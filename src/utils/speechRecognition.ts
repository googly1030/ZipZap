export class SpeechRecognitionService {
  private recognition: SpeechRecognition;
  private isListening: boolean = false;

  constructor() {
    // Check browser support
    if (!('webkitSpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
  }

  startListening(onResult: (text: string) => void, onEnd: () => void) {
    if (this.isListening) return;

    this.isListening = true;
    this.recognition.start();

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      onResult(transcript);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };
  }

  stopListening() {
    if (!this.isListening) return;
    this.recognition.stop();
    this.isListening = false;
  }
}