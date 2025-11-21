import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, User, Mail, Trophy, Moon, Sun } from 'lucide-react';
import Navbar from './Navbar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('beginner');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  // Listen for dark mode changes
  useEffect(() => {
    const handleDarkModeChange = (e) => {
      setDarkMode(e.detail);
    };
    
    window.addEventListener('darkModeChange', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChange', handleDarkModeChange);
  }, []);

  useEffect(() => {
    if (user?.profile) {
      setName(user.profile.name);
      setProficiencyLevel(user.profile.proficiencyLevel);
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/user/profile`,
        { name, proficiencyLevel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast('Profile updated successfully!', 'success');
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    const toastDiv = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    toastDiv.className = `fixed top-20 right-4 ${bgColor} text-white px-6 py-3 rounded-xl shadow-2xl z-50`;
    toastDiv.textContent = message;
    document.body.appendChild(toastDiv);
    setTimeout(() => toastDiv.remove(), 3000);
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className="min-h-screen" style={{ background: darkMode ? '#343541' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Navbar />
      
      {/* Content with top padding */}
      <div className="pt-14 sm:pt-16 md:pt-18">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-2xl p-6 sm:p-8 shadow-xl border-2" style={{
            background: darkMode ? '#444654' : '#ffffff',
            borderColor: darkMode ? '#565869' : '#e5e7eb'
          }}>
            {/* User Info */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b" style={{
              borderColor: darkMode ? '#565869' : '#e5e7eb'
            }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <User className="text-white" size={32} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold" style={{ color: darkMode ? '#ececf1' : '#1f2937' }}>
                  {user?.profile?.name}
                </h2>
                <p className="text-sm flex items-center gap-2" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                  <Mail size={14} />
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#c5c5d2' : '#374151' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                  style={{
                    background: darkMode ? '#40414f' : '#f9fafb',
                    borderColor: darkMode ? '#565869' : '#d1d5db',
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#c5c5d2' : '#374151' }}>
                  Proficiency Level
                </label>
                <select
                  value={proficiencyLevel}
                  onChange={(e) => setProficiencyLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 outline-none transition-all"
                  style={{
                    background: darkMode ? '#40414f' : '#f9fafb',
                    borderColor: darkMode ? '#565869' : '#d1d5db',
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-semibold transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff'
                }}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>

            {/* Stats */}
            <div className="mt-8 pt-6 border-t" style={{
              borderColor: darkMode ? '#565869' : '#e5e7eb'
            }}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: darkMode ? '#ececf1' : '#1f2937' }}>
                <Trophy size={20} style={{ color: '#fbbf24' }} />
                Your Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{
                  background: darkMode ? '#565869' : '#f3f4f6'
                }}>
                  <p className="text-2xl font-bold" style={{ color: darkMode ? '#ececf1' : '#1f2937' }}>
                    {user?.statistics?.totalMessages || 0}
                  </p>
                  <p className="text-sm" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                    Total Messages
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{
                  background: darkMode ? '#565869' : '#f3f4f6'
                }}>
                  <p className="text-2xl font-bold" style={{ color: darkMode ? '#ececf1' : '#1f2937' }}>
                    {user?.statistics?.grammarCorrections || 0}
                  </p>
                  <p className="text-sm" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                    Grammar Tips
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
