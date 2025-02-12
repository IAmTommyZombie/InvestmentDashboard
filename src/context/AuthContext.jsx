import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check session storage on initial load
    const storedAuth = sessionStorage.getItem('adminAuth');
    if (storedAuth) {
      const { timestamp } = JSON.parse(storedAuth);
      // Check if the session is less than 2 hours old
      if (Date.now() - timestamp < 2 * 60 * 60 * 1000) {
        return true;
      } else {
        sessionStorage.removeItem('adminAuth');
      }
    }
    return false;
  });

  const login = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('adminAuth', JSON.stringify({ 
      timestamp: Date.now() 
    }));
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
  };

  // Check session timeout every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const storedAuth = sessionStorage.getItem('adminAuth');
      if (storedAuth) {
        const { timestamp } = JSON.parse(storedAuth);
        if (Date.now() - timestamp >= 2 * 60 * 60 * 1000) {
          logout();
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 