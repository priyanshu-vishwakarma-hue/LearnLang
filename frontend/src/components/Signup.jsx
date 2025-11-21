import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [proficiencyLevel, setProficiencyLevel] = useState('beginner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(name, email, password, proficiencyLevel);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container scroll-page min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-3xl shadow-2xl p-8 sm:p-10" style={{
          background: darkMode ? '#2c2d37' : '#ffffff'
        }}>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
              <UserPlus size={32} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2" style={{
            color: darkMode ? '#ececf1' : '#1f2937'
          }}>
            Create Account
          </h2>
          <p className="text-center mb-8 text-sm sm:text-base" style={{
            color: darkMode ? '#c5c5d2' : '#6b7280'
          }}>
            Start your English learning journey today
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{
                color: darkMode ? '#ececf1' : '#374151'
              }}>
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={20} style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-xl border-2 text-base sm:text-lg font-medium transition-all focus:outline-none focus:ring-4"
                  style={{
                    background: darkMode ? '#40414f' : '#f9fafb',
                    borderColor: darkMode ? '#565869' : '#e5e7eb',
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{
                color: darkMode ? '#ececf1' : '#374151'
              }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={20} style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-xl border-2 text-base sm:text-lg font-medium transition-all focus:outline-none focus:ring-4"
                  style={{
                    background: darkMode ? '#40414f' : '#f9fafb',
                    borderColor: darkMode ? '#565869' : '#e5e7eb',
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{
                color: darkMode ? '#ececf1' : '#374151'
              }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 sm:py-3.5 rounded-xl border-2 text-base sm:text-lg font-medium transition-all focus:outline-none focus:ring-4"
                  style={{
                    background: darkMode ? '#40414f' : '#f9fafb',
                    borderColor: darkMode ? '#565869' : '#e5e7eb',
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff size={20} style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} />
                  ) : (
                    <Eye size={20} style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} />
                  )}
                </button>
              </div>
            </div>

            {/* Proficiency Level */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{
                color: darkMode ? '#ececf1' : '#374151'
              }}>
                Proficiency Level
              </label>
              <select
                value={proficiencyLevel}
                onChange={(e) => setProficiencyLevel(e.target.value)}
                className="w-full px-4 py-3 sm:py-3.5 rounded-xl border-2 text-base sm:text-lg font-medium transition-all focus:outline-none focus:ring-4"
                style={{
                  background: darkMode ? '#40414f' : '#f9fafb',
                  borderColor: darkMode ? '#565869' : '#e5e7eb',
                  color: darkMode ? '#ececf1' : '#1f2937'
                }}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 sm:py-4 rounded-xl text-white text-base sm:text-lg font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm sm:text-base" style={{
            color: darkMode ? '#c5c5d2' : '#6b7280'
          }}>
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-bold hover:underline"
              style={{ color: '#667eea' }}
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
