from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class IngestionRecord(Base):
    __tablename__ = "ingestion_records"

    id = Column(Integer, primary_key=True, index=True)
    repo_name = Column(String)
    directory_path = Column(String)
    files_count = Column(Integer, default=0)
    chunks_count = Column(Integer, default=0)
    status = Column(String, default="In Progress") # In Progress, Complete, Error
    created_at = Column(DateTime, default=datetime.utcnow)
