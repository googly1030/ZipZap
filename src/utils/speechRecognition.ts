import axios from 'axios';
interface AIResponse {
  text: string;
  error?: string;
}
export class SpeechRecognitionService {
  private recognition: SpeechRecognition;
  private isListening: boolean = false;
  private finalTranscript: string = '';
  private apiKey: string;

  constructor(apiKey: string = import.meta.env.VITE_GROQ_API_KEY || '') {
    if (!('webkitSpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
    this.apiKey = apiKey;
    
    // Optimize configuration for faster response
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
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
          this.finalTranscript += transcript;
          // Get AI response when we have final transcript
          const aiResponse = await this.getAIResponse(this.finalTranscript);
          if (!aiResponse.error) {
            onResult(aiResponse.text);
          }
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Show interim results while processing
      onResult(this.finalTranscript + interimTranscript);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };
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

  stopListening() {
    if (!this.isListening) return;
    this.recognition.stop();
    this.isListening = false;
    this.finalTranscript = '';
  }
}