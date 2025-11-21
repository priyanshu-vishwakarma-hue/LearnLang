import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, LogOut, Settings, Bookmark, Moon, Sun, 
  HelpCircle, Menu, X, MessageCircle, Home
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', darkMode);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('darkModeChange', { detail: darkMode }));
  }, [darkMode]);

  // Listen for dark mode changes from other components
  useEffect(() => {
    const handleDarkModeChange = (e) => {
      setDarkMode(e.detail);
    };
    
    window.addEventListener('darkModeChange', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChange', handleDarkModeChange);
  }, []);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard', color: '#667eea' },
    { icon: MessageCircle, label: 'Chat', path: '/chat', color: '#10b981' },
    { icon: HelpCircle, label: 'How to Use', path: '/how-to-use', color: '#3b82f6' },
    { icon: Bookmark, label: 'Saved', path: '/saved', color: '#f59e0b' },
    { icon: Settings, label: 'Profile', path: '/profile', color: '#a855f7' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-[1000] backdrop-blur-lg border-b"
      style={{
        background: darkMode ? 'rgba(44, 45, 55, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        borderColor: darkMode ? '#444654' : 'rgba(229, 231, 235, 0.8)',
        boxShadow: darkMode 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-18">
          
          {/* Logo */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
          >
            <BookOpen 
              size={24} 
              className="sm:w-7 sm:h-7" 
              style={{ color: darkMode ? '#10b981' : '#667eea' }} 
            />
            <span 
              className="text-lg sm:text-xl md:text-2xl font-bold"
              style={{ color: darkMode ? '#ececf1' : '#667eea' }}
            >
              LangLearn
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg font-semibold text-sm lg:text-base transition-all active:scale-100 ${
                  isActive(item.path) ? 'scale-105' : 'hover:scale-105'
                }`}
                style={{
                  background: isActive(item.path)
                    ? darkMode 
                      ? item.color 
                      : item.color
                    : darkMode 
                      ? '#565869' 
                      : '#d1d5db', // Changed from #f3f4f6 to #d1d5db (much darker gray)
                  color: isActive(item.path)
                    ? '#ffffff'
                    : darkMode 
                      ? '#ececf1' 
                      : '#1f2937', // Changed from #374151 to #1f2937 (much darker)
                  opacity: 1,
                  boxShadow: !darkMode && isActive(item.path) 
                    ? `0 2px 8px ${item.color}40` 
                    : 'none',
                  fontWeight: isActive(item.path) ? '600' : '500'
                }}
                onMouseDown={(e) => e.currentTarget.style.opacity = '1'}
                onMouseUp={(e) => e.currentTarget.style.opacity = '1'}
              >
                <item.icon size={18} style={{ 
                  color: isActive(item.path) ? '#ffffff' : darkMode ? '#ececf1' : '#374151'
                }} />
                <span className="hidden lg:inline" style={{ 
                  color: isActive(item.path) ? '#ffffff' : 'inherit'
                }}>
                  {item.label}
                </span>
              </button>
            ))}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 lg:p-2.5 rounded-lg transition-all hover:opacity-80 active:opacity-100"
              style={{
                background: darkMode 
                  ? '#fbbf24' 
                  : 'linear-gradient(135deg, #1f2937, #111827)',
                color: '#ffffff',
                opacity: 1
              }}
              title="Toggle Theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg font-semibold text-sm lg:text-base transition-all"
              style={{ 
                background: darkMode 
                  ? '#ef4444' 
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#ffffff',
                opacity: 1 
              }}
            >
              <LogOut size={18} />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg transition-all active:opacity-100"
              style={{
                background: darkMode 
                  ? '#fbbf24' 
                  : 'linear-gradient(135deg, #1f2937, #111827)',
                color: '#ffffff',
                opacity: 1
              }}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg transition-all active:opacity-100"
              style={{
                background: darkMode ? '#565869' : '#f3f4f6',
                color: darkMode ? '#ececf1' : '#374151',
                opacity: 1
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden py-3 border-t animate-slide-down"
            style={{
              borderColor: darkMode ? '#444654' : '#e5e7eb'
            }}
          >
            <div className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all active:scale-100 ${
                    isActive(item.path) ? 'scale-[1.02]' : ''
                  }`}
                  style={{
                    background: isActive(item.path)
                      ? darkMode 
                        ? item.color 
                        : item.color
                      : darkMode 
                        ? '#565869' 
                        : '#d1d5db', // Changed from #f3f4f6 to #d1d5db
                    color: isActive(item.path)
                      ? '#ffffff'
                      : darkMode 
                        ? '#ececf1' 
                        : '#1f2937', // Changed from #374151 to #1f2937
                    opacity: 1,
                    boxShadow: !darkMode && isActive(item.path) 
                      ? `0 2px 8px ${item.color}40` 
                      : 'none'
                  }}
                >
                  <item.icon size={20} style={{ 
                    color: isActive(item.path) ? '#ffffff' : darkMode ? '#ececf1' : '#374151'
                  }} />
                  <span style={{ 
                    color: isActive(item.path) ? '#ffffff' : 'inherit'
                  }}>
                    {item.label}
                  </span>
                </button>
              ))}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all"
                style={{ 
                  background: darkMode 
                    ? '#ef4444' 
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#ffffff',
                  opacity: 1 
                }}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>

            {/* User Info in Mobile Menu */}
            <div 
              className="mt-3 pt-3 border-t"
              style={{ borderColor: darkMode ? '#444654' : '#e5e7eb' }}
            >
              <p className="text-xs px-4" style={{ color: darkMode ? '#9ca3af' : '#6b7280' }}>
                Logged in as <span className="font-semibold">{user?.email}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
