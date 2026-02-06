# Semantic Code Search + AI Code Assistant

## What this project does

This repo turns your codebase into an AI-assisted code search and planning tool:

- **Semantic code search** – find code by meaning, not just exact keywords.
- **Hybrid ranking (embeddings + TF‑IDF)** – combines vector similarity with a
    lightweight lexical scorer so exact symbol/config names get boosted.
- **Per-symbol Python ingestion** – uses the Python AST to index functions and
    classes as first-class symbols with name, signature, and docstring.
- **Gemini-powered change planning** – given a natural-language goal, it
    retrieves relevant code and asks Gemini (via the `google-genai` SDK) to
    propose a structured change plan (what files/lines to touch, why, and what
    to test).
- **Qdrant-backed vector store** – all code chunks and symbols are stored in a
    local Qdrant collection for fast similarity search.
- **CLI + Gradio UI** – run searches from the command line or a modern web UI
    with a togglable `search` / `plan` mode.

At a high level:

1. `ingest.py` recursively walks your project, extracts symbols/blocks, and
     stores embeddings + metadata in Qdrant.
2. `search.py` performs **hybrid search**:
     - semantic score from Qdrant (FastEmbed vectors, cosine distance)
     - lexical score from a simple TF‑IDF-style scorer over the retrieved code
     - final score = 0.7 × semantic + 0.3 × lexical
3. `reasoning.py` takes a query + top search results and calls **Gemini**
     (`gemini-3-flash-preview`) to return a JSON change plan.
4. `ui_gradio.py` exposes both search and plan modes in a web UI.

## How Qdrant and TF‑IDF work together

- **Qdrant (vector search)**
    - Stores 384‑dimensional FastEmbed vectors for each code chunk/symbol.
    - Uses cosine similarity to find semantically similar snippets.
    - Supports payload filters such as `language` and `repo_name`.

- **TF‑IDF lexical scoring in `search.py`**
    - Tokenises the query and candidate snippets into simple terms
        (identifiers, words, numbers).
    - Builds sparse TF‑IDF vectors and computes cosine similarity.
    - Slightly boosts results whose `symbol_name` appears in the query.
    - The fused score improves relevance for things like config keys or
        function names you remember exactly.

## How Gemini is used

Gemini is **not** used for raw search; it is only used for reasoning on top
of retrieved context:

- `reasoning.generate_change_plan(query, results)`:
    - Builds a compact text context from the top search results, including file
        paths, line ranges, symbol metadata, and code (truncated for length).
    - Sends a single prompt to Gemini asking for a strict JSON object with:
        - `goal`
        - `files_to_modify` (with reasons and line ranges)
        - `existing_logic_summary`
        - `suggested_changes` (per file, with change_type and considerations)
        - `tests_to_update`.
    - Parses the JSON and **filters out any file paths that are not in the
        retrieved results**, so plans stay grounded in real files.

The Gradio UI and CLI both expose a **plan** mode that runs this pipeline and
prints/renders Gemini’s structured response.

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start Qdrant
```bash
docker run -p 6333:6333 -p 6334:6334 \
    -v "$(pwd)/qdrant_storage:/qdrant/storage:z" \
    qdrant/qdrant
```

### 3. Ingest code
```bash
python ingest.py sample_project --repo-name sample-project
```

### 4. Search and plan
```bash
# CLI
python search.py "database connection"

# Web UI
python ui_gradio.py
# Open http://localhost:7860
```

## Features

- Recursive code ingestion from directories.
- AST-aware Python chunking into functions and classes with signature + docstring.
- Hybrid semantic + lexical ranking (FastEmbed + TF‑IDF).
- Gemini-backed change planning (`plan` mode) with JSON outputs.
- CLI and Gradio web UI with search/plan toggle.
- Multi-language support (Python, JavaScript, Java, C++, etc.).
- Metadata filtering (language, repository).

## Tech Stack

- **Qdrant**: Vector database for similarity search
- **FastEmbed**: Lightweight embedding generation (no PyTorch!)
- **Gradio**: Web UI framework
- **Python**: Core implementation

## License

Open source - available for use.
