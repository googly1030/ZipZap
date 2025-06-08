// API Key Management Utility
export interface ApiKeys {
  groqApiKey: string;
  geminiApiKey: string;
}

export const getApiKeys = (): ApiKeys => {
  // First check if keys are available in window object (set by settings page)
  const windowKeys = (window as any).__API_KEYS__;
  if (windowKeys) {
    return windowKeys;
  }

  // Then check localStorage
  const savedKeys = localStorage.getItem('apiKeys');
  if (savedKeys) {
    try {
      return JSON.parse(savedKeys);
    } catch (error) {
      console.error('Error parsing saved API keys:', error);
    }
  }

  // Fallback to environment variables
  return {
    groqApiKey: import.meta.env.VITE_GROQ_API_KEY || '',
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || ''
  };
};

export const hasValidApiKeys = (): boolean => {
  const keys = getApiKeys();
  return !!(keys.groqApiKey && keys.geminiApiKey);
};

export const validateApiKey = (key: string, type: 'groq' | 'gemini'): boolean => {
  if (!key.trim()) return false;
  
  if (type === 'groq') {
    return key.startsWith('gsk_') && key.length > 10;
  }
  
  if (type === 'gemini') {
    return key.length > 30;
  }
  
  return false;
};