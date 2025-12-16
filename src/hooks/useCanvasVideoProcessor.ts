import { useState, useCallback, useRef } from 'react';
import { MosaicRegion } from '../types/mosaic';
import { TextOverlay } from '../types/textOverlay';
import { VideoMetadata } from '../types/video';
import { processVideoWithCanvas } from '../utils/canvasVideoProcessing';
import { checkMediaRecorderSupport } from '../utils/codecSupport';

interface ProcessingOptions {
  videoFile: File;
  regions: MosaicRegion[];
  textOverlays: TextOverlay[];
  metadata: VideoMetadata;
}

export function useCanvasVideoProcessor() {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  // MediaRecorderのサポートをチェック
  const support = checkMediaRecorderSupport();

  const processVideo = useCallback(
    async (options: ProcessingOptions): Promise<Blob> => {
      if (!support.supported) {
        const errorMsg = support.message || 'お使いのブラウザは動画処理をサポートしていません';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      if (processingRef.current) {
        const errorMsg = '既に処理中です';
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      processingRef.current = true;
      setError(null);
      setProgress(0);

      try {
        const blob = await processVideoWithCanvas({
          ...options,
          onProgress: (p) => {
            setProgress(p);
          },
        });

        setProgress(100);
        return blob;
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : '動画の処理中にエラーが発生しました';
        setError(errorMsg);
        throw err;
      } finally {
        processingRef.current = false;
        setTimeout(() => setProgress(0), 1000);
      }
    },
    [support]
  );

  return {
    ready: support.supported,
    progress,
    error,
    processVideo,
  };
}
