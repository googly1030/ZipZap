import { config } from '../config/env';

export async function generateGeminiResponse(text: string): Promise<string> {
  try {
    const response = await fetch(`${config.geminiApiUrl}?key=${config.geminiApiKey}`, {
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
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'Sorry, I had trouble processing that. Could you try again?';
  }
}