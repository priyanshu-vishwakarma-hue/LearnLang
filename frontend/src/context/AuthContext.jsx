import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

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

    verifyToken();
  }, []);

  const signup = async (userData) => {
    console.log('Attempting signup to:', `${API_URL}/auth/signup`);
    console.log('Signup data:', userData);
    
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, userData);
      
      console.log('✅ Signup successful');
      
      const { token, user: userInfo } = response.data;
      localStorage.setItem('token', token);
      setUser(userInfo);
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error.response?.data) {
        throw error.response;
      }
      
      throw new Error('Signup failed. Please try again.');
    }
  };

  const login = async (credentials) => {
    console.log('Attempting login to:', `${API_URL}/auth/login`);
    
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      
      console.log('✅ Login successful');
      
      const { token, user: userInfo } = response.data;
      localStorage.setItem('token', token);
      setUser(userInfo);
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.data) {
        throw error.response;
      }
      
      throw new Error('Login failed. Please check your credentials.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
