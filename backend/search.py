"""Semantic + Hybrid Code Search Module.

This module provides two layers:

1. Retrieval: Qdrant vector search over local FastEmbed embeddings.
2. Re-ranking: a lightweight TF-IDF lexical scorer that boosts exact
   matches on symbol names and identifiers.

The API remains backwards compatible for simple CLI and UI usage:
`CodeSearcher.search()` still returns a list of dicts and `print_results`
prints a human-readable view.
"""

import math
import re
from collections import Counter, defaultdict
from typing import Any, Dict, List, Optional

from qdrant_client import QdrantClient
from qdrant_client.models import FieldCondition, Filter, MatchValue
from fastembed import TextEmbedding


class CodeSearcher:
    """Search code using semantic + lexical similarity.

    Qdrant provides the semantic ranking (cosine similarity over embeddings).
    We then re-rank the top-N semantic hits using a cheap in-memory
    TF-IDF-based lexical similarity and combine both scores:

        final_score = 0.7 * semantic_score + 0.3 * lexical_score

    where both components are normalised into [0, 1] per query.
    """

    def __init__(
        self,
        qdrant_url: str = "http://localhost:6333",
        collection_name: str = "code_search",
        embedding_model: str = "BAAI/bge-small-en-v1.5",
    ) -> None:
        # Use HTTP endpoint on the provided URL (e.g. http://localhost:6333).
        # This avoids requiring the separate gRPC port to be exposed.
        self.client = QdrantClient(path="./qdrant_db")
        self.collection_name = collection_name
        # FastEmbed is much lighter - no PyTorch required.
        self.model = TextEmbedding(model_name=embedding_model)

        # Tunable weights for score fusion.
        self.semantic_weight = 0.7
        self.lexical_weight = 0.3

        # Simple in-memory cache for query embeddings within a process.
        self._embedding_cache: Dict[str, List[float]] = {}

    # ------------------------------------------------------------------
    # Retrieval + hybrid scoring
    # ------------------------------------------------------------------

    def search(
        self,
        query: str,
        limit: int = 5,
        language_filter: Optional[str] = None,
        repo_filter: Optional[str] = None,
        chunk_types_filter: Optional[List[str]] = None,
        min_score: float = 0.0,
        sort_by: str = "relevance",  # "relevance", "semantic", "lexical"
        semantic_weight: Optional[float] = None,
        overfetch_multiplier: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search for code snippets matching a natural language query."""

        # Use provided weight or fall back to instance default
        s_weight = semantic_weight if semantic_weight is not None else self.semantic_weight
        l_weight = 1.0 - s_weight

        # Ensure the target collection exists.
        try:
            self.client.get_collection(self.collection_name)
        except Exception as e:
            if "doesn't exist" in str(e) or "not found" in str(e).lower():
                raise ValueError(f"Collection '{self.collection_name}' doesn't exist!")
            raise

        # Generate (and cache) embedding for the query.
        if query in self._embedding_cache:
            query_embedding = self._embedding_cache[query]
        else:
            query_embedding = list(self.model.embed(query))[0].tolist()
            self._embedding_cache[query] = query_embedding

        # Build Qdrant filter if needed.
        query_filter: Optional[Filter] = None
        must_conditions: List[FieldCondition] = []
        if language_filter:
            # Ingestion stores languages in lowercase (e.g. 'python'), 
            # while the frontend might send capitalized versions (e.g. 'Python').
            must_conditions.append(
                FieldCondition(key="language", match=MatchValue(value=language_filter.lower()))
            )
        if repo_filter:
            must_conditions.append(
                FieldCondition(key="repo_name", match=MatchValue(value=repo_filter))
            )
        if chunk_types_filter:
            # Qdrant match can take a list for 'any of'
            from qdrant_client.models import MatchAny
            must_conditions.append(
                FieldCondition(key="symbol_type", match=MatchAny(any=chunk_types_filter))
            )

        if must_conditions:
            query_filter = Filter(must=must_conditions)

        # Over-fetch candidates so lexical re-ranking has room to reshuffle.
        initial_limit = max(limit * overfetch_multiplier, 50)
        results = self.client.query_points(
            collection_name=self.collection_name,
            query=query_embedding,
            query_filter=query_filter,
            with_payload=True,
            limit=initial_limit,
        )

        if not results.points:
            return []

        # ---------------- Lexical scoring (TF‑IDF) -----------------
        query_tokens = self._tokenize(query)
        query_tf = Counter(query_tokens)

        doc_tfs: List[Counter] = []
        df: Dict[str, int] = defaultdict(int)
        for point in results.points:
            text = (point.payload or {}).get("code_snippet", "")
            tokens = self._tokenize(text)
            tf = Counter(tokens)
            doc_tfs.append(tf)
            for term in tf:
                df[term] += 1

        num_docs = len(results.points)

        # Build query TF‑IDF vector.
        query_vec: Dict[str, float] = {}
        for term, freq in query_tf.items():
            term_df = df.get(term, 0)
            if term_df == 0:
                continue
            idf = math.log(1 + num_docs / (1 + term_df))
            query_vec[term] = freq * idf

        lexical_scores: List[float] = []
        for idx, tf in enumerate(doc_tfs):
            doc_vec: Dict[str, float] = {}
            for term, freq in tf.items():
                term_df = df.get(term, 0)
                if term_df == 0:
                    continue
                idf = math.log(1 + num_docs / (1 + term_df))
                doc_vec[term] = freq * idf

            score = self._cosine_similarity(query_vec, doc_vec)

            payload = results.points[idx].payload or {}
            symbol_name = str(payload.get("symbol_name") or "").lower()
            if symbol_name and symbol_name in " ".join(query_tokens):
                score *= 1.25

            lexical_scores.append(score)

        semantic_scores = [p.score for p in results.points]
        
        # Normalization: handle edge cases where all scores are the same or zero
        min_sem, max_sem = min(semantic_scores), max(semantic_scores)
        range_sem = max_sem - min_sem if max_sem > min_sem else 1.0
        
        min_lex, max_lex = min(lexical_scores), max(lexical_scores)
        range_lex = max_lex - min_lex if max_lex > min_lex else 1.0

        fused: List[Dict[str, Any]] = []
        for idx, point in enumerate(results.points):
            # Normalize to [0, 1] based on the current candidate set
            semantic_norm = (semantic_scores[idx] - min_sem) / range_sem if max_sem > min_sem else 1.0
            lexical_norm = (lexical_scores[idx] - min_lex) / range_lex if max_lex > min_lex else 0.0
            
            # If everything is identical (e.g. all 0), default to 1 for semantic if it was the top hit
            if max_sem == min_sem and idx == 0: semantic_norm = 1.0
            
            # Select primary score based on sort_by
            if sort_by == "semantic":
                final_score = semantic_norm
            elif sort_by == "lexical":
                # Special case: if lexical matches are found, use norm; 
                # if no lexical matches found at ALL, avoid returning 1.0 incorrectly
                final_score = lexical_norm if max_lex > 0 else 0.0
            else:  # relevance (hybrid)
                final_score = (s_weight * semantic_norm) + (l_weight * lexical_norm)

            # Apply min_score filter
            # If min_score is high (e.g. 0.5), we only keep results that are significantly
            # better than the worst hit in the top-50.
            if final_score < min_score:
                continue

            payload = point.payload or {}
            fused.append(
                {
                    "score": final_score,
                    "semantic_score": semantic_scores[idx],
                    "lexical_score": lexical_scores[idx],
                    "file_path": payload.get("file_path", ""),
                    "code_snippet": payload.get("code_snippet", ""),
                    "repo_name": payload.get("repo_name", ""),
                    "language": payload.get("language", ""),
                    "start_line": payload.get("start_line", 0),
                    "end_line": payload.get("end_line", 0),
                    "chunk_type": payload.get(
                        "chunk_type", payload.get("symbol_type", "block")
                    ),
                    "symbol_name": payload.get("symbol_name"),
                    "symbol_type": payload.get("symbol_type"),
                    "signature": payload.get("signature"),
                    "docstring": payload.get("docstring"),
                }
            )

        fused.sort(key=lambda r: r["score"], reverse=True)
        return fused[:limit]

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _tokenize(self, text: str) -> List[str]:
        """Tokenise code or natural language into lowercase terms.

        This is intentionally simple and dependency-free: we split on
        non-alphanumeric characters but keep underscores so that identifiers
        like ``get_user_by_id`` remain a single token and match exact symbol
        names and configuration keys.
        """

        return [
            t.lower()
            for t in re.findall(r"[A-Za-z0-9_]+", text)
            if t
        ]

    def _cosine_similarity(self, a: Dict[str, float], b: Dict[str, float]) -> float:
        """Compute cosine similarity between two sparse TF‑IDF vectors."""

        if not a or not b:
            return 0.0

        dot = 0.0
        for term, aval in a.items():
            bval = b.get(term)
            if bval is not None:
                dot += aval * bval

        if dot == 0.0:
            return 0.0

        norm_a = math.sqrt(sum(v * v for v in a.values()))
        norm_b = math.sqrt(sum(v * v for v in b.values()))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return dot / (norm_a * norm_b)

    # ------------------------------------------------------------------
    # CLI helpers
    # ------------------------------------------------------------------

    def print_results(self, results: List[Dict[str, Any]]) -> None:
        """Pretty print search results for the CLI."""

        if not results:
            print("No results found.")
            return

        print(f"\nFound {len(results)} results:\n")
        print("=" * 80)

        for i, result in enumerate(results, 1):
            sem = result.get("semantic_score")
            lex = result.get("lexical_score")
            if sem is not None and lex is not None:
                print(
                    f"\n[{i}] Score: {result['score']:.4f} "
                    f"(semantic={sem:.4f}, lexical={lex:.4f})"
                )
            else:
                print(f"\n[{i}] Score: {result['score']:.4f}")

            print(f"    File: {result['file_path']}")
            print(f"    Repo: {result['repo_name']}")
            print(f"    Language: {result['language']}")
            print(
                f"    Lines: {result['start_line']}-{result['end_line']} "
                f"({result['chunk_type']})"
            )

            print("\n    Code snippet:")
            print("    " + "-" * 76)

            code_lines = result["code_snippet"].split("\n")
            for offset, line in enumerate(code_lines, start=0):
                line_num = result["start_line"] + offset
                print(f"    {line_num:4d} | {line}")

            print("    " + "-" * 76)
            print()

        print("=" * 80)


def main() -> None:
    """CLI entry point for search."""

    import argparse
    import json

    from reasoning import generate_change_plan

    parser = argparse.ArgumentParser(description="Search code using hybrid similarity or generate a change plan")
    parser.add_argument("query", help="Natural language search query")
    parser.add_argument("--limit", type=int, default=5, help="Number of results (default: 5)")
    parser.add_argument("--language", help="Filter by programming language")
    parser.add_argument("--repo", help="Filter by repository name")
    parser.add_argument("--collection", help="Qdrant collection name", default="code_search")
    parser.add_argument("--qdrant-url", help="Qdrant URL", default="http://localhost:6333")
    parser.add_argument("--model", help="Embedding model", default="BAAI/bge-small-en-v1.5")
    parser.add_argument(
        "--mode",
        choices=["search", "plan"],
        default="search",
        help="Execution mode: 'search' (default) or 'plan' for a Gemini-generated change plan",
    )

    args = parser.parse_args()

    searcher = CodeSearcher(
        qdrant_url=args.qdrant_url,
        collection_name=args.collection,
        embedding_model=args.model,
    )

    results = searcher.search(
        query=args.query,
        limit=args.limit,
        language_filter=args.language,
        repo_filter=args.repo,
    )

    if args.mode == "search":
        searcher.print_results(results)
    else:  # plan mode
        plan = generate_change_plan(args.query, results)
        print(json.dumps(plan, indent=2))


if __name__ == "__main__":  # pragma: no cover - CLI entry
    main()


