import { useState, useMemo, useRef } from 'react';

const useSearch = (authFetch, semanticWeight) => {
  const resultsRef = useRef(null);

  // Search State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [plan, setPlan] = useState(null);

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

  // Reactive Results Filtering
  const displayedResults = useMemo(() => {
    return results;
  }, [results]);

  const handleSearch = async (e, forcedQuery = null) => {
    if (e) e.preventDefault();
    const finalQuery = forcedQuery || query;
    if (!finalQuery) return;

    setLoading(true);
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
      const response = await authFetch('http://127.0.0.1:8000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: finalQuery,
          limit,
          language: language === 'All' ? null : language,
          repo: repo === 'All' ? null : repo,
          chunk_types: chunkTypes.map(t => {
            const map = { 'Functions': 'function', 'Classes': 'class', 'Blocks': 'block' };
            return map[t] || t.toLowerCase();
          }),
          min_score: minScore,
          sort_by: sortBy,
          semantic_weight: semanticWeight,
          mode: 'search'
        }),
      });
      const data = await response.json();
      const searchLatency = performance.now() - startTime;
      const resultsData = data.results || [];

      setResults(resultsData);
      setSearchTime((searchLatency / 1000).toFixed(2));

      // Update Analytics Data
      if (resultsData.length > 0) {
        // 1. Score Distribution (Buckets of 0.1)
        const buckets = Array(10).fill(0).map((_, i) => ({ range: `${(i / 10).toFixed(1)}-${((i + 1) / 10).toFixed(1)}`, count: 0 }));
        resultsData.forEach(r => {
          const idx = Math.min(Math.floor(r.score * 10), 9);
          buckets[idx].count++;
        });

        // 2. Correlation (Semantic vs Lexical)
        const corr = resultsData.map(r => ({
          semantic: r.semantic_score || 0,
          lexical: r.lexical_score || 0,
          name: r.symbol_name || 'block'
        }));

        // 3. Symbol Frequency
        const symMap = {};
        resultsData.forEach(r => {
          const key = r.symbol_name || 'unknown';
          if (!symMap[key]) symMap[key] = { name: key, type: r.symbol_type || 'block', file: r.file_path, count: 0 };
          symMap[key].count++;
        });
        const topSymbols = Object.values(symMap).sort((a, b) => b.count - a.count).slice(0, 6);

        // 4. Languages
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
    }
  };

  const toggleChunkType = (type) => {
    setChunkTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return {
    query, setQuery, results, loading, searchTime,
    expandedIndex, setExpandedIndex, plan,
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
