import { useState, useEffect, useMemo, useRef } from 'react';

// Components
import Icons from './components/Icons';
import SidebarItem from './components/SidebarItem';
import ConfirmationModal from './components/ConfirmationModal';

// Hooks
import useConfirm from './hooks/useConfirm';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Analytics from './pages/Analytics';
import Ingestion from './pages/Ingestion';
import Settings from './pages/Settings';

const App = () => {
  const { modalConfig, requestConfirm, requestAlert, handleClose, handleConfirm } = useConfirm();

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

  // Ingestion State
  const [ingestionHistory, setIngestionHistory] = useState([]);
  const [ingestPath, setIngestPath] = useState('');
  const [ingestRepoName, setIngestRepoName] = useState('');
  const [ingestExcludes, setIngestExcludes] = useState(['.git', 'node_modules', '__pycache__', '.venv', 'venv']);
  const [newExclude, setNewExclude] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  // Fetch ingestion history (needed in Dashboard if we want it to refresh automatically, or just Ingestion)
  const fetchIngestionHistory = async () => {
    setIsRefreshing(true);
    try {
      const response = await authFetch('http://localhost:8000/ingestion-history');
      if (response.ok) {
        const data = await response.json();
        setIngestionHistory(data);
      }
    } catch (err) {
      console.error("Error fetching ingestion history:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearHistory = async () => {
    const isConfirmed = await requestConfirm(
      "Clear Ingestion History",
      "Are you sure you want to clear all ingestion history? This action cannot be undone.",
      true
    );
    if (!isConfirmed) return;

    setIsClearingHistory(true);
    try {
      const response = await authFetch('http://localhost:8000/ingestion-history', {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchIngestionHistory();
      } else {
        requestAlert("Error", "Failed to clear history.", true);
      }
    } catch (err) {
      console.error("Error clearing history:", err);
      requestAlert("Error", "Error clearing history.", true);
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleStartIngestion = async (e) => {
    e.preventDefault();
    if (!ingestPath) return;

    setIsIngesting(true);
    try {
      const response = await authFetch('http://localhost:8000/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          directory_path: ingestPath,
          repo_name: ingestRepoName || null,
          exclude_dirs: ingestExcludes
        })
      });

      if (response.ok) {
        setIngestPath('');
        setIngestRepoName('');
        fetchIngestionHistory();
        requestAlert("Ingestion Started", "The repository is being ingested in the background.");
      } else {
        const error = await response.json();
        requestAlert("Ingestion Error", `Error: ${error.detail}`, true);
      }
    } catch (err) {
      console.error(err);
      requestAlert("Ingestion Failed", "Failed to start ingestion process.", true);
    } finally {
      setIsIngesting(false);
    }
  };

  const removeExclude = (tag) => {
    setIngestExcludes(ingestExcludes.filter(t => t !== tag));
  };

  useEffect(() => {
    if (activeView === 'ingestion') {
      fetchIngestionHistory();
      const interval = setInterval(fetchIngestionHistory, 5000);
      return () => clearInterval(interval);
    }
  }, [activeView]);

  const resultsRef = useRef(null)
  const profileMenuRef = useRef(null)

  // Close profile menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    };
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

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState({
    scoreDistribution: [],
    correlation: [],
    symbols: [],
    languages: [],
    performance: []
  })
  const prevPointsRef = useRef(null)

  // Reactive Results Filtering
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
      } catch {
        console.error('Info fetch failed')
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
      const searchLatency = performance.now() - startTime
      const resultsData = data.results || []

      setResults(resultsData)
      setSearchTime((searchLatency / 1000).toFixed(2))

      // Update Analytics Data
      if (resultsData.length > 0) {
        // 1. Score Distribution (Buckets of 0.1)
        const buckets = Array(10).fill(0).map((_, i) => ({ range: `${(i / 10).toFixed(1)}-${((i + 1) / 10).toFixed(1)}`, count: 0 }))
        resultsData.forEach(r => {
          const idx = Math.min(Math.floor(r.score * 10), 9)
          buckets[idx].count++
        })

        // 2. Correlation (Semantic vs Lexical)
        const corr = resultsData.map(r => ({
          semantic: r.semantic_score || 0,
          lexical: r.lexical_score || 0,
          name: r.symbol_name || 'block'
        }))

        // 3. Symbol Frequency
        const symMap = {}
        resultsData.forEach(r => {
          const key = r.symbol_name || 'unknown'
          if (!symMap[key]) symMap[key] = { name: key, type: r.symbol_type || 'block', file: r.file_path, count: 0 }
          symMap[key].count++
        })
        const topSymbols = Object.values(symMap).sort((a, b) => b.count - a.count).slice(0, 6)

        // 4. Languages
        const langMap = {}
        resultsData.forEach(r => {
          const key = r.language || 'Other'
          langMap[key] = (langMap[key] || 0) + 1
        })
        const langData = Object.entries(langMap).map(([name, value]) => ({ name, value }))

        setAnalyticsData(prev => ({
          scoreDistribution: buckets,
          correlation: corr,
          symbols: topSymbols,
          languages: langData,
          performance: [...prev.performance.map(p => ({ ...p, index: p.index })), { // Ensure index is sequential
            index: prev.performance.length > 0 ? Math.max(...prev.performance.map(p => p.index)) + 1 : 1,
            time: Math.round(searchLatency),
            avg: Math.round([...prev.performance.map(p => p.time), searchLatency].reduce((a, b) => a + b, 0) / (prev.performance.length + 1))
          }].slice(-20)
        }))
      }

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

  const handleResetSettings = async () => {
    const isConfirmed = await requestConfirm(
      "Reset Settings",
      "Are you sure you want to reset all settings to their defaults?",
      true
    );
    if (isConfirmed) {
      setSemanticWeight(0.7)
      setOverfetchMultiplier(5)
      setEmbeddingModel('BAAI/bge-small-en-v1.5')
    }
  }

  const handleDeleteCollection = async () => {
    const isConfirmed = await requestConfirm(
      "Delete Collection",
      "CRITICAL: This will permanently delete the collection and all its vectorized data. Are you absolutely sure you want to continue?",
      true
    );
    if (isConfirmed) {
      requestAlert("Collection Deleted", "The collection has been successfully deleted. (Simulated)")
    }
  }

  const fetchProfile = async () => {
    try {
      const resp = await authFetch('http://127.0.0.1:8000/auth/me')
      if (resp.ok) {
        const data = await resp.json()
        setProfileData(data)
      }
    } catch {
      console.error("Failed to fetch profile:")
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
        requestAlert("Profile Updated", "Your profile details have been saved successfully.");
      } else {
        const errorData = await resp.json()
        requestAlert("Update Failed", errorData.detail || "Update failed", true)
      }
    } catch {
      requestAlert("Update Failed", "An error occurred during update", true)
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
    return (
      <>
        <AuthPage onLogin={login} />
        <ConfirmationModal
          isOpen={modalConfig.isOpen}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          isDestructive={modalConfig.isDestructive}
          mode={modalConfig.mode}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-slate-200 font-sans overflow-hidden">
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        isDestructive={modalConfig.isDestructive}
        mode={modalConfig.mode}
      />

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
          {activeView === 'search' && (
            <Search
              handleSearch={handleSearch}
              query={query}
              setQuery={setQuery}
              searchHistory={searchHistory}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              language={language}
              setLanguage={setLanguage}
              repo={repo}
              setRepo={setRepo}
              stats={stats}
              minScore={minScore}
              setMinScore={setMinScore}
              chunkTypes={chunkTypes}
              toggleChunkType={toggleChunkType}
              sortBy={sortBy}
              setSortBy={setSortBy}
              limit={limit}
              setLimit={setLimit}
              resultsRef={resultsRef}
              loading={loading}
              displayedResults={displayedResults}
              searchTime={searchTime}
              expandedIndex={expandedIndex}
              setExpandedIndex={setExpandedIndex}
            />
          )}

          {activeView === 'dashboard' && (
            <Dashboard
              stats={stats}
              searchHistory={searchHistory}
              setQuery={setQuery}
              setActiveView={setActiveView}
              handleSearch={handleSearch}
              embeddingModel={embeddingModel}
              collectionName={collectionName}
            />
          )}

          {activeView === 'analytics' && (
            <Analytics analyticsData={analyticsData} />
          )}

          {activeView === 'ingestion' && (
            <Ingestion
              handleStartIngestion={handleStartIngestion}
              ingestPath={ingestPath}
              setIngestPath={setIngestPath}
              ingestRepoName={ingestRepoName}
              setIngestRepoName={setIngestRepoName}
              ingestExcludes={ingestExcludes}
              removeExclude={removeExclude}
              newExclude={newExclude}
              setNewExclude={setNewExclude}
              setIngestExcludes={setIngestExcludes}
              isIngesting={isIngesting}
              fetchIngestionHistory={fetchIngestionHistory}
              isRefreshing={isRefreshing}
              isClearingHistory={isClearingHistory}
              handleClearHistory={handleClearHistory}
              ingestionHistory={ingestionHistory}
            />
          )}

          {activeView === 'settings' && (
            <Settings
              handleTestConnection={handleTestConnection}
              isTestingConnection={isTestingConnection}
              connectionStatus={connectionStatus}
              qdrantUrl={qdrantUrl}
              setQdrantUrl={setQdrantUrl}
              collectionName={collectionName}
              setCollectionName={setCollectionName}
              embeddingModel={embeddingModel}
              setEmbeddingModel={setEmbeddingModel}
              semanticWeight={semanticWeight}
              setSemanticWeight={setSemanticWeight}
              overfetchMultiplier={overfetchMultiplier}
              setOverfetchMultiplier={setOverfetchMultiplier}
              handleDeleteCollection={handleDeleteCollection}
              handleResetSettings={handleResetSettings}
            />
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
