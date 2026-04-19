import Icons from '../Icons';
import SidebarItem from '../SidebarItem';

const Sidebar = ({ activeView, setActiveView, sidebarCollapsed, setSidebarCollapsed }) => {
  return (
    <aside className={`${sidebarCollapsed ? 'w-16' : 'w-52'} border-r border-slate-800/50 flex flex-col p-3 bg-[#0a0e17] shrink-0 transition-all duration-300 ease-in-out`}>

      {/* Logo */}
      <div className={`flex items-center mb-2 group cursor-pointer overflow-hidden whitespace-nowrap py-3 ${sidebarCollapsed ? 'justify-center' : 'gap-2.5 px-1.5'}`}>
        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
          <Icons.Logo />
        </div>
        {!sidebarCollapsed && <span className="text-lg font-bold tracking-tight text-white transition-colors uppercase italic underline decoration-blue-500/50 underline-offset-4">SCS</span>}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1">
        <SidebarItem id="dashboard" label="Dashboard" icon={<Icons.Dashboard />} activeView={activeView} setView={setActiveView} collapsed={sidebarCollapsed} />
        <SidebarItem id="search" label="Search" icon={<Icons.Search />} activeView={activeView} setView={setActiveView} collapsed={sidebarCollapsed} />
        <SidebarItem id="analytics" label="Analytics" icon={<Icons.Analytics />} activeView={activeView} setView={setActiveView} collapsed={sidebarCollapsed} />
        <SidebarItem id="ingestion" label="Ingestion" icon={<Icons.Ingestion />} activeView={activeView} setView={setActiveView} collapsed={sidebarCollapsed} />
        <SidebarItem id="settings" label="Settings" icon={<Icons.Settings />} activeView={activeView} setView={setActiveView} collapsed={sidebarCollapsed} />
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto space-y-1 border-t border-slate-800/50 pt-2">

        {/* API Docs link */}
        <a
          href="http://127.0.0.1:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          title="API Documentation (Swagger)"
          className={`flex items-center rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 transition-all duration-200 group
            ${sidebarCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}`}
        >
          <span className="shrink-0 text-slate-500 group-hover:text-violet-400 transition-colors">
            <Icons.BookOpen />
          </span>
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between flex-1 overflow-hidden">
              <span className="text-[11px] font-semibold tracking-wide truncate">API Docs</span>
              <span className="text-slate-600 group-hover:text-violet-400 transition-colors shrink-0">
                <Icons.ExternalLink />
              </span>
            </div>
          )}
        </a>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all duration-200"
        >
          <div className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}>
            <Icons.ArrowLeft />
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
