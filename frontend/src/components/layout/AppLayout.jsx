import Sidebar from './Sidebar';
import Header from './Header';

const AppLayout = ({ activeView, setActiveView, sidebarCollapsed, setSidebarCollapsed, username, openProfileModal, logout, children }) => {
  return (
    <div className="flex h-screen bg-[#0b0f1a] text-slate-200 font-sans overflow-hidden">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      <main className="flex-1 overflow-y-auto scroll-smooth">
        <Header
          activeView={activeView}
          username={username}
          openProfileModal={openProfileModal}
          logout={logout}
        />

        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
