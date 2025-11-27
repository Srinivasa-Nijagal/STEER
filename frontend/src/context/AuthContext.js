import React, { useState, useEffect, createContext, useContext } from 'react';

// Best Practice: Assign directly. If undefined, it stays undefined (easier to debug)
// Switch to local backend for development
// const API_URL = 'http://localhost:5000'; 
const API_URL = process.env.REACT_APP_API_URL; // Keep this for when you push to production

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // **NEW:** Function to fetch the latest user data (including rating)
  const refreshUser = async (currentToken = token) => {
    if (!currentToken) return;
    try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await res.json();
        if (res.ok) {
            const userData = { 
                _id: data._id, 
                name: data.name, 
                email: data.email, 
                verificationStatus: data.verificationStatus,
                isAdmin: data.isAdmin,
                averageRating: data.averageRating
            };
            setUser(userData);
            localStorage.setItem('steerUser', JSON.stringify(userData));
        }
    } catch (error) {
        console.error("Failed to refresh user data", error);
    }
  };

  useEffect(() => {
    const init = async () => {
        const storedUser = localStorage.getItem('steerUser');
        const storedToken = localStorage.getItem('steerToken');
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
            // **FIX:** Refresh user data on load to get the latest rating
            await refreshUser(storedToken);
        }
        setLoading(false);
    };
    init();
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      const userData = { 
        _id: data._id, 
        name: data.name, 
        email: data.email, 
        verificationStatus: data.verificationStatus,
        isAdmin: data.isAdmin,
        averageRating: data.averageRating // Store rating on login
      };
      setUser(userData);
      setToken(data.token);
      localStorage.setItem('steerUser', JSON.stringify(userData));
      localStorage.setItem('steerToken', data.token);
      return data;
    } else {
      throw new Error(data.message);
    }
  };

  const register = async (name, email, password) => {
     const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (res.ok) {
        await login(email, password);
        return data;
    } else {
      throw new Error(data.message);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('steerUser');
    localStorage.removeItem('steerToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, isAuthenticated: !!token, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);