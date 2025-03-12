export class SpeechRecognitionService {
  private recognition: SpeechRecognition;
  private isListening: boolean = false;
  private finalTranscript: string = '';

  constructor() {
    if (!('webkitSpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
    
    // Optimize configuration for faster response
    this.recognition.continuous = false; // Changed to false for single utterance
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
  }

  startListening(onResult: (text: string) => void, onEnd: () => void) {
    if (this.isListening) return;

    this.isListening = true;
    this.finalTranscript = '';
    this.recognition.start();

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.finalTranscript = transcript; 
          onResult(this.finalTranscript);
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

    // Updated error handling with correct type
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