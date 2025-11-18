import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, Globe } from 'lucide-react';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    nativeLanguage: 'Hindi',
    proficiencyLevel: 'beginner'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-5">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <UserPlus className="text-primary mx-auto mb-4" size={48} />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-gray-600 text-sm">Start your English learning journey today!</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-primary focus-within:bg-white transition-all">
            <User size={20} className="text-gray-400" />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="flex-1 bg-transparent text-gray-800 text-base border-none"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-primary focus-within:bg-white transition-all">
            <Mail size={20} className="text-gray-400" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="flex-1 bg-transparent text-gray-800 text-base border-none"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-primary focus-within:bg-white transition-all">
            <Lock size={20} className="text-gray-400" />
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="flex-1 bg-transparent text-gray-800 text-base border-none"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-primary focus-within:bg-white transition-all">
            <Globe size={20} className="text-gray-400" />
            <select 
              name="nativeLanguage" 
              value={formData.nativeLanguage} 
              onChange={handleChange}
              className="flex-1 bg-transparent text-gray-800 text-base border-none"
            >
              <option value="Hindi">Hindi</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
            </select>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-transparent focus-within:border-primary focus-within:bg-white transition-all">
            <select 
              name="proficiencyLevel" 
              value={formData.proficiencyLevel} 
              onChange={handleChange}
              className="flex-1 bg-transparent text-gray-800 text-base border-none"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-primary to-primary-dark text-white py-4 rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-5 text-center text-gray-600 text-sm">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
