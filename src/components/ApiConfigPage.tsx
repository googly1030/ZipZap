import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Save, AlertCircle, CheckCircle, ExternalLink, Shield, Info } from 'lucide-react';
import { getApiKeys, validateApiKey } from '../utils/apiKeyManager';

interface ApiKeys {
  groqApiKey: string;
  geminiApiKey: string;
}

const ApiConfigPage: React.FC = () => {
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
    const currentKeys = getApiKeys();
    setApiKeys(currentKeys);
  }, []);

  const validateKeys = (): boolean => {
    const newErrors: Partial<ApiKeys> = {};
    
    if (!apiKeys.groqApiKey.trim()) {
      newErrors.groqApiKey = 'GROQ API key is required';
    } else if (!validateApiKey(apiKeys.groqApiKey, 'groq')) {
      newErrors.groqApiKey = 'Invalid GROQ API key format (should start with "gsk_")';
    }
    
    if (!apiKeys.geminiApiKey.trim()) {
      newErrors.geminiApiKey = 'Gemini API key is required';
    } else if (!validateApiKey(apiKeys.geminiApiKey, 'gemini')) {
      newErrors.geminiApiKey = 'Invalid Gemini API key format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    
    if (!validateKeys()) {
      setSaveStatus('error');
      return;
    }

    try {
      // Save to localStorage
      localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
      
      // Update runtime keys
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
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">API Configuration</h1>
        <p className="text-gray-400">Configure your API keys to unlock all Budy-X features</p>
      </div>

      {/* Status Banner */}
      {(apiKeys.groqApiKey || apiKeys.geminiApiKey) && (
        <div className="mb-6 p-4 rounded-lg bg-green-900/20 border border-green-500/30">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-medium">API Keys Configured</span>
          </div>
          <p className="text-green-300 text-sm mt-1">
            Your API keys are active and ready to use
          </p>
        </div>
      )}

      {/* API Keys Configuration */}
      <div className="space-y-8">
        {/* GROQ API Key */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-600/20">
              <Key className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">GROQ API Key</h2>
              <p className="text-gray-400 text-sm">Required for code assistance and email generation</p>
            </div>
          </div>
          
          <div className="space-y-4">
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
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
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Get your free API key</span>
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span>GROQ Console</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Gemini API Key */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-600/20">
              <Key className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Gemini API Key</h2>
              <p className="text-gray-400 text-sm">Required for voice mode and advanced AI features</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <input
                type={showKeys.gemini ? 'text' : 'password'}
                placeholder="AIza..."
                value={apiKeys.geminiApiKey}
                onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
                className={`w-full rounded-lg bg-white/5 border text-white py-3 px-4 pr-12
                         outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all
                         ${errors.geminiApiKey ? 'border-red-500/50' : 'border-purple-900/30'}`}
              />
              <button
                type="button"
                onClick={() => toggleShowKey('gemini')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
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
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Get your free API key</span>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>Google AI Studio</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
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
            <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Security & Privacy Info */}
      <div className="mt-8 glass-card p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-5 w-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Security & Privacy</h3>
        </div>
        <div className="space-y-3 text-gray-300 text-sm">
          <div className="flex items-start space-x-3">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p>Your API keys are stored locally in your browser and never sent to our servers</p>
          </div>
          <div className="flex items-start space-x-3">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p>Both GROQ and Gemini offer generous free tiers for personal use</p>
          </div>
          <div className="flex items-start space-x-3">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p>You can update or remove your API keys at any time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiConfigPage;