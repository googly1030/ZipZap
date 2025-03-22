import  { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import Tesseract from 'tesseract.js';
import { ScreenAnalysis } from '../types/screenTypes';

interface ImageProcessorProps {
  mediaStream: MediaStream | null;
  onAnalysisComplete: (analysis: ScreenAnalysis) => void;
}

export interface ImageProcessorMethods {
  processFrameManually: () => Promise<ScreenAnalysis>;
}

const ImageProcessor = forwardRef<ImageProcessorMethods, ImageProcessorProps>(
  ({ mediaStream, onAnalysisComplete }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const processingRef = useRef(false);
    const lastProcessedTime = useRef<number>(0);
    const PROCESS_INTERVAL = 60000; 
    const processFrame = useCallback(async () => {
      const currentTime = Date.now();
      if (currentTime - lastProcessedTime.current < PROCESS_INTERVAL) {
        return;
      }

      if (!videoRef.current || !canvasRef.current || processingRef.current) return;

      processingRef.current = true;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        processingRef.current = false;
        return;
      }

      lastProcessedTime.current = currentTime;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
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

        const lines = result.data.text.split('\n').filter(line => line.trim());
        
        const analysis: ScreenAnalysis = {
          screenOverview: {
            text: result.data.text,
            lineCount: lines.length,
            visibleRange: `Lines 1-${Math.min(15, lines.length)}`,
            timestamp: Date.now(),
            lastUpdate: new Date().toISOString()
          }
        
        };
        onAnalysisComplete(analysis);
      } catch (error) {
        console.error('Error processing frame:', error);
        onAnalysisComplete({
          screenOverview: {
            text: 'Waiting for content...\nMake sure your code editor window is visible and in focus.',
            lineCount: 0,
            visibleRange: 'No content',
            timestamp: Date.now()
          }
        });
      }

      processingRef.current = false;
    }, [onAnalysisComplete]);

    // Expose manual processing method
    useImperativeHandle(ref, () => ({
      processFrameManually: async () => {
        await processFrame();
        return {
          screenOverview: {
            text: videoRef.current?.srcObject ? 'Processing...' : 'No video stream',
            lineCount: 0,
            visibleRange: 'Processing...',
            timestamp: Date.now()
          }
        };
      }
    }));

    useEffect(() => {
      if (!mediaStream || !videoRef.current) return;

      const video = videoRef.current;
      let isPlayingVideo = false;

      const setupVideo = async () => {
        try {
          video.srcObject = mediaStream;
          await video.play();
          isPlayingVideo = true;
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
      }, PROCESS_INTERVAL);

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
  }
);

export default ImageProcessor;
