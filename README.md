<div align="center">
  <h1>🚀 SCS Pro: Semantic Code Search & AI Assistant</h1>
  <p>
    <strong>Enterprise-grade codebase search, AST-aware python ingestion, and Gemini-powered change planning.</strong>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Frontend-React+Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Vector_DB-Qdrant-FF5252?style=for-the-badge&logo=qdrant&logoColor=white" alt="Qdrant" />
    <img src="https://img.shields.io/badge/AI-Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  </p>
</div>

---

## 📖 Overview

This repository transforms your codebase into an intelligent, AI-assisted code search and planning environment. By combining modern vector-based semantic search with lightweight lexical scoring and generative AI, **SCS Pro** allows developers to natively query, understand, and plan changes across large repositories.

- **Hybrid Semantic & Lexical Search** – Find code by its meaning, not just exact keywords. Qdrant handles FastEmbed vectors (cosine similarity) while a custom TF‑IDF scorer ranks exact identifier/symbol matches to give you the best of both worlds.
- **AST-Aware Ingestion** – Python AST is utilized to index functions and classes as first-class symbols, preserving signatures, definitions, and docstrings. 
- **Gemini-Powered Change Planning** – Once relevant code is found, the system delegates a natural-language goal to Google's Gemini LLM (via the `google-genai` SDK) to propose a structured, verifiable change plan (including files to modify, existing logic summaries, and suggested tests).
- **Dual Interfaces** – Includes a modern React/Vite-based frontend with a stunning UI, as well as a Gradio-based web interface and CLI for power users.

## ✨ Key Features

- **Deep Code Ingestion**: Walk directories recursively and parse files intelligently.
- **Hybrid Ranking Engine**: Fused scores (0.7 × Semantic + 0.3 × Lexical) for phenomenal precision.
- **Change Plan Generation**: `plan` mode streams Gemini's structured JSON response grounded *only* in the retrieved context.
- **Premium User Interface**: Dark-themed, responsive, glassmorphic React dashboard (`frontend/`) for a seamless visualization of repositories, searches, and plans.
- **Multi-tenant Backend**: Built-in authentication (JWT) and user access via FastAPI.
- **Zero PyTorch Dependency**: Uses [FastEmbed](https://qdrant.github.io/fastembed/) for extremely fast, lightweight embedding generation locally.

---

## 🛠️ Architecture & Tech Stack

### Backend (`/backend`)
- **FastAPI**: Core API framework handling authentication, searches, indexing, and history.
- **Qdrant**: Vector database running via Docker to store 384-dimensional FastEmbed payload chunks.
- **FastEmbed**: Generates embeddings (e.g., `BAAI/bge-small-en-v1.5`) without the heavy PyTorch footprint.
- **Gemini (`gemini-3-flash-preview`)**: LLM for reasoning, summarizing, and building modification plans.

### Frontend (`/frontend`)
- **React 18 + Vite**: Lightning-fast build tooling and UI framework.
- **Recharts**: For rendering analytics and metrics on the dashboard.
- **Tailwind CSS**: Utility-first styling with premium glassmorphism and modern gradient designs.

---

## 🚀 Quick Start Guide

### 1. Start Qdrant (Vector Database)

Ensure you have Docker installed, then start a local Qdrant instance:

```bash
docker run -p 6333:6333 -p 6334:6334 \
    -v "$(pwd)/qdrant_storage:/qdrant/storage:z" \
    qdrant/qdrant
```

### 2. Setup the Backend

Navigate to the `backend` directory and install the Python dependencies:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

**Run the FastAPI Server:**

```bash
uvicorn main:app --reload --port 8000
```

*(Alternatively, run the Gradio UI locally via `python ui_gradio.py`)*

### 3. Setup the Frontend

Open a new terminal, navigate to the `frontend` directory:

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🧠 How Qdrant and TF‑IDF Work Together

The search pipeline natively fuses two distinct database search techniques:
1. **Qdrant (Vector Search)**: 
   Finds semantically similar snippets computing the cosine similarity between the natural language query and 384-dimensional stored embedded blocks.
2. **TF‑IDF Lexical Scoring**:
   The `search.py` module tokenizes the query and candidate snippets down to raw identifiers and words, building sparse TF-IDF vectors. It provides a strategic score boost to exact symbol names, giving incredible reliance for config keys or explicit function lookups.

---

## 🤖 The Gemini Planning Engine

Gemini is strictly used for **reasoning on top of retrieved context**, not for raw searching. 

When a user triggers a plan, `reasoning.py` builds an optimized, token-efficient prompt containing the top retrieval results (files, lines ranges, signatures, constrained logic). Gemini responds with a strict JSON object mapping out:
- High-level goal interpretation.
- Affected files with specific lines to target.
- Verifiable test integration strategies.

The system then auto-filters file hallucinations, ensuring that suggested changes are grounded strictly within your real, indexed project space.

---

## 📜 License

This project is Open Source and available for use, modification, and distribution.
