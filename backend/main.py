from fastapi import FastAPI, HTTPException, Depends, status, Security, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional, Any
from datetime import datetime
import os
import uuid
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Import Auth & DB
import models
from database import engine, get_db
from auth import get_password_hash, verify_password, create_access_token, decode_token

# Create database tables
models.Base.metadata.create_all(bind=engine)

from pathlib import Path
from fastembed import TextEmbedding
from qdrant_client.models import VectorParams, Distance, PointStruct
from ingest import CodeChunker

# Import existing logic
from search import CodeSearcher
from reasoning import generate_change_plan
from ingest import CodeIngester

from collections import defaultdict

# Load environment variables
load_dotenv()

app = FastAPI(title="Semantic Code Search API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the React app's URL
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Searcher
searcher = CodeSearcher(
    qdrant_url=None,  # Not used with local path
    collection_name="code_search",
    embedding_model="BAAI/bge-small-en-v1.5"
)

# Pydantic models for Auth
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    name: str
    email: EmailStr
    role: str = "User"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str

class SearchRequest(BaseModel):
    query: str
    limit: int = 10
    language: Optional[str] = None
    repo: Optional[str] = None
    chunk_types: Optional[List[str]] = None
    min_score: float = 0.0
    sort_by: str = "relevance"
    semantic_weight: float = 0.7
    overfetch_multiplier: int = 5
    mode: str = "search"  # "search" or "plan"

class IngestRequest(BaseModel):
    directory_path: str
    repo_name: Optional[str] = None
    exclude_dirs: Optional[List[str]] = None

class IngestionRecordResponse(BaseModel):
    id: int
    repo_name: str
    directory_path: str
    files_count: int
    chunks_count: int
    status: str
    created_at: datetime

    # Fix #6: use Pydantic V2 ConfigDict instead of deprecated orm_mode
    model_config = ConfigDict(from_attributes=True)

# Auth Security
security = HTTPBearer()

async def get_current_user(auth: HTTPAuthorizationCredentials = Security(security)):
    token = auth.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

# Auth Endpoints
@app.post("/auth/signup", response_model=Token)
async def signup(user: UserSignup, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=get_password_hash(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": str(new_user.id), "name": new_user.name})
    return {"access_token": access_token, "token_type": "bearer", "user_name": new_user.name}

@app.get("/auth/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = int(current_user.get("sub"))
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "name": db_user.name,
        "email": db_user.email,
        "role": "User" # Default role for now
    }

@app.put("/auth/profile", response_model=UserProfile)
async def update_profile(user_update: UserUpdate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = int(current_user.get("sub"))
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.name:
        db_user.name = user_update.name
    if user_update.email:
        # Check if email is already taken
        existing_user = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing_user and existing_user.id != db_user.id:
            raise HTTPException(status_code=400, detail="Email already in use")
        db_user.email = user_update.email
    if user_update.password:
        db_user.hashed_password = get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(db_user)
    return {
        "name": db_user.name,
        "email": db_user.email,
        "role": "User"
    }

@app.post("/auth/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": str(db_user.id), "name": db_user.name})
    return {"access_token": access_token, "token_type": "bearer", "user_name": db_user.name}

@app.post("/search")
async def search(request: SearchRequest, current_user: Any = Depends(get_current_user)):
    try:
        results = searcher.search(
            query=request.query,
            limit=request.limit,
            language_filter=request.language,
            repo_filter=request.repo,
            chunk_types_filter=request.chunk_types,
            min_score=request.min_score,
            sort_by=request.sort_by,
            semantic_weight=request.semantic_weight,
            overfetch_multiplier=request.overfetch_multiplier
        )
        
        if request.mode == "plan":
            plan = generate_change_plan(request.query, results)
            return {"results": results, "plan": plan}
            
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/info")
async def info(current_user: Any = Depends(get_current_user)):
    try:
        info = searcher.client.get_collection(searcher.collection_name)
        
        # Get all points to extract stats (for small/medium databases)
        # Note: In a large DB, we'd use aggregations or cached stats
        response = searcher.client.scroll(
            collection_name=searcher.collection_name,
            limit=10000,
            with_payload=True,
            with_vectors=False
        )
        
        points = response[0]

        repo_stats = {}
        languages = {}
        
        # for p in points:
        #     payload = p.payload
        #     repo_name = payload.get('repo_name', 'Unknown')
        #     lang = payload.get('language', 'Unknown')
            
        #     # Update repo stats
        #     if repo_name not in repo_stats:
        #         repo_stats[repo_name] = {"name": repo_name, "points": 0, "languages": set()}
        #     repo_stats[repo_name]["points"] += 1
        #     repo_stats[repo_name]["languages"].add(lang)
            
        #     # Update global language stats
        #     languages[lang] = languages.get(lang, 0) + 1

        # Initialize with default factories
        repo_stats = defaultdict(lambda: {"points": 0, "languages": set()})
        languages = defaultdict(int)

        for p in points:
            payload = p.payload
            repo_name = payload.get('repo_name', 'Unknown')
            lang = payload.get('language', 'Unknown')
    
             # Direct access, no 'if' checks required
            repo_stats[repo_name]["name"] = repo_name
            repo_stats[repo_name]["points"] += 1
            repo_stats[repo_name]["languages"].add(lang)
    
            languages[lang] += 1
        
        # Format repo list for frontend
        repos_list = []
        for name, stats in repo_stats.items():
            repos_list.append({
                "name": name,
                "points_count": stats["points"],
                "primary_language": list(stats["languages"])[0] if stats["languages"] else "Unknown"
            })
        
        return {
            "points_count": info.points_count,
            "vector_size": info.config.params.vectors.size,
            "distance": info.config.params.vectors.distance,
            "repo_count": len(repo_stats),
            "languages": languages,
            "repos": repos_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Ingestion Endpoints
def run_ingestion(record_id: int, directory_path: str, repo_name: str, exclude_dirs: Optional[List[str]]):
    """Background task: ingest a directory using the SHARED Qdrant client.
    
    We intentionally reuse `searcher.client` (the already-open local DB
    connection) instead of creating a new CodeIngester, which would try to
    open a *second* connection to the same ./qdrant_db folder — Qdrant's local
    mode only allows one writer at a time and raises 'use Qdrant server instead'.
    """
    db = next(get_db())
    record = db.query(models.IngestionRecord).filter(models.IngestionRecord.id == record_id).first()
    
    try:
        # Reuse the shared Qdrant client — no second open needed
        client = searcher.client
        collection_name = searcher.collection_name

        # Ensure collection exists (idempotent)
        try:
            client.get_collection(collection_name)
        except Exception:
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            )

        # Load embedding model (same one as search.py)
        embed_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
        chunker = CodeChunker()

        language_map = {
            '.py': 'python', '.js': 'javascript', '.ts': 'typescript',
            '.java': 'java', '.cpp': 'cpp', '.c': 'c', '.cs': 'csharp',
            '.go': 'go', '.rs': 'rust', '.rb': 'ruby', '.php': 'php',
            '.swift': 'swift', '.kt': 'kotlin', '.md': 'markdown',
        }

        if exclude_dirs is None:
            exclude_dirs = ['.git', 'node_modules', '__pycache__', '.venv', 'venv']

        directory = Path(directory_path)
        if not directory.exists():
            raise ValueError(f"Directory not found: {directory_path}")

        # Find all code files
        code_files = []
        for ext in language_map.keys():
            code_files.extend(directory.rglob(f"*{ext}"))
        code_files = [f for f in code_files if not any(ex in f.parts for ex in exclude_dirs)]

        print(f"Ingesting {len(code_files)} files from {directory_path}")

        all_points = []
        total_chunks = 0
        files_count = 0

        for file_path in code_files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                language = language_map.get(file_path.suffix.lower(), 'unknown')
                chunks = chunker.chunk_file(str(file_path), content, language)

                for chunk in chunks:
                    embedding = list(embed_model.embed(chunk['text']))[0].tolist()
                    payload = {
                        'file_path': str(file_path.relative_to(directory)),
                        'code_snippet': chunk['text'],
                        'repo_name': repo_name,
                        'language': language,
                        'start_line': chunk['start_line'],
                        'end_line': chunk['end_line'],
                        'symbol_type': chunk.get('symbol_type', 'block'),
                    }
                    if chunk.get('symbol_name'):
                        payload['symbol_name'] = chunk['symbol_name']
                    if chunk.get('signature'):
                        payload['signature'] = chunk['signature']
                    if chunk.get('docstring'):
                        payload['docstring'] = chunk['docstring']

                    all_points.append(PointStruct(
                        id=uuid.uuid5(uuid.NAMESPACE_URL, f"{repo_name}:{file_path}:{chunk['start_line']}").int & 0x7FFFFFFFFFFFFFFF,
                        vector=embedding,
                        payload=payload,
                    ))
                    total_chunks += 1

                files_count += 1

                if len(all_points) >= 100:
                    client.upsert(collection_name=collection_name, points=all_points, wait=True)
                    print(f"  Upserted batch, total so far: {total_chunks}")
                    all_points = []

            except Exception as e:
                print(f"  Error processing {file_path}: {e}")
                continue

        if all_points:
            client.upsert(collection_name=collection_name, points=all_points, wait=True)

        record.status = "Complete"
        record.chunks_count = total_chunks
        record.files_count = files_count
        db.commit()
        print(f"Ingestion done: {files_count} files, {total_chunks} chunks for '{repo_name}'")

    except Exception as e:
        if record:
            record.status = "Error"
        print(f"Ingestion error for {repo_name}: {e}")
        db.commit()
    finally:
        db.close()

@app.post("/ingest")
async def start_ingestion(request: IngestRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    # Create record
    new_record = models.IngestionRecord(
        repo_name=request.repo_name or os.path.basename(request.directory_path),
        directory_path=request.directory_path,
        status="In Progress"
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    # Start background task
    background_tasks.add_task(
        run_ingestion, 
        new_record.id, 
        request.directory_path, 
        new_record.repo_name, 
        request.exclude_dirs
    )
    
    return {"message": "Ingestion started", "record_id": new_record.id}

@app.get("/ingestion-history", response_model=List[IngestionRecordResponse])
async def get_ingestion_history(db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    records = db.query(models.IngestionRecord).order_by(models.IngestionRecord.created_at.desc()).all()
    return records

@app.delete("/ingestion-history")
async def clear_ingestion_history(db: Session = Depends(get_db), current_user: Any = Depends(get_current_user)):
    try:
        # 1. Clear SQLite History (Except "sample")
        db.query(models.IngestionRecord).filter(
            models.IngestionRecord.repo_name != "sample"
        ).delete(synchronize_session=False)
        db.commit()
        
        # 2. Clear Qdrant Vectors (Except "sample")
        try:
            from qdrant_client.http.models import Filter, FieldCondition, MatchValue
            
            # Delete points WHERE repo_name is NOT 'sample'
            # (Qdrant doesn't have a direct "NOT equals", but we can use MustNot + MatchValue)
            searcher.client.delete(
                collection_name=searcher.collection_name,
                points_selector=Filter(
                    must_not=[
                        FieldCondition(
                            key="repo_name",
                            match=MatchValue(value="sample")
                        )
                    ]
                )
            )
        except Exception as q_err:
            print(f"Warning: Failed to partially reset Qdrant collection: {q_err}")

        return {"message": "Ingestion history cleared successfully (sample project preserved)"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug-clear")
async def debug_clear_qdrant(current_user: Any = Depends(get_current_user)):
    try:
        # Fetch up to 100k points to manually delete everything but 'sample'
        res = searcher.client.scroll(
            collection_name=searcher.collection_name, 
            limit=100000, 
            with_payload=True, 
            with_vectors=False
        )
        points = res[0]
        
        points_to_delete = []
        for p in points:
            # Safely check if 'sample' is in the repo name or if it exactly matches
            r_name = p.payload.get("repo_name", "")
            if "sample" not in r_name.lower():
                points_to_delete.append(p.id)
                
        if points_to_delete:
            searcher.client.delete(
                collection_name=searcher.collection_name,
                points_selector=points_to_delete
            )
            
        return {
            "message": f"Successfully deleted {len(points_to_delete)} non-sample ghost points from Qdrant.",
            "total_scanned": len(points)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
