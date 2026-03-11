import React from 'react';
import Icons from '../components/Icons';
import CustomDropdown from '../components/CustomDropdown';

const Settings = ({
    handleTestConnection,
    isTestingConnection,
    connectionStatus,
    qdrantUrl,
    setQdrantUrl,
    collectionName,
    setCollectionName,
    embeddingModel,
    setEmbeddingModel,
    semanticWeight,
    setSemanticWeight,
    overfetchMultiplier,
    setOverfetchMultiplier,
    handleDeleteCollection,
    handleResetSettings
}) => {
    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Connection Settings */}
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                    <Icons.Database /> Connection Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Qdrant URL</label>
                        <input
                            className="w-full bg-[#0b0f1a] border border-slate-800 rounded-xl px-4 py-1.5 text-sm font-mono text-blue-400 focus:border-blue-500 transition-all outline-none"
                            value={qdrantUrl}
                            onChange={e => setQdrantUrl(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Collection Name</label>
                        <input
                            className="w-full bg-[#0b0f1a] border border-slate-800 rounded-xl px-4 py-1.5 text-sm font-mono text-slate-300 focus:border-blue-500 transition-all outline-none"
                            value={collectionName}
                            onChange={e => setCollectionName(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className={`flex items-center gap-2 px-5 py-1 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${connectionStatus === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                        }`}
                >
                    {isTestingConnection ? (
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                    ) : connectionStatus === 'success' ? (
                        <Icons.Check />
                    ) : null}
                    {isTestingConnection ? 'Testing...' : connectionStatus === 'success' ? 'Connection Verified' : 'Test Connection'}
                </button>
            </div>

            {/* Model Settings */}
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                    <Icons.Shield size={20} /> Model Settings
                </h3>
                <div className="space-y-6">
                    <div className="max-w-md">
                        <CustomDropdown
                            label="Embedding Model"
                            value={embeddingModel}
                            onChange={setEmbeddingModel}
                            options={['BAAI/bge-small-en-v1.5', 'BAAI/bge-base-en-v1.5', 'sentence-transformers/all-MiniLM-L6-v2']}
                        />
                    </div>
                    <div className="space-y-2 pt-4">
                        <label className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Gemini Model</label>
                        <div className="flex items-center justify-between bg-[#0b0f1a] border border-slate-800 rounded-2xl px-5 py-2">
                            <span className="text-sm font-mono text-slate-300">gemini-1.5-flash-preview</span>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Configured</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Tuning */}
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                    <Icons.Analytics /> Search Tuning
                </h3>
                <div className="space-y-8">
                    {/* Semantic Weight */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[13px] text-[#94a3b8]">
                            <span>Semantic Weight</span>
                            <span>{semanticWeight.toFixed(1)}</span>
                        </div>
                        <input
                            type="range" min="0" max="1" step="0.1"
                            value={semanticWeight} onChange={e => setSemanticWeight(parseFloat(e.target.value))}
                            className="w-full premium-range"
                            style={{
                                background: `linear-gradient(to right, #06b6d4 0%, #10b981 ${semanticWeight * 100}%, #1e293b ${semanticWeight * 100}%, #1e293b 100%)`
                            }}
                        />
                    </div>

                    {/* Lexical Weight (auto) */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[13px] text-[#94a3b8]">
                            <span>Lexical Weight (auto)</span>
                            <span>{(1 - semanticWeight).toFixed(1)}</span>
                        </div>
                        {/* Bicolor Ratio Bar */}
                        <div className="h-6 w-full rounded-full overflow-hidden flex">
                            <div
                                className="h-full bg-[#06b6d4] flex items-center justify-center transition-all duration-300 ease-out"
                                style={{ width: `${semanticWeight * 100}%` }}
                            >
                                {semanticWeight > 0.15 && <span className="text-[11px] font-bold text-white">Semantic {(semanticWeight * 100).toFixed(0)}%</span>}
                            </div>
                            <div
                                className="h-full bg-[#8b5cf6] flex items-center justify-center transition-all duration-300 ease-out"
                                style={{ width: `${(1 - semanticWeight) * 100}%` }}
                            >
                                {(1 - semanticWeight) > 0.15 && <span className="text-[11px] font-bold text-white">Lexical {((1 - semanticWeight) * 100).toFixed(0)}%</span>}
                            </div>
                        </div>
                    </div>

                    {/* Over-fetch Multiplier */}
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center text-[13px] text-[#94a3b8]">
                            <span>Over-fetch Multiplier</span>
                            <span>{overfetchMultiplier}x</span>
                        </div>
                        <input
                            type="range" min="1" max="10" step="1"
                            value={overfetchMultiplier} onChange={e => setOverfetchMultiplier(parseInt(e.target.value))}
                            className="w-full premium-range"
                            style={{
                                background: `linear-gradient(to right, #06b6d4 0%, #10b981 ${(overfetchMultiplier - 1) / 9 * 100}%, #1e293b ${(overfetchMultiplier - 1) / 9 * 100}%, #1e293b 100%)`
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="border border-rose-500/30 bg-rose-500/5 rounded-[32px] p-6 shadow-2xl shadow-rose-900/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icons.AlertTriangle />
                </div>
                <h3 className="text-lg font-bold text-rose-500 mb-4 flex items-center gap-3">
                    <Icons.AlertTriangle /> Danger Zone
                </h3>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={handleDeleteCollection}
                        className="px-5 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2 shadow-lg shadow-rose-900/20"
                    >
                        <Icons.Trash /> Delete Collection
                    </button>
                    <button
                        onClick={handleResetSettings}
                        className="px-5 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2"
                    >
                        <Icons.Refresh /> Reset All Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
