#!/usr/bin/env python3
"""Local latency benchmark: hybrid search + optional Gemini plan.

Run from backend/ (or set PYTHONPATH):

  cd backend && python scripts/benchmark_latency.py --iterations 3 --plan \\
      --query "add logging to API"

Requires GEMINI_API_KEY in environment for --plan.
"""

from __future__ import annotations

import argparse
import os
import statistics
import sys
import time
from pathlib import Path

# Repo layout: scripts/ alongside main.py imports
_BACKEND = Path(__file__).resolve().parent.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))


def main() -> None:
    ap = argparse.ArgumentParser(description="Benchmark search vs plan timings")
    ap.add_argument("--query", default="authentication", help="Search / plan query")
    ap.add_argument("--iterations", type=int, default=3)
    ap.add_argument("--limit", type=int, default=10)
    ap.add_argument(
        "--plan",
        action="store_true",
        help="Include Gemini generate_change_plan timings",
    )
    args = ap.parse_args()

    from search import CodeSearcher
    from reasoning import generate_change_plan

    if args.plan and not os.getenv("GEMINI_API_KEY"):
        print("Warning: GEMINI_API_KEY unset — plan runs will likely fail.")

    searcher = CodeSearcher(collection_name="code_search")
    search_ms: list[float] = []
    plan_ms: list[float] = []
    gemini_only: list[float] = []

    print(
        f"Benchmark: query={args.query!r} limit={args.limit} iterations={args.iterations} plan={args.plan}",
        flush=True,
    )

    for i in range(args.iterations):
        t0 = time.perf_counter()
        results = searcher.search(query=args.query, limit=args.limit)
        s_ms = (time.perf_counter() - t0) * 1000.0
        search_ms.append(s_ms)

        if args.plan and results:
            timings: dict = {}
            t1 = time.perf_counter()
            generate_change_plan(args.query, results, timings)
            wall = (time.perf_counter() - t1) * 1000.0
            plan_ms.append(wall)
            g = timings.get("gemini_ms")
            if isinstance(g, (int, float)):
                gemini_only.append(float(g))

        print(
            f"  [{i+1}] search_ms={s_ms:.1f} hits={len(results)}"
            + (
                f" plan_wall_ms={plan_ms[-1]:.1f} gemini_ms={gemini_only[-1] if gemini_only else '—'}"
                if args.plan and results
                else ""
            ),
            flush=True,
        )

    def _fmt(xs: list[float]) -> str:
        if not xs:
            return "n/a"
        return f"p50={statistics.median(xs):.1f} mean={statistics.fmean(xs):.1f} min={min(xs):.1f} max={max(xs):.1f}"

    print(f"\nSearch (hybrid+Qdrant): {_fmt(search_ms)}", flush=True)
    if args.plan:
        print(f"Plan wall (retrieve+Gemini): {_fmt(plan_ms)}", flush=True)
        if gemini_only:
            print(f"Gemini-only (reported):     {_fmt(gemini_only)}", flush=True)


if __name__ == "__main__":
    main()
