"""
Semantic Code Search Module
Queries Qdrant to find code snippets matching natural language queries.
"""

from typing import List, Dict, Optional
from qdrant_client import QdrantClient
from fastembed import TextEmbedding


class CodeSearcher:
    """Search code using semantic similarity."""
    
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
    
    def search(
        self,
        query: str,
        limit: int = 5,
        language_filter: Optional[str] = None,
        repo_filter: Optional[str] = None
    ) -> List[Dict]:
        """
        Search for code snippets matching a natural language query.
        
        Args:
            query: Natural language search query
            limit: Number of results to return
            language_filter: Filter by programming language (optional)
            repo_filter: Filter by repository name (optional)
        
        Returns:
            List of dictionaries with search results
        """
        # Check if collection exists
        try:
            self.client.get_collection(self.collection_name)
        except Exception as e:
            if "doesn't exist" in str(e) or "not found" in str(e).lower():
                raise ValueError(
                    f"❌ Collection '{self.collection_name}' doesn't exist!\n"
                    f"   Please run ingestion first:\n"
                    f"   python ingest.py <directory> --repo-name <name>"
                ) from e
            raise
        
        # Generate embedding for query (fastembed returns iterator)
        query_embedding = list(self.model.embed(query))[0].tolist()
        
        # Build filter if needed
        query_filter = None
        if language_filter or repo_filter:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            
            must_conditions = []
            if language_filter:
                must_conditions.append(
                    FieldCondition(key="language", match=MatchValue(value=language_filter))
                )
            if repo_filter:
                must_conditions.append(
                    FieldCondition(key="repo_name", match=MatchValue(value=repo_filter))
                )
            
            if must_conditions:
                query_filter = Filter(must=must_conditions)
        
        # Search Qdrant
        results = self.client.query_points(
            collection_name=self.collection_name,
            query=query_embedding,
            query_filter=query_filter,
            with_payload=True,
            limit=limit
        )
        
        # Format results
        formatted_results = []
        for point in results.points:
            formatted_results.append({
                'score': point.score,
                'file_path': point.payload.get('file_path', ''),
                'code_snippet': point.payload.get('code_snippet', ''),
                'repo_name': point.payload.get('repo_name', ''),
                'language': point.payload.get('language', ''),
                'start_line': point.payload.get('start_line', 0),
                'end_line': point.payload.get('end_line', 0),
                'chunk_type': point.payload.get('chunk_type', 'block')
            })
        
        return formatted_results
    
    def print_results(self, results: List[Dict]):
        """Pretty print search results."""
        if not results:
            print("❌ No results found.")
            return
        
        print(f"\n🔍 Found {len(results)} results:\n")
        print("=" * 80)
        
        for i, result in enumerate(results, 1):
            print(f"\n[{i}] Score: {result['score']:.4f}")
            print(f"    📁 File: {result['file_path']}")
            print(f"    📦 Repo: {result['repo_name']}")
            print(f"    🔤 Language: {result['language']}")
            print(f"    📍 Lines: {result['start_line']}-{result['end_line']} ({result['chunk_type']})")
            print(f"\n    Code snippet:")
            print("    " + "-" * 76)
            
            # Print code with line numbers
            code_lines = result['code_snippet'].split('\n')
            for line_num in range(result['start_line'], result['start_line'] + len(code_lines)):
                if line_num - result['start_line'] < len(code_lines):
                    line = code_lines[line_num - result['start_line']]
                    print(f"    {line_num:4d} | {line}")
            
            print("    " + "-" * 76)
            print()
        
        print("=" * 80)


def main():
    """CLI entry point for search."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Search code using semantic similarity')
    parser.add_argument('query', help='Natural language search query')
    parser.add_argument('--limit', type=int, default=5, help='Number of results (default: 5)')
    parser.add_argument('--language', help='Filter by programming language')
    parser.add_argument('--repo', help='Filter by repository name')
    parser.add_argument('--collection', help='Qdrant collection name', default='code_search')
    parser.add_argument('--qdrant-url', help='Qdrant URL', default='http://localhost:6333')
    parser.add_argument('--model', help='Embedding model', default='BAAI/bge-small-en-v1.5')
    
    args = parser.parse_args()
    
    # Initialize searcher
    searcher = CodeSearcher(
        qdrant_url=args.qdrant_url,
        collection_name=args.collection,
        embedding_model=args.model
    )
    
    # Perform search
    results = searcher.search(
        query=args.query,
        limit=args.limit,
        language_filter=args.language,
        repo_filter=args.repo
    )
    
    # Print results
    searcher.print_results(results)


if __name__ == "__main__":
    main()

