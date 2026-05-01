import { useState, useRef } from 'react';

const BASE_URL = 'http://127.0.0.1:8000'; // Fix #5: unified URL constant

/** Parse one SSE block that may contain multiple lines; return payload objects. */
function parseSSEBlocks(buffer) {
  /** @type {{ events: any[], rest: string }} */
  const out = { events: [], rest: '' };
  const chunks = buffer.split(/\r?\n\r?\n/);
  out.rest = chunks.pop() ?? '';
  for (const block of chunks) {
    const dataLine = block.split(/\r?\n/).find((l) => l.startsWith('data: '));
    if (!dataLine) continue;
    try {
      out.events.push(JSON.parse(dataLine.slice(6)));
    } catch {
      /* ignore malformed chunk */
    }
  }
  return out;
}

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
  const [planStreamPreview, setPlanStreamPreview] = useState('');
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

  const buildSearchBody = (finalQuery, activeMode) =>
    JSON.stringify({
      query: finalQuery,
      limit,
      language: language === 'All' ? null : language,
      repo: repo === 'All' ? null : repo,
      chunk_types:
        chunkTypes.length === 0 || chunkTypes.length === 3
          ? null
          : chunkTypes.map((t) => {
              const map = { Functions: 'function', Classes: 'class', Blocks: 'block' };
              return map[t] || t.toLowerCase();
            }),
      min_score: minScore,
      sort_by: sortBy,
      semantic_weight: semanticWeight,
      mode: activeMode
    });

  const consumePlanStream = async (response, startTime) => {
    if (!response.ok || !response.body) return false;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let sawComplete = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSSEBlocks(buffer);
      buffer = rest;

      for (const json of events) {
        if (json.event === 'retrieval_done') {
          const rd = json.results || [];
          setResults(rd);
          const sm = json.timings?.search_ms;
          setSearchTime(
            sm != null ? (sm / 1000).toFixed(2) : ((performance.now() - startTime) / 1000).toFixed(2)
          );
        }
        if (json.event === 'plan_delta' && json.text) {
          setPlanStreamPreview((prev) => prev + json.text);
        }
        if (json.event === 'plan_done' && json.plan) {
          setPlan(json.plan);
        }
        if (json.event === 'complete') {
          sawComplete = true;
          const resultsData = json.results || [];
          setResults(resultsData);
          if (json.plan) setPlan(json.plan);
          const totalMs = json.timings?.total_ms;
          const effectiveMs =
            totalMs != null ? totalMs : performance.now() - startTime;
          setSearchTime((effectiveMs / 1000).toFixed(2));

          if (resultsData.length > 0) {
            applyAnalyticsFromResults(resultsData, startTime, effectiveMs);
          }
        }
        if (json.event === 'error') {
          console.warn('search/stream error:', json.detail);
          return false;
        }
      }
    }

    return sawComplete;
  };

  const applyAnalyticsFromResults = (resultsData, startTime, latencyOverride) => {
    const searchLatency = latencyOverride ?? performance.now() - startTime;
    const buckets = Array(10)
      .fill(0)
      .map((_, i) => ({
        range: `${(i / 10).toFixed(1)}-${((i + 1) / 10).toFixed(1)}`,
        count: 0
      }));
    resultsData.forEach((r) => {
      const idx = Math.min(Math.floor(r.score * 10), 9);
      buckets[idx].count++;
    });

    const corr = resultsData.map((r) => ({
      semantic: r.semantic_score || 0,
      lexical: r.lexical_score || 0,
      name: r.symbol_name || 'block'
    }));

    const symMap = {};
    resultsData.forEach((r) => {
      const key = r.symbol_name || 'unknown';
      if (!symMap[key]) {
        symMap[key] = {
          name: key,
          type: r.symbol_type || 'block',
          file: r.file_path,
          count: 0
        };
      }
      symMap[key].count++;
    });
    const topSymbols = Object.values(symMap).sort((a, b) => b.count - a.count).slice(0, 6);

    const langMap = {};
    resultsData.forEach((r) => {
      const key = r.language || 'Other';
      langMap[key] = (langMap[key] || 0) + 1;
    });
    const langData = Object.entries(langMap).map(([name, value]) => ({ name, value }));

    setAnalyticsData((prev) => ({
      scoreDistribution: buckets,
      correlation: corr,
      symbols: topSymbols,
      languages: langData,
      performance: [
        ...prev.performance.map((p) => ({ ...p, index: p.index })),
        {
          index:
            prev.performance.length > 0
              ? Math.max(...prev.performance.map((p) => p.index)) + 1
              : 1,
          time: Math.round(searchLatency),
          avg: Math.round(
            [...prev.performance.map((p) => p.time), searchLatency].reduce((a, b) => a + b, 0) /
              (prev.performance.length + 1)
          )
        }
      ].slice(-20)
    }));
  };

  const fallbackJsonSearch = async (finalQuery, activeMode, startTime) => {
    const response = await authFetch(`${BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: buildSearchBody(finalQuery, activeMode)
    });
    const data = await response.json();
    const searchLatency = performance.now() - startTime;
    const resultsData = data.results || [];

    setResults(resultsData);
    setSearchTime((searchLatency / 1000).toFixed(2));

    if (activeMode === 'plan' && data.plan) {
      setPlan(data.plan);
    }

    if (resultsData.length > 0) {
      applyAnalyticsFromResults(resultsData, startTime);
    }
  };

  const handleSearch = async (e, forcedQuery = null, forcedMode = null) => {
    if (e) e.preventDefault();
    const finalQuery = forcedQuery || query;
    if (!finalQuery) return;

    const activeMode = forcedMode || searchMode;

    setLoading(true);
    if (activeMode === 'plan') {
      setPlanLoading(true);
      setPlanStreamPreview('');
    }
    const startTime = performance.now();
    setPlan(null);
    setResults([]);
    setExpandedIndex(null);

    setSearchHistory((prev) => {
      const filtered = prev.filter((h) => h !== finalQuery);
      return [finalQuery, ...filtered].slice(0, 6);
    });

    try {
      if (activeMode === 'plan') {
        let streamOk = false;
        try {
          const streamResp = await authFetch(`${BASE_URL}/search/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'text/event-stream'
            },
            body: buildSearchBody(finalQuery, activeMode)
          });
          streamOk = await consumePlanStream(streamResp, startTime);
        } catch (streamErr) {
          console.warn('search/stream failed, falling back:', streamErr);
          streamOk = false;
        }

        if (!streamOk) {
          await fallbackJsonSearch(finalQuery, activeMode, startTime);
        }
      } else {
        await fallbackJsonSearch(finalQuery, activeMode, startTime);
      }

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
    setChunkTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return {
    query,
    setQuery,
    results,
    loading,
    searchTime,
    expandedIndex,
    setExpandedIndex,
    searchMode,
    setSearchMode,
    plan,
    planLoading,
    planStreamPreview,
    showFilters,
    setShowFilters,
    language,
    setLanguage,
    repo,
    setRepo,
    minScore,
    setMinScore,
    chunkTypes,
    toggleChunkType,
    sortBy,
    setSortBy,
    limit,
    setLimit,
    searchHistory,
    analyticsData,
    displayedResults,
    handleSearch,
    resultsRef
  };
};

export default useSearch;
