const SidebarItem = ({ icon, label, id, activeView, setView, collapsed }) => (
  <button
    onClick={() => setView(id)}
    className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 ${activeView === id
      ? 'bg-blue-900/20 text-blue-200 border-l-4 border-blue-600 shadow-[inset_0_0_20px_rgba(30,64,175,0.05)]'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-4 border-transparent'
      } ${collapsed ? 'justify-center px-0' : ''}`}
  >
    <div className="w-5 h-5 flex items-center justify-center shrink-0">
      {icon}
    </div>
    {!collapsed && <span className="text-sm font-medium tracking-wide truncate">{label}</span>}
  </button>
)

export default SidebarItem;
