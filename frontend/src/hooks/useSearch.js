import { useState, useRef } from 'react';

const BASE_URL = 'http://127.0.0.1:8000'; // Fix #5: unified URL constant

const useSearch = (authFetch, semanticWeight) => {
  const resultsRef = useRef(null);

  // Search State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState(null);

  // ── Plan Mode ──────────────────────────────────────────────────────────────
  const [searchMode, setSearchMode] = useState('search'); // 'search' | 'plan'
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  // ──────────────────────────────────────────────────────────────────────────

  // Advanced Filter State
  const [showFilters, setShowFilters] = useState(true);
  const [language, setLanguage] = useState('All');
  const [repo, setRepo] = useState('All');
  const [minScore, setMinScore] = useState(0.0);
  const [chunkTypes, setChunkTypes] = useState(['Functions', 'Classes', 'Blocks']);
  const [sortBy, setSortBy] = useState('relevance');
  const [limit, setLimit] = useState(10);

  // Search History State
  const [searchHistory, setSearchHistory] = useState([
    'authentication middleware',
    'database query builder',
    'error handling patterns'
  ]);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState({
    scoreDistribution: [],
    correlation: [],
    symbols: [],
    languages: [],
    performance: []
  });

  // Results alias (no filtering needed here — results come pre-ranked from backend)
  const displayedResults = results;

  const handleSearch = async (e, forcedQuery = null, forcedMode = null) => {
    if (e) e.preventDefault();
    const finalQuery = forcedQuery || query;
    if (!finalQuery) return;

    // Determine which mode to use (allows history chips to keep current mode)
    const activeMode = forcedMode || searchMode;

    setLoading(true);
    if (activeMode === 'plan') setPlanLoading(true);
    const startTime = performance.now();
    setPlan(null);
    setResults([]);
    setExpandedIndex(null);

    // Update Search History
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h !== finalQuery);
      return [finalQuery, ...filtered].slice(0, 6);
    });

    try {
      const response = await authFetch(`${BASE_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: finalQuery,
          limit,
          language: language === 'All' ? null : language,
          repo: repo === 'All' ? null : repo,
          // Fix #14: send null when all types selected or none — avoids Qdrant MatchAny([]) error
          chunk_types: chunkTypes.length === 0 || chunkTypes.length === 3 ? null : chunkTypes.map(t => {
            const map = { 'Functions': 'function', 'Classes': 'class', 'Blocks': 'block' };
            return map[t] || t.toLowerCase();
          }),
          min_score: minScore,
          sort_by: sortBy,
          semantic_weight: semanticWeight,
          mode: activeMode   // ← 'search' OR 'plan' sent to backend
        }),
      });
      const data = await response.json();
      const searchLatency = performance.now() - startTime;
      const resultsData = data.results || [];

      setResults(resultsData);
      setSearchTime((searchLatency / 1000).toFixed(2));

      // ── If plan mode — store the plan from backend response ──────────────
      if (activeMode === 'plan' && data.plan) {
        setPlan(data.plan);
      }
      // ─────────────────────────────────────────────────────────────────────

      // Update Analytics Data
      if (resultsData.length > 0) {
        const buckets = Array(10).fill(0).map((_, i) => ({ range: `${(i / 10).toFixed(1)}-${((i + 1) / 10).toFixed(1)}`, count: 0 }));
        resultsData.forEach(r => {
          const idx = Math.min(Math.floor(r.score * 10), 9);
          buckets[idx].count++;
        });

        const corr = resultsData.map(r => ({
          semantic: r.semantic_score || 0,
          lexical: r.lexical_score || 0,
          name: r.symbol_name || 'block'
        }));

        const symMap = {};
        resultsData.forEach(r => {
          const key = r.symbol_name || 'unknown';
          if (!symMap[key]) symMap[key] = { name: key, type: r.symbol_type || 'block', file: r.file_path, count: 0 };
          symMap[key].count++;
        });
        const topSymbols = Object.values(symMap).sort((a, b) => b.count - a.count).slice(0, 6);

        const langMap = {};
        resultsData.forEach(r => {
          const key = r.language || 'Other';
          langMap[key] = (langMap[key] || 0) + 1;
        });
        const langData = Object.entries(langMap).map(([name, value]) => ({ name, value }));

        setAnalyticsData(prev => ({
          scoreDistribution: buckets,
          correlation: corr,
          symbols: topSymbols,
          languages: langData,
          performance: [...prev.performance.map(p => ({ ...p, index: p.index })), {
            index: prev.performance.length > 0 ? Math.max(...prev.performance.map(p => p.index)) + 1 : 1,
            time: Math.round(searchLatency),
            avg: Math.round([...prev.performance.map(p => p.time), searchLatency].reduce((a, b) => a + b, 0) / (prev.performance.length + 1))
          }].slice(-20)
        }));
      }

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setPlanLoading(false);
    }
  };

  const toggleChunkType = (type) => {
    setChunkTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return {
    query, setQuery, results, loading, searchTime,
    expandedIndex, setExpandedIndex,
    // Plan Mode exports
    searchMode, setSearchMode,
    plan, planLoading,
    showFilters, setShowFilters,
    language, setLanguage, repo, setRepo,
    minScore, setMinScore,
    chunkTypes, toggleChunkType,
    sortBy, setSortBy, limit, setLimit,
    searchHistory, analyticsData,
    displayedResults, handleSearch, resultsRef
  };
};

export default useSearch;
