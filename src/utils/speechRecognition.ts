import axios from 'axios';

interface AIResponse {
  text: string;
  error?: string;
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognition;
  private isListening: boolean = false;
  private finalTranscript: string = '';
  private apiKey: string = process.env.REACT_APP_GROQ_API_KEY || '';

  constructor() {
    if (!('webkitSpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
    
    // Configure for Whisper optimization
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
  }

  private async getAIResponse(query: string): Promise<AIResponse> {
    try {
      const response = await axios.post(
        'https://api.groq.com/v1/chat/completions',
        {
          model: 'whisper-large-v3',
          messages: [{ role: 'user', content: query }],
          max_tokens: 150,
          temperature: 0.7,
          top_p: 1,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        text: response.data.choices[0].message.content
      };
    } catch (error) {
      console.error('GROQ API Error:', error);
      return {
        text: '',
        error: 'Failed to get AI response'
      };
    }
  }

  async startListening(onResult: (text: string) => void, onEnd: () => void) {
    if (this.isListening) return;

    this.isListening = true;
    this.finalTranscript = '';
    this.recognition.start();

    this.recognition.onresult = async (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.finalTranscript = transcript;
          
          // Process through Whisper model
          const aiResponse = await this.getAIResponse(transcript);
          if (!aiResponse.error) {
            onResult(aiResponse.text);
          } else {
            onResult(transcript); // Fallback to original transcript
          }
          
          this.recognition.stop();
        } else {
          interimTranscript = transcript;
          onResult(interimTranscript);
        }
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    this.recognition.addEventListener('error', ((event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      this.isListening = false;
      onEnd();
    }) as EventListener);
  }

  stopListening() {
    if (!this.isListening) return;
    this.recognition.stop();
    this.isListening = false;
    this.finalTranscript = '';
  }
}