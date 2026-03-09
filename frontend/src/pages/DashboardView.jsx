import Icons from '../components/Icons';
import StatCard from '../components/StatCard';
import RepoRow from '../components/RepoRow';

const DashboardView = ({ stats, searchHistory, setQuery, setActiveView, handleSearch, embeddingModel, collectionName }) => {
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
              onClick={() => { setQuery(s); setActiveView('search'); handleSearch(null, s); }}
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
