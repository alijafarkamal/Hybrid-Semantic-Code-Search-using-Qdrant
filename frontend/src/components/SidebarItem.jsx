import React from 'react';

const SidebarItem = ({ icon, label, id, activeView, setView, collapsed }) => (
    <button
        onClick={() => setView(id)}
        className={`group relative w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 ${activeView === id
            ? 'bg-blue-900/20 text-blue-200 border-l-4 border-blue-600 shadow-[inset_0_0_20px_rgba(30,64,175,0.05)]'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-4 border-transparent'
            } ${collapsed ? 'justify-center px-0' : ''}`}
    >
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
            {icon}
        </div>
        {!collapsed && <span className="text-sm font-medium tracking-wide truncate">{label}</span>}
        {collapsed && (
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-[#1e293b] text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] whitespace-nowrap shadow-xl border border-slate-700/50">
                {label}
            </div>
        )}
    </button>
);

export default SidebarItem;
