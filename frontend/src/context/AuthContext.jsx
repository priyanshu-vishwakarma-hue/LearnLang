import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get(`${API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login to:', `${API_URL}/auth/login`);
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      console.log('Attempting signup to:', `${API_URL}/auth/signup`);
      const response = await axios.post(`${API_URL}/auth/signup`, userData);
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      console.error('Signup error:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
