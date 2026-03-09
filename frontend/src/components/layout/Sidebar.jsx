import Icons from '../Icons';
import SidebarItem from '../SidebarItem';

const Sidebar = ({ activeView, setActiveView, sidebarCollapsed, setSidebarCollapsed }) => {
  return (
    <aside className={`${sidebarCollapsed ? 'w-16' : 'w-52'} border-r border-slate-800/50 flex flex-col p-3 bg-[#0a0e17] shrink-0 transition-all duration-300 ease-in-out`}>
      <div className={`flex items-center mb-2 group cursor-pointer overflow-hidden whitespace-nowrap py-3 ${sidebarCollapsed ? 'justify-center' : 'gap-2.5 px-1.5'}`}>
        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
          <Icons.Logo />
        </div>
        {!sidebarCollapsed && <span className="text-lg font-bold tracking-tight text-white transition-colors uppercase italic underline decoration-blue-500/50 underline-offset-4">SCS</span>}
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarItem id="dashboard" label="Dashboard" icon={<Icons.Dashboard />} activeView={activeView} setView={setActiveView} collapsed={sidebarCollapsed} />
        <SidebarItem id="search" label="Search" icon={<Icons.Search />} activeView={activeView} setView={setActiveView} collapsed={sidebarCollapsed} />
        <SidebarItem id="analytics" label="Analytics" icon={<Icons.Analytics />} activeView={activeView} setView={setActiveView} collapsed={sidebarCollapsed} />
        <SidebarItem id="ingestion" label="Ingestion" icon={<Icons.Ingestion />} activeView={activeView} setView={setActiveView} collapsed={sidebarCollapsed} />
        <SidebarItem id="settings" label="Settings" icon={<Icons.Settings />} activeView={activeView} setView={setActiveView} collapsed={sidebarCollapsed} />
      </nav>

      <div className="mt-auto p-2 border-t border-slate-800/50">
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
