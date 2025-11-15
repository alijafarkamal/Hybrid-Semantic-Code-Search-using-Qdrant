# 🚀 Quick Start Guide

Get up and running with Semantic Code Search in 5 minutes!

## Step 1: Start Qdrant

```bash
docker run -p 6333:6333 -p 6334:6334 \
    -v "$(pwd)/qdrant_storage:/qdrant/storage:z" \
    qdrant/qdrant
```

Keep this terminal running. Qdrant will be available at http://localhost:6333

## Step 2: Install Dependencies

In a new terminal:

```bash
cd /home/ali-jafar/Hackathon/lablab-qdrant
pip install -r requirements.txt
```

## Step 3: Test with Example Code

Ingest the example code directory:

```bash
python ingest.py example_code --repo-name example-project
```

You should see output like:
```
📁 Found 3 code files in example_code
  ✅ Upserted 100 chunks (total: 100)
✨ Ingestion complete! Total chunks: 15
```

## Step 4: Search!

### Option A: CLI

```bash
python search.py "read CSV file"
python search.py "JWT authentication"
python search.py "sort array descending"
```

### Option B: Web UI (Great for Demos!)

```bash
python ui_gradio.py
```

Then open `http://localhost:7860` in your browser for a beautiful interactive interface!

## Step 5: Use Your Own Code

Replace `example_code` with your own project:

```bash
python ingest.py /path/to/your/project --repo-name my-project
python search.py "your search query"
```

## Troubleshooting

- **Qdrant not found**: Make sure Docker container is running (`docker ps`)
- **No results**: Check that ingestion completed successfully
- **Import errors**: Make sure all dependencies are installed (`pip install -r requirements.txt`)
- **Note**: FastEmbed is much lighter than sentence-transformers - no PyTorch (900MB+) required!

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Try different embedding models
- Customize chunk sizes for your codebase
- Add filters (language, repository) to your searches

Happy searching! 🔍

