import { useState, useCallback } from 'react';
import { VideoMetadata } from '../types/video';

export function useVideoMetadata() {
  const [isExtracting, setIsExtracting] = useState(false);

  const extractMetadata = useCallback(async (file: File): Promise<VideoMetadata> => {
    setIsExtracting(true);

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const metadata: VideoMetadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          fps: 30, // Default, actual FPS extraction requires more complex approach
          size: file.size,
        };

        URL.revokeObjectURL(video.src);
        setIsExtracting(false);
        resolve(metadata);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        setIsExtracting(false);
        reject(new Error('Failed to extract video metadata'));
      };

      video.src = URL.createObjectURL(file);
    });
  }, []);

  return { extractMetadata, isExtracting };
}
