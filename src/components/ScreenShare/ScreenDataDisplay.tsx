import React from 'react';
import { Code, MessageSquare } from 'lucide-react';

interface ScreenOverview {
  text: string;
  lineCount: number;
  visibleRange: string;
  timestamp: number;
}

interface ScreenDataDisplayProps {
  data: {
    window?: string;
    contentType?: string;
    resolution?: string;
    frameRate?: string;
    languages?: string[];
    codeComplexity?: "Low" | "Medium" | "High";
    potentialIssues?: number;
    performanceScore?: number;
    bestPractices?: { score: number; issues: number };
    screenOverview?: ScreenOverview;
  };
  isLive?: boolean;
  onUseAsPrompt?: (text: string) => void;
}

export const ScreenDataDisplay: React.FC<ScreenDataDisplayProps> = ({
  data,
  isLive,
  onUseAsPrompt,
}) => {
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
                  <div className="text-xs text-[#ffffff99] mb-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <Code className="h-3 w-3 mr-2" />
                      Content Preview
                    </div>
                    <button
                      onClick={() => onUseAsPrompt?.(data.screenOverview?.text || "")}
                      className="flex items-center space-x-1 px-2 py-1 rounded-md 
                               bg-[#8AB4F8] text-[#202124] hover:bg-[#8AB4F8]/90 
                               transition-colors"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span className="text-xs font-medium">Use as Prompt</span>
                    </button>
                  </div>
                  <div className="bg-[#202124] rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-[#ffffff0a] border-b border-[#ffffff1a] flex items-center justify-between">
                      <div className="text-xs text-[#ffffff99]">Source Code</div>
                      <div className="flex items-center space-x-2">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-[#8AB4F8]" />
                        <span className="text-xs text-[#ffffff99]">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 font-mono text-xs leading-5 text-[#ffffffcc] 
                                  overflow-x-auto whitespace-pre-wrap max-h-[200px] 
                                  overflow-y-auto scrollbar-thin scrollbar-thumb-[#ffffff1a] 
                                  scrollbar-track-transparent border-l-2 border-[#8AB4F8]"
                    >
                      {data.screenOverview.text}
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