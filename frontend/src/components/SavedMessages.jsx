import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { ArrowLeft, Folder, Trash2, Volume2 } from 'lucide-react';
import Navbar from './Navbar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SavedMessages = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState({});
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    fetchSavedMessages();
  }, []);

  // Listen for dark mode changes
  useEffect(() => {
    const handleDarkModeChange = (e) => {
      setDarkMode(e.detail);
    };
    
    window.addEventListener('darkModeChange', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChange', handleDarkModeChange);
  }, []);

  const fetchSavedMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/saved/folders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFolders(response.data.folders);
    } catch (error) {
      console.error('Error fetching saved messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/saved/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSavedMessages();
      showToast('Message deleted', 'success');
    } catch (error) {
      console.error('Error deleting message:', error);
      showToast('Failed to delete', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    const toastDiv = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    toastDiv.className = `fixed top-20 right-4 ${bgColor} text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-slide-in`;
    toastDiv.textContent = message;
    document.body.appendChild(toastDiv);
    setTimeout(() => toastDiv.remove(), 3000);
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen" style={{ background: darkMode ? '#343541' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Navbar />
      
      <div className="pt-14 sm:pt-16 md:pt-18">
        <div className="bg-white shadow-lg px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-800">Saved Messages</h2>
        </div>

        <div className="max-w-5xl mx-auto p-6">
          {loading ? (
            <p className="text-white text-center">Loading...</p>
          ) : Object.keys(folders).length === 0 ? (
            <div className="text-center text-white">
              <p className="text-xl mb-4">No saved messages yet</p>
              <button onClick={() => navigate('/chat')} className="bg-white text-primary px-6 py-3 rounded-lg font-semibold">
                Start Chatting
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(folders).reverse().map(([folderName, messages]) => (
                <div key={folderName} className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Folder className="text-blue-500" size={24} />
                    <h3 className="text-xl font-bold text-gray-800">{folderName}</h3>
                    <span className="text-sm text-gray-500">({messages.length} saved)</span>
                  </div>
                  
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg._id} className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded-lg">
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 font-semibold mb-1">Your Question:</p>
                          <p className="text-gray-800">{msg.userMessage}</p>
                        </div>
                        
                        <div className="bg-blue-50 p-3 rounded-lg mb-3">
                          <p className="text-sm text-blue-600 font-semibold mb-1">AI Response:</p>
                          <p className="text-gray-800">{msg.aiResponse}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            Saved: {new Date(msg.savedAt).toLocaleDateString()}
                          </p>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => speakText(msg.aiResponse)}
                              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Listen"
                            >
                              <Volume2 size={18} />
                            </button>
                            
                            <button
                              onClick={() => deleteMessage(msg._id)}
                              className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedMessages;
