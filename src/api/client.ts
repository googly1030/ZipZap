import { Groq } from 'groq-sdk';
import { config } from '../config/env';
import { captureAndAnalyzeScreen } from '../utils/screenCapture';

const client = new Groq({ 
  apiKey: config.groqApiKey,
  dangerouslyAllowBrowser: true 
});

let activeRequest: AbortController | null = null;

interface PresentationModification {
  originalContent: string;
  modificationRequest: string;
}

export const generatePresentation = async (
  topic: string, 
  audience: string, 
  documentType: string,
  modification?: PresentationModification
): Promise<{ title: string; slides: Array<{ title: string; content: string }> }> => {
  if (activeRequest) {
    activeRequest.abort();
  }

  activeRequest = new AbortController();
  const signal = activeRequest.signal;

  try {
    const audiencePrompts = {
      students: `Create an educational and engaging ${documentType} for students about: ${topic}.
        Focus on clear explanations, examples, and learning objectives.
        Use simple language and include interactive elements where possible.`,
      
      clients: `Create a professional and persuasive ${documentType} for potential clients about: ${topic}.
        Focus on value proposition, benefits, and concrete solutions.
        Include case studies or success stories where relevant.`,
      
      companies: `Create a detailed and comprehensive ${documentType} for business partners about: ${topic}.
        Focus on market analysis, implementation details, and business impact.
        Include technical specifications and operational considerations.`,
      
      investors: `Create a compelling ${documentType} for investors about: ${topic}.
        Focus on market opportunity, growth potential, and financial projections.
        Include metrics, competitive analysis, and ROI expectations.`
    };

    const basePrompt = modification ? 
      `Modify the existing presentation according to these changes: "${modification.modificationRequest}"
      Original presentation:
      ${modification.originalContent}
      
      Important guidelines:
      1. Keep the modifications focused and relevant
      2. Maintain existing structure where appropriate
      3. Update content based on the modification request
      4. Target content specifically for ${audience}` :
      audiencePrompts[audience as keyof typeof audiencePrompts] || 
      `Create a ${documentType} presentation about: ${topic}`;

    const prompt = `${basePrompt}
      
      Format the response as a JSON object with:
      {
        "title": "Presentation Title",
        "slides": [
          {
            "title": "Slide Title",
            "content": "Slide content with bullet points using • for each point"
          }
        ]
      }

      Important guidelines:
      1. Include 5-7 slides
      2. Make first slide an introduction
      3. Make last slide a summary or call to action
      4. Keep content concise and impactful
      5. Format bullet points with • symbol
      6. Maintain professional tone
      7. Target content specifically for ${audience}`;

    const completion = await client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 2048,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from GROQ');

    try {
      const jsonStr = response.trim().replace(/```json|```/g, '');
      const parsedResponse = JSON.parse(jsonStr);
      
      if (!parsedResponse.title || !Array.isArray(parsedResponse.slides)) {
        throw new Error('Invalid presentation structure');
      }

      return {
        title: parsedResponse.title,
        slides: parsedResponse.slides.map((slide: { title: string; content: string }) => ({
          title: slide.title,
          content: slide.content.trim()
        }))
      };
    } catch (parseError) {
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse presentation content');
    }
  } catch {
    if (signal.aborted) {
      throw new Error('Request cancelled');
    }
    throw new Error('An error occurred');
  } finally {
    if (activeRequest?.signal === signal) {
      activeRequest = null;
    }
  }
};

interface EmailMetadata {
  sender: {
    name: string;
    role: string;
    company: string;
    email: string;
  };
}

interface EmailModification {
  originalContent: string;
  modificationRequest: string;
}

export const generateEmail = async (
  topic: string,
  audience: string,
  metadata?: EmailMetadata,
  modification?: EmailModification
): Promise<{ subject: string; content: string }> => {
  if (activeRequest) {
    activeRequest.abort();
  }

  activeRequest = new AbortController();
  const signal = activeRequest.signal;

  try {
    const audiencePrompts = {
      students: 'Use an educational and encouraging tone. Focus on clear explanations and learning objectives.',
      clients: 'Use a professional and persuasive tone. Focus on value proposition and benefits.',
      companies: 'Use a formal business tone. Focus on professional collaboration and mutual benefits.',
      investors: 'Use a confident and data-driven tone. Focus on opportunities and potential returns.'
    };

    const audienceStyle = audiencePrompts[audience as keyof typeof audiencePrompts] || 
      'Use a professional tone';

    const senderInfo = metadata ? `
    Sender Information (only use for signature and placeholders):
    - Name: ${metadata.sender.name}
    - Role: ${metadata.sender.role}
    - Company: ${metadata.sender.company}
    - Email: ${metadata.sender.email}
    ` : '';

    const prompt = modification ? 
      `Modify the existing email according to these changes: "${modification.modificationRequest}"
      ${senderInfo}
      ${modification.originalContent}
      
      Important:
      1. ${audienceStyle}
      2. Only use sender information for [Name], [Role], etc. placeholders
      3. Keep the email header and signature minimal
      4. Focus on the content modifications
      
      Respond with a JSON object in this exact format:
      {
        "subject": "Email Subject",
        "content": "Dear [Appropriate Greeting],\\n\\nEmail body here...\\n\\nBest regards,\\n[Name]\\n[Role]"
      }` :
      `Write a professional email about: "${topic}"
      ${senderInfo}
      
      Important:
      1. ${audienceStyle}
      2. Only use sender information where explicitly needed with [Name], [Role] placeholders
      3. Keep the email header simple
      4. Only include full signature details if contextually necessary
      5. Focus on the email content
      
      Response format:
      {
        "subject": "Email Subject",
        "content": "Dear [Appropriate Greeting],\\n\\nEmail body here...\\n\\nBest regards,\\n[Name]"
      }`;

    const completion = await client.chat.completions.create({
      messages: [{ 
        role: 'user', 
        content: prompt,
      }],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from GROQ');

    try {
      const jsonStr = response.trim().replace(/```json|```/g, '');
      const parsedResponse = JSON.parse(jsonStr);
      
      if (!parsedResponse.subject || !parsedResponse.content) {
        throw new Error('Invalid response structure');
      }

      const formattedContent = parsedResponse.content
        .replace(/\[Name\]/g, metadata?.sender.name || '')
        .replace(/\[Role\]/g, metadata?.sender.role || '')
        .replace(/\[Company\]/g, metadata?.sender.company || '')
        .replace(/\[Email\]/g, metadata?.sender.email || '');

      return {
        subject: parsedResponse.subject.replace(/\[Name\]/g, metadata?.sender.name || '')
          .replace(/\[Role\]/g, metadata?.sender.role || '')
          .replace(/\[Company\]/g, metadata?.sender.company || '')
          .trim(),
        content: formattedContent
      };
    } catch (parseError) {
      console.error('Parse error:', parseError);
      
      if (typeof response === 'string') {
        const subject = response.match(/Subject: (.*?)\n/)?.[1] || 'No Subject';
        const content = response.replace(/Subject: .*?\n/, '').trim();
        
        return {
          subject: subject.trim(),
          content: content.replace(/[{}]/g, '').trim() 
        };
      }
      
      throw new Error('Failed to parse email content');
    }
  } catch (error: unknown) {
    console.error('Generation error:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to generate email');
    } else {
      throw new Error('Failed to generate email');
    }
  } finally {
    if (activeRequest?.signal === signal) {
      activeRequest = null;
    }
  }
};

export interface CodeSnippet {
  title: string;
  code: string;
  language: string;
  explanation?: string;
}

export interface CodeAssistanceResponse {
  response: string;
  context?: string;
  suggestions: string[];
  codeSnippets: CodeSnippet[];
  references?: string[];
}

interface CodeContext {
  previousSnippets: CodeSnippet[];
  lastAction?: {
    type: string;
    timestamp: number;
  };
}

// Add this function to better detect combination requests
const isCodeCombinationIntent = (
  prompt: string,
  previousSnippets: CodeSnippet[] | undefined
): boolean => {
  if (!previousSnippets?.length) return false;

  const promptLower = prompt.toLowerCase();
  
  // Common patterns that indicate wanting to work with previous code
  const intentPatterns = [
    // Direct combination requests
    /combine|merge|join|together|single file/i,
    
    // References to previous code
    /previous|earlier|last|that|those|the|these/i,
    
    // File manipulation hints
    /put|place|move|add|include/i,
    
    // References to multiple files
    /both|all|files|snippets|codes?/i,
    
    // Contextual connections
    /and|with|plus|also/i
  ];

  // Check if we have multiple related files (e.g., HTML/CSS/JS)
  const hasRelatedFiles = previousSnippets.some((snippet, i) => 
    previousSnippets.some((other, j) => i !== j && areFilesRelated(snippet, other))
  );

  return (
    intentPatterns.some(pattern => pattern.test(promptLower)) ||
    hasRelatedFiles ||
    isRequestingFileModification(prompt, previousSnippets)
  );
};

// Helper to check if files are typically used together
const areFilesRelated = (snippet1: CodeSnippet, snippet2: CodeSnippet): boolean => {
  const relatedPairs = [
    ['html', 'css'],
    ['html', 'javascript'],
    ['css', 'javascript'],
    ['tsx', 'css'],
    ['jsx', 'css'],
    ['component', 'style']
  ];

  return relatedPairs.some(([a, b]) => 
    (snippet1.language.toLowerCase().includes(a) && snippet2.language.toLowerCase().includes(b)) ||
    (snippet1.language.toLowerCase().includes(b) && snippet2.language.toLowerCase().includes(a)) ||
    (snippet1.title.toLowerCase().includes(a) && snippet2.title.toLowerCase().includes(b)) ||
    (snippet1.title.toLowerCase().includes(b) && snippet2.title.toLowerCase().includes(a))
  );
};

// Helper to detect file modification requests
const isRequestingFileModification = (
  prompt: string, 
  previousSnippets: CodeSnippet[]
): boolean => {
  const promptLower = prompt.toLowerCase();
  
  return previousSnippets.some(snippet => {
    const fileType = snippet.language.toLowerCase();
    const fileTypeVariants = [
      fileType,
      `${fileType} file`,
      `${fileType} code`,
      snippet.title.toLowerCase()
    ];
    
    return fileTypeVariants.some(variant => promptLower.includes(variant));
  });
};

export const generateCodeAssistance = async (
  prompt: string,
  isScreenSharing: boolean,
  mediaStream: MediaStream | null,
  context?: CodeContext
): Promise<CodeAssistanceResponse> => {
  if (activeRequest) {
    activeRequest.abort();
  }

  activeRequest = new AbortController();
  const signal = activeRequest.signal;

  try {
    let screenContent = '';
    if (isScreenSharing && mediaStream) {
      screenContent = await captureAndAnalyzeScreen(mediaStream);
    }

    const shouldCombineCode = isCodeCombinationIntent(prompt, context?.previousSnippets);
    const hasPreviousSnippets = (context?.previousSnippets ?? []).length > 0;

    const promptContent = shouldCombineCode && hasPreviousSnippets
      ? `Based on the following code snippets and request: "${prompt}"
         
         Previous code:
         ${context?.previousSnippets.map(snippet => 
           `File: ${snippet.title} (${snippet.language})
           \`\`\`${snippet.language}
           ${snippet.code}
           \`\`\``
         ).join('\n\n')}
         
         Please provide a combined solution that:
         1. Maintains all functionality
         2. Properly organizes the code
         3. Follows best practices for file organization
         4. Includes any necessary modifications from the request`
      : `As a coding assistant, provide a detailed solution for: ${prompt}
         ${isScreenSharing ? `\nContext from screen share:\n${screenContent}` : ''}`;

    const completion = await client.chat.completions.create({
      messages: [{ 
        role: 'user', 
        content: promptContent
      }],
      model: 'qwen-2.5-coder-32b',
      temperature: 0.2, // Lower temperature for more precise coding responses
      max_tokens: 8192, // Qwen supports larger context
      top_p: 0.95,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      response_format: { type: "text" }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from GROQ');

    // Parse the markdown response into structured content
    const sections = response.split('#').filter(Boolean).map(section => {
      const [title, ...content] = section.trim().split('\n');
      return { title: title.trim(), content: content.join('\n').trim() };
    });

    // Convert to our response format
    const formattedResponse: CodeAssistanceResponse = {
      response: sections.find(s => s.title === 'Main Explanation')?.content || response,
      suggestions: sections.find(s => s.title === 'Best Practices')?.content
        .split('-')
        .filter(Boolean)
        .map(s => s.trim()) || [],
      codeSnippets: [],
      references: sections.find(s => s.title === 'Additional Resources')?.content
        .split('-')
        .filter(Boolean)
        .map(s => s.trim()) || []
    };

    // Extract code snippets
    const codePattern = /```(\w+)\n([\s\S]*?)```/g;
    let match;
    let index = 0;
    while ((match = codePattern.exec(response)) !== null) {
      formattedResponse.codeSnippets.push({
        title: index === 0 ? 'Main Implementation' : 'Alternative Implementation',
        language: match[1],
        code: match[2].trim(),
        explanation: index === 0 
          ? (sections.find(s => s.title === 'Explanation')?.content || '')
          : (sections.find(s => s.title === 'Alternative Approaches')?.content.split('```')[1]?.trim() || '')
      });
      index++;
    }

    return formattedResponse;

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