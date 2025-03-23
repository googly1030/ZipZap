import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown } from 'lucide-react';
import { sendToEmailClient } from '../utils/emailUtils';

interface SendEmailButtonProps {
  emailContent: string;
  subject: string;
  senderEmail: string;
  disabled?: boolean;
}

const SendEmailButton: React.FC<SendEmailButtonProps> = ({
  emailContent,
  subject,
  senderEmail,
  disabled = false
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = (provider: 'gmail' | 'outlook' | 'yahoo') => {
    sendToEmailClient({
      subject,
      body: emailContent,
      from: senderEmail,
      provider
    });
    setShowDropdown(false);
  };

  return (
    <div className="relative ml-auto" ref={dropdownRef}>
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleSend('gmail')}
          disabled={disabled}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                   transition-all duration-300 backdrop-blur-md
                   border border-purple-500/20
                   ${disabled 
                     ? 'bg-gray-600/20 cursor-not-allowed text-gray-400' 
                     : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 hover:text-white'}`}
        >
          <Send className="h-3.5 w-3.5" />
          <span>Send</span>
        </button>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled}
          className={`p-1.5 rounded-lg transition-all duration-300 backdrop-blur-md
                   border border-purple-500/20
                   ${disabled 
                     ? 'bg-gray-600/20 cursor-not-allowed text-gray-400' 
                     : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 hover:text-white'}`}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg overflow-hidden 
                      backdrop-blur-xl bg-black/40 border border-purple-500/20 
                      shadow-lg shadow-purple-900/20 z-50">
          <div className="py-1">
            {['gmail', 'outlook', 'yahoo'].map((provider) => (
              <button
                key={provider}
                onClick={() => handleSend(provider as 'gmail' | 'outlook' | 'yahoo')}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm 
                         text-purple-200 hover:text-white hover:bg-purple-600/20 
                         transition-colors capitalize"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send with {provider}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SendEmailButton;