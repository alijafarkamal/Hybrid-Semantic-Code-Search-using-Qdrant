import { useState } from 'react';

const useSettings = (requestConfirm, requestAlert) => {
  const [qdrantUrl, setQdrantUrl] = useState('http://localhost:6333');
  const [collectionName, setCollectionName] = useState('code_search');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [embeddingModel, setEmbeddingModel] = useState('BAAI/bge-small-en-v1.5');
  const [semanticWeight, setSemanticWeight] = useState(0.7);
  const [overfetchMultiplier, setOverfetchMultiplier] = useState(5);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    setTimeout(() => {
      setIsTestingConnection(false);
      setConnectionStatus('success');
    }, 1500);
  };

  const handleResetSettings = async () => {
    const isConfirmed = await requestConfirm(
      "Reset Settings",
      "Are you sure you want to reset all settings to their defaults?",
      true
    );
    if (isConfirmed) {
      setSemanticWeight(0.7);
      setOverfetchMultiplier(5);
      setEmbeddingModel('BAAI/bge-small-en-v1.5');
    }
  };

  const handleDeleteCollection = async () => {
    const isConfirmed = await requestConfirm(
      "Delete Collection",
      "CRITICAL: This will permanently delete the collection and all its vectorized data. Are you absolutely sure you want to continue?",
      true
    );
    if (isConfirmed) {
      requestAlert("Collection Deleted", "The collection has been successfully deleted. (Simulated)");
    }
  };

  return {
    qdrantUrl, setQdrantUrl,
    collectionName, setCollectionName,
    isTestingConnection, connectionStatus,
    handleTestConnection,
    embeddingModel, setEmbeddingModel,
    semanticWeight, setSemanticWeight,
    overfetchMultiplier, setOverfetchMultiplier,
    handleDeleteCollection, handleResetSettings
  };
};

export default useSettings;
