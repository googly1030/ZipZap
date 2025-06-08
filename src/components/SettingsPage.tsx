import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
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
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Chat</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">API Settings</h1>
              <p className="text-gray-400">Configure your API keys to enable Budy-X features</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="backdrop-blur-lg bg-gradient-to-b from-white/10 to-white/5 rounded-2xl p-8 border border-purple-900/30">
            <div className="space-y-8">
              {/* GROQ API Key */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Key className="h-5 w-5 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">GROQ API Key</h2>
                </div>
                <p className="text-gray-400 text-sm">
                  Required for code assistance and email generation. Get your key from{' '}
                  <a 
                    href="https://console.groq.com/keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    GROQ Console
                  </a>
                </p>
                <div className="relative">
                  <input
                    type={showKeys.groq ? 'text' : 'password'}
                    placeholder="gsk_..."
                    value={apiKeys.groqApiKey}
                    onChange={(e) => handleInputChange('groqApiKey', e.target.value)}
                    className={`w-full rounded-lg bg-white/5 border text-white py-3 px-4 pr-12
                             outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all
                             ${errors.groqApiKey ? 'border-red-500/50' : 'border-purple-900/30'}`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('groq')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showKeys.groq ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.groqApiKey && (
                  <div className="flex items-center space-x-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.groqApiKey}</span>
                  </div>
                )}
              </div>

              {/* Gemini API Key */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Key className="h-5 w-5 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">Gemini API Key</h2>
                </div>
                <p className="text-gray-400 text-sm">
                  Required for voice mode responses. Get your key from{' '}
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Google AI Studio
                  </a>
                </p>
                <div className="relative">
                  <input
                    type={showKeys.gemini ? 'text' : 'password'}
                    placeholder="AIza..."
                    value={apiKeys.geminiApiKey}
                    onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
                    className={`w-full rounded-lg bg-white/5 border text-white py-3 px-4 pr-12
                             outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all
                             ${errors.geminiApiKey ? 'border-red-500/50' : 'border-purple-900/30'}`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey('gemini')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showKeys.gemini ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.geminiApiKey && (
                  <div className="flex items-center space-x-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.geminiApiKey}</span>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-6 border-t border-purple-900/30">
                <div className="flex items-center space-x-2">
                  {saveStatus === 'saved' && (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="text-green-400">API keys saved successfully!</span>
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <span className="text-red-400">Please fix the errors above</span>
                    </>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300
                           ${saveStatus === 'saving' 
                             ? 'bg-gray-600/20 cursor-not-allowed text-gray-400' 
                             : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] text-white'}`}
                >
                  <Save className="h-5 w-5" />
                  <span>{saveStatus === 'saving' ? 'Saving...' : 'Save API Keys'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 backdrop-blur-lg bg-gradient-to-b from-blue-900/10 to-blue-900/5 rounded-2xl p-6 border border-blue-900/30">
            <h3 className="text-lg font-semibold text-white mb-4">Important Information</h3>
            <div className="space-y-3 text-gray-300 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                <p>Your API keys are stored locally in your browser and are never sent to our servers.</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                <p>GROQ API is free with generous limits. Gemini API offers free tier with usage limits.</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                <p>You can update your API keys anytime by returning to this page.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;