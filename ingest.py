"""
Code Ingestion Module
Reads code files, chunks them, generates embeddings, and stores in Qdrant.
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from fastembed import TextEmbedding


class CodeChunker:
    """Splits code files into logical chunks (functions, classes, or blocks)."""
    
    def __init__(self, max_chunk_size: int = 200, min_chunk_size: int = 50):
        self.max_chunk_size = max_chunk_size
        self.min_chunk_size = min_chunk_size
    
    def chunk_file(self, file_path: str, content: str, language: str) -> List[Dict]:
        """
        Split code file into chunks.
        Returns list of dicts with 'text', 'start_line', 'end_line', 'type'.
        """
        chunks = []
        
        # Try to extract functions and classes first
        if language in ['python', 'py']:
            chunks.extend(self._extract_python_structures(content))
        elif language in ['javascript', 'js', 'typescript', 'ts']:
            chunks.extend(self._extract_js_structures(content))
        elif language in ['java', 'cpp', 'c', 'csharp', 'cs']:
            chunks.extend(self._extract_brace_structures(content))
        
        # If no structures found or chunks are too small, split by lines
        if not chunks:
            chunks = self._chunk_by_lines(content)
        else:
            # Fill gaps with line-based chunks
            chunks = self._fill_gaps(content, chunks)
        
        # Format chunks with metadata
        result = []
        for chunk in chunks:
            if len(chunk['text'].strip()) >= self.min_chunk_size:
                result.append({
                    'text': chunk['text'],
                    'start_line': chunk.get('start_line', 0),
                    'end_line': chunk.get('end_line', 0),
                    'type': chunk.get('type', 'block')
                })
        
        return result
    
    def _extract_python_structures(self, content: str) -> List[Dict]:
        """Extract Python functions and classes."""
        chunks = []
        lines = content.split('\n')
        
        # Pattern for function/class definitions
        pattern = r'^(def|class)\s+\w+'
        current_chunk = None
        
        for i, line in enumerate(lines, 1):
            if re.match(pattern, line.strip()):
                if current_chunk:
                    chunks.append(current_chunk)
                
                # Find the end of the function/class (next def/class or end of file)
                current_chunk = {
                    'text': line,
                    'start_line': i,
                    'end_line': i,
                    'type': 'function' if 'def' in line else 'class'
                }
            elif current_chunk:
                current_chunk['text'] += '\n' + line
                current_chunk['end_line'] = i
                
                # Stop if we hit another top-level definition
                if re.match(pattern, line.strip()):
                    chunks.append(current_chunk)
                    current_chunk = None
        
        if current_chunk:
            chunks.append(current_chunk)
        
        return chunks
    
    def _extract_js_structures(self, content: str) -> List[Dict]:
        """Extract JavaScript/TypeScript functions and classes."""
        chunks = []
        lines = content.split('\n')
        
        # Pattern for function/class definitions
        pattern = r'^(function\s+\w+|const\s+\w+\s*=\s*(async\s+)?\(|class\s+\w+|export\s+(function|class|const))'
        current_chunk = None
        brace_count = 0
        
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            
            if re.match(pattern, stripped):
                if current_chunk and brace_count == 0:
                    chunks.append(current_chunk)
                    current_chunk = None
                
                if not current_chunk:
                    current_chunk = {
                        'text': line,
                        'start_line': i,
                        'end_line': i,
                        'type': 'function'
                    }
                    brace_count = line.count('{') - line.count('}')
                else:
                    current_chunk['text'] += '\n' + line
                    current_chunk['end_line'] = i
                    brace_count += line.count('{') - line.count('}')
            elif current_chunk:
                current_chunk['text'] += '\n' + line
                current_chunk['end_line'] = i
                brace_count += line.count('{') - line.count('}')
                
                if brace_count == 0 and len(current_chunk['text']) > 50:
                    chunks.append(current_chunk)
                    current_chunk = None
        
        if current_chunk:
            chunks.append(current_chunk)
        
        return chunks
    
    def _extract_brace_structures(self, content: str) -> List[Dict]:
        """Extract structures for brace-based languages (Java, C++, etc.)."""
        chunks = []
        lines = content.split('\n')
        
        # Pattern for function/class definitions
        pattern = r'^\s*(public|private|protected)?\s*(static)?\s*(class|interface|enum|\w+\s+\w+\s*\(|\w+\s*\([^)]*\)\s*\{)'
        current_chunk = None
        brace_count = 0
        
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            
            if re.match(pattern, stripped) or (current_chunk and brace_count == 0 and '{' in line):
                if current_chunk and brace_count == 0:
                    chunks.append(current_chunk)
                    current_chunk = None
                
                if not current_chunk:
                    current_chunk = {
                        'text': line,
                        'start_line': i,
                        'end_line': i,
                        'type': 'function'
                    }
                    brace_count = line.count('{') - line.count('}')
                else:
                    current_chunk['text'] += '\n' + line
                    current_chunk['end_line'] = i
                    brace_count += line.count('{') - line.count('}')
            elif current_chunk:
                current_chunk['text'] += '\n' + line
                current_chunk['end_line'] = i
                brace_count += line.count('{') - line.count('}')
                
                if brace_count == 0 and len(current_chunk['text']) > 50:
                    chunks.append(current_chunk)
                    current_chunk = None
        
        if current_chunk:
            chunks.append(current_chunk)
        
        return chunks
    
    def _chunk_by_lines(self, content: str) -> List[Dict]:
        """Fallback: chunk by fixed number of lines."""
        chunks = []
        lines = content.split('\n')
        
        for i in range(0, len(lines), self.max_chunk_size):
            chunk_lines = lines[i:i + self.max_chunk_size]
            chunks.append({
                'text': '\n'.join(chunk_lines),
                'start_line': i + 1,
                'end_line': min(i + len(chunk_lines), len(lines)),
                'type': 'block'
            })
        
        return chunks
    
    def _fill_gaps(self, content: str, existing_chunks: List[Dict]) -> List[Dict]:
        """Fill gaps between extracted structures with line-based chunks."""
        lines = content.split('\n')
        all_chunks = []
        last_end = 0
        
        for chunk in sorted(existing_chunks, key=lambda x: x['start_line']):
            # Add gap chunk if there's a gap
            if chunk['start_line'] > last_end + 1:
                gap_lines = lines[last_end:chunk['start_line'] - 1]
                if len(gap_lines) >= self.min_chunk_size:
                    all_chunks.append({
                        'text': '\n'.join(gap_lines),
                        'start_line': last_end + 1,
                        'end_line': chunk['start_line'] - 1,
                        'type': 'block'
                    })
            
            all_chunks.append(chunk)
            last_end = chunk['end_line']
        
        # Add remaining content
        if last_end < len(lines):
            remaining = lines[last_end:]
            if len(remaining) >= self.min_chunk_size:
                all_chunks.append({
                    'text': '\n'.join(remaining),
                    'start_line': last_end + 1,
                    'end_line': len(lines),
                    'type': 'block'
                })
        
        return all_chunks


class CodeIngester:
    """Main class for ingesting code into Qdrant."""
    
    def __init__(
        self,
        qdrant_url: str = "http://localhost:6333",
        collection_name: str = "code_search",
        embedding_model: str = "BAAI/bge-small-en-v1.5"
    ):
        self.client = QdrantClient(url=qdrant_url)
        self.collection_name = collection_name
        # FastEmbed is much lighter - no PyTorch required!
        self.model = TextEmbedding(model_name=embedding_model)
        self.chunker = CodeChunker()
        
        # Language extensions mapping
        self.language_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.go': 'go',
            '.rs': 'rust',
            '.rb': 'ruby',
            '.php': 'php',
            '.swift': 'swift',
            '.kt': 'kotlin',
        }
    
    def detect_language(self, file_path: str) -> str:
        """Detect programming language from file extension."""
        ext = Path(file_path).suffix.lower()
        return self.language_map.get(ext, 'unknown')
    
    def create_collection(self, vector_size: Optional[int] = None):
        """
        Create Qdrant collection for code embeddings.
        Automatically detects vector size from the model if not provided.
        """
        if vector_size is None:
            # Get vector size from model (fastembed returns iterators)
            test_embedding = list(self.model.embed("test"))[0]
            vector_size = len(test_embedding)
        
        try:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE
                ),
            )
            print(f"✅ Created collection '{self.collection_name}' (vector size: {vector_size})")
        except Exception as e:
            if "already exists" in str(e).lower():
                print(f"ℹ️  Collection '{self.collection_name}' already exists")
            else:
                raise
    
    def ingest_directory(
        self,
        directory: str,
        repo_name: Optional[str] = None,
        exclude_dirs: Optional[List[str]] = None
    ):
        """
        Recursively ingest all code files from a directory.
        
        Args:
            directory: Path to code directory
            repo_name: Name of the repository/project
            exclude_dirs: List of directory names to exclude (e.g., ['node_modules', '.git'])
        """
        if exclude_dirs is None:
            exclude_dirs = ['.git', 'node_modules', '__pycache__', '.venv', 'venv', 'env', '.env']
        
        directory = Path(directory)
        if not directory.exists():
            raise ValueError(f"Directory not found: {directory}")
        
        if repo_name is None:
            repo_name = directory.name
        
        # Find all code files
        code_files = []
        for ext in self.language_map.keys():
            code_files.extend(directory.rglob(f"*{ext}"))
        
        # Filter out excluded directories
        code_files = [
            f for f in code_files
            if not any(excluded in f.parts for excluded in exclude_dirs)
        ]
        
        print(f"📁 Found {len(code_files)} code files in {directory}")
        
        # Process files
        all_points = []
        total_chunks = 0
        
        for file_path in code_files:
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                
                language = self.detect_language(str(file_path))
                chunks = self.chunker.chunk_file(str(file_path), content, language)
                
                for chunk in chunks:
                    # Generate embedding (fastembed returns iterator)
                    embedding = list(self.model.embed(chunk['text']))[0].tolist()
                    
                    # Create point
                    point = PointStruct(
                        id=len(all_points),
                        vector=embedding,
                        payload={
                            'file_path': str(file_path.relative_to(directory)),
                            'code_snippet': chunk['text'],
                            'repo_name': repo_name,
                            'language': language,
                            'start_line': chunk['start_line'],
                            'end_line': chunk['end_line'],
                            'chunk_type': chunk['type']
                        }
                    )
                    all_points.append(point)
                    total_chunks += 1
                
                if len(all_points) >= 100:  # Batch upsert every 100 points
                    self.client.upsert(
                        collection_name=self.collection_name,
                        points=all_points,
                        wait=True
                    )
                    print(f"  ✅ Upserted {len(all_points)} chunks (total: {total_chunks})")
                    all_points = []
            
            except Exception as e:
                print(f"  ⚠️  Error processing {file_path}: {e}")
                continue
        
        # Upsert remaining points
        if all_points:
            self.client.upsert(
                collection_name=self.collection_name,
                points=all_points,
                wait=True
            )
            print(f"  ✅ Upserted {len(all_points)} chunks (total: {total_chunks})")
        
        print(f"\n✨ Ingestion complete! Total chunks: {total_chunks}")
    
    def get_collection_info(self):
        """Get information about the collection."""
        try:
            info = self.client.get_collection(self.collection_name)
            print(f"\n📊 Collection '{self.collection_name}':")
            print(f"   Points: {info.points_count}")
            print(f"   Vector size: {info.config.params.vectors.size}")
            print(f"   Distance: {info.config.params.vectors.distance}")
        except Exception as e:
            print(f"❌ Error getting collection info: {e}")


def main():
    """CLI entry point for ingestion."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Ingest code into Qdrant')
    parser.add_argument('directory', help='Path to code directory')
    parser.add_argument('--repo-name', help='Repository/project name', default=None)
    parser.add_argument('--collection', help='Qdrant collection name', default='code_search')
    parser.add_argument('--qdrant-url', help='Qdrant URL', default='http://localhost:6333')
    parser.add_argument('--model', help='Embedding model', default='BAAI/bge-small-en-v1.5')
    
    args = parser.parse_args()
    
    # Initialize ingester
    ingester = CodeIngester(
        qdrant_url=args.qdrant_url,
        collection_name=args.collection,
        embedding_model=args.model
    )
    
    # Create collection
    ingester.create_collection()
    
    # Ingest directory
    ingester.ingest_directory(args.directory, repo_name=args.repo_name)
    
    # Show collection info
    ingester.get_collection_info()


if __name__ == "__main__":
    main()

