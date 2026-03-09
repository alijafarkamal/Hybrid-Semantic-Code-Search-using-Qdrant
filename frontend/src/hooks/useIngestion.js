import { useState, useEffect } from 'react';

const useIngestion = (authFetch, activeView, requestConfirm, requestAlert) => {
  const [ingestionHistory, setIngestionHistory] = useState([]);
  const [ingestPath, setIngestPath] = useState('');
  const [ingestRepoName, setIngestRepoName] = useState('');
  const [ingestExcludes, setIngestExcludes] = useState(['.git', 'node_modules', '__pycache__', '.venv', 'venv']);
  const [newExclude, setNewExclude] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

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
        headers: { 'Content-Type': 'application/json' },
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

  return {
    ingestionHistory, ingestPath, setIngestPath,
    ingestRepoName, setIngestRepoName,
    ingestExcludes, setIngestExcludes,
    newExclude, setNewExclude,
    isIngesting, isRefreshing, isClearingHistory,
    handleStartIngestion, handleClearHistory,
    removeExclude, fetchIngestionHistory
  };
};

export default useIngestion;
