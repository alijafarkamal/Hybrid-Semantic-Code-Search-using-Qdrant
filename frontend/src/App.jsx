import { useState } from 'react';

// Hooks
import useAuth from './hooks/useAuth';
import useConfirm from './hooks/useConfirm';
import useSettings from './hooks/useSettings';
import useStats from './hooks/useStats';
import useSearch from './hooks/useSearch';
import useIngestion from './hooks/useIngestion';
import useProfile from './hooks/useProfile';

// Layout
import AppLayout from './components/layout/AppLayout';

// Shared Components
import ConfirmationModal from './components/ConfirmationModal';

// Page Views
import AuthPage from './pages/AuthPage';
import DashboardView from './pages/DashboardView';
import SearchView from './pages/SearchView';
import AnalyticsView from './pages/AnalyticsView';
import IngestionView from './pages/IngestionView';
import SettingsView from './pages/SettingsView';
import ProfileModal from './pages/ProfileModal';

const App = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Hooks
  const { modalConfig, requestConfirm, requestAlert, handleClose, handleConfirm } = useConfirm();
  const { token, username, setUsername, login, logout, authFetch } = useAuth();
  const settings = useSettings(requestConfirm, requestAlert);
  const { stats } = useStats(token, authFetch);
  const search = useSearch(authFetch, settings.semanticWeight);
  const ingestion = useIngestion(authFetch, activeView, requestConfirm, requestAlert);
  const profile = useProfile(authFetch, setUsername, requestAlert);

  // Unauthenticated view
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
    <>
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        isDestructive={modalConfig.isDestructive}
        mode={modalConfig.mode}
      />

      <AppLayout
        activeView={activeView}
        setActiveView={setActiveView}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        username={username}
        openProfileModal={profile.openProfileModal}
        logout={logout}
      >
        {activeView === 'search' && (
          <SearchView
            query={search.query} setQuery={search.setQuery} handleSearch={search.handleSearch}
            searchHistory={search.searchHistory}
            searchMode={search.searchMode} setSearchMode={search.setSearchMode}
            plan={search.plan} planLoading={search.planLoading}
            showFilters={search.showFilters} setShowFilters={search.setShowFilters}
            language={search.language} setLanguage={search.setLanguage}
            repo={search.repo} setRepo={search.setRepo}
            stats={stats}
            minScore={search.minScore} setMinScore={search.setMinScore}
            chunkTypes={search.chunkTypes} toggleChunkType={search.toggleChunkType}
            sortBy={search.sortBy} setSortBy={search.setSortBy}
            limit={search.limit} setLimit={search.setLimit}
            loading={search.loading}
            displayedResults={search.displayedResults}
            searchTime={search.searchTime}
            expandedIndex={search.expandedIndex} setExpandedIndex={search.setExpandedIndex}
            resultsRef={search.resultsRef}
          />
        )}

        {activeView === 'dashboard' && (
          <DashboardView
            stats={stats}
            searchHistory={search.searchHistory}
            setQuery={search.setQuery}
            setActiveView={setActiveView}
            handleSearch={search.handleSearch}
            embeddingModel={settings.embeddingModel}
            collectionName={settings.collectionName}
            setSearchMode={search.setSearchMode}
          />
        )}

        {activeView === 'ingestion' && (
          <IngestionView
            ingestPath={ingestion.ingestPath} setIngestPath={ingestion.setIngestPath}
            ingestRepoName={ingestion.ingestRepoName} setIngestRepoName={ingestion.setIngestRepoName}
            ingestExcludes={ingestion.ingestExcludes} setIngestExcludes={ingestion.setIngestExcludes}
            newExclude={ingestion.newExclude} setNewExclude={ingestion.setNewExclude}
            isIngesting={ingestion.isIngesting}
            handleStartIngestion={ingestion.handleStartIngestion}
            removeExclude={ingestion.removeExclude}
            ingestionHistory={ingestion.ingestionHistory}
            fetchIngestionHistory={ingestion.fetchIngestionHistory}
            isRefreshing={ingestion.isRefreshing}
            isClearingHistory={ingestion.isClearingHistory}
            handleClearHistory={ingestion.handleClearHistory}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsView analyticsData={search.analyticsData} />
        )}

        {activeView === 'settings' && (
          <SettingsView
            qdrantUrl={settings.qdrantUrl} setQdrantUrl={settings.setQdrantUrl}
            collectionName={settings.collectionName} setCollectionName={settings.setCollectionName}
            isTestingConnection={settings.isTestingConnection} connectionStatus={settings.connectionStatus}
            handleTestConnection={settings.handleTestConnection}
            embeddingModel={settings.embeddingModel} setEmbeddingModel={settings.setEmbeddingModel}
            semanticWeight={settings.semanticWeight} setSemanticWeight={settings.setSemanticWeight}
            overfetchMultiplier={settings.overfetchMultiplier} setOverfetchMultiplier={settings.setOverfetchMultiplier}
            handleDeleteCollection={settings.handleDeleteCollection}
            handleResetSettings={settings.handleResetSettings}
          />
        )}
      </AppLayout>

      <ProfileModal
        isProfileModalOpen={profile.isProfileModalOpen}
        setIsProfileModalOpen={profile.setIsProfileModalOpen}
        isEditingProfile={profile.isEditingProfile}
        setIsEditingProfile={profile.setIsEditingProfile}
        profileData={profile.profileData}
        setProfileData={profile.setProfileData}
        profileUpdateLoading={profile.profileUpdateLoading}
        handleUpdateProfile={profile.handleUpdateProfile}
        newPassword={profile.newPassword}
        setNewPassword={profile.setNewPassword}
        showPassword={profile.showPassword}
        setShowPassword={profile.setShowPassword}
      />
    </>
  );
};

export default App;
