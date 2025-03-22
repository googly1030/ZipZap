import React, { useState, useEffect } from 'react';
import { Code, Copy, Check, RefreshCw } from 'lucide-react';
import { rephraseLowQualityText } from '../../utils/groqApi';
import { ScreenAnalysis } from '../../types/screenTypes';

interface ScreenDataDisplayProps {
  data: ScreenAnalysis;
  isLive?: boolean;
  onUseAsPrompt?: (text: string) => void;
  onRefresh?: () => Promise<void>; // Add this prop
}

export const ScreenDataDisplay: React.FC<ScreenDataDisplayProps> = ({
  data,
  isLive,
  onRefresh
}) => {
  const [rephrased, setRephrased] = useState('');
  const [isRephrasing, setIsRephrasing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isManualRephrasing, setIsManualRephrasing] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rephrased);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); 
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleManualRephrase = async () => {
    if (isManualRephrasing) return;
    
    setIsManualRephrasing(true);
    setIsRephrasing(true);
    
    try {
      // First trigger a new screen capture
      if (onRefresh) {
        await onRefresh();
      }
      
      // Then process the new text once data is updated
      if (data.screenOverview?.text) {
        const improved = await rephraseLowQualityText(data.screenOverview.text);
        setRephrased(improved);
      }
    } catch (error) {
      console.error('Failed to manually rephrase text:', error);
      setRephrased(data.screenOverview?.text || '');
    } finally {
      setIsRephrasing(false);
      setIsManualRephrasing(false);
    }
  };

  useEffect(() => {
    const rephrase = async () => {
      if (data.screenOverview?.text) {
        setIsRephrasing(true);
        try {
          const improved = await rephraseLowQualityText(data.screenOverview.text);
          setRephrased(improved);
        } catch (error) {
          console.error('Failed to rephrase text:', error);
          setRephrased(data.screenOverview.text);
        } finally {
          setIsRephrasing(false);
        }
      }
    };

    rephrase();
  }, [data.screenOverview?.text]);

  return (
    <div className="w-full space-y-4">
      <div className="bg-[#202124] rounded-lg p-4 border border-[#ffffff1a] mt-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-base font-medium">AI Code Analysis</h2>
          <div className="flex items-center space-x-2">
            <span
              className={`flex h-2 w-2 rounded-full ${
                isLive ? "bg-green-500 animate-pulse" : "bg-[#ffffff66]"
              }`}
            />
            <span className={`text-xs ${isLive ? "text-green-400" : "text-[#ffffff66]"}`}>
              {isLive ? "LIVE ANALYSIS" : "IDLE"}
            </span>
          </div>
        </div>

        {data.screenOverview && (
          <div className="bg-[#ffffff0a] backdrop-blur-sm rounded-lg p-4 border border-[#ffffff1a]">
            <div className="text-xs text-[#ffffff99] mb-3 flex items-center justify-between">
              <div className="flex items-center">
                <span className="flex h-1.5 w-1.5 rounded-full bg-[#8AB4F8] mr-2" />
                Screen Content
              </div>
              <span className="text-[#ffffff66]">{data.screenOverview.visibleRange}</span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#ffffff0a] rounded-lg p-2">
                  <div className="text-xs text-[#ffffff99]">Lines</div>
                  <div className="text-sm text-white">{data.screenOverview.lineCount}</div>
                </div>
                <div className="bg-[#ffffff0a] rounded-lg p-2">
                  <div className="text-xs text-[#ffffff99]">Last Update</div>
                  <div className="text-sm text-white">
                    {new Date(data.screenOverview.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {data.screenOverview.text && (
                <div className="mt-2">
                  <div className="text-xs text-[#ffffff99] mb-2 flex items-center">
                    <div className="flex items-center">
                      <Code className="h-3 w-3 mr-2" />
                      Content Preview
                    </div>
                  </div>
                  <div className="bg-[#202124] rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-[#ffffff0a] border-b border-[#ffffff1a] flex items-center justify-between">
                      <div className="text-xs text-[#ffffff99]">Screen Share Content</div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={handleManualRephrase}
                          className="flex items-center space-x-2 text-[#ffffff99] hover:text-[#ffffffcc] transition-colors"
                          disabled={isRephrasing || isManualRephrasing}
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${isManualRephrasing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={handleCopy}
                          className="flex items-center space-x-2 text-[#ffffff99] hover:text-[#ffffffcc] transition-colors"
                          disabled={isRephrasing || !rephrased}
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <div className="flex items-center space-x-2">
                          <span className="flex h-1.5 w-1.5 rounded-full bg-[#8AB4F8]" />
                          <span className="text-xs text-[#ffffff99]">
                            {new Date().toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 font-mono text-xs leading-5 text-[#ffffffcc] 
                                  overflow-x-auto whitespace-pre-wrap max-h-[200px] 
                                  overflow-y-auto scrollbar-thin scrollbar-thumb-[#ffffff1a] 
                                  scrollbar-track-transparent border-l-2 border-[#8AB4F8]"
                    >
                      {isRephrasing ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-pulse text-[#ffffff99]">Improving text quality...</div>
                        </div>
                      ) : (
                        rephrased
                      )}
                    </div>

                    <div className="px-4 py-2 bg-[#ffffff0a] border-t border-[#ffffff1a] flex justify-between items-center">
                      <div className="text-xs text-[#ffffff99]">
                        Lines: {data.screenOverview.lineCount}
                      </div>
                      <div className="text-xs text-[#ffffff66]">
                        {data.screenOverview.visibleRange}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenDataDisplay;