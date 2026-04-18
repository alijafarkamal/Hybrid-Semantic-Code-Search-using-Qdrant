import { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CustomDropdown from '../components/CustomDropdown';

// Language map: our backend lang names → Prism language IDs
const LANG_MAP = {
  python: 'python',
  javascript: 'javascript',
  typescript: 'typescript',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  csharp: 'csharp',
  go: 'go',
  rust: 'rust',
  ruby: 'ruby',
  php: 'php',
  swift: 'swift',
  kotlin: 'kotlin',
  markdown: 'markdown',
};

// Copy button component — local to this file
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      title="Copy code"
      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200 border
        ${copied
          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
          : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200 hover:border-slate-600'
        }`}
    >
      {copied ? (
        <>
          <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2">
            <path d="M3 8l4 4 6-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="5" width="9" height="9" rx="1.5" />
            <path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" strokeLinecap="round" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
};

const SearchView = ({
  query, setQuery, handleSearch,
  searchHistory,
  showFilters, setShowFilters,
  language, setLanguage,
  repo, setRepo,
  stats,
  minScore, setMinScore,
  chunkTypes, toggleChunkType,
  sortBy, setSortBy,
  limit, setLimit,
  loading,
  displayedResults,
  searchTime,
  expandedIndex, setExpandedIndex,
  resultsRef
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Search Bar & Chips */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="relative group max-w-5xl mx-auto flex gap-3">
          <div className="relative flex-1">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-light">🔍</div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your codebase…"
              className="w-full bg-[#111827] border border-slate-800 focus:border-blue-500/50 rounded-2xl py-4 pl-16 pr-8 text-lg outline-none transition-all shadow-2xl"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2 shrink-0"
          >
            <span>Search</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2 justify-center max-w-5xl mx-auto">
          {searchHistory.map((s, idx) => (
            <button
              key={`${s}-${idx}`}
              onClick={() => { setQuery(s); handleSearch(null, s); }}
              className="px-4 py-1.5 bg-[#161e2e]/50 border border-slate-800/50 rounded-full text-[10px] text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-all flex items-center gap-2 group"
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">↺</span>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-[#111827]/50 border border-slate-800 rounded-2xl max-w-5xl mx-auto transition-all shadow-xl relative">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`w-full p-4 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors bg-[#111827] rounded-t-2xl ${!showFilters ? 'rounded-b-2xl' : ''}`}
        >
          <span className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : 'rotate-90'}`}>⌵</span>
          Advanced Filters
        </button>

        {showFilters && (
          <div className="px-6 py-5 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-800/50 rounded-b-2xl overflow-x-auto">
            <div className="flex flex-wrap items-start gap-6 min-w-0">

              {/* Language */}
              <CustomDropdown
                label="Language"
                value={language}
                onChange={(val) => setLanguage(val)}
                options={['All', 'Python', 'JavaScript', 'TypeScript', 'Markdown']}
              />

              {/* Repository */}
              <CustomDropdown
                label="Repository"
                value={repo}
                onChange={(val) => setRepo(val)}
                options={['All', ...stats.repoList.map(r => r.name)]}
              />

              {/* Min Score Slider */}
              <div className="space-y-2 min-w-[120px] flex-1 max-w-[200px]">
                <div className="flex justify-between">
                  <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Min Score</label>
                  <span className="text-[10px] font-mono text-blue-400">{(minScore * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={minScore} onChange={(e) => setMinScore(parseFloat(e.target.value))}
                  className="w-full premium-range"
                  style={{
                    background: `linear-gradient(to right, #06b6d4 0%, #14b8a6 ${minScore * 100}%, rgba(30, 41, 59, 0.5) ${minScore * 100}%, rgba(30, 41, 59, 0.5) 100%)`
                  }}
                />
              </div>

              {/* Divider */}
              <div className="w-px bg-slate-800 self-stretch hidden md:block"></div>

              {/* Chunk Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Chunk Type</label>
                <div className="flex flex-col gap-1.5">
                  {['Functions', 'Classes', 'Blocks'].map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={chunkTypes.includes(type)}
                        onChange={() => toggleChunkType(type)}
                        className="accent-blue-500 w-3.5 h-3.5 rounded cursor-pointer"
                      />
                      <span className={`text-xs font-medium transition-colors ${chunkTypes.includes(type) ? 'text-slate-200' : 'text-slate-500'} group-hover:text-slate-300`}>{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Sort By</label>
                <div className="flex flex-col gap-1.5">
                  {['Relevance', 'Semantic', 'Lexical'].map(mode => (
                    <label key={mode} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="sortBy"
                        checked={sortBy === mode.toLowerCase()}
                        onChange={() => setSortBy(mode.toLowerCase())}
                        className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className={`text-xs font-medium transition-colors ${sortBy === mode.toLowerCase() ? 'text-slate-200' : 'text-slate-500'} group-hover:text-slate-300`}>{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="w-px bg-slate-800 self-stretch hidden md:block"></div>

              {/* Results Limit */}
              <div className="space-y-2 min-w-[120px] flex-1 max-w-[200px]">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={limit}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val > 0) setLimit(val);
                    }}
                    className="bg-[#0f172a] border border-slate-700 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded outline-none w-14 text-right focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                  />
                </div>
                <input
                  type="range" min="1" max={Math.max(100, limit)}
                  value={limit} onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="w-full premium-range"
                  style={{
                    background: `linear-gradient(to right, #06b6d4 0%, #14b8a6 ${(limit / Math.max(100, limit)) * 100}%, rgba(30, 41, 59, 0.5) ${(limit / Math.max(100, limit)) * 100}%, rgba(30, 41, 59, 0.5) 100%)`
                  }}
                />
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Status & Results */}
      <div ref={resultsRef} className="max-w-5xl mx-auto space-y-6 scroll-mt-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-sm font-medium">Searching {repo === 'All' ? 'codebase' : repo}...</p>
          </div>
        ) : (
          <>
            {displayedResults.length > 0 ? (
              <>
                <div className="text-xs font-medium text-slate-500 flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
                  Found <span className="text-white font-bold">{displayedResults.length}</span> results in <span className="text-white font-bold">{searchTime}s</span>
                </div>

                <div className="space-y-4">
                  {displayedResults.map((res, i) => (
                    <div key={i}
                      className="bg-[#111827]/40 border border-slate-800/60 rounded-2xl overflow-hidden hover:border-slate-700/80 transition-all shadow-xl group animate-in fade-in slide-in-from-bottom-4 duration-500"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {/* Result Header */}
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
                          <h4 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors font-mono text-sm break-all">
                            {res.file_path}
                          </h4>
                          <div className="text-right shrink-0">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center">
                              Score: {(res.score * 100).toFixed(2)}%
                            </div>
                            <div className="text-[9px] text-slate-500 mt-1 uppercase font-mono">
                              sem: {(res.semantic_score * 100).toFixed(1)}% · lex: {(res.lexical_score * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-5">
                          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{res.language}</span>
                          <span className="bg-yellow-500/10 text-yellow-500/80 border border-yellow-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">📁 {res.repo_name}</span>
                          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">📍 L{res.start_line}–{res.end_line}</span>
                          <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">🛠 {res.chunk_type}</span>
                          {res.symbol_name && <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">⚡ {res.symbol_name}</span>}
                        </div>

                        {/* Signature */}
                        {res.signature && (
                          <div className="mb-4 text-sm font-mono text-blue-400 opacity-90 break-all">
                            {res.signature}
                          </div>
                        )}

                        {/* Docstring */}
                        <div className="mb-5 text-sm text-slate-400 leading-relaxed italic">
                          {res.docstring || 'No description available for this code block.'}
                        </div>

                        {/* Toggle Code Button */}
                        <button
                          onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                          className="text-[11px] font-bold text-blue-500 flex items-center gap-1 hover:text-blue-400 transition-colors uppercase tracking-widest"
                        >
                          {expandedIndex === i ? '⌄ Hide Code' : '⌵ View Code'}
                        </button>
                      </div>

                      {/* Expanded Code Block with Syntax Highlighting */}
                      {expandedIndex === i && (
                        <div className="border-t border-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-300">
                          {/* Code toolbar */}
                          <div className="flex items-center justify-between px-5 py-2 bg-[#0d1117] border-b border-slate-800/60">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></span>
                              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70"></span>
                              <span className="text-[10px] text-slate-500 font-mono ml-2">
                                {res.language} · Lines {res.start_line}–{res.end_line}
                              </span>
                            </div>
                            <CopyButton text={res.code_snippet} />
                          </div>

                          {/* Highlighted Code */}
                          <div className="overflow-x-auto text-xs leading-relaxed">
                            <SyntaxHighlighter
                              language={LANG_MAP[res.language?.toLowerCase()] || 'text'}
                              style={vscDarkPlus}
                              showLineNumbers
                              startingLineNumber={res.start_line || 1}
                              wrapLongLines={false}
                              customStyle={{
                                margin: 0,
                                padding: '1.25rem 1.5rem',
                                background: 'rgba(0,0,0,0.45)',
                                fontSize: '0.78rem',
                                lineHeight: '1.65',
                                borderRadius: 0,
                              }}
                              lineNumberStyle={{
                                color: '#3f4f6b',
                                minWidth: '2.5em',
                                paddingRight: '1.2em',
                                userSelect: 'none',
                              }}
                            >
                              {res.code_snippet}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : !loading && query && (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-2xl bg-[#111827]/20 animate-in zoom-in-95 duration-500">
                <div className="text-4xl mb-4 opacity-50 text-slate-500">📂</div>
                <h4 className="text-slate-300 font-bold mb-1">No results found</h4>
                <p className="text-slate-500 text-sm">Try adjusting your filters or search query</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchView;
