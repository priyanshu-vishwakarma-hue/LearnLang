import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: darkMode ? '#343541' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="w-full max-w-md">
        <div className="rounded-3xl shadow-2xl p-8 sm:p-10" style={{
          background: darkMode ? '#2c2d37' : '#ffffff'
        }}>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
              <LogIn size={32} className="text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2" style={{
            color: darkMode ? '#ececf1' : '#1f2937'
          }}>
            Welcome Back!
          </h2>
          <p className="text-center mb-8 text-sm sm:text-base" style={{
            color: darkMode ? '#c5c5d2' : '#6b7280'
          }}>
            Login to continue your English learning journey
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 sm:py-4 rounded-xl text-white text-base sm:text-lg font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm sm:text-base" style={{
            color: darkMode ? '#c5c5d2' : '#6b7280'
          }}>
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="font-bold hover:underline"
              style={{ color: '#667eea' }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
