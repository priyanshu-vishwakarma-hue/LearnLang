import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import axios from 'axios';
import { Edit2, Save, X, User, Mail, Award, CheckCircle, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    proficiencyLevel: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.profile?.name || '',
        email: user.email || '',
        proficiencyLevel: user.profile?.proficiencyLevel || 'beginner'
      });
    }
  }, [user]);

  // Listen for dark mode changes
  useEffect(() => {
    const handleDarkModeChange = (e) => {
      setDarkMode(e.detail);
    };
    
    window.addEventListener('darkModeChange', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChange', handleDarkModeChange);
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${API_URL}/user/profile`,
        profile,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update context WITHOUT reloading
      updateUser(response.data.user);
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfile({
      name: user.profile?.name || '',
      email: user.email || '',
      proficiencyLevel: user.profile?.proficiencyLevel || 'beginner'
    });
  };

  return (
    <div className="min-h-screen" style={{ background: darkMode ? '#343541' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Navbar />
      
      <div className="pt-20 px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl p-8 shadow-2xl" style={{
            background: darkMode ? '#2c2d37' : '#ffffff'
          }}>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold" style={{ color: darkMode ? '#ececf1' : '#1f2937' }}>
                Profile Settings
              </h1>
              
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                  style={{ background: '#667eea', color: '#ffffff' }}
                >
                  <Edit2 size={18} />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                    style={{ background: '#10b981', color: '#ffffff' }}
                  >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                    style={{ background: '#ef4444', color: '#ffffff' }}
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#c5c5d2' : '#6b7280' }}>
                  <User className="inline mr-2" size={16} />
                  Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-lg border transition-all"
                  style={{
                    background: darkMode ? '#40414f' : '#f9fafb',
                    borderColor: darkMode ? '#565869' : '#d1d5db',
                    color: darkMode ? '#ececf1' : '#1f2937',
                    cursor: isEditing ? 'text' : 'not-allowed'
                  }}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#c5c5d2' : '#6b7280' }}>
                  <Mail className="inline mr-2" size={16} />
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border transition-all cursor-not-allowed opacity-60"
                  style={{
                    background: darkMode ? '#40414f' : '#f9fafb',
                    borderColor: darkMode ? '#565869' : '#d1d5db',
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}
                />
                <p className="text-xs mt-1" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                  Email cannot be changed
                </p>
              </div>

              {/* Proficiency Level */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: darkMode ? '#c5c5d2' : '#6b7280' }}>
                  <Award className="inline mr-2" size={16} />
                  Proficiency Level
                </label>
                <select
                  value={profile.proficiencyLevel}
                  onChange={(e) => setProfile({ ...profile, proficiencyLevel: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 rounded-lg border transition-all"
                  style={{
                    background: darkMode ? '#40414f' : '#f9fafb',
                    borderColor: darkMode ? '#565869' : '#d1d5db',
                    color: darkMode ? '#ececf1' : '#1f2937',
                    cursor: isEditing ? 'pointer' : 'not-allowed'
                  }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Account Info */}
            <div className="mt-8 pt-6 border-t" style={{
              borderColor: darkMode ? '#565869' : '#e5e7eb'
            }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: darkMode ? '#ececf1' : '#1f2937' }}>
                Account Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>Member Since</p>
                  <p className="font-medium" style={{ color: darkMode ? '#ececf1' : '#1f2937' }}>
                    {new Date(user?.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>Last Active</p>
                  <p className="font-medium" style={{ color: darkMode ? '#ececf1' : '#1f2937' }}>
                    {user?.statistics?.lastActive 
                      ? new Date(user.statistics.lastActive).toLocaleDateString()
                      : 'Never'}
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
