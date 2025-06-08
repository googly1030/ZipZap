import React from 'react';
import { Key, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ApiKeyPromptProps {
  onClose?: () => void;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const handleSetupKeys = () => {
    navigate('/settings');
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-lg bg-gradient-to-b from-white/10 to-white/5 rounded-2xl p-8 border border-purple-900/30 max-w-md w-full">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-yellow-500/20">
              <AlertTriangle className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">API Keys Required</h2>
          <p className="text-gray-300 mb-6">
            To use Budy-X features, you need to configure your API keys. This only takes a minute and your keys are stored securely in your browser.
          </p>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3 text-left">
              <Key className="h-5 w-5 text-purple-400 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">GROQ API Key</p>
                <p className="text-gray-400 text-sm">For code assistance and email generation</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 text-left">
              <Key className="h-5 w-5 text-purple-400 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Gemini API Key</p>
                <p className="text-gray-400 text-sm">For voice mode responses</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-purple-900/30 text-white hover:bg-white/10 transition-all"
              >
                Later
              </button>
            )}
            <button
              onClick={handleSetupKeys}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all"
            >
              Setup API Keys
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;