import Tesseract from 'tesseract.js';

export const captureAndAnalyzeScreen = async (mediaStream: MediaStream): Promise<string> => {
  try {
    // Create video element
    const video = document.createElement('video');
    video.srcObject = mediaStream;
    await video.play();

    // Create canvas for frame capture
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Get canvas context and capture frame
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Perform OCR on the captured frame
    const result = await Tesseract.recognize(
      canvas.toDataURL('image/png'),
      'eng',
      {
        logger: m => console.log(m),
        errorHandler: err => console.error('OCR Error:', err)
      }
    );

    return result.data.text || '';
  } catch (error) {
    console.error('Screen capture error:', error);
    return '';
  }
};