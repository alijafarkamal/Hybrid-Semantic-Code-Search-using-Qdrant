import { useEffect, useRef, useState } from 'react';
import Icons from '../Icons';

const viewTitles = {
  dashboard: 'Dashboard',
  search: 'Code Search',
  analytics: 'Analytics',
  ingestion: 'Ingestion',
  settings: 'Settings'
};

const Header = ({ activeView, username, openProfileModal, logout, openFAQModal }) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#0b0f1a]/80 backdrop-blur-md border-b border-slate-800/50 px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center gap-4 min-w-0">
      <h2 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
        {viewTitles[activeView] || 'Dashboard'}
      </h2>
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Qdrant Connected</span>
        </div>

        <button 
          onClick={openFAQModal}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full hover:bg-blue-500/20 transition-colors"
        >
          <span className="text-blue-400"><Icons.Help /></span>
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">FAQ</span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-800/50 relative" ref={profileMenuRef}>
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">{username}</span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">User</span>
          </div>
          <div
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden"
          >
            <div className="text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <Icons.User />
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#111827] border border-slate-800 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold text-white uppercase">{username}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-tighter mt-0.5">SCS User</p>
              </div>

              <button
                onClick={() => { setProfileMenuOpen(false); openProfileModal(); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all text-left"
              >
                <span className="text-blue-400"><Icons.Settings /></span>
                Edit Profile
              </button>

              <div className="h-px bg-slate-800 my-1 mx-2"></div>

              <button
                onClick={() => { setProfileMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-400/5 transition-all text-left"
              >
                <span className="text-rose-500/80">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                </span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
