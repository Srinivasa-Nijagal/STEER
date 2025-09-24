import React, { useState, useEffect, createContext, useContext } from 'react';

const API_URL = 'http://localhost:5000'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('steerUser');
    const storedToken = localStorage.getItem('steerToken');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setUser({ _id: data._id, name: data.name, email: data.email });
      setToken(data.token);
      localStorage.setItem('steerUser', JSON.stringify({ _id: data._id, name: data.name, email: data.email }));
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
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
