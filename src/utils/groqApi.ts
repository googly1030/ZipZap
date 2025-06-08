import { Groq } from 'groq-sdk';
import { getApiKeys } from './apiKeyManager';

const getGroqClient = () => {
  const { groqApiKey } = getApiKeys();
  if (!groqApiKey) {
    throw new Error('GROQ API key not configured. Please set up your API keys in settings.');
  }
  
  return new Groq({ 
    apiKey: groqApiKey,
    dangerouslyAllowBrowser: true 
  });
};

export const rephraseLowQualityText = async (text: string): Promise<string> => {
  try {
    const groq = getGroqClient();

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Analyze the given text and provide a response in this format:

          Content Overview:
          - Describe what the text is about
          - Identify main topics or concepts
          - Note any technical terms or code elements

          Present the analysis in a clear, structured format using markdown. Focus on understanding rather than correction.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      model: 'gemma2-9b-it',
      temperature: 0.3,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    });

    return response.choices[0].message.content ?? '';
  } catch (error: any) {
    console.error('Error rephrasing text:', error);
    if (error.message.includes('API key not configured')) {
      return 'Please configure your GROQ API key in settings to use this feature.';
    }
    return text; 
  }
};