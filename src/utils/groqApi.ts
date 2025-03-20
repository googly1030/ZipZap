import { Groq } from 'groq-sdk';
import { config } from '../config/env';

const groq = new Groq({ 
  apiKey: config.groqApiKey,
  dangerouslyAllowBrowser: true 
});

export const rephraseLowQualityText = async (text: string): Promise<string> => {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a text improvement assistant. Rephrase the given text to be clear and coherent while maintaining the original meaning. Fix any OCR errors and improve readability.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.3,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    });

    return response.choices[0].message.content ?? '';
  } catch (error) {
    console.error('Error rephrasing text:', error);
    return text; // Return original text if rephrasing fails
  }
};