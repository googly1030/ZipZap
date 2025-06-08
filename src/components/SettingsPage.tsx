import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, AlertCircle, CheckCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from './LandingHeader';

interface ApiKeys {
  groqApiKey: string;
  geminiApiKey: string;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    groqApiKey: '',
    geminiApiKey: ''
  });
  const [showKeys, setShowKeys] = useState({
    groq: false,
    gemini: false
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<ApiKeys>>({});

  // Load existing API keys on mount
  useEffect(() => {
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        setApiKeys(parsedKeys);
      } catch (error) {
        console.error('Error loading saved API keys:', error);
      }
    }
  }, []);

  const validateApiKey = (key: string, type: 'groq' | 'gemini'): string | null => {
    if (!key.trim()) {
      return `${type === 'groq' ? 'GROQ' : 'Gemini'} API key is required`;
    }
    
    if (type === 'groq' && !key.startsWith('gsk_')) {
      return 'GROQ API key should start with "gsk_"';
    }
    
    if (type === 'gemini' && key.length < 30) {
      return 'Gemini API key appears to be too short';
    }
    
    return null;
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    setErrors({});

    // Validate keys
    const groqError = validateApiKey(apiKeys.groqApiKey, 'groq');
    const geminiError = validateApiKey(apiKeys.geminiApiKey, 'gemini');

    if (groqError || geminiError) {
      setErrors({
        groqApiKey: groqError || undefined,
        geminiApiKey: geminiError || undefined
      });
      setSaveStatus('error');
      return;
    }

    try {
      // Save to localStorage
      localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
      
      // Update environment variables for the session
      (window as any).__API_KEYS__ = apiKeys;
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving API keys:', error);
      setSaveStatus('error');
    }
  };

  const handleInputChange = (field: keyof ApiKeys, value: string) => {
    setApiKeys(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleShowKey = (type: 'groq' | 'gemini') => {
    setShowKeys(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <>
      <Header isFormCompleted={true} />
      <div className="min-h-screen bg-[#0a0a0f] pt-16">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header Section - Improved Layout */}
          <div className="mb-12">
            <button
              onClick={() => navigate('/chat')}
              className="group flex items-center space-x-3 text-purple-400 hover:text-purple-300 transition-all duration-300 mb-6 p-2 rounded-lg hover:bg-purple-600/10"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Chat</span>
            </button>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600">
                API Settings
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl">
                Configure your API keys to unlock the full power of Budy-X features
              </p>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 via-white/5 to-white/10 rounded-3xl p-8 border border-purple-900/30 shadow-2xl">
            <div className="space-y-10">
              
              {/* GROQ API Key Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-purple-600/20 border border-purple-500/30">
                      <Key className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">GROQ API Key</h2>
                      <p className="text-gray-400">Powers code assistance and email generation</p>
                    </div>
                  </div>
                  <a 
                    href="https://console.groq.com/keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors group"
                  >
                    <span className="text-sm font-medium">Get API Key</span>
                    <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showKeys.groq ? 'text' : 'password'}
                      placeholder="gsk_..."
                      value={apiKeys.groqApiKey}
                      onChange={(e) => handleInputChange('groqApiKey', e.target.value)}
                      className={`w-full rounded-xl bg-black/20 border text-white py-4 px-6 pr-14 text-lg
                               outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all
                               placeholder-gray-500 backdrop-blur-sm
                               ${errors.groqApiKey ? 'border-red-500/50 focus:ring-red-500/20' : 'border-purple-900/30'}`}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('groq')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                      {showKeys.groq ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.groqApiKey && (
                    <div className="flex items-center space-x-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{errors.groqApiKey}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-purple-900/30"></div>

              {/* Gemini API Key Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-blue-600/20 border border-blue-500/30">
                      <Key className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Gemini API Key</h2>
                      <p className="text-gray-400">Enables intelligent voice mode responses</p>
                    </div>
                  </div>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors group"
                  >
                    <span className="text-sm font-medium">Get API Key</span>
                    <ExternalLink className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showKeys.gemini ? 'text' : 'password'}
                      placeholder="AIza..."
                      value={apiKeys.geminiApiKey}
                      onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
                      className={`w-full rounded-xl bg-black/20 border text-white py-4 px-6 pr-14 text-lg
                               outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all
                               placeholder-gray-500 backdrop-blur-sm
                               ${errors.geminiApiKey ? 'border-red-500/50 focus:ring-red-500/20' : 'border-purple-900/30'}`}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('gemini')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                      {showKeys.gemini ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.geminiApiKey && (
                    <div className="flex items-center space-x-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{errors.geminiApiKey}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Section */}
              <div className="flex items-center justify-between pt-8 border-t border-purple-900/30">
                <div className="flex items-center space-x-3">
                  {saveStatus === 'saved' && (
                    <div className="flex items-center space-x-3 text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">API keys saved successfully!</span>
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="flex items-center space-x-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Please fix the errors above</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105
                           ${saveStatus === 'saving' 
                             ? 'bg-gray-600/20 cursor-not-allowed text-gray-400' 
                             : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-[0_0_30px_rgba(147,51,234,0.4)] text-white shadow-lg'}`}
                >
                  <Save className="h-5 w-5" />
                  <span>{saveStatus === 'saving' ? 'Saving...' : 'Save API Keys'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 backdrop-blur-lg bg-gradient-to-br from-blue-900/10 to-purple-900/10 rounded-2xl p-8 border border-blue-900/30">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <AlertCircle className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Security & Privacy</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Local Storage Only</p>
                    <p className="text-gray-400 text-sm">Your API keys are stored securely in your browser and never sent to our servers.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Free Tier Available</p>
                    <p className="text-gray-400 text-sm">Both GROQ and Gemini offer generous free tiers to get you started.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Easy Updates</p>
                    <p className="text-gray-400 text-sm">You can update your API keys anytime by returning to this page.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 rounded-full bg-pink-400 mt-3 flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Instant Activation</p>
                    <p className="text-gray-400 text-sm">Changes take effect immediately across all Budy-X features.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;