import { ScreenAnalysis } from './screenTypes';

export interface ImageProcessorMethods {
  processFrameManually: () => Promise<ScreenAnalysis>;
}

export interface ImageProcessorProps {
  mediaStream: MediaStream | null;
  onAnalysisComplete: (analysis: ScreenAnalysis) => void;
}