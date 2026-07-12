import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('transitops_theme') || 'dark');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('transitops_theme', theme);
  }, [theme]);


  // Initialize auth state on load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('transitops_token');
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
        } catch (error) {
          localStorage.removeItem('transitops_token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('transitops_token', res.data.token);
    // Fetch profile immediately after login
    const profileRes = await api.get('/api/auth/me');
    setUser(profileRes.data);
    return profileRes.data;
  };

  const logout = () => {
    localStorage.removeItem('transitops_token');
    setUser(null);
  };
  
  const updateUser = (data) => {
    setUser({ ...user, ...data });
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const hasRole = (...roles) => roles.includes(user?.role);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, theme, toggleTheme, loading, hasRole }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
