import React, { useState } from 'react';
import Icons from '../components/Icons';

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
        } catch {
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

export default AuthPage;
