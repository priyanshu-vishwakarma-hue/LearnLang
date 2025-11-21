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

  const signup = async (name, email, password, proficiencyLevel) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      console.log('Attempting signup to:', `${API_URL}/auth/signup`);
      
      const response = await axios.post(`${API_URL}/auth/signup`, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        proficiencyLevel
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      console.log('✅ Signup successful');
    } catch (error) {
      console.error('Signup error:', error.response?.data || error);
      
      // Better error handling
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.message).join(', ');
        throw new Error(errorMessages);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Signup failed. Please try again.');
      }
    }
  };

  const login = async (email, password) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      console.log('Attempting login to:', `${API_URL}/auth/login`);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: email.trim().toLowerCase(),
        password
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      console.log('✅ Login successful');
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      
      // Better error handling
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(err => err.message).join(', ');
        throw new Error(errorMessages);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Login failed. Please try again.');
      }
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
