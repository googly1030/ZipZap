import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2, Brain } from 'lucide-react';
import { generateGeminiResponse } from '../../utils/geminiApi';

interface VoiceModeProps {
  onSpeechResult: (text: string) => void; 
  onResponse: (response: string) => void;   
  isActive: boolean;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface ExtendedSpeechRecognition extends SpeechRecognition {
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
}

const VoiceMode: React.FC<VoiceModeProps> = ({ isActive, onSpeechResult, onResponse }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);
  const [finalTranscript, setFinalTranscript] = useState('');

  const speakFunctionRef = useRef<((text: string) => void) | null>(null);

  const stopListening = useCallback(() => {
    // Stop recognition
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  
    // Immediately stop any ongoing speech synthesis
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsThinking(false);
    setFinalTranscript('');
  }, [recognition]);

  const startListening = useCallback(() => {
    if (recognition && isActive) {
      recognition.start();
      setIsListening(true);
    }
  }, [recognition, isActive]);

  useEffect(() => {
    if (synthesis) {
      speakFunctionRef.current = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        setIsSpeaking(true);
        synthesis.speak(utterance);
      };
    }
  }, [synthesis]);

  const handleSpeechResult = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;
    
    setFinalTranscript(transcript);
    onSpeechResult(transcript);
    setIsThinking(true);
    
    try {
      const response = await generateGeminiResponse(transcript);
      
      if (response) {
        onResponse(response);
        
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(response);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          utterance.onstart = () => {
            setIsSpeaking(true);
            if (recognition) {
              recognition.stop(); 
            }
          };

          utterance.onend = () => {
            setIsSpeaking(false);
            if (isListening && recognition) {
              setTimeout(() => {
                recognition.start(); 
              }, 100);
            }
          };

          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
      console.error('Error processing speech:', error);
      const errorMessage = "Sorry, I had trouble processing that. Could you try again?";
      onResponse(errorMessage);
    } finally {
      setIsThinking(false);
      setFinalTranscript('');
    }
  }, [onSpeechResult, onResponse, recognition, isListening]);

  // Update the initializeSpeechRecognition function
  const initializeSpeechRecognition = useCallback(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition && !recognition) {
        const recognitionInstance = new SpeechRecognition() as ExtendedSpeechRecognition;
        recognitionInstance.continuous = true; // Keep this true for continuous listening
        recognitionInstance.interimResults = true;

        let currentTranscript = ''; // Track current speech segment

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            currentTranscript = transcript;
            handleSpeechResult(currentTranscript);
            currentTranscript = ''; // Reset for next segment
            setFinalTranscript('');
          } else {
            setFinalTranscript(transcript);
          }
        };

        // Ensure recognition keeps running
        recognitionInstance.onend = () => {
          console.log('Speech recognition ended');
          if (isListening && !isSpeaking) {
            console.log('Restarting speech recognition');
            recognitionInstance.start();
          }
        };

        // Update error handler to restart recognition
        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          switch (event.error) {
            case 'no-speech':
              // Don't show error, just keep listening
              break;
            case 'audio-capture':
              setFinalTranscript('No microphone was found.');
              break;
            case 'not-allowed':
              setFinalTranscript('Microphone permission denied.');
              break;
            default:
              console.error('Speech recognition error:', event.error);
          }
          
          // Attempt to restart recognition unless explicitly stopped
          if (isListening && !isSpeaking) {
            setTimeout(() => {
              recognitionInstance.start();
            }, 1000);
          }
        };

        setRecognition(recognitionInstance);
        setSynthesis(window.speechSynthesis);
      }
    }
  }, [recognition, handleSpeechResult, isListening, isSpeaking]);

  // Initialize once on mount
  useEffect(() => {
    initializeSpeechRecognition();
  }, [initializeSpeechRecognition]);

  // Handle active state changes
  useEffect(() => {
    if (!isActive && isListening) {
      stopListening();
    }
  }, [isActive, isListening, stopListening]);

  // Add this effect to initialize voices
  useEffect(() => {
    // Load voices when component mounts
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };

    loadVoices();
    
    // Chrome requires this event listener to load voices
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      // Cleanup
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="fixed bottom-[9rem] right-[4rem] flex items-center space-x-4">
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={!isActive || isThinking}
        className={`p-4 rounded-full transition-all duration-300 ${
          !isActive || isThinking ? 'opacity-50 cursor-not-allowed' :
          isListening 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {isListening ? (
          <MicOff className="h-6 w-6 text-white" />
        ) : (
          <Mic className="h-6 w-6 text-white" />
        )}
      </button>
      {finalTranscript && (
        <div className="flex items-center space-x-2 bg-purple-600/20 px-4 py-2 rounded-full">
          <span className="text-sm text-purple-300">{finalTranscript}</span>
        </div>
      )}
      {isThinking && (
        <div className="flex items-center space-x-2 bg-blue-600/20 px-4 py-2 rounded-full">
          <Brain className="h-4 w-4 text-blue-400 animate-pulse" />
          <span className="text-sm text-blue-300">Thinking...</span>
        </div>
      )}
      {isSpeaking && (
        <div className="flex items-center space-x-2 bg-purple-600/20 px-4 py-2 rounded-full">
          <Volume2 className="h-4 w-4 text-purple-400 animate-pulse" />
          <span className="text-sm text-purple-300">Speaking...</span>
        </div>
      )}
    </div>
  );
};

export default VoiceMode;