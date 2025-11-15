# 🔍 Semantic Code Search using Qdrant

**Repository:** [https://github.com/alijafarkamal/Semantic-Code-Search-using-Qdrant](https://github.com/alijafarkamal/Semantic-Code-Search-using-Qdrant)

## Problem Statement

Searching through large codebases using traditional keyword-based search is inefficient. Developers often struggle to find relevant code snippets when they only know what they want to accomplish, not the exact function names or keywords. This project solves this by enabling **semantic code search** - finding code by meaning, not just keywords.

## Solution

This project uses **vector embeddings** and **Qdrant** (a vector database) to enable semantic code search. Code files are:
1. **Chunked** into logical units (functions, classes, or blocks)
2. **Embedded** using FastEmbed to create vector representations
3. **Stored** in Qdrant with metadata (file path, language, repository)
4. **Searched** using natural language queries that are converted to embeddings

## How Qdrant Works

**Qdrant** is a vector similarity search engine that:
- Stores high-dimensional vectors (embeddings) representing code semantics
- Uses **cosine similarity** to find the most similar code chunks to a query
- Supports **metadata filtering** (by language, repository, etc.)
- Provides fast, scalable vector search even with millions of code chunks

When you search "read CSV file", Qdrant:
1. Converts your query to a vector embedding
2. Finds code chunks with similar embeddings (semantic meaning)
3. Returns results ranked by similarity score

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

### 3. Ingest Code
```bash
python ingest.py sample_project --repo-name sample-project
```

### 4. Search
```bash
# CLI
python search.py "database connection"

# Web UI
python ui_gradio.py
# Open http://localhost:7860
```

## Features

- 📁 Recursive code ingestion from directories
- 🧩 Smart chunking (functions, classes, blocks)
- 🎯 Semantic search using embeddings
- 🔍 CLI and Gradio web UI
- 🌐 Multi-language support (Python, JavaScript, Java, C++, etc.)
- 🎨 Metadata filtering (language, repository)

## Tech Stack

- **Qdrant**: Vector database for similarity search
- **FastEmbed**: Lightweight embedding generation (no PyTorch!)
- **Gradio**: Web UI framework
- **Python**: Core implementation

## License

Open source - available for hackathon use.
