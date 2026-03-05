import { useState, useEffect, useMemo, useRef } from 'react'

const Icons = {
  Dashboard: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
  Planner: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>,
  Analytics: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" /></svg>,
  Ingestion: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" /><polyline points="14 2 14 8 20 8" /><path d="M2 15h10" /><path d="m9 18 3-3-3-3" /></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  ArrowLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>,
  Logo: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>,
  Code: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>,
  Folder: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>,
  Globe: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" x2="22" y1="12" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  PieChart: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>,
  Database: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5V19A9 3 0 0 0 21 19V5" /><path d="M3 12A9 3 0 0 0 21 12" /></svg>,
  Shield: ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  Mail: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /><rect width="20" height="16" x="2" y="4" rx="2" /></svg>,
  Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Eye: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  EyeOff: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
  Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  AlertTriangle: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  Refresh: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
}

const CustomDropdown = ({ value, onChange, options, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 min-w-[120px]" ref={dropdownRef}>
      {label && <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="premium-select-trigger"
        >
          <span className="truncate">{value}</span>
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-400' : 'text-slate-500'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="premium-select-menu animate-in fade-in zoom-in-95 duration-200">
            {options.map((option) => (
              <div
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`premium-select-item ${value === option ? 'active' : ''}`}
              >
                {option}
                {value === option && (
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

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

const StatCard = ({ icon, label, value, trend, trendColor }) => (
  <div className="bg-[#111827] border border-slate-800/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 rounded-xl bg-blue-900/20 flex items-center justify-center text-blue-300 text-xl border border-blue-800/30 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trendColor || 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
          {trend}
        </span>
      )}
    </div>
    <div className="space-y-1">
      <h3 className="text-3xl font-bold text-white">{value}</h3>
      <p className="text-slate-400 text-sm font-medium">{label}</p>
    </div>
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
  </div>
)

const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const url = isLogin ? 'http://127.0.0.1:8000/auth/login' : 'http://127.0.0.1:8000/auth/signup'
      const payload = isLogin ? { email, password } : { email, password, name }

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await resp.json()
      if (resp.ok) {
        onLogin(data.access_token, data.user_name)
      } else {
        setError(data.detail || 'Authentication failed')
      }
    } catch (err) {
      setError('Connection to server failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0b0f1a] overflow-hidden relative">
      {/* Header */}
      <header className="w-full z-50 bg-[#0b0f1a]/90 backdrop-blur-md border-b border-slate-800/50 pl-20 pr-8 py-3.5 flex items-center justify-between shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-indigo-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
            <Icons.Shield size={22} />
          </div>
          <span className="text-white font-black text-xl tracking-tight">SCS <span className="text-blue-300">Pro</span></span>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1 ml-1">Search</span>
        </div>

        {/* Nav Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLogin(true)}
            className={`text-sm font-semibold px-4 py-1.5 rounded-lg transition-all ${isLogin ? 'text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className="text-sm font-black px-5 py-1.5 bg-blue-800 hover:bg-blue-700 text-white rounded-lg transition-all shadow-lg shadow-blue-900/30 active:scale-95"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Main Auth Body */}
      <div className="flex flex-1 md:flex-row overflow-hidden">
        {/* Left Hero Side */}
        <div className="hidden md:flex md:w-[55%] bg-[#0b0f1a] relative items-center justify-center p-12 overflow-hidden shadow-[20px_0_60px_rgba(0,0,0,0.4)]">
          {/* Base Gradient Layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-blue-900 to-slate-950"></div>

          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-grid-white opacity-20 [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]"></div>

          {/* Animated Background Orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-800 opacity-10 blur-[120px] rounded-full animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900 opacity-10 blur-[100px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

          {/* Floating Decorative Elements */}
          <div className="absolute top-20 left-20 text-blue-300/20 animate-float opacity-40 blur-[1px]">
            <Icons.Code />
          </div>
          <div className="absolute bottom-24 right-32 text-indigo-900/20 animate-float-delayed opacity-40 blur-[1px]">
            <Icons.Globe />
          </div>

          {/* S-Shape Divider Overlay */}
          <div className="absolute top-0 right-0 h-full w-64 translate-x-1/2 z-20 pointer-events-none">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full fill-[#0b0f1a]">
              <path d="M0,0 C80,25 20,75 0,100 L100,100 L100,0 Z" />
            </svg>
          </div>

          <div className="relative z-30 space-y-12 flex flex-col items-center text-center max-w-lg animate-in fade-in slide-in-from-left-12 duration-1000">
            {/* Enhanced Glass Logo Box */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-blue-900/20 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="w-32 h-32 glass-morphism rounded-[36px] flex items-center justify-center relative z-10 group-hover:scale-105 transition-all duration-500 border-white/10 group-hover:border-blue-700/30">
                <div className="text-blue-300 group-hover:text-blue-200 transition-colors duration-500">
                  <Icons.Shield size={72} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h1 className="text-7xl font-black tracking-tight text-white drop-shadow-2xl">
                SCS <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800 drop-shadow-none">Pro</span>
              </h1>
              <div className="space-y-3">
                <p className="text-2xl text-slate-300 font-light leading-snug tracking-tight">
                  <span className="text-white font-medium">Enterprise Codebase Search.</span>
                </p>
                <div className="h-1 w-12 bg-blue-700/50 mx-auto rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Side */}
        <div className="flex-1 flex items-center justify-center bg-[#0b0f1a] p-4 relative z-10">
          <div className="w-full max-w-[340px] space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            <div className="bg-[#111827]/60 backdrop-blur-3xl rounded-[32px] p-6 shadow-[0_40px_100px_rgba(0,0,0,0.3)] border border-slate-800/40">
              <div className="space-y-1 mb-6 text-center">
                <h2 className="text-xl font-black text-white tracking-tight">
                  {isLogin ? 'Welcome Back' : 'Get Started'}
                </h2>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.15em] opacity-80">
                  {isLogin ? 'Secure access' : 'Join the elite'}
                </p>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-[12px] font-bold mb-6 text-center animate-bounce-short">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black tracking-[0.1em] text-slate-500 ml-1">Full Name</label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-700 transition-colors">
                        <Icons.User size={16} />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-blue-500/50 focus:bg-slate-900/80 transition-all text-white text-sm font-semibold placeholder:text-slate-700 shadow-inner"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-black tracking-[0.1em] text-slate-500 ml-1">Email</label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-700 transition-colors">
                      <Icons.Mail size={16} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-blue-500/50 focus:bg-slate-900/80 transition-all text-white text-sm font-semibold placeholder:text-slate-700 shadow-inner"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-black tracking-[0.1em] text-slate-500 ml-1">Secure Key</label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-700 transition-colors">
                      <Icons.Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-12 outline-none focus:border-blue-500/50 focus:bg-slate-900/80 transition-all text-white text-sm font-semibold placeholder:text-slate-700 shadow-inner"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-800 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-3 rounded-xl transition-all shadow-[0_10px_20px_rgba(30,64,175,0.2)] active:scale-[0.97] mt-4 text-xs uppercase tracking-[0.1em]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Validating...</span>
                    </div>
                  ) : (isLogin ? 'Login' : 'Sign up')}
                </button>
              </form>

              <div className="mt-6 text-center border-t border-slate-800/60 pt-4">
                <p className="text-slate-500 text-[11px] font-bold">
                  {isLogin ? "New to SCS?" : "Already established?"}{' '}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-300 font-black hover:text-blue-200 transition-colors uppercase tracking-tight ml-1"
                  >
                    {isLogin ? 'Sign up' : 'Login'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const App = () => {
  const [token, setToken] = useState(sessionStorage.getItem('scs_token'))
  const [username, setUsername] = useState(sessionStorage.getItem('scs_user'))
  const [activeView, setActiveView] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({ name: '', email: '', role: 'User' })
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const resultsRef = useRef(null)
  const profileMenuRef = useRef(null)

  // Close profile menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auth Functions
  const logout = () => {
    sessionStorage.removeItem('scs_token')
    sessionStorage.removeItem('scs_user')
    setToken(null)
    setUsername(null)
  }

  const login = (newToken, newUser) => {
    sessionStorage.setItem('scs_token', newToken)
    sessionStorage.setItem('scs_user', newUser)
    setToken(newToken)
    setUsername(newUser)
  }

  // Wrapper for fetch with auth
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
    const resp = await fetch(url, { ...options, headers })
    if (resp.status === 401) {
      logout()
    }
    return resp
  }

  // Search State
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTime, setSearchTime] = useState(0)
  const [expandedIndex, setExpandedIndex] = useState(null)
  const [plan, setPlan] = useState(null)

  // Advanced Filter State
  const [showFilters, setShowFilters] = useState(true)
  const [language, setLanguage] = useState('All')
  const [repo, setRepo] = useState('All')
  const [minScore, setMinScore] = useState(0.0)
  const [chunkTypes, setChunkTypes] = useState(['Functions', 'Classes', 'Blocks'])
  const [sortBy, setSortBy] = useState('relevance')
  const [limit, setLimit] = useState(10)

  // Search History State
  const [searchHistory, setSearchHistory] = useState([
    'authentication middleware',
    'database query builder',
    'error handling patterns'
  ])

  // Settings State
  const [qdrantUrl, setQdrantUrl] = useState('http://localhost:6333')
  const [collectionName, setCollectionName] = useState('code_search')
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null) // null, 'success', 'error'
  const [embeddingModel, setEmbeddingModel] = useState('BAAI/bge-small-en-v1.5')
  const [semanticWeight, setSemanticWeight] = useState(0.7)
  const [overfetchMultiplier, setOverfetchMultiplier] = useState(5)

  // Stats State
  const [stats, setStats] = useState({
    points: '...',
    repos: '...',
    languages: '...',
    latency: '...',
    pointsTrend: null,
    langData: [],
    repoList: []
  })
  const prevPointsRef = useRef(null)

  // Reactive Results Filtering
  // Simplified as the backend now handles specific filtering; 
  // keeping the hook structure in case global frontend-only post-processing is needed later.
  const displayedResults = useMemo(() => {
    return results;
  }, [results]);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!token) return
      const startTime = performance.now()
      try {
        const resp = await authFetch('http://127.0.0.1:8000/info')
        if (resp.ok) {
          const data = await resp.json()
          const infoLatency = ((performance.now() - startTime) / 1000).toFixed(2)
          const langConfig = {
            'python': { color: 'from-blue-500 to-indigo-500', display: 'Python', hex: '#3b82f6' },
            'javascript': { color: 'from-yellow-400 to-yellow-500', display: 'JavaScript', hex: '#facc15' },
            'typescript': { color: 'from-blue-400 to-sky-400', display: 'TypeScript', hex: '#38bdf8' },
            'java': { color: 'from-orange-600 to-red-500', display: 'Java', hex: '#ea580c' },
            'c++': { color: 'from-pink-500 to-rose-500', display: 'C++', hex: '#f43f5e' },
            'go': { color: 'from-teal-400 to-cyan-400', display: 'Go', hex: '#14b8a6' },
            'rust': { color: 'from-orange-700 to-red-600', display: 'Rust', hex: '#c2410c' },
            'markdown': { color: 'from-slate-400 to-slate-200', display: 'Markdown', hex: '#94a3b8' }
          }

          const lData = Object.entries(data.languages || {}).map(([name, count]) => {
            const key = name.toLowerCase();
            const config = langConfig[key] || { color: 'from-emerald-500 to-indigo-500', display: name, hex: '#10b981' };
            return {
              name: config.display,
              count: count.toLocaleString(),
              pct: (count / data.points_count) * 100,
              gradient: config.color
            }
          }).sort((a, b) => b.pct - a.pct)

          // Calculate dynamic trend
          let trend = null
          if (prevPointsRef.current !== null && data.points_count > prevPointsRef.current) {
            trend = `+${data.points_count - prevPointsRef.current} new`
          } else if (prevPointsRef.current === null) {
            trend = "Live"
          }
          prevPointsRef.current = data.points_count

          setStats({
            points: data.points_count.toLocaleString(),
            repos: data.repo_count.toString(),
            languages: Object.keys(data.languages || {}).length.toString(),
            latency: `${infoLatency}s`,
            pointsTrend: trend,
            langData: lData,
            repoList: (data.repos || []).map(r => {
              const key = r.primary_language?.toLowerCase();
              const config = langConfig[key] || { color: 'from-emerald-500 to-indigo-500', display: r.primary_language, hex: '#10b981' };
              return {
                name: r.name,
                points: `${r.points_count.toLocaleString()}`,
                lang: config.display,
                color: config.hex
              };
            })
          })
        }
      } catch (err) {
        console.error('Info fetch failed', err)
      }
    }

    fetchInfo()
    const interval = setInterval(fetchInfo, 5000)
    return () => clearInterval(interval)
  }, [token])

  const handleSearch = async (e, forcedQuery = null) => {
    if (e) e.preventDefault()
    const finalQuery = forcedQuery || query
    if (!finalQuery) return

    setLoading(true)
    const startTime = performance.now()
    setPlan(null)
    setResults([])
    setExpandedIndex(null)

    // Update Search History
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h !== finalQuery)
      return [finalQuery, ...filtered].slice(0, 6)
    })

    try {
      const response = await authFetch('http://127.0.0.1:8000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: finalQuery,
          limit,
          language: language === 'All' ? null : language,
          repo: repo === 'All' ? null : repo,
          chunk_types: chunkTypes.map(t => {
            const map = { 'Functions': 'function', 'Classes': 'class', 'Blocks': 'block' };
            return map[t] || t.toLowerCase();
          }),
          min_score: minScore,
          sort_by: sortBy,
          semantic_weight: semanticWeight,
          mode: 'search'
        }),
      })
      const data = await response.json()
      setResults(data.results || [])
      setSearchTime(((performance.now() - startTime) / 1000).toFixed(2))

      // Smooth scroll to results 
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleChunkType = (type) => {
    setChunkTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus(null)
    // Simulate API call
    setTimeout(() => {
      setIsTestingConnection(false)
      setConnectionStatus('success')
    }, 1500)
  }

  const handleResetSettings = () => {
    if (window.confirm("Are you sure you want to reset all settings?")) {
      setSemanticWeight(0.7)
      setOverfetchMultiplier(5)
      setEmbeddingModel('BAAI/bge-small-en-v1.5')
    }
  }

  const handleDeleteCollection = () => {
    if (window.confirm("CRITICAL: This will permanently delete the collection. Continue?")) {
      alert("Collection deleted (Simulated)")
    }
  }

  const fetchProfile = async () => {
    try {
      const resp = await authFetch('http://127.0.0.1:8000/auth/me')
      if (resp.ok) {
        const data = await resp.json()
        setProfileData(data)
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileUpdateLoading(true)
    try {
      const payload = {
        name: profileData.name,
        email: profileData.email
      }
      if (newPassword) payload.password = newPassword

      const resp = await authFetch('http://127.0.0.1:8000/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (resp.ok) {
        const data = await resp.json()
        setProfileData(data)
        setUsername(data.name)
        sessionStorage.setItem('scs_user', data.name)
        setIsEditingProfile(false)
        setNewPassword('')
      } else {
        const errorData = await resp.json()
        alert(errorData.detail || "Update failed")
      }
    } catch (err) {
      alert("An error occurred during update")
    } finally {
      setProfileUpdateLoading(false)
    }
  }

  const openProfileModal = () => {
    setProfileMenuOpen(false)
    fetchProfile()
    setIsProfileModalOpen(true)
    setIsEditingProfile(false)
  }

  if (!token) {
    return <AuthPage onLogin={login} />
  }

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-slate-200 font-sans overflow-hidden">

      {/* Sidebar */}
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
          <SidebarItem id="planner" label="AI Planner" icon={<Icons.Planner />} activeView={activeView} setView={setActiveView} collapsed={sidebarCollapsed} />
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#0b0f1a]/80 backdrop-blur-md border-b border-slate-800/50 px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {activeView === 'dashboard' ? 'Dashboard' :
              activeView === 'search' ? 'Code Search' :
                activeView === 'planner' ? 'AI Planner' :
                  activeView === 'analytics' ? 'Analytics' :
                    activeView === 'ingestion' ? 'Ingestion' : 'Settings'}
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Qdrant Connected</span>
            </div>

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
                    onClick={openProfileModal}
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

        <div className="p-8 max-w-7xl mx-auto">

          {/* Search View */}
          {activeView === 'search' && (
            <div className="space-y-8 animate-in fade-in duration-500">

              {/* Search Bar & Chips */}
              <div className="space-y-4">
                <form onSubmit={handleSearch} className="relative group max-w-5xl mx-auto flex gap-3">
                  <div className="relative flex-1">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-light">🔍</div>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="WebSocket connection"
                      className="w-full bg-[#111827] border border-slate-800 focus:border-blue-500/50 rounded-2xl py-4 pl-16 pr-8 text-lg outline-none transition-all shadow-2xl"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                  >
                    <span>Search</span>
                  </button>
                </form>

                <div className="flex flex-wrap gap-2 justify-center max-w-5xl mx-auto">
                  {searchHistory.map((s, idx) => (
                    <button
                      key={`${s}-${idx}`}
                      onClick={() => { setQuery(s); handleSearch(null, s); }}
                      className="px-4 py-1.5 bg-[#161e2e]/50 border border-slate-800/50 rounded-full text-[10px] text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-all flex items-center gap-2 group"
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">↺</span>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="bg-[#111827]/50 border border-slate-800 rounded-2xl max-w-5xl mx-auto transition-all shadow-xl relative overflow-hidden">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full p-4 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors bg-[#111827]"
                >
                  <span className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : 'rotate-90'}`}>⌵</span>
                  Advanced Filters
                </button>

                {showFilters && (
                  <div className="px-6 py-5 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-slate-800/50">
                    <div className="flex flex-wrap items-start gap-8">

                      {/* Language */}
                      <CustomDropdown
                        label="Language"
                        value={language}
                        onChange={(val) => setLanguage(val)}
                        options={['All', 'Python', 'JavaScript', 'TypeScript', 'Markdown']}
                      />

                      {/* Repository */}
                      <CustomDropdown
                        label="Repository"
                        value={repo}
                        onChange={(val) => setRepo(val)}
                        options={['All', 'my-backend']}
                      />

                      {/* Min Score Slider */}
                      <div className="space-y-2 min-w-[130px] flex-1 max-w-[200px]">
                        <div className="flex justify-between">
                          <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Min Score</label>
                          <span className="text-[10px] font-mono text-blue-400">{(minScore * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range" min="0" max="1" step="0.05"
                          value={minScore} onChange={(e) => setMinScore(parseFloat(e.target.value))}
                          className="w-full premium-range"
                          style={{
                            background: `linear-gradient(to right, #06b6d4 0%, #14b8a6 ${minScore * 100}%, rgba(30, 41, 59, 0.5) ${minScore * 100}%, rgba(30, 41, 59, 0.5) 100%)`
                          }}
                        />
                      </div>

                      {/* Divider */}
                      <div className="w-px bg-slate-800 self-stretch hidden md:block"></div>

                      {/* Chunk Type */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Chunk Type</label>
                        <div className="flex flex-col gap-1.5">
                          {['Functions', 'Classes', 'Blocks'].map(type => (
                            <label key={type} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={chunkTypes.includes(type)}
                                onChange={() => toggleChunkType(type)}
                                className="accent-blue-500 w-3.5 h-3.5 rounded cursor-pointer"
                              />
                              <span className={`text-xs font-medium transition-colors ${chunkTypes.includes(type) ? 'text-slate-200' : 'text-slate-500'} group-hover:text-slate-300`}>{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Sort By */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Sort By</label>
                        <div className="flex flex-col gap-1.5">
                          {['Relevance', 'Semantic', 'Lexical'].map(mode => (
                            <label key={mode} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="radio"
                                name="sortBy"
                                checked={sortBy === mode.toLowerCase()}
                                onChange={() => setSortBy(mode.toLowerCase())}
                                className="accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className={`text-xs font-medium transition-colors ${sortBy === mode.toLowerCase() ? 'text-slate-200' : 'text-slate-500'} group-hover:text-slate-300`}>{mode}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="w-px bg-slate-800 self-stretch hidden md:block"></div>

                      {/* Results Limit */}
                      <div className="space-y-2 min-w-[130px] flex-1 max-w-[200px]">
                        <div className="flex justify-between">
                          <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Results Limit</label>
                          <span className="text-[10px] font-mono text-slate-400">{limit}</span>
                        </div>
                        <input
                          type="range" min="1" max="50"
                          value={limit} onChange={(e) => setLimit(parseInt(e.target.value))}
                          className="w-full premium-range"
                          style={{
                            background: `linear-gradient(to right, #06b6d4 0%, #14b8a6 ${(limit / 50) * 100}%, rgba(30, 41, 59, 0.5) ${(limit / 50) * 100}%, rgba(30, 41, 59, 0.5) 100%)`
                          }}
                        />
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* Status & Results */}
              <div ref={resultsRef} className="max-w-5xl mx-auto space-y-6 scroll-mt-24">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 text-sm font-medium">Searching {repo === 'All' ? 'codebase' : repo}...</p>
                  </div>
                ) : (
                  <>
                    {displayedResults.length > 0 ? (
                      <>
                        <div className="text-xs font-medium text-slate-500 flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
                          Found <span className="text-white font-bold">{displayedResults.length}</span> results in <span className="text-white font-bold">{searchTime}s</span>
                        </div>

                        <div className="space-y-4">
                          {displayedResults.map((res, i) => (
                            <div key={i}
                              className="bg-[#111827]/40 border border-slate-800/60 rounded-2xl overflow-hidden hover:border-slate-700/80 transition-all shadow-xl group animate-in fade-in slide-in-from-bottom-4 duration-500"
                              style={{ animationDelay: `${i * 50}ms` }}
                            >
                              <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                  <h4 className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{res.file_path}</h4>
                                  <div className="text-right">
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-bold flex items-center justify-center">
                                      Score: {(res.score * 100).toFixed(2)}%
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-1 uppercase font-mono">
                                      semantic: {(res.semantic_score * 100).toFixed(1)}% | lexical: {(res.lexical_score * 100).toFixed(1)}%
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-6">
                                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold">{res.language}</span>
                                  <span className="bg-yellow-500/10 text-yellow-500/80 border border-yellow-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">📁 {res.repo_name}</span>
                                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">📍 Lines {res.start_line}-{res.end_line}</span>
                                  <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">🛠 {res.chunk_type}</span>
                                  {res.symbol_name && <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">⚡ {res.symbol_name}</span>}
                                </div>

                                {res.signature && (
                                  <div className="mb-4 text-sm font-mono text-blue-400 opacity-90">
                                    {res.signature}
                                  </div>
                                )}

                                <div className="mb-6 text-sm text-slate-400 leading-relaxed italic">
                                  {res.docstring || "No description available for this code block."}
                                </div>

                                <button
                                  onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                                  className="text-[11px] font-bold text-blue-500 flex items-center gap-1 hover:text-blue-400 transition-colors uppercase tracking-widest"
                                >
                                  {expandedIndex === i ? '⌄ Hide Code' : '⌵ View Code'}
                                </button>
                              </div>

                              {expandedIndex === i && (
                                <div className="border-t border-slate-800/80 bg-black/40 p-6">
                                  <pre className="font-mono text-xs leading-relaxed text-slate-300 overflow-x-auto">
                                    <code>{res.code_snippet}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    ) : !loading && query && (
                      <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-2xl bg-[#111827]/20 animate-in zoom-in-95 duration-500">
                        <div className="text-4xl mb-4 opacity-50 text-slate-500">📂</div>
                        <h4 className="text-slate-300 font-bold mb-1">No results found</h4>
                        <p className="text-slate-500 text-sm">Try adjusting your filters or search query</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Icons.Code />} label="Indexed points" value={stats.points} trend={stats.pointsTrend} />
                <StatCard icon={<Icons.Folder />} label="Active repos" value={stats.repos} />
                <StatCard icon={<Icons.Globe />} label="Supported languages" value={stats.languages} />
                <StatCard icon={<Icons.Clock />} label="System Latency" value={stats.latency} trend="Live" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#111827] border border-slate-800/50 rounded-2xl p-8 shadow-xl">
                  <div className="flex items-center gap-2.5 mb-8 text-blue-500">
                    <Icons.PieChart />
                    <h3 className="text-lg font-bold text-white tracking-tight">Language Distribution</h3>
                  </div>
                  <div className="space-y-7">
                    {stats.langData.map((lang) => (
                      <div key={lang.name} className="flex items-center gap-6 group">
                        <span className="w-24 font-semibold text-slate-400 group-hover:text-slate-200 transition-colors text-[11px] tracking-wide">{lang.name}</span>
                        <div className="flex-1 h-3 bg-slate-800/80 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${lang.gradient} rounded-full transition-all duration-1000 relative`}
                            style={{
                              width: `${lang.pct}%`
                            }}
                          ></div>
                        </div>
                        <span className="w-16 text-right font-mono text-slate-500 text-[11px] font-medium tracking-tight">{lang.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-center gap-2.5 mb-8 text-blue-500">
                    <Icons.Database />
                    <h3 className="text-lg font-bold text-white tracking-tight">Repositories</h3>
                  </div>
                  <div className="space-y-4">
                    {stats.repoList.map((repo) => (
                      <div key={repo.name} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/40 border border-transparent hover:border-slate-800/80 transition-all cursor-pointer group">
                        <div className="flex items-center gap-3.5">
                          <span className="text-slate-600 group-hover:text-blue-500 transition-colors">
                            <Icons.Folder />
                          </span>
                          <span className="font-semibold text-sm tracking-tight group-hover:text-blue-400 transition-colors">{repo.name}</span>
                        </div>
                        <div className="flex items-center gap-5">
                          <span className="text-[11px] font-mono text-slate-500 font-medium">{repo.points}</span>
                          <span
                            className="px-4 py-1 rounded-full border text-[10px] font-bold tracking-tight"
                            style={{
                              color: repo.color,
                              borderColor: `${repo.color}80`, // 50% opacity hex
                              backgroundColor: `${repo.color}15` // ~10% opacity hex
                            }}
                          >
                            {repo.lang}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Searches */}
              <div className="bg-[#111827] border border-slate-800/50 rounded-2xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <div className="flex items-center gap-2 mb-6 text-blue-400">
                  <Icons.Search />
                  <h3 className="text-lg font-bold text-white">Recent Searches</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {searchHistory.length > 0 ? searchHistory.map((s, idx) => (
                    <button
                      key={`${s}-${idx}`}
                      onClick={() => { setQuery(s); setActiveView('search'); handleSearch(null, s); }}
                      className="px-4 py-2 bg-[#161e2e] border border-slate-800 rounded-full text-xs text-slate-400 hover:text-white hover:border-slate-600 transition-all shadow-sm"
                    >
                      {s}
                    </button>
                  )) : (
                    <p className="text-slate-500 text-xs italic">No searches yet</p>
                  )}
                </div>
              </div>

              {/* System Status Bar */}
              <div className="mt-8 py-4 px-6 bg-[#0f172a]/50 border border-slate-800/50 rounded-2xl flex flex-wrap gap-8 items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span>Qdrant: <span className="text-slate-300 ml-1">Connected</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span>Embedding Model: <span className="text-slate-300 ml-1">BAAI/bge-small-en-v1.5</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                  <span>Gemini API: <span className="text-slate-300 ml-1">Configured</span></span>
                </div>
              </div>
            </div>
          )}

          {/* Planner View */}
          {activeView === 'planner' && (
            <div className="max-w-4xl mx-auto h-[60vh] flex flex-col items-center justify-center text-center opacity-50">
              <div className="text-6xl mb-6">🤖</div>
              <h3 className="text-2xl font-bold mb-4">AI Plan Integration</h3>
              <p className="max-w-sm text-slate-500">The planner view is being migrated to this new layout. It will allow you to generate code refactoring steps directly from search results.</p>
            </div>
          )}

          {/* Settings View */}
          {activeView === 'settings' && (
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
                      className="w-full tuning-range"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${semanticWeight * 100}%, #e2e8f0 ${semanticWeight * 100}%, #e2e8f0 100%)`
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
                        className="h-full bg-[#3b82f6] flex items-center justify-center transition-all duration-300 ease-out"
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
                      className="w-full tuning-range"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(overfetchMultiplier - 1) / 9 * 100}%, #e2e8f0 ${(overfetchMultiplier - 1) / 9 * 100}%, #e2e8f0 100%)`
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
          )}
        </div>
      </main>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0f172a] border border-slate-800 rounded-[32px] w-full max-w-[325px] overflow-hidden shadow-[0_32px_128px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300 relative">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute right-5 top-5 text-slate-500 hover:text-rose-500 transition-all p-1.5 hover:bg-rose-500/10 rounded-xl"
            >
              <Icons.Close />
            </button>

            <div className="p-5 pt-8 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center text-xl font-black text-blue-400 mb-4 shadow-inner ring-4 ring-blue-500/5">
                {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
              </div>

              <h2 className="text-2xl font-black text-white mb-0.5 tracking-tight">Your Profile</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-5">Manage Account</p>

              <div className="w-full bg-[#111827]/40 border border-slate-800/50 rounded-2xl p-4 mb-6 flex flex-col gap-4">
                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="flex flex-col gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block pl-1">Full Name</label>
                      <input
                        className="w-full bg-[#0b0f1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        value={profileData.name}
                        onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block pl-1">Email Address</label>
                      <input
                        type="email"
                        className="w-full bg-[#0b0f1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                        value={profileData.email}
                        onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block pl-1">New Password</label>
                      <div className="relative group/pass">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="w-full bg-[#0b0f1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none placeholder:text-slate-700 pr-12"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors"
                        >
                          {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-500/20 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={profileUpdateLoading}
                        className="flex-[2] py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                      >
                        {profileUpdateLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-400">
                        <Icons.User />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</p>
                        <p className="text-[15px] font-bold text-white leading-tight">{profileData.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-400">
                        <Icons.Mail />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</p>
                        <p className="text-[13px] font-bold text-white truncate leading-tight">{profileData.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-blue-400">
                        <Icons.Database />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Account Role</p>
                        <p className="text-[14px] font-black text-emerald-400 uppercase tracking-tight leading-tight">{profileData.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full mt-2 py-3 bg-[#1e293b] border border-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-[0.15em] hover:bg-blue-600 hover:border-blue-500 hover:shadow-blue-500/20 transition-all shadow-xl flex items-center justify-center gap-3 group"
                    >
                      <Icons.Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500 text-blue-400 group-hover:text-white" />
                      Edit Profile
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
