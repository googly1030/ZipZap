import React, { useEffect, useRef, useState, useCallback } from 'react';

interface VoiceAssistantProps {
  isActive: boolean;
  message: string;
  onComplete: () => void;
  voiceConfig?: {
    rate: number;
    pitch: number;
    voice: number;
  };
}

const defaultVoiceConfig = {
  rate: 1,
  pitch: 1,
  voice: 0
};

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  isActive,
  message,
  onComplete,
  voiceConfig = defaultVoiceConfig
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    speechSynthRef.current = window.speechSynthesis;
    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!speechSynthRef.current) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthRef.current.getVoices();
    
    // Ensure voice index exists, fallback to first available voice
    const selectedVoice = voices[voiceConfig.voice] || voices[0];
    utterance.voice = selectedVoice;
    utterance.rate = voiceConfig.rate;
    utterance.pitch = voiceConfig.pitch;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onComplete();
    };
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    speechSynthRef.current.speak(utterance);
  }, [voiceConfig, onComplete]);

  const stopSpeaking = useCallback(() => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  useEffect(() => {
    if (isActive && message && !isSpeaking) {
      speak(message);
    } else if (!isActive && isSpeaking) {
      stopSpeaking();
    }
  }, [isActive, message, isSpeaking, speak, stopSpeaking]);

  return (
    <div className={`fixed bottom-24 right-4 z-50 ${isSpeaking ? 'visible' : 'invisible'}`}>
      <div className="bg-purple-600/20 backdrop-blur-lg border border-purple-900/30 rounded-full p-3">
        <div className="flex items-center space-x-2">
          <div className="relative w-4 h-4">
            <div className="absolute inset-0 animate-ping rounded-full bg-purple-400 opacity-75"></div>
            <div className="relative rounded-full w-4 h-4 bg-purple-500"></div>
          </div>
          <span className="text-white text-sm">AI Speaking...</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;