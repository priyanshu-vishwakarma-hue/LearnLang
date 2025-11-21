import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Book, Mic, Phone, MessageCircle, Lightbulb, 
  CheckCircle, Settings, Volume2, Sparkles, Zap, Target,
  Moon, Sun, ChevronDown, ChevronUp
} from 'lucide-react';
import Navbar from './Navbar';

const HowToUse = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [expandedSection, setExpandedSection] = useState(null);

  // Listen for dark mode changes
  useEffect(() => {
    const handleDarkModeChange = (e) => {
      setDarkMode(e.detail);
    };
    
    window.addEventListener('darkModeChange', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChange', handleDarkModeChange);
  }, []);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen" style={{ 
      background: darkMode ? '#343541' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    }}>
      <Navbar />
      
      <div className="pt-14 sm:pt-16 md:pt-18">
        {/* Header */}
        <div className="sticky top-0 z-50 px-3 sm:px-4 md:px-6 py-3 md:py-4 border-b" style={{
          background: darkMode ? 'rgba(44, 45, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderColor: darkMode ? '#444654' : 'rgba(255, 255, 255, 0.3)'
        }}>
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 p-2 rounded-lg hover:opacity-80 transition-opacity"
              style={{ color: darkMode ? '#ececf1' : '#667eea' }}
            >
              <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
              <span className="hidden sm:inline font-semibold">Back</span>
            </button>
            
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold" style={{ 
              color: darkMode ? '#ececf1' : '#1f2937' 
            }}>
              📚 How to Use LangLearn
            </h1>

            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-lg transition-all"
              style={{ 
                background: darkMode ? '#fbbf24' : '#1f2937',
                color: '#ffffff'
              }}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10">
          
          {/* Quick Start */}
          <section className="mb-8 sm:mb-10 rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl border-2" style={{
            background: darkMode ? '#444654' : '#ffffff',
            borderColor: darkMode ? '#565869' : '#e5e7eb'
          }}>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              }}>
                <Zap className="text-white" size={24} />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ 
                color: darkMode ? '#ececf1' : '#1f2937' 
              }}>
                🚀 Quick Start
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: Phone, text: 'Click "Start Call" for voice conversation', color: '#10b981' },
                { icon: MessageCircle, text: 'Or use "Start Conversation" for chat', color: '#3b82f6' },
                { icon: Settings, text: 'Adjust language settings (EN/HI)', color: '#f59e0b' },
                { icon: Mic, text: 'Allow microphone access for voice', color: '#ef4444' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 sm:p-4 rounded-lg" style={{
                  background: darkMode ? '#565869' : '#f9fafb'
                }}>
                  <item.icon size={20} style={{ color: item.color, flexShrink: 0 }} />
                  <p className="text-sm sm:text-base" style={{ color: darkMode ? '#c5c5d2' : '#6b7280' }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Practice Commands */}
          <section className="mb-8 sm:mb-10 rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl border-2" style={{
            background: darkMode ? '#444654' : '#ffffff',
            borderColor: darkMode ? '#565869' : '#e5e7eb'
          }}>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <Target className="text-white" size={24} />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ 
                color: darkMode ? '#ececf1' : '#1f2937' 
              }}>
                🎯 Magic Practice Commands
              </h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {[
                {
                  title: '📝 Sentence Framing Practice',
                  commands: [
                    'practice sentence framing',
                    'give 10 sentences',
                    'teach modals',
                    'teach prepositions',
                    'teach conjunctions'
                  ],
                  result: 'AI will give you 10-12 sentences ONE BY ONE. After each sentence, AI asks: "Repeat this. Ready for the next?"',
                  example: 'You: "practice sentence framing"\nAI: "I should go to the market. Repeat this. Ready for the next?"\nYou: (repeat)\nAI: "Next sentence..."'
                },
                {
                  title: '🔗 Combine Everything',
                  commands: [
                    'combine all',
                    'make a long sentence',
                    'use modals and prepositions together'
                  ],
                  result: 'AI creates ONE long 3-4 line sentence using modals + prepositions + conjunctions',
                  example: 'You: "combine all"\nAI: "I should go to the market before it closes because I need to buy vegetables, and if I don\'t go now, I might not get fresh items since they usually run out by evening."'
                },
                {
                  title: '📖 Deep Learning',
                  commands: [
                    'explain in detail',
                    'tell me more',
                    'teach deeply',
                    'why is this correct?',
                    'how does this work?'
                  ],
                  result: 'AI gives detailed 5+ line explanations with examples',
                  example: 'You: "explain modals in detail"\nAI: (gives 5+ lines of explanation with examples)'
                },
                {
                  title: '📚 Word Meanings',
                  commands: [
                    'what does [word] mean?',
                    'explain this word',
                    'meaning of [word]'
                  ],
                  result: 'AI gives simple meaning in English or Hindi',
                  example: 'You: "what does perseverance mean?"\nAI: "Perseverance means continuing to try even when things are difficult. In Hindi: धैर्य और लगन"'
                }
              ].map((section, i) => (
                <div key={i} className="rounded-xl overflow-hidden border-2" style={{
                  background: darkMode ? '#565869' : '#f9fafb',
                  borderColor: darkMode ? '#6b7280' : '#e5e7eb'
                }}>
                  <button
                    onClick={() => toggleSection(i)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between hover:opacity-80 transition-opacity"
                  >
                    <h3 className="text-base sm:text-lg font-bold text-left" style={{ 
                      color: darkMode ? '#ececf1' : '#1f2937' 
                    }}>
                      {section.title}
                    </h3>
                    {expandedSection === i ? (
                      <ChevronUp size={20} style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} />
                    ) : (
                      <ChevronDown size={20} style={{ color: darkMode ? '#9ca3af' : '#6b7280' }} />
                    )}
                  </button>
                  
                  {expandedSection === i && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3 sm:space-y-4">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold mb-2" style={{ 
                          color: darkMode ? '#fbbf24' : '#f59e0b' 
                        }}>
                          Say these commands:
                        </p>
                        <div className="space-y-1.5 sm:space-y-2">
                          {section.commands.map((cmd, j) => (
                            <div key={j} className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg" style={{
                              background: darkMode ? '#40414f' : '#ffffff',
                              border: `1px solid ${darkMode ? '#565869' : '#e5e7eb'}`
                            }}>
                              <code className="text-xs sm:text-sm" style={{ 
                                color: darkMode ? '#10b981' : '#059669',
                                fontFamily: 'monospace'
                              }}>
                                "{cmd}"
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 sm:p-4 rounded-lg" style={{
                        background: darkMode ? '#40414f' : '#ffffff',
                        border: `2px dashed ${darkMode ? '#3b82f6' : '#60a5fa'}`
                      }}>
                        <p className="text-xs sm:text-sm font-semibold mb-2" style={{ 
                          color: darkMode ? '#3b82f6' : '#2563eb' 
                        }}>
                          What happens:
                        </p>
                        <p className="text-xs sm:text-sm" style={{ color: darkMode ? '#c5c5d2' : '#6b7280' }}>
                          {section.result}
                        </p>
                      </div>

                      <div className="p-3 sm:p-4 rounded-lg" style={{
                        background: darkMode ? '#1f2937' : '#f0fdf4',
                        border: `1px solid ${darkMode ? '#374151' : '#bbf7d0'}`
                      }}>
                        <p className="text-xs font-semibold mb-2" style={{ 
                          color: darkMode ? '#10b981' : '#059669' 
                        }}>
                          Example:
                        </p>
                        <pre className="text-xs whitespace-pre-wrap font-mono" style={{ 
                          color: darkMode ? '#d1d5db' : '#374151' 
                        }}>
                          {section.example}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section className="mb-8 sm:mb-10 rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl border-2" style={{
            background: darkMode ? '#444654' : '#ffffff',
            borderColor: darkMode ? '#565869' : '#e5e7eb'
          }}>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
              }}>
                <Sparkles className="text-white" size={24} />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ 
                color: darkMode ? '#ececf1' : '#1f2937' 
              }}>
                ✨ All Features
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: Phone, title: 'Call Mode', desc: 'Hands-free voice conversation with auto-restart' },
                { icon: MessageCircle, title: 'Chat Mode', desc: 'Type or use mic for individual messages' },
                { icon: Volume2, title: 'Text-to-Speech', desc: 'AI speaks responses in EN/HI with adjustable speed' },
                { icon: Mic, title: 'Voice Input', desc: 'Speak in English or Hindi, AI understands both' },
                { icon: Book, title: 'Grammar Tips', desc: 'Get corrections with yellow highlight badges' },
                { icon: Lightbulb, title: 'Suggestions', desc: 'Click bulb icon for conversation starters' },
                { icon: Settings, title: 'Customization', desc: 'Adjust speech speed (0.5x-1.5x) and pitch' },
                { icon: CheckCircle, title: 'Save Messages', desc: 'Bookmark important conversations for later' }
              ].map((feature, i) => (
                <div key={i} className="p-4 sm:p-5 rounded-xl border-2" style={{
                  background: darkMode ? '#565869' : '#f9fafb',
                  borderColor: darkMode ? '#6b7280' : '#e5e7eb'
                }}>
                  <div className="flex items-start gap-3">
                    <feature.icon size={20} className="flex-shrink-0 mt-1" style={{ 
                      color: darkMode ? '#3b82f6' : '#2563eb' 
                    }} />
                    <div>
                      <h3 className="text-sm sm:text-base font-bold mb-1" style={{ 
                        color: darkMode ? '#ececf1' : '#1f2937' 
                      }}>
                        {feature.title}
                      </h3>
                      <p className="text-xs sm:text-sm" style={{ color: darkMode ? '#c5c5d2' : '#6b7280' }}>
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pro Tips */}
          <section className="rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl border-2" style={{
            background: darkMode ? '#444654' : '#ffffff',
            borderColor: darkMode ? '#565869' : '#e5e7eb'
          }}>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
              }}>
                <Lightbulb className="text-white" size={24} />
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ 
                color: darkMode ? '#ececf1' : '#1f2937' 
              }}>
                💡 Pro Tips
              </h2>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {[
                'Use Call Mode for continuous practice without clicking',
                'Say "pause" to stop the call temporarily',
                'Change AI language to Hindi if you want AI to reply in Hindi',
                'Slow down speech speed (0.5x-0.75x) for better understanding',
                'Practice daily - even 5 minutes helps!',
                'Ask "why" and "how" to get detailed explanations',
                'Use "combine all" after learning separate patterns',
                'Save important corrections to review later'
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 sm:gap-3 pl-3 sm:pl-0">
                  <CheckCircle 
                    size={16} 
                    className="flex-shrink-0 mt-0.5 sm:mt-1" 
                    style={{ color: darkMode ? '#10b981' : '#059669' }} 
                  />
                  <p className="text-xs sm:text-sm" style={{ color: darkMode ? '#c5c5d2' : '#6b7280' }}>
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Button */}
          <div className="mt-8 sm:mt-10 flex justify-center">
            <button 
              onClick={() => navigate('/chat')}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg flex items-center gap-2 sm:gap-3 transition-all hover:scale-105 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff'
              }}
            >
              <MessageCircle size={20} />
              <span>Start Practicing Now</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToUse;
