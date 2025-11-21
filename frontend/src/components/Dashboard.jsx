import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Navbar from './Navbar';
import { 
  MessageCircle, User, TrendingUp, CheckCircle, XCircle, BookOpen
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const navigate = useNavigate();

  // Listen for dark mode changes
  useEffect(() => {
    const handleDarkModeChange = (e) => {
      setDarkMode(e.detail);
    };
    
    window.addEventListener('darkModeChange', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChange', handleDarkModeChange);
  }, []);

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

  const accuracy = statistics
    ? ((statistics.correctResponses / (statistics.correctResponses + statistics.incorrectResponses)) * 100 || 0).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen" style={{ background: darkMode ? '#343541' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Fixed Navbar */}
      <Navbar />

      {/* Content with top padding to account for fixed navbar */}
      <div className="pt-14 sm:pt-16 md:pt-18">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10">
          {/* Welcome Section */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10" style={{ color: darkMode ? '#ececf1' : '#ffffff' }}>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 px-2">
              Welcome back, {user?.profile?.name}! 👋
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl opacity-90 px-2">
              Ready to practice your English conversation skills?
            </p>
          </div>

          {/* Start Conversation Button */}
          <div className="flex justify-center mb-6 sm:mb-8 md:mb-10 px-3">
            <button 
              onClick={() => navigate('/chat')} 
              className="group relative w-full sm:w-auto px-6 sm:px-10 md:px-12 lg:px-16 py-4 sm:py-5 md:py-6 rounded-2xl sm:rounded-full text-base sm:text-lg md:text-xl lg:text-2xl font-bold inline-flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300"
              style={{
                background: darkMode 
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' 
                  : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                color: darkMode ? '#f0fdf4' : '#5b21b6',
                boxShadow: darkMode 
                  ? '0 8px 25px rgba(5, 150, 105, 0.25)' 
                  : '0 8px 25px rgba(139, 92, 246, 0.15)',
              }}
            >
              <MessageCircle size={24} />
              <span>Start Conversation</span>
              <span>→</span>
            </button>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-8">
            {/* Total Messages Card */}
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 pointer-events-none" style={{
              background: darkMode ? '#444654' : '#ffffff',
              borderColor: darkMode ? '#565869' : '#e5e7eb'
            }}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}>
                  <MessageCircle size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold truncate" style={{
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}>
                    {statistics?.totalMessages || 0}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base truncate" style={{
                    color: darkMode ? '#9ca3af' : '#6b7280'
                  }}>
                    Total Messages
                  </p>
                </div>
              </div>
            </div>

            {/* Correct Responses Card */}
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 pointer-events-none" style={{
              background: darkMode ? '#444654' : '#ffffff',
              borderColor: darkMode ? '#565869' : '#e5e7eb'
            }}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}>
                  <CheckCircle size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold truncate" style={{
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}>
                    {statistics?.correctResponses || 0}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base truncate" style={{
                    color: darkMode ? '#9ca3af' : '#6b7280'
                  }}>
                    Correct Responses
                  </p>
                </div>
              </div>
            </div>

            {/* Incorrect Card */}
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 pointer-events-none" style={{
              background: darkMode ? '#444654' : '#ffffff',
              borderColor: darkMode ? '#565869' : '#e5e7eb'
            }}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                }}>
                  <XCircle size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold truncate" style={{
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}>
                    {statistics?.incorrectResponses || 0}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base truncate" style={{
                    color: darkMode ? '#9ca3af' : '#6b7280'
                  }}>
                    Incorrect
                  </p>
                </div>
              </div>
            </div>

            {/* Accuracy Card */}
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 pointer-events-none" style={{
              background: darkMode ? '#444654' : '#ffffff',
              borderColor: darkMode ? '#565869' : '#e5e7eb'
            }}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
                }}>
                  <TrendingUp size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold truncate" style={{
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}>
                    {accuracy}%
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base truncate" style={{
                    color: darkMode ? '#9ca3af' : '#6b7280'
                  }}>
                    Accuracy
                  </p>
                </div>
              </div>
            </div>

            {/* Grammar Tips Card */}
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 pointer-events-none" style={{
              background: darkMode ? '#444654' : '#ffffff',
              borderColor: darkMode ? '#565869' : '#e5e7eb'
            }}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                }}>
                  <BookOpen size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold truncate" style={{
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}>
                    {statistics?.grammarCorrections || 0}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base truncate" style={{
                    color: darkMode ? '#9ca3af' : '#6b7280'
                  }}>
                    Grammar Tips
                  </p>
                </div>
              </div>
            </div>

            {/* Level Card */}
            <div className="rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 pointer-events-none" style={{
              background: darkMode ? '#444654' : '#ffffff',
              borderColor: darkMode ? '#565869' : '#e5e7eb'
            }}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)'
                }}>
                  <User size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold capitalize truncate" style={{
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}>
                    {user?.profile?.proficiencyLevel}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base truncate" style={{
                    color: darkMode ? '#9ca3af' : '#6b7280'
                  }}>
                    Level
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            <div className="rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl border-2" style={{
              background: darkMode ? '#444654' : '#ffffff',
              borderColor: darkMode ? '#565869' : '#e5e7eb'
            }}>
              <h3 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 md:mb-5" style={{
                color: darkMode ? '#ececf1' : '#1f2937'
              }}>
                💡 Learning Tips
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {[
                  'Practice daily for best results',
                  "Don't be afraid to make mistakes",
                  'Use voice input for better pronunciation',
                  'Review grammar corrections carefully'
                ].map((tip, index) => (
                  <li key={index} className="pl-5 sm:pl-6 relative text-xs sm:text-sm md:text-base" style={{
                    color: darkMode ? '#c5c5d2' : '#6b7280'
                  }}>
                    <span className="absolute left-0 text-green-500 font-bold text-sm sm:text-base">✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl border-2" style={{
              background: darkMode ? '#444654' : '#ffffff',
              borderColor: darkMode ? '#565869' : '#e5e7eb'
            }}>
              <h3 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 md:mb-5" style={{
                color: darkMode ? '#ececf1' : '#1f2937'
              }}>
                📊 Your Progress
              </h3>
              <div className="h-2.5 sm:h-3 md:h-4 rounded-full overflow-hidden mb-3 sm:mb-4" style={{
                background: darkMode ? '#565869' : '#e5e7eb'
              }}>
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${accuracy}%`,
                    background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                  }}
                ></div>
              </div>
              <p className="text-center text-xs sm:text-sm md:text-base" style={{
                color: darkMode ? '#c5c5d2' : '#6b7280'
              }}>
                You're doing great! Keep practicing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
