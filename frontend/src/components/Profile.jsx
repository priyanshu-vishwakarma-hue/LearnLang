import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Save, User, Globe, Target, Briefcase, Heart } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Profile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.profile?.name || '',
    nativeLanguage: user?.profile?.nativeLanguage || 'Hindi',
    proficiencyLevel: user?.profile?.proficiencyLevel || 'beginner',
    learningGoals: user?.profile?.learningGoals || '',
    age: user?.profile?.age || '',
    occupation: user?.profile?.occupation || '',
    interests: user?.profile?.interests?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const interestsArray = formData.interests.split(',').map(i => i.trim()).filter(i => i);
      
      const response = await axios.put(
        `${API_URL}/user/profile`,
        {
          profile: {
            ...formData,
            interests: interestsArray,
            age: formData.age ? parseInt(formData.age) : undefined
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUser({ ...user, profile: response.data.user });
      setMessage('Profile updated successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark p-5">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Edit Profile</h1>
              <p className="text-gray-600 text-sm">Update your personal information</p>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg text-center ${
              message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-primary transition-colors">
              <User size={20} className="text-gray-400" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="flex-1 bg-transparent outline-none text-gray-800"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-primary transition-colors">
              <Globe size={20} className="text-gray-400" />
              <select 
                name="nativeLanguage" 
                value={formData.nativeLanguage} 
                onChange={handleChange}
                className="flex-1 bg-transparent outline-none text-gray-800"
              >
                <option value="Hindi">Hindi</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Chinese">Chinese</option>
              </select>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-primary transition-colors">
              <Target size={20} className="text-gray-400" />
              <select 
                name="proficiencyLevel" 
                value={formData.proficiencyLevel} 
                onChange={handleChange}
                className="flex-1 bg-transparent outline-none text-gray-800"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-primary transition-colors">
              <User size={20} className="text-gray-400" />
              <input
                type="number"
                name="age"
                placeholder="Age (optional)"
                value={formData.age}
                onChange={handleChange}
                min="1"
                max="120"
                className="flex-1 bg-transparent outline-none text-gray-800"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-primary transition-colors">
              <Briefcase size={20} className="text-gray-400" />
              <input
                type="text"
                name="occupation"
                placeholder="Occupation (optional)"
                value={formData.occupation}
                onChange={handleChange}
                className="flex-1 bg-transparent outline-none text-gray-800"
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-primary transition-colors">
              <Heart size={20} className="text-gray-400 mt-1" />
              <input
                type="text"
                name="interests"
                placeholder="Interests (comma-separated, e.g., reading, music, travel)"
                value={formData.interests}
                onChange={handleChange}
                className="flex-1 bg-transparent outline-none text-gray-800"
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-primary transition-colors">
              <Target size={20} className="text-gray-400 mt-1" />
              <textarea
                name="learningGoals"
                placeholder="Your learning goals (optional)"
                value={formData.learningGoals}
                onChange={handleChange}
                rows={4}
                className="flex-1 bg-transparent outline-none text-gray-800 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
