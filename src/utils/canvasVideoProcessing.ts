import { MosaicRegion } from '../types/mosaic';
import { VideoMetadata } from '../types/video';
import { TextOverlay } from '../types/textOverlay';
import { normalizeToPixels, applyBlurToRegion } from './canvasBlur';
import { normalizeTextToPixels, renderTextOverlay } from './canvasText';
import { createVideoElement, extractAudioTrack } from './audioExtraction';
import { createRecordingStream, recordStream, stopRecording } from './mediaRecorderHelper';

interface ProcessingOptions {
  videoFile: File;
  regions: MosaicRegion[];
  textOverlays: TextOverlay[];
  metadata: VideoMetadata;
  onProgress?: (progress: number) => void;
}

async function seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const handler = () => {
      video.removeEventListener('seeked', handler);
      resolve();
    };
    video.addEventListener('seeked', handler);
    video.currentTime = time;
  });
}

export async function processVideoWithCanvas(
  options: ProcessingOptions
): Promise<Blob> {
  const { videoFile, regions, textOverlays, metadata, onProgress } = options;

  onProgress?.(0);

  // ビデオ要素を作成
  const video = await createVideoElement(videoFile);
  video.muted = true; // 再生音を消す（音声はMediaRecorderで録音）

  // Canvasを作成
  const canvas = document.createElement('canvas');
  canvas.width = metadata.width;
  canvas.height = metadata.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Failed to get 2d context from canvas');
  }

  onProgress?.(5);

  // 音声トラックを抽出
  let audioTrack: MediaStreamTrack | null = null;
  try {
    audioTrack = await extractAudioTrack(video);
  } catch (error) {
    console.warn('Failed to extract audio track:', error);
  }

  onProgress?.(10);

  // フレーム処理のためのパラメータ
  const fps = metadata.fps || 30;
  const frameInterval = 1 / fps;
  const totalFrames = Math.floor(metadata.duration * fps);

  console.log('Processing parameters:', {
    fps,
    frameInterval,
    totalFrames,
    duration: metadata.duration,
    width: metadata.width,
    height: metadata.height,
  });

  // MediaRecorderのセットアップ
  const stream = createRecordingStream({
    canvas,
    fps,
    audioTrack,
  });

  const chunks: Blob[] = [];
  const mediaRecorder = await recordStream(stream, (blob) => {
    chunks.push(blob);
  });

  // 録画開始
  mediaRecorder.start(100); // 100msごとにデータを取得

  onProgress?.(15);

  // フレームごとに処理
  for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
    const currentTime = frameIndex * frameInterval;

    // 動画をシーク
    await seekToTime(video, currentTime);

    // Canvasをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 現在のフレームを描画
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // アクティブなモザイク領域を特定
    const activeRegions = regions.filter(
      (r) => currentTime >= r.startTime && currentTime <= r.endTime
    );

    // 面積の大きい順にソート
    activeRegions.sort((a, b) => b.width * b.height - a.width * a.height);

    // 各モザイク領域にぼかしを適用
    for (const region of activeRegions) {
      const pixelRegion = normalizeToPixels(region, metadata);
      applyBlurToRegion(ctx, pixelRegion, region.blurStrength || 20);
    }

    // アクティブなテキストオーバーレイを特定
    const activeTexts = textOverlays.filter(
      (t) => currentTime >= t.startTime && currentTime <= t.endTime
    );

    // 各テキストオーバーレイを描画
    for (const text of activeTexts) {
      const pixelText = normalizeTextToPixels(text, metadata);
      renderTextOverlay(ctx, pixelText);
    }

    // 進捗を報告（10フレームごと）
    if (frameIndex % 10 === 0 && onProgress) {
      const progress = 15 + Math.round((frameIndex / totalFrames) * 75);
      onProgress(progress);
    }

    // MediaRecorderがフレームをキャプチャするのを待つ
    await new Promise((resolve) => setTimeout(resolve, frameInterval * 1000));
  }

  onProgress?.(90);

  // 録画停止
  await stopRecording(mediaRecorder);

  onProgress?.(95);

  // Blobを作成
  const outputBlob = new Blob(chunks, { type: chunks[0]?.type || 'video/webm' });

  // クリーンアップ
  URL.revokeObjectURL(video.src);

  onProgress?.(100);

  console.log('Processing complete:', {
    blobSize: outputBlob.size,
    blobType: outputBlob.type,
  });

  return outputBlob;
}
