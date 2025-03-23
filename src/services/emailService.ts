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
    // Helper function to clean and extract email parts
    const processEmailResponse = (response: string) => {
      // Remove any introductory text and clean up the response
      const cleanedResponse = response
        .replace(/.*?(Subject:)/i, '$1') // Keep only the first subject line
        .replace(/Here is .+?:\n*/gi, '') // Remove introductory phrases
        .replace(/Subject:.*\n.*Subject:/i, 'Subject:') // Remove duplicate subject lines
        .trim();

      const lines = cleanedResponse.split('\n');
      const subjectLine = lines.find(line => line.toLowerCase().startsWith('subject:'));
      const subject = subjectLine 
        ? subjectLine.replace(/^subject:\s*/i, '').trim() 
        : '';
      
      // Remove the subject line from content and clean up
      const content = lines
        .filter(line => !line.toLowerCase().startsWith('subject:'))
        .join('\n')
        .trim();

      // Format content without URL encoding
      const formattedContent = content
        .replace(/\*/g, '•'); // Replace markdown bullets with bullet points

      return { 
        subject, 
        content: formattedContent
      };
    };

    if (modification) {
      const modificationPrompt = `Modify this email:
${modification.originalContent}

Changes requested: ${modification.modificationRequest}

Important:
- Include exactly one subject line at the top
- Remove any introductory text
- Maintain professional formatting
- Keep the email structure intact`;

      const completion = await client.chat.completions.create({
        messages: [{ role: 'user', content: modificationPrompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024
      });

      const modifiedResponse = completion.choices[0]?.message?.content;
      if (!modifiedResponse) throw new Error('No response from AI');

      return processEmailResponse(modifiedResponse);
    }

    // Handle new email generation
    const emailPrompt = `Write a professional email about: ${topic}

Important:
- Include exactly one subject line at the start, formatted as "Subject: Your Subject Here"
- Do not repeat the subject line in the body
- Start the email body with "Dear" or appropriate greeting
- Do not include any introductory text before the subject
${metadata ? `
From: ${metadata.sender.name}
Role: ${metadata.sender.role}
Company: ${metadata.sender.company}
Email: ${metadata.sender.email}
` : ''}`;

    const completion = await client.chat.completions.create({
      messages: [{ role: 'user', content: emailPrompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from AI');

    return processEmailResponse(response);

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