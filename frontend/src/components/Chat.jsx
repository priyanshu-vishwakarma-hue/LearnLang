import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  Mic, MicOff, Send, Volume2, ArrowLeft, Trash2, PhoneCall, PhoneOff, 
  Lightbulb, X, Pause, Play, Bookmark, BookmarkCheck, Moon, Sun, Settings, Menu
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
  const [speechRate, setSpeechRate] = useState(0.9);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [showSettings, setShowSettings] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [browserInfo, setBrowserInfo] = useState('');

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const autoModeTimeoutRef = useRef(null);
  const autoModeRef = useRef(false);
  const isPausedRef = useRef(false);
  const userSpeakLanguageRef = useRef('en');
  const aiResponseLanguageRef = useRef('en');

  // Apply dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    fetchConversation();
    initializeSpeechRecognition();
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      synthesisRef.current.cancel();
      if (autoModeTimeoutRef.current) clearTimeout(autoModeTimeoutRef.current);
    };
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { fetchSavedStatus(); }, []);
  useEffect(() => { userSpeakLanguageRef.current = userSpeakLanguage; }, [userSpeakLanguage]);
  useEffect(() => { aiResponseLanguageRef.current = aiResponseLanguage; }, [aiResponseLanguage]);

  // Detect mobile and browser
  useEffect(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);
    
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !isChrome;
    const isFirefox = /Firefox/.test(navigator.userAgent);
    
    setBrowserInfo(
      isChrome ? 'Chrome' :
      isSafari ? 'Safari' :
      isFirefox ? 'Firefox' : 'Unknown'
    );
    
    console.log('📱 Device Info:', {
      isMobile: mobile,
      browser: browserInfo,
      userAgent: navigator.userAgent
    });
  }, []);

  // Mobile viewport height fix
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  const initializeSpeechRecognition = () => {
    // Check if running on HTTPS or localhost
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      setPermissionError('❌ Microphone requires HTTPS. Please use HTTPS URL.');
      console.error('Not HTTPS - mic blocked');
      showToast('Microphone requires HTTPS connection', 'error');
      return;
    }

    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      const errorMsg = isMobile 
        ? '❌ Speech recognition not supported on this mobile browser. Please use Chrome on Android or Safari on iOS.'
        : '❌ Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.';
      
      setPermissionError(errorMsg);
      console.error('❌ Speech recognition not available');
      showToast(errorMsg, 'error');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    
    // Mobile-specific settings
    if (isMobile) {
      console.log('📱 Configuring for mobile...');
      recognitionRef.current.continuous = false; // Better for mobile
      recognitionRef.current.interimResults = false; // More reliable on mobile
    } else {
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
    }
    
    recognitionRef.current.maxAlternatives = 1;
    
    recognitionRef.current.onstart = () => {
      console.log('🎤 Started listening');
      setIsListening(true);
      setPermissionError(''); // Clear any errors
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
      
      // Mobile-specific error handling
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setPermissionError('🎤 Microphone permission denied. Please enable in browser settings.');
        showToast('Please allow microphone in browser settings', 'error');
        return;
      }
      
      if (event.error === 'no-speech') {
        console.log('⚠️ No speech detected');
        if (autoModeRef.current && !isPausedRef.current) {
          console.log('🔄 No speech detected, restarting...');
          setTimeout(() => startListening(), 1500);
        }
        return;
      }
      
      if (event.error === 'network') {
        setPermissionError('❌ Network error. Check your internet connection.');
        showToast('Network error - check internet', 'error');
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

    console.log('✅ Speech recognition initialized');
    setPermissionError('');
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

  const startListening = async () => {
    if (!recognitionRef.current) {
      console.error('❌ Speech recognition not initialized');
      setPermissionError('Speech recognition not available. Please refresh the page.');
      return;
    }

    if (isListening || isPaused || loading) {
      console.log('⚠️ Cannot start listening - listening:', isListening, 'paused:', isPaused, 'loading:', loading);
      return;
    }

    try {
      // Request microphone permission explicitly
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('🎤 Requesting microphone permission...');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          console.log('✅ Microphone permission granted');
          
          // Stop the test stream
          stream.getTracks().forEach(track => track.stop());
          
          setPermissionError('');
        } catch (permError) {
          console.error('❌ Microphone permission denied:', permError);
          
          if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
            setPermissionError('🎤 Microphone access denied. Please:\n1. Click the 🔒 lock icon in address bar\n2. Allow Microphone permission\n3. Reload the page');
          } else {
            setPermissionError('🎤 Cannot access microphone: ' + permError.message);
          }
          
          showToast('Please allow microphone access', 'error');
          return;
        }
      }

      // Set language
      recognitionRef.current.lang = userSpeakLanguageRef.current === 'hi' ? 'hi-IN' : 'en-US';
      console.log('🎤 Starting recognition with language:', recognitionRef.current.lang);
      
      // Start recognition
      recognitionRef.current.start();
      
    } catch (error) {
      console.error('❌ Error starting recognition:', error);
      
      if (error.name === 'InvalidStateError') {
        console.log('⚠️ Recognition already started, stopping and restarting...');
        recognitionRef.current.stop();
        setTimeout(() => startListening(), 500);
        return;
      }
      
      setPermissionError('Failed to start microphone: ' + error.message);
      showToast('Failed to start microphone', 'error');
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
      utterance.rate = speechRate; // Use state value
      utterance.pitch = speechPitch; // Use state value
      utterance.volume = 1.0; // You can also make this adjustable
      
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
      setMessages(prev => prev.filter (msg => msg.content !== textToSend));
      
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

  const handleSpeechRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    console.log('🎚️ Changing speech rate to:', newRate);
    setSpeechRate(newRate);
  };

  const handleSpeechPitchChange = (e) => {
    const newPitch = parseFloat(e.target.value);
    console.log('🎵 Changing speech pitch to:', newPitch);
    setSpeechPitch(newPitch);
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className="flex flex-col mobile-vh-100" style={{ 
      background: darkMode ? '#343541' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      height: '100vh',
      height: 'calc(var(--vh, 1vh) * 100)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Header - Responsive */}
      <div className="sticky top-0 z-50 border-b px-3 sm:px-4 md:px-6 py-3 md:py-4" style={{
        background: darkMode ? '#2c2d37' : '#ffffff',
        borderColor: darkMode ? '#444654' : '#e5e7eb'
      }}>
        <div className="flex items-center justify-between gap-2">
          {/* Left Section */}
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2 md:p-2.5 rounded-lg hover:opacity-80 transition-opacity"
              style={{ color: darkMode ? '#ececf1' : '#1f2937' }}
            >
              <ArrowLeft size={20} className="md:w-6 md:h-6" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-base md:text-xl font-semibold" style={{ color: darkMode ? '#ececf1' : '#1f2937' }}>
                English Practice
              </h2>
              <p className="text-xs md:text-sm" style={{ color: darkMode ? '#c5c5d2' : '#6b7280' }}>
                {autoMode ? (isPaused ? '⏸️ Paused' : '📞 Active') : 'Chat'}
              </p>
            </div>
          </div>

          {/* Right Section - Larger buttons on desktop */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
            <button 
              onClick={toggleDarkMode}
              className="p-2 md:p-2.5 rounded-lg transition-all"
              style={{ 
                background: darkMode ? '#fbbf24' : '#1f2937',
                color: '#ffffff'
              }}
              title="Toggle Theme"
            >
              {darkMode ? <Sun size={16} className="md:w-5 md:h-5" /> : <Moon size={16} className="md:w-5 md:h-5" />}
            </button>

            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 md:p-2.5 rounded-lg hover:opacity-80 transition-opacity"
              style={{ color: darkMode ? '#ececf1' : '#1f2937' }}
              title="Settings"
            >
              <Settings size={16} className="md:w-5 md:h-5" />
            </button>

            {/* Suggestions button - larger on desktop */}
            <button 
              onClick={getSuggestion}
              className="p-2 md:p-2.5 rounded-lg hover:opacity-80 transition-all flex items-center gap-1.5"
              style={{ 
                background: darkMode ? '#fbbf24' : '#fbbf24',
                color: '#1f2937'
              }}
              title="Get Suggestions"
            >
              <Lightbulb size={16} className="md:w-5 md:h-5" />
              <span className="hidden lg:inline text-sm font-semibold">Suggestions</span>
            </button>

            <button 
              onClick={toggleAutoMode}
              className={`p-2 md:p-2.5 rounded-lg transition-all flex items-center gap-1.5 ${autoMode ? 'animate-pulse' : ''}`}
              style={{ 
                background: autoMode ? '#10b981' : (darkMode ? '#444654' : '#f3f4f6'),
                color: autoMode ? '#ffffff' : (darkMode ? '#ececf1' : '#1f2937')
              }}
              title={autoMode ? 'End Call' : 'Start Call'}
            >
              {autoMode ? <PhoneOff size={16} className="md:w-5 md:h-5" /> : <PhoneCall size={16} className="md:w-5 md:h-5" />}
              <span className="hidden lg:inline text-sm font-semibold">{autoMode ? 'End Call' : 'Call'}</span>
            </button>

            <button 
              onClick={clearConversation}
              className="hidden md:flex items-center gap-1.5 p-2 md:p-2.5 rounded-lg hover:opacity-80 transition-all"
              style={{ 
                background: '#ef4444',
                color: '#ffffff'
              }}
              title="Clear Chat"
            >
              <Trash2 size={16} className="md:w-5 md:h-5" />
              <span className="hidden lg:inline text-sm font-semibold">Clear</span>
            </button>
          </div>
        </div>

        {/* Settings Panel - Collapsible */}
        {showSettings && (
          <div className="mt-3 p-3 md:p-4 rounded-lg" style={{ background: darkMode ? '#444654' : '#f9fafb' }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
              <div>
                <label className="block text-xs md:text-sm mb-1 font-medium" style={{ color: darkMode ? '#c5c5d2' : '#6b7280' }}>I speak:</label>
                <select 
                  value={userSpeakLanguage}
                  onChange={(e) => setUserSpeakLanguage(e.target.value)}
                  className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base rounded-lg border"
                  style={{
                    background: darkMode ? '#40414f' : '#ffffff',
                    borderColor: darkMode ? '#565869' : '#d1d5db',
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}
                  disabled={autoMode && !isPaused}
                >
                  <option value="en">🇬🇧 EN</option>
                  <option value="hi">🇮🇳 HI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm mb-1 font-medium" style={{ color: darkMode ? '#c5c5d2' : '#6b7280' }}>AI:</label>
                <select 
                  value={aiResponseLanguage}
                  onChange={(e) => setAiResponseLanguage(e.target.value)}
                  className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base rounded-lg border"
                  style={{
                    background: darkMode ? '#40414f' : '#ffffff',
                    borderColor: darkMode ? '#565869' : '#d1d5db',
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}
                  disabled={autoMode && !isPaused}
                >
                  <option value="en">🇬🇧 EN</option>
                  <option value="hi">🇮🇳 HI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm mb-1 font-medium" style={{ color: darkMode ? '#c5c5d2' : '#6b7280' }}>Speed: {speechRate}x</label>
                <select 
                  value={speechRate}
                  onChange={handleSpeechRateChange}
                  className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base rounded-lg border"
                  style={{
                    background: darkMode ? '#40414f' : '#ffffff',
                    borderColor: darkMode ? '#565869' : '#d1d5db',
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}
                  disabled={isSpeaking}
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={0.9}>0.9x</option>
                  <option value={1.0}>1.0x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm mb-1 font-medium" style={{ color: darkMode ? '#c5c5d2' : '#6b7280' }}>Pitch: {speechPitch}</label>
                <select 
                  value={speechPitch}
                  onChange={handleSpeechPitchChange}
                  className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base rounded-lg border"
                  style={{
                    background: darkMode ? '#40414f' : '#ffffff',
                    borderColor: darkMode ? '#565869' : '#d1d5db',
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}
                  disabled={isSpeaking}
                >
                  <option value={0.5}>Low</option>
                  <option value={0.8}>Norm-</option>
                  <option value={1.0}>Norm</option>
                  <option value={1.2}>Norm+</option>
                  <option value={1.5}>High</option>
                </select>
              </div>

              <button 
                onClick={clearConversation}
                className="md:hidden px-3 py-1.5 rounded-lg text-sm font-semibold"
                style={{ background: '#ef4444', color: '#ffffff' }}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Permission Error Banner - Enhanced with line breaks */}
      {permissionError && (
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4" style={{ 
          background: darkMode ? '#7f1d1d' : '#fee2e2',
          borderBottom: '2px solid #dc2626',
          position: 'relative',
          zIndex: 50
        }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm md:text-base font-semibold text-center mb-2 whitespace-pre-line" style={{
              color: darkMode ? '#fecaca' : '#991b1b'
            }}>
              {permissionError}
            </p>
            
            {/* Mobile-specific instructions */}
            {isMobile && (
              <div className="text-xs sm:text-sm space-y-1" style={{
                color: darkMode ? '#fca5a5' : '#b91c1c'
              }}>
                <p className="font-semibold">📱 Mobile Setup:</p>
                {browserInfo === 'Chrome' && (
                  <>
                    <p>• Tap 🔒 in address bar</p>
                    <p>• Tap "Permissions"</p>
                    <p>• Enable "Microphone"</p>
                    <p>• Reload page</p>
                  </>
                )}
                {browserInfo === 'Safari' && (
                  <>
                    <p>• Go to iPhone Settings → Safari → {window.location.hostname}</p>
                    <p>• Enable "Microphone"</p>
                    <p>• Reload page</p>
                  </>
                )}
                {window.location.protocol !== 'https:' && (
                  <p className="mt-2 font-bold">⚠️ Must use HTTPS URL!</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages - Scrollable area with proper padding for fixed bottom */}
      <div 
        className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6" 
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overflowY: 'auto',
          position: 'relative',
          minHeight: 0,
          paddingBottom: '100px' // Extra space so messages don't hide behind input
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4" style={{
              background: darkMode ? '#444654' : 'rgba(255,255,255,0.2)',
              color: darkMode ? '#10a37f' : '#ffffff'
            }}>
              <PhoneCall size={32} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: darkMode ? '#ececf1' : '#ffffff' }}>
              Start Conversation
            </h3>
            <p className="text-sm sm:text-base" style={{ color: darkMode ? '#c5c5d2' : 'rgba(255,255,255,0.9)' }}>
              Click the phone icon to begin!
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
            {messages.map((msg, index) => {
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const isSaved = !!savedMessageMap[msg.content];
              
              return (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div 
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg ${
                      msg.role === 'user' 
                        ? '' 
                        : msg.hasGrammarError
                          ? 'border-2 border-amber-500'
                          : ''
                    }`}
                    style={
                      msg.role === 'user'
                        ? { background: '#10b981', color: '#ffffff' }
                        : msg.hasGrammarError
                          ? { background: darkMode ? '#92400e' : '#fef3c7', color: darkMode ? '#ffffff' : '#92400e' }
                          : { background: darkMode ? '#444654' : '#ffffff', color: darkMode ? '#ececf1' : '#1f2937' }
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex-1 text-sm sm:text-base whitespace-pre-wrap break-words">{msg.content}</p>
                      
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button 
                            onClick={() => speakText(msg.content, aiResponseLanguage === 'hi' ? 'hi-IN' : 'en-US')}
                            className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                            title="Listen"
                          >
                            <Volume2 size={14} />
                          </button>
                          
                          <button 
                            onClick={() => isSaved ? unsaveMessage(msg.content) : saveMessage(prevMsg?.content || 'Q', msg.content)}
                            className={`p-1.5 rounded-lg transition-all ${isSaved ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                            style={isSaved ? { background: '#3b82f6', color: '#ffffff' } : {}}
                            title={isSaved ? 'Unsave' : 'Save'}
                          >
                            {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {msg.hasGrammarError && (
                      <span className="inline-block mt-2 px-2 py-1 rounded-full text-xs font-semibold" style={{
                        background: darkMode ? '#fbbf24' : '#fef3c7',
                        color: darkMode ? '#1f2937' : '#92400e'
                      }}>
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

      {/* Suggestion Modal - Responsive */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSuggestionModal(false)}>
          <div 
            className="rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl animate-fade-in"
            style={{ background: darkMode ? '#2c2d37' : '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: darkMode ? '#ececf1' : '#1f2937' }}>
                <Lightbulb className="text-amber-500" size={24} />
                Suggestions
              </h3>
              <button onClick={() => setShowSuggestionModal(false)} className="p-2 rounded-lg hover:opacity-70" style={{ color: darkMode ? '#ececf1' : '#1f2937' }}>
                <X size={20} />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: darkMode ? '#c5c5d2' : '#6b7280' }}>
              Click any suggestion:
            </p>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => useSuggestion(suggestion)}
                  className="w-full text-left p-3 rounded-lg transition-all hover:scale-102"
                  style={{
                    background: darkMode ? '#444654' : '#f3f4f6',
                    color: darkMode ? '#ececf1' : '#1f2937'
                  }}
                >
                  <p className="text-sm">{suggestion}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area - ABSOLUTELY FIXED like WhatsApp */}
      {!autoMode && (
        <div 
          className="sticky-bottom safe-bottom"
          style={{ 
            background: darkMode ? '#2c2d37' : '#ffffff',
            borderTop: `1px solid ${darkMode ? '#444654' : '#e5e7eb'}`,
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            paddingLeft: '12px',
            paddingRight: '12px',
            paddingTop: '12px',
            paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)',
            boxShadow: darkMode 
              ? '0 -2px 10px rgba(0, 0, 0, 0.3)'
              : '0 -2px 10px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <div className="flex-1 rounded-2xl border overflow-hidden" style={{
              background: darkMode ? '#40414f' : '#f3f4f6',
              borderColor: darkMode ? '#565869' : '#d1d5db'
            }}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={userSpeakLanguage === 'hi' ? 'हिंदी में टाइप करें...' : 'Type in English...'}
                rows={1}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent resize-none outline-none text-sm sm:text-base"
                style={{ 
                  color: darkMode ? '#ececf1' : '#1f2937',
                  maxHeight: '100px',
                  fontSize: '16px'
                }}
              />
            </div>

            <button 
              onClick={handleVoiceInput}
              className={`p-2.5 sm:p-3 rounded-full transition-all flex-shrink-0 ${isListening ? 'animate-pulse' : ''}`}
              style={{ 
                background: isListening ? '#ef4444' : '#10b981',
                color: '#ffffff'
              }}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button 
              onClick={() => sendMessage()} 
              disabled={!inputText.trim() || loading}
              className="p-2.5 sm:p-3 rounded-full transition-all disabled:opacity-50 flex-shrink-0"
              style={{ background: '#10b981', color: '#ffffff' }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Auto Mode Controls - ABSOLUTELY FIXED like WhatsApp */}
      {autoMode && (
        <div 
          className="sticky-bottom safe-bottom"
          style={{ 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
            color: '#ffffff',
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            paddingLeft: '12px',
            paddingRight: '12px',
            paddingTop: '16px',
            paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left flex-1">
                <p className="font-semibold text-base sm:text-lg">
                  {isPaused ? '⏸️ Paused' : isListening ? '🎤 Listening...' : isSpeaking ? '🔊 Speaking...' : loading ? '⏳ Processing...' : '✅ Ready'}
                </p>
                <p className="text-xs sm:text-sm opacity-90 mt-0.5">
                  {isPaused ? 'Resume to continue' : 'Speak naturally'}
                </p>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                {!isPaused && !loading && !isSpeaking && (
                  <button 
                    onClick={handleVoiceInput}
                    className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-sm sm:text-base flex items-center gap-2 transition-all ${
                      isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-white text-emerald-600 hover:bg-gray-100'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff size={18} />
                        <span className="hidden sm:inline">Stop</span>
                      </>
                    ) : (
                      <>
                        <Mic size={18} />
                        <span className="hidden sm:inline">Speak</span>
                      </>
                    )}
                  </button>
                )}
                
                <button 
                  onClick={togglePause}
                  className={`px-4 sm:px-8 py-2 sm:py-2.5 rounded-full font-semibold text-sm sm:text-base flex items-center gap-2 transition-all ${
                    isPaused ? 'bg-blue-500 hover:bg-blue-600 animate-pulse' : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {isPaused ? (
                    <>
                      <Play size={18} />
                      <span className="hidden sm:inline">Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause size={18} />
                      <span className="hidden sm:inline">Pause</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
