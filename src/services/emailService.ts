import { Groq } from 'groq-sdk';
import { config } from '../config/env';
import { EmailMetadata, EmailModification, EmailResponse } from '../types/emailTypes';

const client = new Groq({ 
  apiKey: config.groqApiKey,
  dangerouslyAllowBrowser: true 
});

let activeRequest: AbortController | null = null;

export const generateEmail = async (
  topic: string,
  metadata?: EmailMetadata,
  modification?: EmailModification
): Promise<EmailResponse> => {
  if (activeRequest) {
    activeRequest.abort();
  }

  activeRequest = new AbortController();
  const signal = activeRequest.signal;

  try {
    const processResponse = (response: string): EmailResponse => {
      // Get only the last email format if multiple exist
      const lastEmailIndex = response.toLowerCase().lastIndexOf('subject:');
      const relevantContent = lastEmailIndex > -1 
        ? response.slice(lastEmailIndex)
        : response;

      // Clean the response
      const cleanedResponse = relevantContent
        .replace(/^(?:Here is|I have created|Here's)(?: an?| the)? (?:email|response|draft).*?\n/i, '')
        .trim();

      const lines = cleanedResponse.split('\n');
      const subjectLine = lines.find(line => line.toLowerCase().startsWith('subject:'));
      const subject = subjectLine ? subjectLine.replace(/^subject:\s*/i, '').trim() : '';

      // Remove metadata and subject line from content
      const content = lines
        .filter(line => !line.toLowerCase().startsWith('subject:'))
        .filter(line => !line.match(/^(?:from|role|company|email):/i))
        .join('\n')
        .trim();

      return { subject, content };
    };

    if (modification) {
      const modificationPrompt = `Modify this email. Only provide the modified email content, no additional text:
      ${modification.originalContent}

      Changes requested: ${modification.modificationRequest}`;

      const completion = await client.chat.completions.create({
        messages: [{ role: 'user', content: modificationPrompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024
      });

      const modifiedResponse = completion.choices[0]?.message?.content;
      if (!modifiedResponse) throw new Error('No response from AI');

      return processResponse(modifiedResponse);
    }

    // Handle new email generation
    const emailPrompt = `Generate a professional email with the following requirements:
- Start with "Subject:" line
- Do not include any introductory text
- Include the email content immediately after the subject
${topic ? `\nTopic: ${topic}` : ''}
${metadata ? `
From: ${metadata.sender.name}
Role: ${metadata.sender.role}
Company: ${metadata.sender.company}
Email: ${metadata.sender.email}` : ''}`;

    const completion = await client.chat.completions.create({
      messages: [{ role: 'user', content: emailPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from AI');

    return processResponse(response);

  } catch (error) {
    if (signal.aborted) {
      throw new Error('Request cancelled');
    }
    throw error;
  } finally {
    if (activeRequest?.signal === signal) {
      activeRequest = null;
    }
  }
};