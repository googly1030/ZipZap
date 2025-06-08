import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Mic, 
  Share2, 
  MessageSquare, 
  Mail, 
  Presentation, 
  Code2, 
  Settings,
  User,
  LogOut,
  Brain,
  Zap,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from './LandingHeader';
import CodeAssistModeSelector, { CodeAssistMode } from './CodeAssistModeSelector/CodeAssistModeSelector';
import VoiceMode from './VoiceMode/VoiceMode';
import ImageProcessor, { ImageProcessorMethods } from './ImageProcessor';
import ScreenDataDisplay from './ScreenShare/ScreenDataDisplay';
import { CodeBlock } from './CodeBlock';
import LoadingDots from './LoadingDots';
import SendEmailButton from './SendEmailButton';
import VoiceAssistant from './VoiceAssistant';
import AlertDialog from './AlertDialog';
import ApiConfigPage from './ApiConfigPage';
import { generateCodeAssistance } from '../api/client';
import { generateEmail } from '../services/emailService';
import { generatePresentation } from '../api/client';
import { ScreenAnalysis } from '../types/screenTypes';
import { CodeAssistanceResponse, CodeSnippet } from '../types/codeTypes';
import { EmailResponse } from '../types/emailTypes';
import { getApiKeys, hasValidApiKeys } from '../utils/apiKeyManager';
import styles from './ChatInterface.module.css';

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
  emailData?: EmailResponse;
  presentationData?: {
    title: string;
    slides: Array<{ title: string; content: string }>;
  };
  codeData?: CodeAssistanceResponse;
}

type ActiveMode = 'code' | 'email' | 'presentation' | 'api-config';

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userInfo }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<ActiveMode>('code');
  const [codeAssistMode, setCodeAssistMode] = useState<CodeAssistMode>('chat');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [screenData, setScreenData] = useState<ScreenAnalysis | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [previousCodeSnippets, setPreviousCodeSnippets] = useState<CodeSnippet[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageProcessorRef = useRef<ImageProcessorMethods>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScreenDataRefresh = useCallback(async () => {
    if (imageProcessorRef.current) {
      await imageProcessorRef.current.processFrameManually();
    }
  }, []);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: false
      });
      
      setMediaStream(stream);
      setIsScreenSharing(true);
      
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        setMediaStream(null);
        setScreenData(null);
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
      setIsScreenSharing(false);
      setScreenData(null);
    }
  };

  const handleScreenAnalysis = (analysis: ScreenAnalysis) => {
    setScreenData(analysis);
  };

  const startVoiceMode = () => {
    setIsVoiceMode(true);
    setCodeAssistMode('voice');
  };

  const stopVoiceMode = () => {
    setIsVoiceMode(false);
    setCodeAssistMode('chat');
  };

  const handleVoiceSpeechResult = (text: string) => {
    if (text.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: text,
        timestamp: new Date(),
        mode: activeMode
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const handleVoiceResponse = (response: string) => {
    setVoiceResponse(response);
    setIsVoiceActive(true);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: response,
      timestamp: new Date(),
      mode: activeMode
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleVoiceComplete = () => {
    setIsVoiceActive(false);
    setVoiceResponse('');
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    sessionStorage.clear();
    navigate('/get-started', { replace: true });
    window.location.reload();
  };

  const addMessage = (content: string, type: 'user' | 'assistant', mode: ActiveMode, additionalData?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      mode,
      ...additionalData
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Check if API keys are configured
    if (!hasValidApiKeys()) {
      addMessage(
        'Please configure your API keys in the API Configuration section to use Budy-X features.',
        'assistant',
        activeMode
      );
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message
    addMessage(userMessage, 'user', activeMode);

    try {
      if (activeMode === 'code') {
        const response = await generateCodeAssistance(
          userMessage,
          isScreenSharing,
          mediaStream,
          { previousSnippets: previousCodeSnippets }
        );

        if (response.codeSnippets.length > 0) {
          setPreviousCodeSnippets(prev => [...prev, ...response.codeSnippets]);
        }

        addMessage(response.response, 'assistant', 'code', { codeData: response });
      } else if (activeMode === 'email') {
        const emailResponse = await generateEmail(userMessage, {
          sender: {
            name: userInfo.name,
            role: userInfo.jobRole,
            company: userInfo.company,
            email: userInfo.email
          }
        });

        addMessage(
          `Email generated successfully!\n\n**Subject:** ${emailResponse.subject}\n\n**Content:**\n${emailResponse.content}`,
          'assistant',
          'email',
          { emailData: emailResponse }
        );
      } else if (activeMode === 'presentation') {
        const [topic, audience = 'general', documentType = 'presentation'] = userMessage.split('|').map(s => s.trim());
        
        const presentationResponse = await generatePresentation(topic, audience, documentType);

        const presentationContent = `# ${presentationResponse.title}\n\n${presentationResponse.slides.map((slide, index) => 
          `## Slide ${index + 1}: ${slide.title}\n${slide.content}`
        ).join('\n\n')}`;

        addMessage(
          presentationContent,
          'assistant',
          'presentation',
          { presentationData: presentationResponse }
        );
      }
    } catch (error: any) {
      console.error('Error:', error);
      addMessage(
        error.message || 'Sorry, I encountered an error. Please try again.',
        'assistant',
        activeMode
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user';
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
          <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isUser ? 'bg-purple-600' : 'bg-gray-700'
            }`}>
              {isUser ? (
                <User className="h-4 w-4 text-white" />
              ) : (
                <Brain className="h-4 w-4 text-white" />
              )}
            </div>
            
            <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-4 rounded-2xl max-w-full ${
                isUser 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-800 text-gray-100'
              }`}>
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                
                {/* Render code snippets */}
                {message.codeData?.codeSnippets && message.codeData.codeSnippets.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {message.codeData.codeSnippets.map((snippet, index) => (
                      <div key={index} className="border border-gray-600 rounded-lg overflow-hidden">
                        <div className="bg-gray-700 px-4 py-2 text-sm font-medium">
                          {snippet.title} ({snippet.language})
                        </div>
                        <CodeBlock code={snippet.code} language={snippet.language} />
                        {snippet.explanation && (
                          <div className="bg-gray-750 px-4 py-3 text-sm text-gray-300 border-t border-gray-600">
                            {snippet.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Render email data */}
                {message.emailData && (
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm opacity-75">Email ready to send</span>
                    <SendEmailButton
                      emailContent={message.emailData.content}
                      subject={message.emailData.subject}
                      senderEmail={userInfo.email}
                    />
                  </div>
                )}
              </div>
              
              <div className={`text-xs text-gray-500 mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderModeContent = () => {
    if (activeMode === 'api-config') {
      return <ApiConfigPage />;
    }

    return (
      <div className="flex-1 flex">
        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col ${isScreenSharing ? 'mr-80' : ''}`}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && activeMode === 'code' && (
              <div className="flex-1 flex items-center justify-center">
                <CodeAssistModeSelector
                  currentMode={codeAssistMode}
                  onModeSelect={setCodeAssistMode}
                  startScreenShare={startScreenShare}
                  startVoiceMode={startVoiceMode}
                />
              </div>
            )}

            {messages.length === 0 && activeMode === 'email' && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <Mail className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-white mb-4">Email Assistant</h2>
                  <p className="text-gray-400 mb-6">
                    Describe the email you want to create and I'll help you craft the perfect message.
                  </p>
                  <div className="text-sm text-gray-500">
                    Example: "Write a follow-up email to a client about project status"
                  </div>
                </div>
              </div>
            )}

            {messages.length === 0 && activeMode === 'presentation' && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <Presentation className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-white mb-4">Presentation Generator</h2>
                  <p className="text-gray-400 mb-6">
                    Tell me your topic and audience, and I'll create a compelling presentation for you.
                  </p>
                  <div className="text-sm text-gray-500">
                    Example: "AI in Healthcare | doctors | presentation"
                  </div>
                </div>
              </div>
            )}

            {messages.map(renderMessage)}
            
            {isLoading && (
              <div className="flex justify-start mb-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-800 text-gray-100 p-4 rounded-2xl">
                    <LoadingDots />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {activeMode !== 'api-config' && (
            <div className="border-t border-gray-700 p-4">
              <form onSubmit={handleSubmit} className="flex space-x-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    activeMode === 'code' ? "Ask me about code, debugging, or share your screen..." :
                    activeMode === 'email' ? "Describe the email you want to create..." :
                    "Describe your presentation topic and audience..."
                  }
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Screen Share Panel */}
        {isScreenSharing && screenData && (
          <div className="w-80 border-l border-gray-700 bg-gray-900 overflow-y-auto">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">Screen Share</h3>
                <button
                  onClick={stopScreenShare}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Stop
                </button>
              </div>
            </div>
            <ScreenDataDisplay 
              data={screenData} 
              isLive={isScreenSharing}
              onRefresh={handleScreenDataRefresh}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Header isFormCompleted={true} />
      <div className="flex h-screen bg-gray-900 pt-16">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* User Info */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{userInfo.name}</p>
                <p className="text-gray-400 text-sm truncate">{userInfo.company}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveMode('code')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeMode === 'code' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Code2 className="h-5 w-5" />
                <span>Code Assistant</span>
              </button>
              
              <button
                onClick={() => setActiveMode('email')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeMode === 'email' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Mail className="h-5 w-5" />
                <span>Email Generator</span>
              </button>
              
              <button
                onClick={() => setActiveMode('presentation')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeMode === 'presentation' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Presentation className="h-5 w-5" />
                <span>Presentations</span>
              </button>

              <button
                onClick={() => setActiveMode('api-config')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeMode === 'api-config' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>API Configuration</span>
              </button>
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => setShowLogoutDialog(true)}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {renderModeContent()}
        </div>

        {/* Voice Mode Components */}
        {isVoiceMode && (
          <VoiceMode
            isActive={isVoiceMode}
            onSpeechResult={handleVoiceSpeechResult}
            onResponse={handleVoiceResponse}
          />
        )}

        <VoiceAssistant
          isActive={isVoiceActive}
          message={voiceResponse}
          onComplete={handleVoiceComplete}
        />

        {/* Screen Capture Processor */}
        <ImageProcessor
          ref={imageProcessorRef}
          mediaStream={mediaStream}
          onAnalysisComplete={handleScreenAnalysis}
        />

        {/* Logout Confirmation Dialog */}
        <AlertDialog
          open={showLogoutDialog}
          title="Sign Out"
          message="Are you sure you want to sign out? You'll need to enter your information again to continue using Budy-X."
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutDialog(false)}
        />
      </div>
    </>
  );
};

export default ChatInterface;