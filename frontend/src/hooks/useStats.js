import { useState, useEffect, useRef, useCallback } from 'react';

const BASE_URL = 'http://127.0.0.1:8000';

const langConfig = {
  'python': { color: 'from-blue-500 to-indigo-500', display: 'Python', hex: '#3b82f6' },
  'javascript': { color: 'from-yellow-400 to-yellow-500', display: 'JavaScript', hex: '#facc15' },
  'typescript': { color: 'from-blue-400 to-sky-400', display: 'TypeScript', hex: '#38bdf8' },
  'java': { color: 'from-orange-600 to-red-500', display: 'Java', hex: '#ea580c' },
  'c++': { color: 'from-pink-500 to-rose-500', display: 'C++', hex: '#f43f5e' },
  'go': { color: 'from-teal-400 to-cyan-400', display: 'Go', hex: '#14b8a6' },
  'rust': { color: 'from-orange-700 to-red-600', display: 'Rust', hex: '#c2410c' },
  'markdown': { color: 'from-slate-400 to-slate-200', display: 'Markdown', hex: '#94a3b8' }
};

const useStats = (token, authFetch) => {
  const [stats, setStats] = useState({
    points: '...',
    repos: '...',
    languages: '...',
    latency: '...',
    pointsTrend: null,
    langData: [],
    repoList: []
  });

  const prevPointsRef = useRef(null);

  // Fix #3: Wrap in useCallback so the stable reference can be added to useEffect deps
  const fetchInfo = useCallback(async () => {
    if (!token) return;
    const startTime = performance.now();
    try {
      const resp = await authFetch(`${BASE_URL}/info`);
      if (resp.ok) {
        const data = await resp.json();
        const infoLatency = ((performance.now() - startTime) / 1000).toFixed(2);

        const lData = Object.entries(data.languages || {}).map(([name, count]) => {
          const key = name.toLowerCase();
          const config = langConfig[key] || { color: 'from-emerald-500 to-indigo-500', display: name, hex: '#10b981' };
          return {
            name: config.display,
            count: count.toLocaleString(),
            pct: (count / data.points_count) * 100,
            gradient: config.color
          };
        }).sort((a, b) => b.pct - a.pct);

        let trend = null;
        if (prevPointsRef.current !== null && data.points_count > prevPointsRef.current) {
          trend = `+${data.points_count - prevPointsRef.current} new`;
        } else if (prevPointsRef.current === null) {
          trend = "Live";
        }
        prevPointsRef.current = data.points_count;

        setStats({
          points: data.points_count.toLocaleString(),
          repos: data.repo_count.toString(),
          languages: Object.keys(data.languages || {}).length.toString(),
          latency: `${infoLatency}s`,
          pointsTrend: trend,
          langData: lData,
          repoList: (data.repos || []).map(r => {
            const key = r.primary_language?.toLowerCase();
            const config = langConfig[key] || { color: 'from-emerald-500 to-indigo-500', display: r.primary_language, hex: '#10b981' };
            return {
              name: r.name,
              points: `${r.points_count.toLocaleString()}`,
              lang: config.display,
              color: config.hex
            };
          })
        });
      }
    } catch {
      console.error('Info fetch failed');
    }
  }, [token, authFetch]); // Fix #3: authFetch in deps

  useEffect(() => {
    fetchInfo();
    const interval = setInterval(fetchInfo, 5000);
    return () => clearInterval(interval);
  }, [fetchInfo]); // Fix #3: use stable fetchInfo reference

  return { stats };
};

export default useStats;
