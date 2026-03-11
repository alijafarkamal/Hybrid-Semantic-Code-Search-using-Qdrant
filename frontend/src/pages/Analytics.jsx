import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ScatterChart, Scatter, ZAxis, PieChart as RePie, Pie, Cell,
    LineChart, Line, Legend
} from 'recharts';
import Icons from '../components/Icons';

const Analytics = ({ analyticsData }) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Score Distribution */}
                <div className="bg-[#111827] border border-slate-800/80 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                    <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
                        <span className="text-blue-500 animate-pulse"><Icons.Analytics /></span>
                        Score Distribution (Last Search)
                    </h3>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[80px] rounded-full -mr-16 -mt-16"></div>
                    <div className="h-[220px] w-full min-h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData.scoreDistribution}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#2dd4bf" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="range" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#94a3b8' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} animationDuration={1000} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Score Correlation */}
                <div className="bg-[#111827] border border-slate-800/80 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                    <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
                        <span className="text-purple-500 animate-pulse"><Icons.Shield /></span>
                        Semantic vs Lexical Score Correlation
                    </h3>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[80px] rounded-full -mr-16 -mt-16"></div>
                    <div className="h-[220px] w-full min-h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    type="number"
                                    dataKey="lexical"
                                    name="Lexical Score"
                                    stroke="#64748b"
                                    fontSize={10}
                                    domain={[0, 1]}
                                    tickCount={6}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="semantic"
                                    name="Semantic Score"
                                    stroke="#64748b"
                                    fontSize={10}
                                    domain={[0, 1]}
                                    tickCount={6}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <ZAxis
                                    type="number"
                                    dataKey={(entry) => (entry.semantic + entry.lexical) * 100}
                                    range={[80, 500]}
                                    name="Combined Score"
                                />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3', stroke: '#334155' }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)', padding: '12px' }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}
                                />
                                <Scatter name="Matches" data={analyticsData.correlation} fillOpacity={0.8} animationDuration={1000}>
                                    {analyticsData.correlation.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={['#3b82f6', '#10b981', '#f43f5e', '#a855f7', '#f59e0b', '#06b6d4'][index % 6]}
                                            stroke="rgba(255,255,255,0.2)"
                                            strokeWidth={2}
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Most Frequent Symbols */}
                <div className="bg-[#111827] border border-slate-800/80 rounded-[32px] p-8 shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
                        <span className="text-emerald-500 animate-pulse"><Icons.Code /></span>
                        Most Frequently Found Symbols
                    </h3>
                    <div className="overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800/50">
                                    <th className="pb-4"># Symbol</th>
                                    <th className="pb-4">Type</th>
                                    <th className="pb-4">File</th>
                                    <th className="pb-4 text-right">Count</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {analyticsData.symbols && analyticsData.symbols.map((sym, i) => (
                                    <tr key={`${sym.name}-${i}`} className="border-b border-slate-800/30 group hover:bg-slate-800/20 transition-colors">
                                        <td className="py-4 font-mono text-[13px] text-white flex items-center gap-3">
                                            <span className="text-slate-600 font-bold">{i + 1}</span>
                                            {sym.name}
                                        </td>
                                        <td className="py-4">
                                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold uppercase">{sym.type}</span>
                                        </td>
                                        <td className="py-4 text-slate-500 text-[11px] truncate max-w-[150px]">{sym.file}</td>
                                        <td className="py-4 text-right font-black text-white">{sym.count}</td>
                                    </tr>
                                ))}
                                {(!analyticsData.symbols || analyticsData.symbols.length === 0) && (
                                    <tr><td colSpan="4" className="py-12 text-center text-slate-600 italic text-xs">No analytics data yet. Perform a search to see stats.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Results by Language */}
                <div className="bg-[#111827] border border-slate-800/80 rounded-[32px] p-8 shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
                        <span className="text-orange-500 animate-pulse"><Icons.Globe /></span>
                        Results by Language
                    </h3>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[80px] rounded-full -mr-16 -mt-16"></div>
                    <div className="h-[220px] w-full flex items-center justify-center min-h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePie>
                                <Pie
                                    data={analyticsData.languages || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(analyticsData.languages || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#fbbf24', '#06b6d4', '#f97316', '#ec4899'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#94a3b8' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                            </RePie>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Performance Timeline */}
            <div className="bg-[#111827] border border-slate-800/80 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
                    <span className="text-cyan-500 animate-pulse"><Icons.Clock /></span>
                    Search Performance Timeline
                </h3>
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[80px] rounded-full -mr-16 -mt-16"></div>
                <div className="h-[180px] w-full min-h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.performance || []}>
                            <defs>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.5} />
                                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="index" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} unit="ms" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)' }}
                                itemStyle={{ color: '#fff' }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Line type="monotone" dataKey="time" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="avg" stroke="#64748b" strokeDasharray="5 5" strokeWidth={1} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
