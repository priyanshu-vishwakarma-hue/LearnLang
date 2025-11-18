import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  MessageCircle, User, TrendingUp, CheckCircle, XCircle, 
  BookOpen, LogOut, Settings, Bookmark
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/user/statistics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const accuracy = statistics
    ? ((statistics.correctResponses / (statistics.correctResponses + statistics.incorrectResponses)) * 100 || 0).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-lg px-6 md:px-10 py-5 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
        <div className="flex items-center gap-3 text-2xl font-bold text-primary">
          <BookOpen size={28} />
          <span>LangLearn</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/saved')} 
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-100 rounded-lg text-blue-800 font-semibold hover:bg-blue-200 transition-all hover:-translate-y-0.5"
          >
            <Bookmark size={20} />
            <span className="hidden md:inline">Saved</span>
          </button>
          <button 
            onClick={() => navigate('/profile')} 
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 rounded-lg text-gray-800 font-semibold hover:bg-primary hover:text-white transition-all hover:-translate-y-0.5"
          >
            <Settings size={20} />
            <span className="hidden md:inline">Profile</span>
          </button>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 rounded-lg text-gray-800 font-semibold hover:bg-red-500 hover:text-white transition-all hover:-translate-y-0.5"
          >
            <LogOut size={20} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-5 py-10">
        {/* Welcome Section */}
        <div className="text-center text-white mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Welcome back, {user?.profile?.name}! 👋</h1>
          <p className="text-lg md:text-xl opacity-90">Ready to practice your English conversation skills?</p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          <div className="bg-white rounded-2xl p-6 flex items-center gap-5 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white">
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-800">{statistics?.totalMessages || 0}</h3>
              <p className="text-gray-600 text-sm">Total Messages</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 flex items-center gap-5 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-800">{statistics?.correctResponses || 0}</h3>
              <p className="text-gray-600 text-sm">Correct Responses</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 flex items-center gap-5 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white">
              <XCircle size={24} />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-800">{statistics?.incorrectResponses || 0}</h3>
              <p className="text-gray-600 text-sm">Incorrect Responses</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 flex items-center gap-5 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-800">{accuracy}%</h3>
              <p className="text-gray-600 text-sm">Accuracy Rate</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 flex items-center gap-5 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-800">{statistics?.grammarCorrections || 0}</h3>
              <p className="text-gray-600 text-sm">Grammar Corrections</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 flex items-center gap-5 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-800 capitalize">{user?.profile?.proficiencyLevel}</h3>
              <p className="text-gray-600 text-sm">Proficiency Level</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center mb-10">
          <button 
            onClick={() => navigate('/chat')} 
            className="bg-white text-primary px-12 py-5 rounded-full text-lg font-bold inline-flex items-center gap-3 shadow-2xl hover:-translate-y-1 hover:scale-105 transition-all"
          >
            <MessageCircle size={24} />
            Start Conversation
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <h3 className="text-gray-800 text-xl font-bold mb-5">💡 Learning Tips</h3>
            <ul className="space-y-3">
              <li className="text-gray-600 pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-green-500 before:font-bold">
                Practice daily for best results
              </li>
              <li className="text-gray-600 pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-green-500 before:font-bold">
                Don't be afraid to make mistakes
              </li>
              <li className="text-gray-600 pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-green-500 before:font-bold">
                Use voice input for better pronunciation
              </li>
              <li className="text-gray-600 pl-6 relative before:content-['✓'] before:absolute before:left-0 before:text-green-500 before:font-bold">
                Review grammar corrections carefully
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <h3 className="text-gray-800 text-xl font-bold mb-5">📊 Your Progress</h3>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                style={{ width: `${accuracy}%` }}
              ></div>
            </div>
            <p className="text-gray-600 text-center">You're doing great! Keep practicing.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
