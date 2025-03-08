import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  Mail,
  FileText,
  Users,
  Briefcase,
  GraduationCap,
  Building2,
} from "lucide-react";
import styles from './ChatInterface.module.css';

interface ChatInterfaceProps {
  userInfo: {
    name: string;
    email: string;
    company: string;
    jobRole: string;
  };
}

import { generateEmail , generatePresentation } from "../api/client";

interface Message {
  type: 'user' | 'bot';
  content: string;
  id?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userInfo }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      content: `Hello ${userInfo.name}, I'm here to help you create professional presentations and emails tailored to your needs.`,
      id: 'initial-message'
    },
  ]);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isModifying, setIsModifying] = useState(false);

  const features = [
    { id: "email", icon: Mail, label: "Generate Email" },
    { id: "presentation", icon: FileText, label: "Create Presentation" },
  ];

  const audiences = [
    { id: "students", icon: GraduationCap, label: "Students" },
    { id: "clients", icon: Users, label: "Clients" },
    { id: "companies", icon: Building2, label: "Companies" },
    { id: "investors", icon: Briefcase, label: "Investors" },
  ];

  const handleFeatureSelect = (featureId: string) => {
    setSelectedFeature(featureId);
    setSelectedAudience(null);
    
    setMessages([{
      type: "bot",
      content: `Hello ${userInfo.name}, I'm here to help you ${
        featureId === 'email' ? 'write professional emails' : 'create engaging presentations'
      }. ${featureId === 'presentation' ? 'Please select your target audience to begin.' : ''}`,
      id: `welcome-${Date.now()}`
    }]);
    setSelectedMessage(null);
    setIsModifying(false);
    setInputValue('');
  };

  const handleAudienceSelect = (audienceId: string) => {
    setSelectedAudience(audienceId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const timestamp = Date.now();
    const userMessage = { 
      type: 'user' as const, 
      content: inputValue,
      id: `user-${timestamp}` 
    };
    setMessages(prev => [...prev, userMessage]);

    if (!selectedFeature) {
      setMessages(prev => [...prev, { 
        type: 'bot',
        content: 'Please select a feature (Email or Presentation) from the sidebar first.',
        id: `bot-${timestamp + 1}`
      }]);
      setInputValue('');
      return;
    }
    
    if (selectedFeature === 'email') {
      try {
        const emailMetadata = {
          sender: {
            name: userInfo.name,
            role: userInfo.jobRole,
            company: userInfo.company,
            email: userInfo.email
          }
        };
        
        const result = await generateEmail(
          inputValue,
          'professional',
          emailMetadata
        );
        
        if (result) {
          const formattedEmail = `From: ${userInfo.name}
Role: ${userInfo.jobRole}
Company: ${userInfo.company}
Email: ${userInfo.email}

Subject: ${result.subject}

${result.content}`;

          setMessages(prev => [...prev, { 
            type: 'bot',
            content: formattedEmail,
            id: `email-${Date.now()}`
          }]);
        }
      } catch (error) {
        console.error('API Error:', error);
        setMessages(prev => [...prev, { 
          type: 'bot',
          content: 'Sorry, there was an error generating your content.',
          id: `error-${Date.now()}`
        }]);
      }
    } else if (selectedFeature === 'presentation') {
      if (!selectedAudience) {
        setMessages(prev => [...prev, { 
          type: 'bot',
          content: 'Please select a target audience for your presentation.',
          id: Date.now().toString()
        }]);
        setInputValue('');
        return;
      }

      try {
        const result = await generatePresentation(
          inputValue,
          selectedAudience,
          'presentation'
        );

        if (result) {
          const formattedPresentation = `Title: ${result.title}\n\n${
            result.slides.map((slide, index) => 
              `Slide ${index + 1}: ${slide.title}\n${slide.content}`
            ).join('\n\n')
          }`;

          setMessages(prev => [...prev, { 
            type: 'bot',
            content: formattedPresentation,
            id: `presentation-${Date.now()}`
          }]);
        }
      } catch (error) {
        console.error('API Error:', error);
        setMessages(prev => [...prev, { 
          type: 'bot',
          content: 'Sorry, there was an error generating your presentation.',
          id: `error-${Date.now()}`
        }]);
      }
    }
    
    setInputValue('');
  };

  const handleModifyEmail = async (modificationPrompt: string) => {
    if (!selectedMessage || !selectedMessage.content) return;

    const timestamp = Date.now();
    const userModRequest = {
      type: 'user' as const,
      content: `Modification request: ${modificationPrompt}`,
      id: `mod-request-${timestamp}`
    };
    setMessages(prev => [...prev, userModRequest]);

    try {
      const result = await generateEmail(
        '',
        'professional',
        {
          sender: {
            name: userInfo.name,
            role: userInfo.jobRole,
            company: userInfo.company,
            email: userInfo.email
          }
        },
        {
          originalContent: selectedMessage.content,
          modificationRequest: modificationPrompt
        }
      );

      if (result) {
        const formattedEmail = `From: ${userInfo.name}
Role: ${userInfo.jobRole}
Company: ${userInfo.company}
Email: ${userInfo.email}

Subject: ${result.subject}

${result.content}`;

        setMessages(prev => [...prev, { 
          type: 'bot',
          content: formattedEmail,
          id: `mod-result-${Date.now()}`
        }]);
      }
    } catch (error) {
      console.error('Modification error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot',
        content: 'Sorry, there was an error modifying the email.',
        id: `mod-error-${Date.now()}`
      }]);
    }
    
    setIsModifying(false);
    setSelectedMessage(null);
    setInputValue('');
  };

  const isEmailContent = (content: string) => {
    return content.includes('From:') && content.includes('Subject:');
  };

  const isPresentationContent = (content: string) => {
    return content.includes('Title:') && content.includes('Slide');
  };

  const handleModifyPresentation = async (modificationPrompt: string) => {
    if (!selectedMessage || !selectedMessage.content) return;

    const timestamp = Date.now();
    const userModRequest = {
      type: 'user' as const,
      content: `Modification request: ${modificationPrompt}`,
      id: `mod-request-${timestamp}`
    };
    setMessages(prev => [...prev, userModRequest]);

    try {
      const result = await generatePresentation(
        modificationPrompt,
        selectedAudience || 'general',
        'presentation',
        {
          originalContent: selectedMessage.content,
          modificationRequest: modificationPrompt
        }
      );

      if (result) {
        const formattedPresentation = `Title: ${result.title}\n\n${
          result.slides.map((slide, index) => 
            `Slide ${index + 1}: ${slide.title}\n${slide.content}`
          ).join('\n\n')
        }`;

        setMessages(prev => [...prev, { 
          type: 'bot',
          content: formattedPresentation,
          id: `mod-presentation-${Date.now()}`
        }]);
      }
    } catch (error) {
      console.error('Modification error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot',
        content: 'Sorry, there was an error modifying the presentation.',
        id: `mod-error-${Date.now()}`
      }]);
    }
    
    setIsModifying(false);
    setSelectedMessage(null);
    setInputValue('');
  };

  return (
    <div className="min-h-[600px] glass-card overflow-hidden flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-72 glass-sidebar flex flex-col min-h-[600px] relative">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">PresentAI</h1>
            <p className="text-[#ffffff99] text-sm">
              Your AI presentation assistant
            </p>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-[#ffffff99] font-medium mb-3 flex items-center text-sm uppercase tracking-wider">
                <MessageSquare className="h-4 w-4 mr-2" />
                Features
              </h2>
              <div className="space-y-1">
                {features.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => handleFeatureSelect(feature.id)}
                    data-active={selectedFeature === feature.id}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                             text-[#ffffff99] hover:bg-[#3C4043] hover:text-white
                             data-[active=true]:bg-[#3C4043] data-[active=true]:text-white"
                  >
                    <feature.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">{feature.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedFeature === "presentation" && (
              <div>
                <h2 className="text-[#ffffff99] font-medium mb-3 flex items-center text-sm uppercase tracking-wider">
                  <Users className="h-4 w-4 mr-2" />
                  Target Audience
                </h2>
                <div className="space-y-1">
                  {audiences.map((audience) => (
                    <button
                      key={audience.id}
                      onClick={() => handleAudienceSelect(audience.id)}
                      data-active={selectedAudience === audience.id}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                               text-[#ffffff99] hover:bg-[#3C4043] hover:text-white
                               data-[active=true]:bg-[#3C4043] data-[active=true]:text-white"
                    >
                      <audience.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{audience.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto border-t border-[#ffffff0f] bg-[#202124]/80 p-6">
          <div className="text-[#ffffff99] text-sm">
            <p className="mb-2 text-xs uppercase tracking-wider text-[#ffffff66]">
              Account
            </p>
            <p className="font-medium text-white">{userInfo.name}</p>
            <p className="text-xs text-[#ffffff99]">{userInfo.jobRole}</p>
            <p className="text-xs text-[#ffffff99]">{userInfo.company}</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#202124]">
        <div className={`p-6 overflow-y-scroll h-[29.7rem] space-y-4 ${styles.chatScroll}`}>
          {messages.map((message) => (
            <div key={message.id} className="flex flex-col">
              <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                  message.type === "user" ? "bg-[#8AB4F8] text-[#202124]" : "glass-panel text-white"
                }`}>
                  <pre className="whitespace-pre-line">{message.content}</pre>
                </div>
              </div>
              {message.type === 'bot' && (
                <div className="flex justify-start mt-2">
                  {isEmailContent(message.content) && (
                    <button
                      onClick={() => {
                        setSelectedMessage(message);
                        setIsModifying(true);
                        setSelectedFeature('email');
                      }}
                      className="text-sm text-[#8AB4F8] hover:text-white transition-colors"
                    >
                      Modify Email
                    </button>
                  )}
                  {isPresentationContent(message.content) && (
                    <button
                      onClick={() => {
                        setSelectedMessage(message);
                        setIsModifying(true);
                        setSelectedFeature('presentation');
                      }}
                      className="text-sm text-[#8AB4F8] hover:text-white transition-colors ml-2"
                    >
                      Modify Presentation
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#ffffff0f] bg-[#202124]">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (isModifying) {
              if (selectedFeature === 'email') {
                handleModifyEmail(inputValue);
              } else if (selectedFeature === 'presentation') {
                handleModifyPresentation(inputValue);
              }
            } else {
              handleSubmit(e);
            }
          }} className="max-w-4xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isModifying ? "Enter modification instructions..." : "Message PresentAI..."}
                className="w-full bg-[#2A2B2D] text-white placeholder-[#ffffff4d] rounded-full px-6 py-3 pr-12
                         focus:outline-none focus:ring-2 focus:ring-[#8AB4F8]/20"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#ffffff99] 
                         hover:text-[#8AB4F8] p-2 rounded-full transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
