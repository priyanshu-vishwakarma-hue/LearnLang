import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Mic, MicOff, Send, Volume2, ArrowLeft, Trash2, PhoneCall, PhoneOff, 
  Lightbulb, X, Pause, Play, Bookmark, BookmarkCheck
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [userSpeakLanguage, setUserSpeakLanguage] = useState('en');
  const [aiResponseLanguage, setAiResponseLanguage] = useState('en');
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [savedMessageMap, setSavedMessageMap] = useState({});

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const autoModeTimeoutRef = useRef(null);
  const autoModeRef = useRef(false);
  const isPausedRef = useRef(false);
  
  // NEW: Add refs for language settings to avoid closure issues
  const userSpeakLanguageRef = useRef('en');
  const aiResponseLanguageRef = useRef('en');

  useEffect(() => {
    fetchConversation();
    initializeSpeechRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      synthesisRef.current.cancel();
      if (autoModeTimeoutRef.current) {
        clearTimeout(autoModeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // NEW: Fetch saved messages to mark them in chat
  useEffect(() => {
    fetchSavedStatus();
  }, []);

  // Update language refs whenever state changes
  useEffect(() => {
    userSpeakLanguageRef.current = userSpeakLanguage;
    console.log('📝 User speak language updated to:', userSpeakLanguage);
  }, [userSpeakLanguage]);

  useEffect(() => {
    aiResponseLanguageRef.current = aiResponseLanguage;
    console.log('📝 AI response language updated to:', aiResponseLanguage);
  }, [aiResponseLanguage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;
      
      recognitionRef.current.onstart = () => {
        console.log('🎤 Started listening');
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        
        console.log('📝 Got transcript:', transcript);
        console.log('Confidence:', confidence);
        console.log('Auto mode (ref):', autoModeRef.current, 'Is paused (ref):', isPausedRef.current);
        
        // Check if transcript is meaningful (not just noise/silence)
        if (!transcript || transcript.trim().length < 2) {
          console.log('⚠️ Empty or too short transcript, restarting listening...');
          setIsListening(false);
          // Restart listening in auto mode
          if (autoModeRef.current && !isPausedRef.current) {
            setTimeout(() => startListening(), 500);
          }
          return;
        }
        
        // Use REF instead of state for immediate access
        if (autoModeRef.current && !isPausedRef.current && transcript.trim()) {
          console.log('✅ Auto-mode ACTIVE: Calling sendMessageDirect...');
          setIsListening(false);
          setTimeout(() => {
            sendMessageDirect(transcript);
          }, 200);
        } else {
          console.log('ℹ️ Normal mode: Updating inputText');
          setInputText(transcript);
          setIsListening(false);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('❌ Speech error:', event.error);
        setIsListening(false);
        
        // If it's "no-speech" error in auto mode, just restart
        if (event.error === 'no-speech' && autoModeRef.current && !isPausedRef.current) {
          console.log('🔄 No speech detected, restarting...');
          setTimeout(() => startListening(), 1000);
          return;
        }
        
        // If error in auto mode, try restarting
        if (autoModeRef.current && !isPausedRef.current && event.error !== 'aborted') {
          setTimeout(() => {
            console.log('🔄 Restarting after error...');
            startListening();
          }, 2000);
        }
      };
      
      recognitionRef.current.onend = () => {
        console.log('🛑 Recognition ended');
        setIsListening(false);
      };
    } else {
      console.error('❌ Speech recognition not supported in this browser');
    }
  };

  const fetchConversation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/conversation`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.conversation.messages || []);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const fetchSavedStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/saved/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Create a map of AI responses to their saved message IDs
      const savedMap = {};
      response.data.savedMessages.forEach(msg => {
        savedMap[msg.aiResponse] = msg._id;
      });
      setSavedMessageMap(savedMap);
    } catch (error) {
      console.error('Error fetching saved status:', error);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isPaused && !loading) {
      // Use REF for current language
      recognitionRef.current.lang = userSpeakLanguageRef.current === 'hi' ? 'hi-IN' : 'en-US';
      console.log('🎤 Starting recognition with language:', recognitionRef.current.lang);
      recognitionRef.current.start();
    } else {
      console.log('⚠️ Cannot start listening - listening:', isListening, 'paused:', isPaused, 'loading:', loading);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      startListening();
    }
  };

  const speakText = (text, language = 'en-US') => {
    return new Promise((resolve) => {
      synthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => {
        console.log('🔊 Speech started');
        setIsSpeaking(true);
      };
      
      utterance.onend = () => {
        console.log('✅ Speech ended');
        setIsSpeaking(false);
        resolve();
      };
      
      utterance.onerror = (error) => {
        console.error('❌ Speech error:', error);
        setIsSpeaking(false);
        resolve();
      };
      
      synthesisRef.current.speak(utterance);
    });
  };

  const sendMessageDirect = async (messageText = inputText) => {
    console.log('🚀 sendMessageDirect called with:', messageText);
    console.log('🌍 Current language settings - User:', userSpeakLanguageRef.current, 'AI:', aiResponseLanguageRef.current);
    
    if (!messageText.trim()) {
      console.log('⚠️ Empty message, skipping');
      if (autoModeRef.current && !isPausedRef.current) {
        setTimeout(() => startListening(), 1000);
      }
      return;
    }

    console.log('📤 Sending message DIRECTLY:', messageText);
    setLoading(true);

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const token = localStorage.getItem('token');
      
      console.log('🌐 Making API call with:', {
        message: messageText,
        userSpeakLanguage: userSpeakLanguageRef.current,
        aiResponseLanguage: aiResponseLanguageRef.current
      });
      
      const response = await axios.post(
        `${API_URL}/conversation/message`,
        { 
          message: messageText,
          userSpeakLanguage: userSpeakLanguageRef.current,
          aiResponseLanguage: aiResponseLanguageRef.current
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      console.log('✅ Got AI response:', response.data.aiResponse);

      const aiMessage = {
        role: 'assistant',
        content: response.data.aiResponse,
        hasGrammarError: response.data.hasCorrection,
        timestamp: new Date()
      };

      if (response.data.conversation && response.data.conversation.messages) {
        setMessages(response.data.conversation.messages);
      } else {
        setMessages(prev => [...prev, aiMessage]);
      }
      
      setLoading(false);
      console.log('✅ Loading set to false, now speaking...');
      
      // Speak in AI's response language - use REF
      const speechLang = aiResponseLanguageRef.current === 'hi' ? 'hi-IN' : 'en-US';
      
      console.log('🔊 Speaking AI response in:', speechLang);
      setIsSpeaking(true);
      
      // Wait for speech to complete
      await speakText(response.data.aiResponse, speechLang);
      
      console.log('✅ Speech completed');
      setIsSpeaking(false);
      
      // IMPORTANT: Wait a bit longer and check we're still in auto mode before restarting
      if (autoModeRef.current && !isPausedRef.current) {
        console.log('🎤 Will restart listening in 1 second...');
        setTimeout(() => {
          if (autoModeRef.current && !isPausedRef.current) {
            console.log('✅ Conditions met - restarting listening now');
            startListening();
          } else {
            console.log('❌ Conditions not met - autoMode:', autoModeRef.current, 'paused:', isPausedRef.current);
          }
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.content !== messageText));
      setLoading(false);
      
      const errorMsg = error.response?.data?.message || error.message || 'Network error';
      showToast(`Failed: ${errorMsg}`, 'error');
      
      if (autoModeRef.current && !isPausedRef.current) {
        setTimeout(() => {
          console.log('🔄 Restarting after error...');
          startListening();
        }, 2000);
      }
    }
  };

  const sendMessage = async (messageText = inputText) => {
    const textToSend = messageText || inputText;
    
    if (!textToSend.trim()) {
      console.log('⚠️ Empty message, skipping');
      return;
    }

    console.log('📤 Sending message:', textToSend);

    const userMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      console.log('🌐 Making API call with userLang:', textToSend, 'hi: ', userSpeakLanguage, 'aiLang:', aiResponseLanguage);
      const response = await axios.post(
        `${API_URL}/conversation/message`,
        { 
          message: textToSend,
          userSpeakLanguage,
          aiResponseLanguage
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      const aiMessage = {
        role: 'assistant',
        content: response.data.aiResponse,
        hasGrammarError: response.data.hasCorrection,
        timestamp: new Date()
      };

      if (response.data.conversation && response.data.conversation.messages) {
        setMessages(response.data.conversation.messages);
      } else {
        setMessages(prev => [...prev, aiMessage]);
      }
      
      const speechLang = aiResponseLanguage === 'hi' ? 'hi-IN' : 'en-US';
      await speakText(response.data.aiResponse, speechLang);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.content !== textToSend));
      
      const errorMsg = error.response?.data?.message || error.message || 'Network error';
      showToast(`Failed: ${errorMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestion = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/conversation/suggestion`,
        { aiResponseLanguage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuggestions(response.data.suggestions);
      setShowSuggestionModal(true);
    } catch (error) {
      console.error('Error getting suggestion:', error);
      showToast('Unable to get suggestions', 'error');
    }
  };

  const useSuggestion = (suggestion) => {
    setInputText(suggestion);
    setShowSuggestionModal(false);
    if (autoMode) {
      setTimeout(() => sendMessage(suggestion), 500);
    }
  };

  const showToast = (message, type = 'success') => {
    const toastDiv = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const icon = type === 'success' 
      ? `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`
      : type === 'error'
      ? `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`
      : `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`;
    
    toastDiv.className = `fixed top-20 right-4 ${bgColor} text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-slide-in flex items-center gap-2`;
    toastDiv.innerHTML = `${icon}<span>${message}</span>`;
    document.body.appendChild(toastDiv);
    setTimeout(() => toastDiv.remove(), 3000);
  };

  const saveMessage = async (userMsg, aiMsg) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/saved/save`,
        {
          userMessage: userMsg,
          aiResponse: aiMsg
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSavedMessageMap(prev => ({
        ...prev,
        [aiMsg]: response.data.savedMessage._id
      }));
      
      showToast(`Saved to: ${response.data.folderName}`, 'success');
    } catch (error) {
      console.error('Error saving message:', error);
      if (error.response?.status === 400) {
        showToast('Already saved!', 'info');
      } else {
        showToast('Failed to save message', 'error');
      }
    }
  };

  const unsaveMessage = async (aiMsg) => {
    const savedId = savedMessageMap[aiMsg];
    if (!savedId) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/saved/${savedId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSavedMessageMap(prev => {
        const newMap = { ...prev };
        delete newMap[aiMsg];
        return newMap;
      });
      
      showToast('Removed from saved', 'info');
    } catch (error) {
      console.error('Error unsaving message:', error);
      showToast('Failed to unsave', 'error');
    }
  };

  const toggleAutoMode = () => {
    const newAutoMode = !autoMode;
    console.log('📞 Toggling auto mode from', autoMode, 'to', newAutoMode);
    setAutoMode(newAutoMode);
    autoModeRef.current = newAutoMode;
    
    if (newAutoMode) {
      setIsPaused(false);
      isPausedRef.current = false;
      console.log('✅ Starting auto conversation mode...');
      showToast('Auto conversation mode activated! 🎙️', 'success');
      setTimeout(() => {
        console.log('🎤 Auto-starting listening in auto mode...');
        startListening();
      }, 1000);
    } else {
      console.log('❌ Stopping auto mode...');
      setIsPaused(false);
      isPausedRef.current = false;
      if (autoModeTimeoutRef.current) {
        clearTimeout(autoModeTimeoutRef.current);
      }
      recognitionRef.current?.stop();
      synthesisRef.current.cancel();
      showToast('Auto mode stopped', 'info');
    }
  };

  const togglePause = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    isPausedRef.current = newPaused; // UPDATE REF IMMEDIATELY
    
    if (newPaused) {
      console.log('⏸️ Pausing conversation...');
      recognitionRef.current?.stop();
      synthesisRef.current.cancel();
      if (autoModeTimeoutRef.current) {
        clearTimeout(autoModeTimeoutRef.current);
      }
    } else {
      console.log('▶️ Resuming conversation...');
      setTimeout(() => startListening(), 500);
    }
  };

  const clearConversation = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/conversation/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([]);
      showToast('Conversation cleared', 'success');
    } catch (error) {
      console.error('Error clearing conversation:', error);
      showToast('Failed to clear conversation', 'error');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-primary to-primary-dark">
      {/* Header */}
      <div className="bg-white shadow-lg px-4 md:px-6 py-4 flex items-center justify-between gap-4">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-xl font-bold text-gray-800">English Practice</h2>
          <p className="text-sm text-gray-600">
            {autoMode ? (isPaused ? '⏸️ Paused' : '📞 Call Active') : 'Chat Mode'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* User Speaking Language */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">I speak:</label>
            <select 
              value={userSpeakLanguage}
              onChange={(e) => setUserSpeakLanguage(e.target.value)}
              className="px-3 py-2 bg-blue-100 rounded-lg text-sm font-semibold"
              disabled={autoMode && !isPaused}
            >
              <option value="en">🇬🇧 English</option>
              <option value="hi">🇮🇳 Hindi</option>
            </select>
          </div>

          {/* AI Response Language */}
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">AI responds:</label>
            <select 
              value={aiResponseLanguage}
              onChange={(e) => setAiResponseLanguage(e.target.value)}
              className="px-3 py-2 bg-green-100 rounded-lg text-sm font-semibold"
              disabled={autoMode && !isPaused}
            >
              <option value="en">🇬🇧 English</option>
              <option value="hi">🇮🇳 Hindi</option>
            </select>
          </div>

          <button onClick={getSuggestion} className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg" title="Get suggestions">
            <Lightbulb size={20} />
          </button>
          
          <button onClick={toggleAutoMode} className={`p-3 rounded-lg ${autoMode ? 'bg-green-500 text-white animate-pulse' : 'bg-gray-100'}`}>
            {autoMode ? <PhoneOff size={20} /> : <PhoneCall size={20} />}
          </button>
          
          <button onClick={clearConversation} className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <PhoneCall size={64} className="mb-4 opacity-50" />
            <h3 className="text-2xl font-bold mb-2">Start Conversation</h3>
            <p className="text-lg opacity-90">Click phone icon for auto mode!</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg, index) => {
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const isSaved = !!savedMessageMap[msg.content];
              
              return (
                <div 
                  key={index} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' 
                        ? 'bg-white text-gray-800' 
                        : msg.hasGrammarError
                          ? 'bg-yellow-100 text-gray-800 border-2 border-yellow-400'
                          : 'bg-white/90 text-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex-1 whitespace-pre-wrap break-words">{msg.content}</p>
                      
                      {/* AI Response Actions */}
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button 
                            onClick={() => speakText(msg.content, aiResponseLanguage === 'hi' ? 'hi-IN' : 'en-US')}
                            className="p-1.5 hover:bg-gray-200 rounded-lg transition-all"
                            title="Listen"
                          >
                            <Volume2 size={16} />
                          </button>
                          
                          <button 
                            onClick={() => isSaved ? unsaveMessage(msg.content) : saveMessage(prevMsg?.content || 'Question', msg.content)}
                            className={`p-1.5 rounded-lg transition-all transform hover:scale-110 ${
                              isSaved
                                ? 'bg-blue-500 text-white'
                                : 'hover:bg-blue-50 text-blue-500'
                            }`}
                            title={isSaved ? 'Unsave' : 'Save'}
                          >
                            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                          </button>
                        </div>
                      )}
                    </div>
                    {msg.hasGrammarError && (
                      <span className="inline-block mt-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full font-semibold">
                        Grammar Tip
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Suggestion Modal */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Lightbulb className="text-yellow-500" size={28} />
                Suggestions
              </h3>
              <button onClick={() => setShowSuggestionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-600 mb-4">Click any suggestion to use it:</p>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => useSuggestion(suggestion)}
                  className="w-full text-left p-4 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-xl transition-all hover:scale-105 border-2 border-transparent hover:border-blue-300"
                >
                  <p className="text-gray-800 font-medium">{suggestion}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area (Hidden in Auto Mode) */}
      {!autoMode && (
        <div className="bg-white px-4 md:px-6 py-4 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-end gap-2">
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  userSpeakLanguage === 'hi' ? 'हिंदी में टाइप करें...' : 'Type in English...'
                }
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none text-gray-800"
              />
            </div>

            <button onClick={handleVoiceInput} className={`p-4 rounded-2xl ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-white'}`}>
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <button onClick={() => sendMessage()} disabled={!inputText.trim() || loading} className="p-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl disabled:opacity-50">
              <Send size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Auto Mode Controls */}
      {autoMode && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <p className="font-bold text-lg">
                {isPaused ? '⏸️ Call Paused' : isListening ? '🎤 Listening...' : isSpeaking ? '🔊 AI Speaking...' : loading ? '⏳ Processing...' : '✅ Ready'}
              </p>
              <p className="text-sm opacity-90">
                {isPaused ? 'Click Resume to continue' : 'Speak naturally or use mic button'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Manual Mic Button */}
              {!isPaused && !loading && !isSpeaking && (
                <button 
                  onClick={handleVoiceInput}
                  className={`px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2 transition-all ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-white text-green-600 hover:bg-gray-100'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff size={24} />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic size={24} />
                      Speak
                    </>
                  )}
                </button>
              )}
              
              {/* Pause/Resume Button */}
              <button 
                onClick={togglePause}
                className={`px-8 py-3 rounded-xl font-bold text-lg flex items-center gap-2 transition-all ${
                  isPaused 
                    ? 'bg-blue-500 hover:bg-blue-600 animate-pulse' 
                    : 'bg-yellow-500 hover:bg-yellow-600'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play size={24} />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause size={24} />
                    Pause
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
