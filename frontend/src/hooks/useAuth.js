import { useState, useCallback } from 'react';

const useAuth = () => {
  const [token, setToken] = useState(
    localStorage.getItem('scs_token') || sessionStorage.getItem('scs_token')
  );
  const [username, setUsername] = useState(
    localStorage.getItem('scs_user') || sessionStorage.getItem('scs_user')
  );

  const login = useCallback((newToken, newUser, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('scs_token', newToken);
    storage.setItem('scs_user', newUser);
    setToken(newToken);
    setUsername(newUser);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('scs_token');
    sessionStorage.removeItem('scs_user');
    localStorage.removeItem('scs_token');
    localStorage.removeItem('scs_user');
    setToken(null);
    setUsername(null);
  }, []);

  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    const resp = await fetch(url, { ...options, headers });
    if (resp.status === 401) {
      logout();
    }
    return resp;
  }, [token, logout]);

  return { token, username, setUsername, login, logout, authFetch };
};

export default useAuth;
