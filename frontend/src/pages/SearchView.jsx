import { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CustomDropdown from '../components/CustomDropdown';

// ── Language map → Prism IDs ──────────────────────────────────────────────
const LANG_MAP = {
  python: 'python', javascript: 'javascript', typescript: 'typescript',
  java: 'java', cpp: 'cpp', c: 'c', csharp: 'csharp', go: 'go',
  rust: 'rust', ruby: 'ruby', php: 'php', swift: 'swift',
  kotlin: 'kotlin', markdown: 'markdown',
};

// ── Copy Button ───────────────────────────────────────────────────────────
const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async (e) => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(text); }
    catch { const el = document.createElement('textarea'); el.value = text; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button onClick={handleCopy} title="Copy code"
      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200 border
        ${copied ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}>
      {copied ? (<><svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2"><path d="M3 8l4 4 6-7" strokeLinecap="round" strokeLinejoin="round" /></svg>Copied!</>) : (<><svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="9" height="9" rx="1.5" /><path d="M11 5V3.5A1.5 1.5 0 009.5 2h-6A1.5 1.5 0 002 3.5v6A1.5 1.5 0 003.5 11H5" strokeLinecap="round" /></svg>Copy</>)}
    </button>
  );
};

// ── Change Type Badge ─────────────────────────────────────────────────────
const ChangeTypeBadge = ({ type }) => {
  const styles = {
    modify:  'bg-amber-500/15  border-amber-500/30  text-amber-400',
    add:     'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    delete:  'bg-rose-500/15   border-rose-500/30   text-rose-400',
  };
  const icons = { modify: '✏️', add: '➕', delete: '🗑️' };
  const key = (type || 'modify').toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${styles[key] || styles.modify}`}>
      {icons[key] || '✏️'} {key}
    </span>
  );
};

// ── AI Change Plan Panel ──────────────────────────────────────────────────
const PlanPanel = ({ plan, loading }) => {
  const [openSection, setOpenSection] = useState(null);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
        <div className="bg-gradient-to-br from-violet-950/40 to-indigo-950/40 border border-violet-500/20 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-5 py-10">
            {/* Gemini-inspired spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-violet-500/10"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-blue-500 border-b-cyan-500 border-l-transparent animate-spin"></div>
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-violet-600/20 to-blue-600/20 flex items-center justify-center text-lg">✨</div>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base">Gemini is thinking…</p>
              <p className="text-slate-400 text-sm mt-1">Analyzing code context and generating your change plan</p>
            </div>
            {/* Animated dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const sections = [
    { id: 'files',   label: 'Files to Modify',    icon: '📁', count: plan.files_to_modify?.length,    color: 'amber' },
    { id: 'changes', label: 'Suggested Changes',   icon: '✏️', count: plan.suggested_changes?.length,  color: 'blue'  },
    { id: 'tests',   label: 'Tests to Update',     icon: '🧪', count: plan.tests_to_update?.length,    color: 'emerald'},
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Plan Header */}
      <div className="bg-gradient-to-br from-violet-950/60 via-indigo-950/50 to-[#111827] border border-violet-500/25 rounded-3xl p-6 shadow-2xl shadow-violet-900/20 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex items-start gap-4">
          {/* Gemini icon */}
          <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xl shadow-lg shadow-violet-500/30">
            ✨
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">Gemini AI Change Plan</span>
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse"></span>
            </div>
            <h3 className="text-lg font-bold text-white leading-snug mb-3">{plan.goal}</h3>
            {plan.existing_logic_summary && (
              <p className="text-sm text-slate-300 leading-relaxed bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                {plan.existing_logic_summary}
              </p>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative flex flex-wrap gap-3 mt-5">
          {sections.map(s => (
            <div key={s.id} className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-4 py-2">
              <span>{s.icon}</span>
              <span className="text-xs font-bold text-slate-300">{s.count || 0}</span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Files to Modify */}
      {plan.files_to_modify?.length > 0 && (
        <AccordionSection
          id="files"
          isOpen={openSection === 'files'}
          onToggle={() => setOpenSection(openSection === 'files' ? null : 'files')}
          icon="📁"
          label="Files to Modify"
          count={plan.files_to_modify.length}
          accentColor="amber"
        >
          <div className="space-y-3">
            {plan.files_to_modify.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
                <span className="text-amber-500 mt-0.5 shrink-0">📄</span>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-amber-300 break-all">{f.file_path}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{f.reason}</p>
                  {f.relevant_lines?.length === 2 && (
                    <span className="inline-block mt-2 text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-lg">
                      Lines {f.relevant_lines[0]}–{f.relevant_lines[1]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </AccordionSection>
      )}

      {/* Suggested Changes */}
      {plan.suggested_changes?.length > 0 && (
        <AccordionSection
          id="changes"
          isOpen={openSection === 'changes'}
          onToggle={() => setOpenSection(openSection === 'changes' ? null : 'changes')}
          icon="✏️"
          label="Suggested Changes"
          count={plan.suggested_changes.length}
          accentColor="blue"
        >
          <div className="space-y-4">
            {plan.suggested_changes.map((c, i) => (
              <div key={i} className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-2xl">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <ChangeTypeBadge type={c.change_type} />
                  <p className="font-mono text-xs text-blue-300 font-bold break-all">{c.file_path}</p>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-3">{c.summary}</p>
                {c.important_considerations?.length > 0 && (
                  <ul className="space-y-1.5 mt-2">
                    {c.important_considerations.map((pt, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="text-blue-500 mt-0.5 shrink-0">›</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </AccordionSection>
      )}

      {/* Tests to Update */}
      {plan.tests_to_update?.length > 0 && (
        <AccordionSection
          id="tests"
          isOpen={openSection === 'tests'}
          onToggle={() => setOpenSection(openSection === 'tests' ? null : 'tests')}
          icon="🧪"
          label="Tests to Update"
          count={plan.tests_to_update.length}
          accentColor="emerald"
        >
          <div className="space-y-3">
            {plan.tests_to_update.map((t, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
                <span className="text-emerald-500 mt-0.5 shrink-0">🧪</span>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-emerald-300 break-all">{t.file_path}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </AccordionSection>
      )}

      {/* Empty state */}
      {!plan.files_to_modify?.length && !plan.suggested_changes?.length && !plan.tests_to_update?.length && (
        <div className="p-6 bg-slate-800/30 border border-slate-700/40 rounded-2xl text-center">
          <p className="text-slate-400 text-sm">No specific file changes were identified. The plan summary is shown above.</p>
        </div>
      )}
    </div>
  );
};

// ── Accordion Section ─────────────────────────────────────────────────────
const AccordionSection = ({ id, isOpen, onToggle, icon, label, count, accentColor, children }) => {
  const colors = {
    amber:   { border: 'border-amber-500/20',   bg: 'bg-amber-500/5',   text: 'text-amber-400',   badge: 'bg-amber-500/15 text-amber-400' },
    blue:    { border: 'border-blue-500/20',    bg: 'bg-blue-500/5',    text: 'text-blue-400',    badge: 'bg-blue-500/15 text-blue-400' },
    emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400' },
  };
  const c = colors[accentColor] || colors.blue;
  return (
    <div className={`border ${c.border} rounded-2xl overflow-hidden shadow-lg`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 sm:p-5 ${c.bg} hover:brightness-110 transition-all`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className={`text-sm font-bold ${c.text}`}>{label}</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${c.badge}`}>{count}</span>
        </div>
        <span className={`transition-transform duration-300 ${c.text} text-lg ${isOpen ? 'rotate-180' : ''}`}>⌵</span>
      </button>
      {isOpen && (
        <div className="p-4 sm:p-5 bg-[#0d1117]/60 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

// ── Main SearchView ───────────────────────────────────────────────────────
const SearchView = ({
  query, setQuery, handleSearch,
  searchHistory,
  searchMode, setSearchMode,
  plan, planLoading,
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
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Mode Toggle ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto">
        <div className="inline-flex items-center p-1 bg-[#0d1117] border border-slate-800 rounded-2xl shadow-xl gap-1">
          <button
            onClick={() => setSearchMode('search')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200
              ${searchMode === 'search'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-500 hover:text-slate-300'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            Search Mode
          </button>
          <button
            onClick={() => setSearchMode('plan')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200
              ${searchMode === 'plan'
                ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/25'
                : 'text-slate-500 hover:text-slate-300'}`}
          >
            <span className="text-sm">✨</span>
            AI Plan Mode
            {searchMode !== 'plan' && (
              <span className="text-[8px] font-black bg-violet-500/20 text-violet-400 border border-violet-500/30 px-1.5 py-0.5 rounded-full">
                Gemini
              </span>
            )}
          </button>
        </div>

        {/* Plan mode hint */}
        {searchMode === 'plan' && (
          <p className="mt-3 text-xs text-slate-500 animate-in fade-in duration-300">
            ✨ Describe a task or feature — Gemini will analyse your codebase and generate a structured change plan.
          </p>
        )}
      </div>

      {/* ── Search Bar ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="relative group max-w-5xl mx-auto flex gap-3">
          <div className="relative flex-1">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-light">
              {searchMode === 'plan' ? '✨' : '🔍'}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchMode === 'plan'
                ? 'Describe a feature or change, e.g. "add rate limiting to login endpoint"…'
                : 'Search your codebase…'}
              className={`w-full bg-[#111827] border rounded-2xl py-4 pl-16 pr-8 text-base sm:text-lg outline-none transition-all shadow-2xl
                ${searchMode === 'plan'
                  ? 'border-violet-500/30 focus:border-violet-500/60'
                  : 'border-slate-800 focus:border-blue-500/50'}`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`font-bold px-6 sm:px-8 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-2 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed
              ${searchMode === 'plan'
                ? 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-violet-500/20'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}`}
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              : <span>{searchMode === 'plan' ? 'Generate Plan' : 'Search'}</span>}
          </button>
        </form>

        {/* Search History Chips */}
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

      {/* ── Advanced Filters (hidden in plan mode) ─────────────────────── */}
      {searchMode === 'search' && (
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
                <CustomDropdown label="Language" value={language} onChange={setLanguage} options={['All', 'Python', 'JavaScript', 'TypeScript', 'Markdown']} />
                <CustomDropdown label="Repository" value={repo} onChange={setRepo} options={['All', ...stats.repoList.map(r => r.name)]} />

                <div className="space-y-2 min-w-[120px] flex-1 max-w-[200px]">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Min Score</label>
                    <span className="text-[10px] font-mono text-blue-400">{(minScore * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={minScore} onChange={(e) => setMinScore(parseFloat(e.target.value))} className="w-full premium-range"
                    style={{ background: `linear-gradient(to right, #06b6d4 0%, #14b8a6 ${minScore * 100}%, rgba(30, 41, 59, 0.5) ${minScore * 100}%, rgba(30, 41, 59, 0.5) 100%)` }} />
                </div>

                <div className="w-px bg-slate-800 self-stretch hidden md:block"></div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Chunk Type</label>
                  <div className="flex flex-col gap-1.5">
                    {['Functions', 'Classes', 'Blocks'].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={chunkTypes.includes(type)} onChange={() => toggleChunkType(type)} className="accent-blue-500 w-3.5 h-3.5 rounded cursor-pointer" />
                        <span className={`text-xs font-medium transition-colors ${chunkTypes.includes(type) ? 'text-slate-200' : 'text-slate-500'} group-hover:text-slate-300`}>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Sort By</label>
                  <div className="flex flex-col gap-1.5">
                    {['Relevance', 'Semantic', 'Lexical'].map(mode => (
                      <label key={mode} className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="sortBy" checked={sortBy === mode.toLowerCase()} onChange={() => setSortBy(mode.toLowerCase())} className="accent-blue-500 w-3.5 h-3.5 cursor-pointer" />
                        <span className={`text-xs font-medium transition-colors ${sortBy === mode.toLowerCase() ? 'text-slate-200' : 'text-slate-500'} group-hover:text-slate-300`}>{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="w-px bg-slate-800 self-stretch hidden md:block"></div>

                <div className="space-y-2 min-w-[120px] flex-1 max-w-[200px]">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Limit</label>
                    <input type="number" min="1" value={limit}
                      onChange={(e) => { const val = parseInt(e.target.value); if (!isNaN(val) && val > 0) setLimit(val); }}
                      className="bg-[#0f172a] border border-slate-700 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded outline-none w-14 text-right focus:border-cyan-500 transition-all" />
                  </div>
                  <input type="range" min="1" max={Math.max(100, limit)} value={limit} onChange={(e) => setLimit(parseInt(e.target.value))} className="w-full premium-range"
                    style={{ background: `linear-gradient(to right, #06b6d4 0%, #14b8a6 ${(limit / Math.max(100, limit)) * 100}%, rgba(30, 41, 59, 0.5) ${(limit / Math.max(100, limit)) * 100}%, rgba(30, 41, 59, 0.5) 100%)` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Results / Plan Area ───────────────────────────────────────── */}
      <div ref={resultsRef} className="max-w-5xl mx-auto space-y-6 scroll-mt-24">

        {/* ── Plan Mode Output ─────────────────────────────────────── */}
        {searchMode === 'plan' && (planLoading || plan) && (
          <PlanPanel plan={plan} loading={planLoading} />
        )}

        {/* ── Search Mode Output ───────────────────────────────────── */}
        {searchMode === 'search' && (
          <>
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
                          style={{ animationDelay: `${i * 50}ms` }}>

                          <div className="p-5 sm:p-6">
                            <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
                              <h4 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors font-mono text-sm break-all">{res.file_path}</h4>
                              <div className="text-right shrink-0">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-bold">
                                  Score: {(res.score * 100).toFixed(2)}%
                                </div>
                                <div className="text-[9px] text-slate-500 mt-1 uppercase font-mono">
                                  sem: {(res.semantic_score * 100).toFixed(1)}% · lex: {(res.lexical_score * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-5">
                              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{res.language}</span>
                              <span className="bg-yellow-500/10 text-yellow-500/80 border border-yellow-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">📁 {res.repo_name}</span>
                              <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">📍 L{res.start_line}–{res.end_line}</span>
                              <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">🛠 {res.chunk_type}</span>
                              {res.symbol_name && <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">⚡ {res.symbol_name}</span>}
                            </div>

                            {res.signature && <div className="mb-4 text-sm font-mono text-blue-400 opacity-90 break-all">{res.signature}</div>}
                            <div className="mb-5 text-sm text-slate-400 leading-relaxed italic">{res.docstring || 'No description available.'}</div>

                            <button
                              onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                              className="text-[11px] font-bold text-blue-500 flex items-center gap-1 hover:text-blue-400 transition-colors uppercase tracking-widest">
                              {expandedIndex === i ? '⌄ Hide Code' : '⌵ View Code'}
                            </button>
                          </div>

                          {expandedIndex === i && (
                            <div className="border-t border-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="flex items-center justify-between px-5 py-2 bg-[#0d1117] border-b border-slate-800/60">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70"></span>
                                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></span>
                                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/70"></span>
                                  <span className="text-[10px] text-slate-500 font-mono ml-2">{res.language} · Lines {res.start_line}–{res.end_line}</span>
                                </div>
                                <CopyButton text={res.code_snippet} />
                              </div>
                              <div className="overflow-x-auto text-xs leading-relaxed">
                                <SyntaxHighlighter
                                  language={LANG_MAP[res.language?.toLowerCase()] || 'text'}
                                  style={vscDarkPlus} showLineNumbers
                                  startingLineNumber={res.start_line || 1} wrapLongLines={false}
                                  customStyle={{ margin: 0, padding: '1.25rem 1.5rem', background: 'rgba(0,0,0,0.45)', fontSize: '0.78rem', lineHeight: '1.65', borderRadius: 0 }}
                                  lineNumberStyle={{ color: '#3f4f6b', minWidth: '2.5em', paddingRight: '1.2em', userSelect: 'none' }}>
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
          </>
        )}

        {/* Plan mode: also show the matched code results below the plan */}
        {searchMode === 'plan' && !planLoading && plan && displayedResults.length > 0 && (
          <div className="space-y-4 animate-in fade-in duration-700">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-800"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Context Sources Used by Gemini</span>
              <div className="h-px flex-1 bg-slate-800"></div>
            </div>
            <div className="space-y-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
              {displayedResults.slice(0, 5).map((res, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[#111827]/30 border border-slate-800/40 rounded-xl">
                  <span className="text-slate-600 text-xs font-bold font-mono shrink-0">{i + 1}</span>
                  <span className="font-mono text-xs text-slate-400 truncate flex-1">{res.file_path}</span>
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[9px] font-bold shrink-0">{res.language}</span>
                  <span className="text-[9px] text-slate-500 font-mono shrink-0">L{res.start_line}–{res.end_line}</span>
                </div>
              ))}
              {displayedResults.length > 5 && (
                <p className="text-center text-[10px] text-slate-600">+{displayedResults.length - 5} more context sources</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;
