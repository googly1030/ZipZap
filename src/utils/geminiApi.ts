import { getApiKeys } from './apiKeyManager';

export async function generateGeminiResponse(text: string): Promise<string> {
  try {
    const { geminiApiKey } = getApiKeys();
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured. Please set up your API keys in settings.');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text }]
        }]
      })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error: any) {
    console.error('Gemini API error:', error);
    if (error.message.includes('API key not configured')) {
      return 'Please configure your Gemini API key in settings to use voice mode.';
    }
    return 'Sorry, I had trouble processing that. Could you try again?';
  }
}