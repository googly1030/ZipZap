import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useMemo } from 'react';
import Tesseract from 'tesseract.js';
import * as tf from '@tensorflow/tfjs';

interface ImageProcessorProps {
  mediaStream: MediaStream | null;
  onAnalysisComplete: (analysis: ScreenAnalysis) => void;
}

interface ScreenAnalysis {
  window: string;
  contentType: string;
  resolution: string;
  frameRate: string;
  languages: string[];
  codeComplexity: 'Low' | 'Medium' | 'High';
  potentialIssues: number;
  performanceScore: number;
  bestPractices: { score: number; issues: number };
  screenOverview: {
    text: string;
    lineCount: number;
    visibleRange: string;
    timestamp: number;
  };
}

const ImageProcessor: React.FC<ImageProcessorProps> = ({ mediaStream, onAnalysisComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const processingRef = useRef(false);
  const [modelError, setModelError] = useState(false);

  // Update model loading with error handling
  const codeModel = useMemo(() => {
    const loadModel = async () => {
      try {
        // Check if model exists first
        const response = await fetch('/models/code-detection/model.json');
        if (!response.ok) {
          throw new Error('Model not found');
        }
        return await tf.loadLayersModel('/models/code-detection/model.json');
      } catch (error) {
        console.warn('Model loading failed, falling back to basic analysis:', error);
        setModelError(true);
        return null;
      }
    };
    return loadModel();
  }, []);

  // Update processFrame to handle missing model
  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processingRef.current) return;

    processingRef.current = true;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Ensure video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      processingRef.current = false;
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Convert canvas to blob for Tesseract
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png');
      });

      const result = await Tesseract.recognize(blob, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.debug(`Recognition progress: ${Math.floor(m.progress * 100)}%`);
          }
        }
      });

      if (!result.data.text) {
        throw new Error('No text detected in frame');
      }

      const languages = detectProgrammingLanguages(result.data.text);
      const complexity = analyzeCodeComplexity(result.data.text);
      
      let aiConfidenceScore = 50; // Default score if model isn't available

      if (!modelError) {
        const model = await codeModel;
        if (model) {
          const tensorFrame = tf.browser.fromPixels(canvas)
            .resizeBilinear([224, 224])
            .expandDims(0)
            .toFloat()
            .div(255);

          const predictionTensor = await model.predict(tensorFrame) as tf.Tensor;
          const predictionData = await predictionTensor.data();
          aiConfidenceScore = Math.floor(predictionData[0] * 100);
          
          // Cleanup tensors
          tensorFrame.dispose();
          predictionTensor.dispose();
        }
      }

      const performanceScore = calculatePerformanceScore(result.data.text);
      const finalScore = Math.floor((performanceScore + aiConfidenceScore) / 2);

      const analysis: ScreenAnalysis = {
        window: 'VS Code',
        contentType: 'Code Editor',
        resolution: `${canvas.width}x${canvas.height}`,
        frameRate: '30',
        languages,
        codeComplexity: complexity,
        potentialIssues: calculateIssues(result.data.text),
        performanceScore: finalScore,
        bestPractices: {
          score: calculateBestPracticesScore(result.data.text),
          issues: calculateIssues(result.data.text),
        },
        screenOverview: extractScreenOverview(result.data.text)
      };

      onAnalysisComplete(analysis);
    } catch (error) {
      console.error('Error processing frame:', error);
      onAnalysisComplete({
        // Provide fallback data
        window: 'VS Code',
        contentType: 'Code Editor',
        resolution: `${canvas.width}x${canvas.height}`,
        frameRate: '30',
        languages: [],
        codeComplexity: 'Low',
        potentialIssues: 0,
        performanceScore: 0,
        bestPractices: { score: 0, issues: 0 },
        screenOverview: {
          text: 'Waiting for content...\nMake sure your code editor window is visible and in focus.',
          lineCount: 0,
          visibleRange: 'No content',
          timestamp: Date.now()
        }
      });
    }

    processingRef.current = false;
  }, [codeModel, modelError, onAnalysisComplete]);

  // Update video handling
  useEffect(() => {
    if (!mediaStream || !videoRef.current) return;

    const video = videoRef.current;
    let isPlayingVideo = false;

    const setupVideo = async () => {
      try {
        video.srcObject = mediaStream;
        await video.play();
        isPlayingVideo = true;
        // Small delay to ensure video is stable
        await new Promise(resolve => setTimeout(resolve, 100));
        processFrame();
      } catch (error) {
        console.warn('Video setup error:', error);
        isPlayingVideo = false;
      }
    };

    setupVideo();
    
    const intervalId = setInterval(() => {
      if (isPlayingVideo) {
        processFrame();
      }
    }, 500);

    return () => {
      clearInterval(intervalId);
      if (video.srcObject) {
        isPlayingVideo = false;
        video.srcObject = null;
      }
    };
  }, [mediaStream, processFrame]);

  return (
    <div style={{ display: 'none' }}>
      <video ref={videoRef} autoPlay playsInline muted />
      <canvas ref={canvasRef} />
    </div>
  );
};

// Helper functions for analysis
const detectProgrammingLanguages = (text: string): string[] => {
  const languages = new Set<string>();
  const patterns = {
    typescript: /interface|type|extends|implements/i,
    javascript: /const|let|function|=>/i,
    python: /def|class|import|from/i,
    java: /public|private|class|void/i,
    cpp: /#include|std::|cout/i,
  };

  Object.entries(patterns).forEach(([lang, pattern]) => {
    if (pattern.test(text)) {
      languages.add(lang);
    }
  });

  return Array.from(languages);
};

const analyzeCodeComplexity = (text: string): 'Low' | 'Medium' | 'High' => {
  const complexityIndicators = {
    loops: (text.match(/for|while|do/g) || []).length,
    conditions: (text.match(/if|else|switch|case/g) || []).length,
    functions: (text.match(/function|=>/g) || []).length,
  };

  const totalComplexity = 
    complexityIndicators.loops + 
    complexityIndicators.conditions + 
    complexityIndicators.functions;

  if (totalComplexity > 20) return 'High';
  if (totalComplexity > 10) return 'Medium';
  return 'Low';
};

const calculateIssues = (text: string): number => {
  const patterns = [
    /console\.(log|error|warn)/g,
    /TODO/g,
    /FIXME/g,
    /any/g,
    /\[\s*\]/g,
  ];

  return patterns.reduce((count, pattern) => 
    count + (text.match(pattern) || []).length, 0);
};

const calculatePerformanceScore = (text: string): number => {
  const baseline = 100;
  const deductions = {
    longFunctions: (text.match(/function.*?\{[\s\S]{500,}\}/g) || []).length * 5,
    complexityPenalty: (text.match(/for.*?for|if.*?if/g) || []).length * 3,
    globalVariables: (text.match(/const\s+\w+\s*=/g) || []).length,
  };

  const totalDeduction = Object.values(deductions).reduce((a, b) => a + b, 0);
  return Math.max(0, Math.min(100, baseline - totalDeduction));
};

const calculateBestPracticesScore = (text: string): number => {
  const baseline = 100;
  const deductions = {
    missingTypes: (text.match(/:\s*any/g) || []).length * 5,
    consoleStatements: (text.match(/console\./g) || []).length * 2,
    magicNumbers: (text.match(/\d+/g) || []).length,
  };

  const totalDeduction = Object.values(deductions).reduce((a, b) => a + b, 0);
  return Math.max(0, Math.min(100, baseline - totalDeduction));
};

const extractScreenOverview = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim());
  const lineCount = lines.length;
  
  // Format the text for better readability
  const visibleText = lines
    .slice(0, 15) 
    .map(line => line.trim())
    .join('\n')
    .substring(0, 1000); 

  return {
    text: visibleText,
    lineCount,
    visibleRange: `Lines 1-${Math.min(15, lineCount)}`,
    timestamp: Date.now()
  };
};

export default ImageProcessor;
