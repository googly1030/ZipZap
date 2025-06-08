import { getApiKeys } from '../utils/apiKeyManager';

const getConfig = () => {
  const apiKeys = getApiKeys();
  
  return {
    groqApiKey: apiKeys.groqApiKey,
    geminiApiKey: apiKeys.geminiApiKey,
    geminiApiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
  };
};

export const config = getConfig();

// Function to refresh config when API keys are updated
export const refreshConfig = () => {
  const newConfig = getConfig();
  Object.assign(config, newConfig);
};