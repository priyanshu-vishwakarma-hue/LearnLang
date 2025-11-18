import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    <div className="flex justify-center items-center min-h-screen p-5">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <LogIn className="text-primary mx-auto mb-4" size={48} />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
          <p className="text-gray-600 text-sm">Login to continue your English learning journey</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-primary focus-within:bg-white transition-all">
            <Mail size={20} className="text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-transparent text-gray-800 text-base border-none"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-primary focus-within:bg-white transition-all">
            <Lock size={20} className="text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="flex-1 bg-transparent text-gray-800 text-base border-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-primary to-primary-dark text-white py-4 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-5 text-center text-gray-600 text-sm">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
