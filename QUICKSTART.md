# 🚀 Quick Start

## Prerequisites
- Docker
- Python 3.9+
- Node.js 18+

---

## 1. Configure Environment

```bash
cp .env.example .env
# Add your GEMINI_API_KEY to .env
```

---

## 2. Start Qdrant

```bash
docker run -p 6333:6333 -p 6334:6334 \
    -v "$(pwd)/qdrant_storage:/qdrant/storage:z" \
    qdrant/qdrant
```

Keep this terminal running. Dashboard → http://localhost:6333/dashboard

---

## 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

---

## 4. Ingest Code

Point the ingester at any local project directory:

```bash
python ingest.py /path/to/your/project --repo-name my-project
```

---

## 5. Search

**CLI:**
```bash
python search.py "your search query"
```

**Gradio UI:**
```bash
python ui_gradio.py
# Open http://localhost:7860
```

---

## 6. Start the Frontend (Optional)

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Qdrant not found | `docker ps` — make sure the container is running |
| No search results | Re-run `ingest.py` and check for errors |
| Import errors | `pip install -r backend/requirements.txt` |
| Gemini auth error | Check `GEMINI_API_KEY` in `.env` |
