"""Gemini-based reasoning and change planning.

Optimized for latency: reused genai.Client, Gemini 2.5 Flash-Lite default,
timeouts, retries, smaller prompts, and optional streaming deltas.
"""

from __future__ import annotations

import json
import logging
import os
import re
import threading
import time
from dataclasses import asdict, dataclass
from typing import Any, Dict, Iterator, List, Optional, Set, Tuple

from dotenv import load_dotenv
from google import genai
from google.genai import types
import httpx

from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

load_dotenv()

logger = logging.getLogger(__name__)

# Primary: fast Lite model. Override with GEMINI_MODEL.
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-2.5-flash")
# Seconds for Gemini HTTP requests (Gemini generates JSON plans; give headroom).
HTTP_TIMEOUT_S = float(os.getenv("GEMINI_HTTP_TIMEOUT", "120"))
# Gemini API retries (transient network / availability).
GEMINI_RETRY_ATTEMPTS = int(os.getenv("GEMINI_RETRY_ATTEMPTS", "3"))

_RETRY_EXCEPTION_TYPES = (
    httpx.TimeoutException,
    httpx.ConnectError,
    httpx.ReadError,
    httpx.ConnectTimeout,
    httpx.ReadTimeout,
    httpx.WriteTimeout,
)


def _retry_gemini(exc: BaseException) -> bool:
    """Avoid retrying deterministic client errors."""

    if _RETRY_EXCEPTION_TYPES and isinstance(exc, _RETRY_EXCEPTION_TYPES):
        return True
    if isinstance(exc, (TimeoutError, ConnectionError, OSError)):
        return True
    text = str(exc).lower()
    return any(
        phrase in text
        for phrase in (
            "unavailable",
            "temporarily unavailable",
            "connection reset",
            "connection aborted",
            "503",
            "502",
            "504",
            "429",
        )
    )

# Smaller context = fewer input tokens → faster TTFT and lower cost.
CONTEXT_MAX_CHARS = int(os.getenv("GEMINI_CONTEXT_MAX_CHARS", "5600"))
CONTEXT_MAX_RESULTS = int(os.getenv("GEMINI_CONTEXT_MAX_RESULTS", "12"))
CONTEXT_SNIPPET_MAX_CHARS = int(os.getenv("GEMINI_CONTEXT_SNIPPET_CHARS", "800"))

_client: Optional[genai.Client] = None
_client_lock = threading.Lock()


@dataclass
class FileChangeSuggestion:
    file_path: str
    reason: str
    relevant_lines: Optional[List[int]] = None


@dataclass
class SuggestedChange:
    file_path: str
    change_type: str
    summary: str
    important_considerations: Optional[List[str]] = None


@dataclass
class TestUpdateSuggestion:
    file_path: str
    reason: str


@dataclass
class ChangePlan:
    goal: str
    files_to_modify: List[FileChangeSuggestion]
    existing_logic_summary: str
    suggested_changes: List[SuggestedChange]
    tests_to_update: List[TestUpdateSuggestion]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "goal": self.goal,
            "files_to_modify": [asdict(f) for f in self.files_to_modify],
            "existing_logic_summary": self.existing_logic_summary,
            "suggested_changes": [asdict(s) for s in self.suggested_changes],
            "tests_to_update": [asdict(t) for t in self.tests_to_update],
        }


def _get_gemini_http_config() -> types.GenerateContentConfig:
    return types.GenerateContentConfig(
        http_options=types.HttpOptions(timeout=HTTP_TIMEOUT_S),
    )


def _get_client() -> genai.Client:
    """Lazy singleton genai.Client (connection reuse per process)."""

    global _client
    if _client is not None:
        return _client
    with _client_lock:
        if _client is None:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise RuntimeError(
                    "GEMINI_API_KEY environment variable is not set. "
                    "Please add it to your .env or shell environment."
                )
            _client = genai.Client(api_key=api_key)
    return _client


def _models_to_try() -> List[str]:
    primary = DEFAULT_MODEL.strip()
    fb = (FALLBACK_MODEL or "").strip()
    out: List[str] = []
    if primary:
        out.append(primary)
    if fb and fb not in out:
        out.append(fb)
    return out or ["gemini-2.5-flash-lite"]


def _build_allowed_files(results: List[Dict[str, Any]]) -> Set[str]:
    return {
        str(r.get("file_path"))
        for r in results
        if r.get("file_path")
    }


def _build_context(
    results: List[Dict[str, Any]],
    max_chars: int = CONTEXT_MAX_CHARS,
    max_results: int = CONTEXT_MAX_RESULTS,
    snippet_chars: int = CONTEXT_SNIPPET_MAX_CHARS,
) -> str:
    """Compact textual context for Gemini (bounded tokens)."""

    lines: List[str] = []
    used_chars = 0

    for idx, r in enumerate(results[:max_results], start=1):
        header = (
            f"[{idx}] File: {r.get('file_path','')}\n"
            f"    Repo: {r.get('repo_name','')} | Lang: {r.get('language','')}\n"
            f"    Lines: {r.get('start_line',0)}-{r.get('end_line',0)}\n"
        )
        symbol_parts: List[str] = []
        if r.get("symbol_name"):
            symbol_parts.append(f"name={r['symbol_name']}")
        if r.get("symbol_type"):
            symbol_parts.append(f"type={r['symbol_type']}")
        if r.get("signature"):
            sig = str(r["signature"])
            if len(sig) > 200:
                sig = sig[:197] + "..."
            symbol_parts.append(f"signature={sig}")
        if r.get("docstring"):
            doc = str(r["docstring"]).strip().replace("\n", " ")
            if len(doc) > 140:
                doc = doc[:137] + "..."
            symbol_parts.append(f"doc={doc}")

        if symbol_parts:
            header += f"    Symbol: {' | '.join(symbol_parts)}\n"

        code = r.get("code_snippet", "") or ""
        if len(code) > snippet_chars:
            code = code[:snippet_chars] + "\n... (truncated)"

        block = header + "    Code:\n" + code + "\n\n"

        if used_chars + len(block) > max_chars:
            break
        lines.append(block)
        used_chars += len(block)

    return "".join(lines)


def build_plan_prompt(
    query: str,
    results: List[Dict[str, Any]],
) -> Tuple[str, Set[str]]:
    """Build Gemini prompt plus allowed file paths from retrieval."""

    allowed_files = _build_allowed_files(results)
    context = _build_context(results)

    prompt = f"""
You are a senior software engineer helping a developer plan safe, minimal
code changes.

The developer's task / high-level goal is:
\"\"\"{query}\"\"\"

You are given a set of code snippets from the repository. You MUST:
- Only reference files and symbols that appear in the context below.
- Prefer small, iterative changes over large refactors.
- Avoid guessing APIs or file names that are not present.

Return a single JSON object with this exact structure (no comments or extra
text outside the JSON):
{{
  "goal": "<short restatement of the task>",
  "files_to_modify": [
    {{
      "file_path": "relative/path.py",
      "reason": "why this file is relevant",
      "relevant_lines": [start_line, end_line]
    }}
  ],
  "existing_logic_summary": "2-6 sentences summarizing how the current code works",
  "suggested_changes": [
    {{
      "file_path": "relative/path.py",
      "change_type": "modify" | "add" | "delete",
      "summary": "1-3 sentences describing the change",
      "important_considerations": ["bullet point", "another point"]
    }}
  ],
  "tests_to_update": [
    {{
      "file_path": "relative/test_or_module.py",
      "reason": "what behavior should be covered or updated"
    }}
  ]
}}

Context:
{context}
"""
    return prompt.strip(), allowed_files


def _strip_code_fences(text: str) -> str:
    match = re.search(r"```(?:json)?\n(.*)```", text, flags=re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return text.strip()


def finalize_plan_dict(
    raw_text: str,
    query: str,
    allowed_files: Set[str],
) -> Dict[str, Any]:
    """Parse Gemini output JSON and constrain file paths."""

    cleaned = _strip_code_fences(raw_text)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        plan = ChangePlan(
            goal=query,
            files_to_modify=[],
            existing_logic_summary=(
                "Failed to parse JSON from Gemini. Raw response was kept "
                "in the 'raw_response' field."
            ),
            suggested_changes=[],
            tests_to_update=[],
        )
        result = plan.to_dict()
        result["raw_response"] = cleaned
        return result

    def _filter_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        filtered: List[Dict[str, Any]] = []
        for item in items or []:
            path = str(item.get("file_path", ""))
            if path and path in allowed_files:
                filtered.append(item)
        return filtered

    data["files_to_modify"] = _filter_items(data.get("files_to_modify", []))
    data["suggested_changes"] = _filter_items(data.get("suggested_changes", []))
    data["tests_to_update"] = _filter_items(data.get("tests_to_update", []))

    data.setdefault("goal", query)
    data.setdefault("existing_logic_summary", "")
    data.setdefault("files_to_modify", [])
    data.setdefault("suggested_changes", [])
    data.setdefault("tests_to_update", [])

    return data


def empty_plan_failure(query: str, message: str) -> Dict[str, Any]:
    plan = ChangePlan(
        goal=query,
        files_to_modify=[],
        existing_logic_summary=message,
        suggested_changes=[],
        tests_to_update=[],
    )
    return plan.to_dict()


@retry(
    stop=stop_after_attempt(GEMINI_RETRY_ATTEMPTS),
    wait=wait_exponential(multiplier=1, min=1, max=12),
    retry=retry_if_exception(_retry_gemini),
    reraise=True,
)
def _generate_content_blocking(
    client: genai.Client,
    model: str,
    prompt: str,
) -> Any:
    return client.models.generate_content(
        model=model,
        contents=prompt,
        config=_get_gemini_http_config(),
    )


def _call_gemini_text_sync(prompt: str) -> Tuple[str, str]:
    """Return (concatenated model text, model_name_used)."""

    client = _get_client()
    last_err: Optional[BaseException] = None

    for model_name in _models_to_try():
        try:
            response = _generate_content_blocking(client, model_name, prompt)
            raw_text = getattr(response, "text", None)
            if not raw_text:
                raw_text = str(response)
            return raw_text, model_name
        except Exception as exc:  # noqa: BLE001 — try fallback models
            last_err = exc
            logger.warning("Gemini generate_content failed for %s: %s", model_name, exc)

    raise last_err  # type: ignore[misc]


def generate_change_plan(
    query: str,
    results: List[Dict[str, Any]],
    timings: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Blocking plan generation with optional timing fills."""

    sink = timings if timings is not None else {}

    if not results:
        sink.setdefault("prompt_build_ms", 0.0)
        sink.setdefault("gemini_ms", 0.0)
        sink.setdefault("parse_ms", 0.0)
        sink.setdefault("gemini_model", None)
        return empty_plan_failure(
            query,
            "No code results were retrieved; nothing to plan.",
        )

    t0 = time.perf_counter()
    prompt, _allowed_files = build_plan_prompt(query, results)
    sink["prompt_build_ms"] = round((time.perf_counter() - t0) * 1000.0, 2)
    sink["prompt_chars"] = len(prompt)

    try:
        t1 = time.perf_counter()
        raw_text, used_model = _call_gemini_text_sync(prompt)
        sink["gemini_ms"] = round((time.perf_counter() - t1) * 1000.0, 2)
        sink["gemini_model"] = used_model
    except Exception as e:  # noqa: BLE001
        sink["gemini_ms"] = None
        sink["gemini_error"] = str(e)
        sink["gemini_model"] = None
        return empty_plan_failure(
            query,
            "Gemini call failed: "
            + str(e)
            + ". Please verify GEMINI_API_KEY and network connectivity.",
        )

    t2 = time.perf_counter()
    parsed = finalize_plan_dict(raw_text, query, _allowed_files)
    sink["parse_ms"] = round((time.perf_counter() - t2) * 1000.0, 2)

    return parsed


def stream_gemini_plan_deltas(prompt: str) -> Iterator[str]:
    """Yield incremental text deltas from Gemini (streaming generation)."""

    client = _get_client()
    last_err: Optional[BaseException] = None

    for model_name in _models_to_try():
        accumulated = ""
        try:
            stream = client.models.generate_content_stream(
                model=model_name,
                contents=prompt,
                config=_get_gemini_http_config(),
            )
            for resp in stream:
                full = getattr(resp, "text", None) or ""
                if len(full) > len(accumulated):
                    yield full[len(accumulated) :]
                    accumulated = full
            return
        except Exception as exc:
            last_err = exc
            logger.warning(
                "Gemini generate_content_stream failed for %s: %s", model_name, exc
            )

    if last_err:
        raise last_err
    raise RuntimeError("No Gemini models configured")


def iterate_plan_stream_events(
    prompt: str,
    query: str,
    allowed_files: Set[str],
) -> Iterator[Dict[str, Any]]:
    """Sync iterator: plan_delta chunks, then plan_done with parsed plan or error."""

    acc = ""
    try:
        for delta in stream_gemini_plan_deltas(prompt):
            acc += delta
            yield {"event": "plan_delta", "text": delta}
    except Exception as e:
        yield {"event": "error", "detail": str(e), "retryable": _retry_gemini(e)}
        return

    parse_t0 = time.perf_counter()
    plan_dict = finalize_plan_dict(acc, query, allowed_files)
    parse_ms = round((time.perf_counter() - parse_t0) * 1000.0, 2)
    yield {
        "event": "plan_done",
        "plan": plan_dict,
        "timings": {
            "parse_ms": parse_ms,
            "response_chars": len(acc),
        },
    }


def _connectivity_check() -> str:
    client = _get_client()
    try:
        resp = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents="Say 'ok' if you received this.",
            config=_get_gemini_http_config(),
        )
    except Exception as e:  # pragma: no cover
        return f"Gemini connectivity test failed: {e}"

    text = getattr(resp, "text", None) or str(resp)
    if len(text) > 200:
        text = text[:197] + "..."
    return f"Gemini connectivity test succeeded. Model replied: {text}"


if __name__ == "__main__":  # pragma: no cover
    logging.basicConfig(level=logging.INFO)
    print(_connectivity_check())
