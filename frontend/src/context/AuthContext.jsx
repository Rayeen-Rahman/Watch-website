// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // On first mount, restore session from localStorage
  useEffect(() => {
    try {
      const storedUser  = localStorage.getItem('watchstore_user');
      const storedToken = localStorage.getItem('watchstore_token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch {
      // Corrupted storage — clear it
      localStorage.removeItem('watchstore_user');
      localStorage.removeItem('watchstore_token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('watchstore_user',  JSON.stringify(userData));
    localStorage.setItem('watchstore_token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('watchstore_user');
    localStorage.removeItem('watchstore_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy use in any component
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
