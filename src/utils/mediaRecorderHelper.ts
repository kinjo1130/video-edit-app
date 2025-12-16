import { getSupportedMimeType } from './codecSupport';

interface StreamConfig {
  canvas: HTMLCanvasElement;
  fps: number;
  audioTrack?: MediaStreamTrack | null;
}

export function createRecordingStream(config: StreamConfig): MediaStream {
  const { canvas, fps, audioTrack } = config;

  // Canvasからビデオストリームを取得
  const canvasStream = canvas.captureStream(fps);

  // 音声トラックがあれば追加
  if (audioTrack) {
    canvasStream.addTrack(audioTrack);
    console.log('Audio track added to recording stream');
  } else {
    console.warn('No audio track available, recording video only');
  }

  return canvasStream;
}

export async function recordStream(
  stream: MediaStream,
  onDataAvailable?: (blob: Blob) => void
): Promise<MediaRecorder> {
  const mimeType = getSupportedMimeType();

  const options: MediaRecorderOptions = {
    mimeType,
    videoBitsPerSecond: 2500000, // 2.5 Mbps
  };

  // 音声トラックがある場合は音声ビットレートも設定
  if (stream.getAudioTracks().length > 0) {
    options.audioBitsPerSecond = 128000; // 128 kbps
  }

  const mediaRecorder = new MediaRecorder(stream, options);

  if (onDataAvailable) {
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        onDataAvailable(event.data);
      }
    };
  }

  mediaRecorder.onerror = (event) => {
    console.error('MediaRecorder error:', event);
  };

  return mediaRecorder;
}

export function stopRecording(mediaRecorder: MediaRecorder): Promise<void> {
  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      console.log('Recording stopped');
      resolve();
    };
    mediaRecorder.stop();
  });
}
