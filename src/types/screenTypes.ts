export interface ScreenOverview {
  text: string;
  lineCount: number;
  visibleRange: string;
  timestamp: number;
  lastUpdate?: string;
}

export interface ScreenAnalysis {
window?: string;
contentType?: string;
resolution?: string;
frameRate?: string;
screenOverview?: ScreenOverview;
}