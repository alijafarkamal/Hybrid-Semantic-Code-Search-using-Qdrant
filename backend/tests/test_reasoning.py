"""Unit tests for Gemini REST helpers (no network calls)."""

import json
from unittest.mock import patch

import pytest

import reasoning


def candidate_json(text: str) -> dict:
    return {"candidates": [{"content": {"parts": [{"text": text}]}}]}


def test_extract_text_from_response_empty():
    assert reasoning._extract_text_from_response({}) == ""


def test_extract_text_from_response_concatenates_parts():
    data = {
        "candidates": [
            {"content": {"parts": [{"text": "a"}, {"text": "b"}]}},
            {"content": {"parts": [{"text": "c"}]}},
        ]
    }
    assert reasoning._extract_text_from_response(data) == "abc"


def test_generate_content_payload_structure():
    p = reasoning._generate_content_payload("hello")
    assert p == {"contents": [{"parts": [{"text": "hello"}]}]}


def test_retry_gemini_maps_timeouts_and_httpish_errors():
    assert reasoning._retry_gemini(TimeoutError())
    assert reasoning._retry_gemini(ConnectionError())
    assert not reasoning._retry_gemini(ValueError("nothing"))
    assert reasoning._retry_gemini(RuntimeError("upstream returned 503"))


@pytest.mark.parametrize(
    ("env_key",),
    [(None,), ("",)],
)
def test_require_api_key_missing(monkeypatch, env_key):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    if env_key is not None:
        monkeypatch.setenv("GEMINI_API_KEY", env_key)
    with pytest.raises(RuntimeError, match="GEMINI_API_KEY"):
        reasoning._require_api_key()


class _FakeStreamResponse:
    def __init__(self, chunks: list[bytes], status_code: int = 200):
        self.status_code = status_code
        self._chunks = chunks

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def read(self):
        return b""

    def iter_bytes(self):
        for c in self._chunks:
            yield c


class _FakeHttpxClient:
    def __init__(self, stream_response: _FakeStreamResponse):
        self._resp = stream_response
        self.stream_calls = []

    def stream(self, method: str, url: str, **kwargs):
        self.stream_calls.append((method, url, kwargs))
        return self._resp


@patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"})
def test_stream_generate_content_rest_sse_incremental(monkeypatch):
    first = candidate_json("Hel")
    second = candidate_json("Hello")
    body = "".join(
        [
            "event: message\n",
            f"data: {json.dumps(first)}\n",
            "\n",
            f"data: {json.dumps(second)}\n",
        ]
    )
    fake_client = _FakeHttpxClient(_FakeStreamResponse([body.encode("utf-8")]))
    monkeypatch.setattr(reasoning, "_get_httpx_client", lambda: fake_client)

    deltas = list(
        reasoning.stream_generate_content_rest("gemini-test", "prompt text")
    )

    assert deltas == ["Hel", "lo"]
    assert len(fake_client.stream_calls) == 1
    method, url, kw = fake_client.stream_calls[0]
    assert method == "POST"
    assert ":streamGenerateContent" in url
    assert kw["params"] == {"key": "test-key", "alt": "sse"}


@patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"})
def test_stream_generate_content_rest_splits_across_byte_chunks(monkeypatch):
    payload = json.dumps(candidate_json("x"))
    # Line arrives in two TCP-ish chunks
    c1 = b"data: "
    c2 = f"{payload}\n".encode()
    fake_client = _FakeHttpxClient(_FakeStreamResponse([c1, c2]))
    monkeypatch.setattr(reasoning, "_get_httpx_client", lambda: fake_client)

    assert list(reasoning.stream_generate_content_rest("m", "p")) == ["x"]


@patch.dict("os.environ", {"GEMINI_API_KEY": "test-key"})
def test_stream_generate_content_rest_http_error(monkeypatch):
    class _ErrResp:
        status_code = 400

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def read(self):
            return b"bad request body"

    class _Client:
        def stream(self, *a, **k):
            return _ErrResp()

    monkeypatch.setattr(reasoning, "_get_httpx_client", _Client)

    with pytest.raises(RuntimeError, match="Gemini stream HTTP 400"):
        list(reasoning.stream_generate_content_rest("m", "p"))


def test_finalize_plan_dict_parses_json_wrapped_in_text():
    raw = """
Here is your plan:
```json
{
  "goal": "do login",
  "files_to_modify": [{"file_path": "app/auth.py", "reason": "auth"}],
  "existing_logic_summary": "summary",
  "suggested_changes": [{"file_path": "app/auth.py", "change_type": "modify", "summary": "x"}],
  "tests_to_update": [{"file_path": "tests/test_auth.py", "reason": "cover login"}]
}
```
Thanks!
"""
    allowed = {"app/auth.py", "tests/test_auth.py"}
    out = reasoning.finalize_plan_dict(raw, "q", allowed)
    assert out["goal"] == "do login"
    assert out["files_to_modify"] == [{"file_path": "app/auth.py", "reason": "auth"}]
    assert out["tests_to_update"] == [
        {"file_path": "tests/test_auth.py", "reason": "cover login"}
    ]


def test_finalize_plan_dict_parses_python_like_dict():
    raw = """Some text {'goal': 'g', 'files_to_modify': [{'file_path': 'a.py', 'reason': 'r'}], 'existing_logic_summary': 's', 'suggested_changes': [], 'tests_to_update': []} trailing"""
    out = reasoning.finalize_plan_dict(raw, "q", {"a.py"})
    assert out["goal"] == "g"
    assert out["files_to_modify"] == [{"file_path": "a.py", "reason": "r"}]
