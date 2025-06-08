import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Mic, 
  Share2, 
  MessageSquare, 
  Mail, 
  Presentation, 
  Code2, 
  Volume2, 
  MicOff,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from './LandingHeader';
import CodeAssistModeSelector, { CodeAssistMode } from './CodeAssistModeSelector/CodeAssistModeSelector';
import VoiceMode from './VoiceMode/VoiceMode';
import VoiceAssistant from './VoiceAssistant';
import ImageProcessor, { ImageProcessorMethods } from './ImageProcessor';
import ScreenDataDisplay from './ScreenShare/ScreenDataDisplay';
import { CodeBlock } from './CodeBlock';
import LoadingDots from './LoadingDots';
import SendEmailButton from './SendEmailButton';
import AlertDialog from './AlertDialog';
import ApiKeyPrompt from './ApiKeyPrompt';
import styles from './ChatInterface.module.css';
import { generateCodeAssistance } from '../api/client';
import { generateEmail } from '../services/emailService';
import { generatePresentation } from '../api/client';
import { CodeAssistanceResponse, CodeSnippet } from '../types/codeTypes';
import { EmailResponse } from '../types/emailTypes';
import { ScreenAnalysis } from '../types/screenTypes';
import { hasValidApiKeys } from '../utils/apiKeyManager';

interface UserInfo {
  name: string;
  email: string;
  company: string;
  jobRole: string;
}

interface ChatInterfaceProps {
  userInfo: UserInfo;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: 'code' | 'email' | 'presentation';
  codeSnippets?: CodeSnippet[];
  emailData?: EmailResponse;
  presentationData?: {
    title: string;
    slides: Array<{ title: string; content: string }>;
  };
}

type ActiveMode = 'code' | 'email' | 'presentation';

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userInfo }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<ActiveMode>('code');
  const [codeAssistMode, setCodeAssistMode] = useState<CodeAssistMode>('chat');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [screenAnalysis, setScreenAnalysis] = useState<ScreenAnalysis | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageProcessorRef = useRef<ImageProcessorMethods>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check API keys on mount
  useEffect(() => {
    if (!hasValidApiKeys()) {
      setShowApiKeyPrompt(true);
    }
  }, []);

  const handleRefreshScreenCapture = useCallback(async () => {
    if (imageProcessorRef.current) {
      try {
        await imageProcessorRef.current.processFrameManually();
      } catch (error) {
        console.error('Failed to refresh screen capture:', error);
      }
    }
  }, []);

  const handleScreenAnalysis = useCallback((analysis: ScreenAnalysis) => {
    setScreenAnalysis(analysis);
  }, []);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: false
      });
      
      setMediaStream(stream);
      setIsScreenSharing(true);
      setCodeAssistMode('screen');
      
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsScreenSharing(false);
    setScreenAnalysis(null);
    setCodeAssistMode('chat');
  };

  const startVoiceMode = () => {
    setIsVoiceMode(true);
    setCodeAssistMode('voice');
  };

  const stopVoiceMode = () => {
    setIsVoiceMode(false);
    setIsListening(false);
    setCodeAssistMode('chat');
  };

  const handleVoiceModeToggle = () => {
    if (isVoiceMode) {
      setShowStopDialog(true);
    } else {
      startVoiceMode();
    }
  };

  const confirmStopVoiceMode = () => {
    stopVoiceMode();
    setShowStopDialog(false);
  };

  const handleSpeechResult = (transcript: string) => {
    if (transcript.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: transcript,
        timestamp: new Date(),
        mode: activeMode
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const handleVoiceResponse = (response: string) => {
    const assistantMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: response,
      timestamp: new Date(),
      mode: activeMode
    };
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleModeSelect = (mode: CodeAssistMode) => {
    setCodeAssistMode(mode);
    if (mode === 'screen') {
      startScreenShare();
    } else if (mode === 'voice') {
      startVoiceMode();
    } else {
      if (isScreenSharing) stopScreenShare();
      if (isVoiceMode) stopVoiceMode();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Check API keys before processing
    if (!hasValidApiKeys()) {
      setShowApiKeyPrompt(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      mode: activeMode
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      let assistantMessage: Message;

      if (activeMode === 'code') {
        const previousSnippets = messages
          .filter(msg => msg.type === 'assistant' && msg.codeSnippets)
          .flatMap(msg => msg.codeSnippets || []);

        const response = await generateCodeAssistance(
          inputValue,
          isScreenSharing,
          mediaStream,
          { previousSnippets }
        );

        assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.response,
          timestamp: new Date(),
          mode: 'code',
          codeSnippets: response.codeSnippets
        };
      } else if (activeMode === 'email') {
        const emailResponse = await generateEmail(inputValue, {
          sender: {
            name: userInfo.name,
            email: userInfo.email,
            company: userInfo.company,
            role: userInfo.jobRole
          }
        });

        assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `I've generated an email for you:`,
          timestamp: new Date(),
          mode: 'email',
          emailData: emailResponse
        };
      } else {
        const presentationResponse = await generatePresentation(
          inputValue,
          'companies',
          'presentation'
        );

        assistantMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `I've created a presentation for you:`,
          timestamp: new Date(),
          mode: 'presentation',
          presentationData: presentationResponse
        };
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error generating response:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      if (error.message.includes('API key not configured')) {
        setShowApiKeyPrompt(true);
        errorMessage = 'Please configure your API keys to use this feature.';
      }

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
        mode: activeMode
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-[#2A2B2D] text-white border border-[#ffffff0f]'
          }`}
        >
          <div className="text-sm">{message.content}</div>
          
          {message.codeSnippets && message.codeSnippets.length > 0 && (
            <div className="mt-4 space-y-3">
              {message.codeSnippets.map((snippet, index) => (
                <div key={index} className="space-y-2">
                  <div className="text-xs text-gray-400 font-medium">
                    {snippet.title}
                  </div>
                  <CodeBlock code={snippet.code} language={snippet.language} />
                  {snippet.explanation && (
                    <div className="text-xs text-gray-300 mt-2 p-3 bg-[#ffffff0a] rounded-lg">
                      {snippet.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {message.emailData && (
            <div className="mt-4 space-y-3">
              <div className="bg-[#ffffff0a] rounded-lg p-4 border border-[#ffffff1a]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-purple-300">
                    Subject: {message.emailData.subject}
                  </div>
                  <SendEmailButton
                    emailContent={message.emailData.content}
                    subject={message.emailData.subject}
                    senderEmail={userInfo.email}
                  />
                </div>
                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                  {message.emailData.content}
                </div>
              </div>
            </div>
          )}

          {message.presentationData && (
            <div className="mt-4 space-y-3">
              <div className="bg-[#ffffff0a] rounded-lg p-4 border border-[#ffffff1a]">
                <h3 className="text-lg font-semibold text-purple-300 mb-4">
                  {message.presentationData.title}
                </h3>
                <div className="space-y-4">
                  {message.presentationData.slides.map((slide, index) => (
                    <div key={index} className="bg-[#ffffff0a] rounded-lg p-4 border border-[#ffffff1a]">
                      <h4 className="font-medium text-white mb-2">
                        Slide {index + 1}: {slide.title}
                      </h4>
                      <div className="text-sm text-gray-300 whitespace-pre-wrap">
                        {slide.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-400 mt-2">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header isFormCompleted={true} />
      <div className="flex flex-col h-screen bg-[#0a0a0f]">
        <main className="flex-1 p-2 md:p-3 lg:p-4 overflow-hidden mt-20">
          <div className="flex flex-col lg:flex-row gap-3 h-[calc(100vh-7rem)] max-w-[1800px] mx-auto w-full">
            
            {/* Sidebar */}
            <div className="w-full md:w-[280px] backdrop-blur-2xl bg-black/20 border-r border-purple-900/30 flex flex-col shrink-0 z-10">
              <div className="p-6 border-b border-purple-900/30">
                <h1 className="text-2xl font-bold text-white mb-2">Budy-X</h1>
                <p className="text-gray-400 text-sm">Smarter Than Your Ex 💀</p>
              </div>

              <div className="p-4 border-b border-purple-900/30">
                <h2 className="text-white text-sm font-medium mb-3 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  FEATURES
                </h2>
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveMode('code')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all ${
                      activeMode === 'code'
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-gray-300 hover:bg-purple-600/10 hover:text-white'
                    }`}
                  >
                    <Code2 className="h-4 w-4" />
                    <span className="text-sm">Code Assistant</span>
                  </button>
                  <button
                    onClick={() => setActiveMode('email')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all ${
                      activeMode === 'email'
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-gray-300 hover:bg-purple-600/10 hover:text-white'
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Generate Email</span>
                  </button>
                  <button
                    onClick={() => setActiveMode('presentation')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all ${
                      activeMode === 'presentation'
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-gray-300 hover:bg-purple-600/10 hover:text-white'
                    }`}
                  >
                    <Presentation className="h-4 w-4" />
                    <span className="text-sm">Create Presentation</span>
                  </button>
                </div>
              </div>

              {/* Settings Button at Bottom */}
              <div className="mt-auto p-4 border-t border-purple-900/30">
                <button
                  onClick={() => navigate('/settings')}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all text-gray-300 hover:bg-purple-600/10 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                  <span className="text-sm">Settings</span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 backdrop-blur-lg bg-gradient-to-b from-black/40 to-[#0a0a0f]/90 rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-0 border border-purple-900/30 relative">
              
              {/* Screen Share Panel */}
              {isScreenSharing && screenAnalysis && (
                <div className="w-full md:w-80 bg-[#1a1a1f] border-r border-purple-900/30 flex flex-col">
                  <ScreenDataDisplay 
                    data={screenAnalysis} 
                    isLive={isScreenSharing}
                    onRefresh={handleRefreshScreenCapture}
                  />
                </div>
              )}

              {/* Chat Area */}
              <div className="flex-1 flex flex-col min-h-0">
                {messages.length === 0 && activeMode === 'code' ? (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <CodeAssistModeSelector
                      currentMode={codeAssistMode}
                      onModeSelect={handleModeSelect}
                      startScreenShare={startScreenShare}
                      startVoiceMode={startVoiceMode}
                    />
                  </div>
                ) : (
                  <>
                    <div className={`flex-1 overflow-y-auto p-4 ${styles.chatScroll}`}>
                      {messages.map(renderMessage)}
                      {isLoading && (
                        <div className="flex justify-start mb-4">
                          <div className="bg-[#2A2B2D] rounded-2xl px-4 py-3 border border-[#ffffff0f]">
                            <LoadingDots />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="border-t border-purple-900/30 p-4">
                      <form onSubmit={handleSubmit} className="flex gap-3">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder={
                            activeMode === 'code' 
                              ? "Ask about your code or request assistance..."
                              : activeMode === 'email'
                              ? "Describe the email you want to generate..."
                              : "Describe the presentation you want to create..."
                          }
                          className="flex-1 bg-[#2A2B2D] border border-[#ffffff0f] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40"
                          disabled={isLoading}
                        />
                        <button
                          type="submit"
                          disabled={isLoading || !inputValue.trim()}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Voice Mode Controls */}
        {isVoiceMode && (
          <div className="fixed bottom-4 right-4 flex items-center space-x-4 z-50">
            <VoiceMode
              isActive={isVoiceMode}
              onSpeechResult={handleSpeechResult}
              onResponse={handleVoiceResponse}
            />
            <button
              onClick={handleVoiceModeToggle}
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
            >
              <MicOff className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Voice Assistant */}
        <VoiceAssistant
          isActive={isSpeaking}
          message=""
          onComplete={() => setIsSpeaking(false)}
        />

        {/* Image Processor */}
        <ImageProcessor
          ref={imageProcessorRef}
          mediaStream={mediaStream}
          onAnalysisComplete={handleScreenAnalysis}
        />

        {/* API Key Prompt */}
        {showApiKeyPrompt && (
          <ApiKeyPrompt onClose={() => setShowApiKeyPrompt(false)} />
        )}

        {/* Stop Voice Mode Dialog */}
        <AlertDialog
          open={showStopDialog}
          title="Stop Voice Mode"
          message="Are you sure you want to stop voice mode?"
          onConfirm={confirmStopVoiceMode}
          onCancel={() => setShowStopDialog(false)}
        />
      </div>
    </>
  );
};

export default ChatInterface;