from fastapi import FastAPI, HTTPException, Depends, status, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Import Auth & DB
import models
from database import engine, get_db
from auth import get_password_hash, verify_password, create_access_token, decode_token

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Import existing logic
from search import CodeSearcher
from reasoning import generate_change_plan

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
        
        for p in points:
            payload = p.payload
            repo_name = payload.get('repo_name', 'Unknown')
            lang = payload.get('language', 'Unknown')
            
            # Update repo stats
            if repo_name not in repo_stats:
                repo_stats[repo_name] = {"name": repo_name, "points": 0, "languages": set()}
            repo_stats[repo_name]["points"] += 1
            repo_stats[repo_name]["languages"].add(lang)
            
            # Update global language stats
            languages[lang] = languages.get(lang, 0) + 1
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
