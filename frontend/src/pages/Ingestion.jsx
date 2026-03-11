import React from 'react';
import Icons from '../components/Icons';

const Ingestion = ({
    handleStartIngestion,
    ingestPath,
    setIngestPath,
    ingestRepoName,
    setIngestRepoName,
    ingestExcludes,
    removeExclude,
    newExclude,
    setNewExclude,
    setIngestExcludes,
    isIngesting,
    fetchIngestionHistory,
    isRefreshing,
    isClearingHistory,
    handleClearHistory,
    ingestionHistory
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Ingest Form */}
            <div className="bg-[#111827] border border-slate-800/80 rounded-[32px] p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[80px] rounded-full -mr-16 -mt-16"></div>

                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-3">
                    <span className="text-emerald-500"><Icons.Ingestion /></span>
                    Ingest New Repository
                </h3>

                <form onSubmit={handleStartIngestion} className="space-y-4 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Directory Path</label>
                            <input
                                type="text"
                                value={ingestPath}
                                onChange={(e) => setIngestPath(e.target.value)}
                                placeholder="/path/to/your/project"
                                className="w-full bg-[#0b0f1a] border border-slate-800 focus:border-emerald-500/50 rounded-2xl py-2 px-5 text-sm outline-none transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Repository Name (Options)</label>
                            <input
                                type="text"
                                value={ingestRepoName}
                                onChange={(e) => setIngestRepoName(e.target.value)}
                                placeholder="my-project"
                                className="w-full bg-[#0b0f1a] border border-slate-800 focus:border-emerald-500/50 rounded-2xl py-2 px-5 text-sm outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Exclude Directories</label>
                        <div className="flex flex-wrap gap-2 p-2 bg-[#0b0f1a] border border-slate-800 rounded-2xl min-h-[40px] focus-within:border-emerald-500/50 transition-all">
                            {ingestExcludes.map(tag => (
                                <span key={tag} className="flex items-center gap-1.5 bg-slate-800/50 text-slate-300 px-3 py-1 rounded-full text-[11px] font-bold border border-slate-700/50">
                                    {tag}
                                    <button type="button" onClick={() => removeExclude(tag)} className="text-slate-500 hover:text-rose-400 transition-colors">
                                        <Icons.Close size={14} />
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={newExclude}
                                onChange={(e) => setNewExclude(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const tag = newExclude.trim();
                                        if (tag && !ingestExcludes.includes(tag)) {
                                            setIngestExcludes([...ingestExcludes, tag]);
                                        }
                                        setNewExclude('');
                                    }
                                }}
                                placeholder="Add..."
                                className="flex-1 bg-transparent border-none outline-none py-1 px-3 text-sm text-slate-300 min-w-[100px]"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isIngesting || !ingestPath}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black px-8 py-2.5 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-3 text-sm uppercase tracking-widest"
                        >
                            {isIngesting ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <Icons.Play />
                            )}
                            <span>{isIngesting ? 'Processing...' : 'Start Ingestion'}</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Ingestion History */}
            <div className="bg-[#111827] border border-slate-800/80 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                        <span className="text-blue-500"><Icons.Clock /></span>
                        Ingestion History
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchIngestionHistory}
                            disabled={isRefreshing || isClearingHistory}
                            title="Refresh history"
                            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white disabled:opacity-50"
                        >
                            <span className={isRefreshing ? 'animate-spin inline-block' : 'inline-block'}>
                                <Icons.Refresh />
                            </span>
                        </button>
                        {ingestionHistory.length > 0 && (
                            <button
                                onClick={handleClearHistory}
                                disabled={isClearingHistory || isRefreshing}
                                title="Clear history"
                                className="p-2 hover:bg-rose-500/10 rounded-full transition-colors text-slate-400 hover:text-rose-400 disabled:opacity-50"
                            >
                                <span className={isClearingHistory ? 'animate-pulse inline-block' : 'inline-block'}>
                                    <Icons.Trash />
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/50">
                                <th className="pb-4 px-2">Repo</th>
                                <th className="pb-4 px-2">Directory</th>
                                <th className="pb-4 px-2">Files</th>
                                <th className="pb-4 px-2">Chunks</th>
                                <th className="pb-4 px-2">Date</th>
                                <th className="pb-4 px-2">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {ingestionHistory.map((record) => (
                                <tr key={record.id} className="border-b border-slate-800/30 group hover:bg-slate-800/20 transition-colors">
                                    <td className="py-3 px-2 font-bold text-white">{record.repo_name}</td>
                                    <td className="py-3 px-2 text-slate-500 font-mono text-[11px] max-w-[200px] truncate">{record.directory_path}</td>
                                    <td className="py-3 px-2 text-slate-400 font-mono text-xs">{record.files_count || '--'}</td>
                                    <td className="py-3 px-2 text-slate-400 font-mono text-xs">{record.chunks_count || '--'}</td>
                                    <td className="py-3 px-2 text-slate-500 text-xs">{new Date(record.created_at).toLocaleDateString()}</td>
                                    <td className="py-3 px-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 w-fit ${record.status === 'Complete' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            record.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                            }`}>
                                            {record.status === 'Complete' ? <Icons.Check /> :
                                                record.status === 'In Progress' ? <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span> :
                                                    <Icons.AlertTriangle />}
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {ingestionHistory.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-600 italic text-xs">No ingestion history found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Ingestion;
