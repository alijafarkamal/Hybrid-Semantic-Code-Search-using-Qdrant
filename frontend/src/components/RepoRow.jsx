import React, { useState } from 'react';
import Icons from './Icons';

const RepoRow = ({ repo }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/40 border border-transparent hover:border-slate-800/80 transition-all cursor-pointer group gap-4"
        >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <span className="text-slate-600 group-hover:text-blue-500 transition-colors flex-shrink-0">
                    <Icons.Folder />
                </span>
                <span
                    className={`font-semibold text-sm tracking-tight group-hover:text-blue-400 transition-colors ${isExpanded ? 'break-all' : 'truncate'}`}
                    title={!isExpanded ? repo.name : ''}
                >
                    {repo.name}
                </span>
            </div>
            <div className="flex items-center gap-5 flex-shrink-0">
                <span className="text-[11px] font-mono text-slate-500 font-medium">{repo.points}</span>
                <span
                    className="px-4 py-1 rounded-full border text-[10px] font-bold tracking-tight"
                    style={{
                        color: repo.color,
                        borderColor: `${repo.color}80`,
                        backgroundColor: `${repo.color}15`
                    }}
                >
                    {repo.lang}
                </span>
            </div>
        </div>
    );
};

export default RepoRow;
