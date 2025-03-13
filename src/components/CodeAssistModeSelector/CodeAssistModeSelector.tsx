import React from 'react';
import { Share2, MessageSquare, Mic } from 'lucide-react';

export type CodeAssistMode = 'screen' | 'chat' | 'voice';

interface CodeAssistModeSelectorProps {
  currentMode: CodeAssistMode;
  onModeSelect: (mode: CodeAssistMode) => void;
  startScreenShare?: () => void;
  startVoiceMode?: () => void;
}

const CodeAssistModeSelector: React.FC<CodeAssistModeSelectorProps> = ({
  currentMode,
  onModeSelect,
  startScreenShare,
  startVoiceMode
}) => {
  const modes = [
    {
      id: 'voice' as CodeAssistMode,
      icon: Mic,
      label: 'Talk to BudX',
      description: 'Have a natural conversation with BudX using voice commands'
    },
    {
      id: 'chat' as CodeAssistMode,
      icon: MessageSquare,
      label: 'Show BudX',
      description: 'Type your questions and get instant code assistance'
    },
    {
      id: 'screen' as CodeAssistMode,
      icon: Share2,
      label: 'Share your screen',
      description: 'Share your screen to show BudX what you\'re working on'
    }
  ];
  const handleModeSelect = (mode: CodeAssistMode) => {
    onModeSelect(mode);
    if (mode === 'screen' && startScreenShare) {
      startScreenShare();
    }
    if (mode === 'voice' && startVoiceMode) {
      startVoiceMode();
    }
  };
  return (
    <div className="p-6">
      <div className='text-center mb-6'>
      <h1 className="text-6xl font-semibold text-white mb-4">
        Talk with BudX 
      </h1>
      <p className="text-gray-400 mb-6">
        Interact with BudX using text, voice,<br/>video, or screen sharing.
      </p>
      </div>

      
      <div className="grid grid-cols-3 gap-4">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleModeSelect(mode.id)}
            className={`
              p-6 rounded-xl flex flex-col items-center text-center
              transition-all duration-300 group relative
              hover:transform hover:-translate-y-1
              ${currentMode === mode.id 
                ? 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 text-white border border-purple-500/50 shadow-lg' 
                : 'bg-black/20 text-gray-400 hover:bg-purple-600/20 hover:text-white hover:shadow-lg'
              }
            `}
          >
            <div className="relative mb-4">
              <mode.icon className={`
                h-8 w-8 transition-transform duration-300
                ${currentMode === mode.id ? 'scale-110' : 'group-hover:scale-110'}
              `} />
              {currentMode === mode.id && (
                <div className="absolute inset-0 animate-ping">
                  <mode.icon className="h-8 w-8 text-purple-500/30" />
                </div>
              )}
            </div>
            <h3 className="text-lg font-medium mb-2">{mode.label}</h3>
            <p className="text-sm text-gray-400 group-hover:text-gray-300">
              {mode.description}
            </p>
            {currentMode === mode.id && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CodeAssistModeSelector;