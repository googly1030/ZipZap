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
  } catch (error) {
    console.error('Error rephrasing text:', error);
    return text; 
  }
};