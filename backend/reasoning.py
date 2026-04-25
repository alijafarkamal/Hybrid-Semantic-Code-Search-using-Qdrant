"""Gemini-based reasoning and change planning.

This module takes a natural language task description plus enriched code
search results and asks Gemini to produce a structured change plan.

It is intentionally focused on *planning* (what to change where), not on
applying edits automatically.
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from google import genai


load_dotenv()

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")


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


def _build_context(results: List[Dict[str, Any]], max_chars: int = 12000) -> str:
    """Render search results into a compact textual context for Gemini.

    We keep this representation simple and deterministic so it is easy to
    debug. Each entry includes file path, line range, symbol metadata, and
    the code snippet (possibly truncated to stay under the character limit).
    """

    lines: List[str] = []
    used_chars = 0

    for idx, r in enumerate(results[:20], start=1):
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
            symbol_parts.append(f"signature={r['signature']}")
        if r.get("docstring"):
            doc = str(r["docstring"]).strip().replace("\n", " ")
            if len(doc) > 200:
                doc = doc[:197] + "..."
            symbol_parts.append(f"doc={doc}")

        if symbol_parts:
            header += f"    Symbol: {' | '.join(symbol_parts)}\n"

        code = r.get("code_snippet", "")
        if len(code) > 2000:
            code = code[:2000] + "\n... (truncated)"

        block = header + "    Code:\n" + code + "\n\n"

        if used_chars + len(block) > max_chars:
            break
        lines.append(block)
        used_chars += len(block)

    return "".join(lines)


def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY environment variable is not set. "
            "Please add it to your .env or shell environment."
        )
    return genai.Client(api_key=api_key)


def _strip_code_fences(text: str) -> str:
    """Strip ```json ... ``` fences if the model returns them."""

    # Common patterns: ```json\n{...}\n``` or ```\n{...}\n```.
    match = re.search(r"```(?:json)?\n(.*)```", text, flags=re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return text.strip()


def generate_change_plan(query: str, results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Call Gemini to generate a structured change plan.

    This function is safe to call from both the CLI and the Gradio UI.
    It returns a pure-Python dict so callers do not depend on dataclasses.
    """

    if not results:
        plan = ChangePlan(
            goal=query,
            files_to_modify=[],
            existing_logic_summary="No code results were retrieved; nothing to plan.",
            suggested_changes=[],
            tests_to_update=[],
        )
        return plan.to_dict()

    context = _build_context(results)

    allowed_files = {
        str(r.get("file_path"))
        for r in results
        if r.get("file_path")
    }

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

    client = _get_client()

    try:
        response = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents=prompt,
        )
    except Exception as e:  # pragma: no cover - network / auth issues
        plan = ChangePlan(
            goal=query,
            files_to_modify=[],
            existing_logic_summary=(
                "Gemini call failed: " + str(e) + ". "
                "Please verify GEMINI_API_KEY and network connectivity."
            ),
            suggested_changes=[],
            tests_to_update=[],
        )
        return plan.to_dict()

    raw_text = getattr(response, "text", None)
    if not raw_text:
        # Fallback: best-effort string conversion.
        raw_text = str(response)

    cleaned = _strip_code_fences(raw_text)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        # If parsing fails, wrap the raw text so the user can inspect it.
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

    # ---------------- Safety filter on file paths -----------------
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

    # Ensure required top-level keys exist even if the model omitted them.
    data.setdefault("goal", query)
    data.setdefault("existing_logic_summary", "")
    data.setdefault("files_to_modify", [])
    data.setdefault("suggested_changes", [])
    data.setdefault("tests_to_update", [])

    return data


def _connectivity_check() -> str:
    """Small helper to verify Gemini connectivity.

    This runs a tiny generate_content call and reports whether it
    succeeded. It is safe to run from the CLI:

        python reasoning.py
    """

    client = _get_client()
    try:
        resp = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents="Say 'ok' if you received this.",
        )
    except Exception as e:  # pragma: no cover - network / auth issues
        return f"Gemini connectivity test failed: {e}"

    text = getattr(resp, "text", None) or str(resp)
    if len(text) > 200:
        text = text[:197] + "..."
    return f"Gemini connectivity test succeeded. Model replied: {text}"


if __name__ == "__main__":  # pragma: no cover - manual check
    print(_connectivity_check())
