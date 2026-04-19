import { useState } from 'react';
import Icons from '../components/Icons';
import StatCard from '../components/StatCard';
import RepoRow from '../components/RepoRow';

const DashboardView = ({ stats, searchHistory, setQuery, setActiveView, handleSearch, embeddingModel, collectionName, setSearchMode }) => {
  const [planInput, setPlanInput] = useState('');
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Icons.Code />} label="Indexed points" value={stats.points} trend={stats.pointsTrend} />
        <StatCard icon={<Icons.Folder />} label="Active repos" value={stats.repos} />
        <StatCard icon={<Icons.Globe />} label="Supported languages" value={stats.languages} />
        <StatCard icon={<Icons.Clock />} label="System Latency" value={stats.latency} trend="Live" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800/50 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-2.5 mb-8 text-blue-500">
            <Icons.PieChart />
            <h3 className="text-lg font-bold text-white tracking-tight">Language Distribution</h3>
          </div>
          <div className="space-y-7">
            {stats.langData.map((lang) => (
              <div key={lang.name} className="flex items-center gap-6 group">
                <span className="w-24 font-semibold text-slate-400 group-hover:text-slate-200 transition-colors text-[11px] tracking-wide">{lang.name}</span>
                <div className="flex-1 h-3 bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${lang.gradient} rounded-full transition-all duration-1000 relative`}
                    style={{ width: `${lang.pct}%` }}
                  ></div>
                </div>
                <span className="w-16 text-right font-mono text-slate-500 text-[11px] font-medium tracking-tight">{lang.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2.5 mb-8 text-blue-500">
            <Icons.Database />
            <h3 className="text-lg font-bold text-white tracking-tight">Repositories</h3>
          </div>
          <div className="space-y-4">
            {stats.repoList.map((repo) => (
              <RepoRow key={repo.name} repo={repo} />
            ))}
          </div>
        </div>
      </div>

      {/* AI Plan Mode CTA */}
      <div className="bg-gradient-to-br from-violet-950/50 via-indigo-950/40 to-[#111827] border border-violet-500/20 rounded-2xl p-8 shadow-2xl shadow-violet-900/10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-900">
        {/* Background glows */}
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-violet-600/8 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-56 h-56 bg-blue-600/8 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col sm:flex-row sm:items-start gap-6">
          {/* Left: text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-base shadow-lg shadow-violet-500/25">
                ✨
              </div>
              <div>
                <span className="text-[9px] font-black text-violet-400 uppercase tracking-[0.2em]">Powered by Gemini</span>
                <h3 className="text-base font-bold text-white leading-none">AI Plan Mode</h3>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              Describe a feature or change in plain English — Gemini will analyse your indexed codebase and generate a
              structured change plan with files to modify, suggested edits, and tests to update.
            </p>

            {/* Quick-launch form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!planInput.trim()) return;
                setSearchMode('plan');
                setQuery(planInput);
                setActiveView('search');
                handleSearch(null, planInput, 'plan');
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={planInput}
                onChange={(e) => setPlanInput(e.target.value)}
                placeholder='e.g. "add rate limiting to the login endpoint"'
                className="flex-1 bg-[#0d1117] border border-violet-500/20 focus:border-violet-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition-all"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 active:scale-95 whitespace-nowrap"
              >
                Generate Plan
              </button>
            </form>
          </div>

          {/* Right: feature bullets */}
          <div className="shrink-0 space-y-2 sm:pt-12">
            {[
              { icon: '📁', label: 'Files to modify' },
              { icon: '✏️', label: 'Suggested changes' },
              { icon: '🧪', label: 'Tests to update' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-slate-400">
                <span>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Searches */}
      <div className="bg-[#111827] border border-slate-800/50 rounded-2xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="flex items-center gap-2 mb-6 text-blue-400">
          <Icons.Search />
          <h3 className="text-lg font-bold text-white">Recent Searches</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {searchHistory.length > 0 ? searchHistory.map((s, idx) => (
            <button
              key={`${s}-${idx}`}
              onClick={() => { setSearchMode('search'); setQuery(s); setActiveView('search'); handleSearch(null, s, 'search'); }}
              className="px-4 py-2 bg-[#161e2e] border border-slate-800 rounded-full text-xs text-slate-400 hover:text-white hover:border-slate-600 transition-all shadow-sm"
            >
              {s}
            </button>
          )) : (
            <p className="text-slate-500 text-xs italic">No searches yet</p>
          )}
        </div>
      </div>

      {/* System Status Bar */}
      <div className="mt-8 py-4 px-6 bg-[#0f172a]/50 border border-slate-800/50 rounded-2xl flex flex-wrap gap-8 items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>Qdrant: <span className="text-slate-300 ml-1">Connected</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>Embedding Model: <span className="text-slate-300 ml-1">{embeddingModel}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span>Collection: <span className="text-slate-300 ml-1">{collectionName}</span></span>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
