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

  const signup = async (email, password, name, proficiencyLevel) => {
    try {
      console.log('📤 Signup request:', { email, password: '***', name, proficiencyLevel });
      
      const response = await axios.post(`${API_URL}/auth/signup`, {
        email: email,
        password: password,
        name: name,
        proficiencyLevel: proficiencyLevel || 'beginner'
      });

      console.log('✅ Signup successful:', response.data);
      
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      console.error('❌ Signup error:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed'
      };
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login with:', { 
        email: typeof email === 'string' ? email : 'ERROR: Not a string!', 
        password: typeof password === 'string' ? '***' : 'ERROR: Not a string!',
        apiUrl: API_URL 
      });
      
      // Ensure email and password are strings
      if (typeof email !== 'string' || typeof password !== 'string') {
        console.error('❌ Email or password is not a string!', { email, password });
        return { 
          success: false, 
          message: 'Invalid email or password format' 
        };
      }
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: email.trim(),
        password: password.trim()
      });

      console.log('✅ Login response:', response.data);
      
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    console.log('✅ User updated in context:', updatedUserData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
