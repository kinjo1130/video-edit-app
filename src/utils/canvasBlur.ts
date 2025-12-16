import { VideoMetadata } from '../types/video';
import { MosaicRegion } from '../types/mosaic';

interface MosaicRegionPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function normalizeToPixels(
  region: MosaicRegion,
  metadata: VideoMetadata
): MosaicRegionPixels {
  return {
    x: Math.round(region.x * metadata.width),
    y: Math.round(region.y * metadata.height),
    width: Math.round(region.width * metadata.width),
    height: Math.round(region.height * metadata.height),
  };
}

export function clampRegion(
  region: MosaicRegionPixels,
  videoWidth: number,
  videoHeight: number
): MosaicRegionPixels {
  const x = Math.max(0, Math.min(region.x, videoWidth - 1));
  const y = Math.max(0, Math.min(region.y, videoHeight - 1));
  const maxWidth = videoWidth - x;
  const maxHeight = videoHeight - y;

  return {
    x,
    y,
    width: Math.max(1, Math.min(region.width, maxWidth)),
    height: Math.max(1, Math.min(region.height, maxHeight)),
  };
}

export function applyBlurToRegion(
  ctx: CanvasRenderingContext2D,
  region: MosaicRegionPixels,
  blurAmount: number = 20
): void {
  // 領域をビデオ境界にクランプ
  const clampedRegion = clampRegion(
    region,
    ctx.canvas.width,
    ctx.canvas.height
  );

  // 領域が有効かチェック
  if (clampedRegion.width <= 0 || clampedRegion.height <= 0) {
    return;
  }

  try {
    // 領域の画像データを抽出
    const imageData = ctx.getImageData(
      clampedRegion.x,
      clampedRegion.y,
      clampedRegion.width,
      clampedRegion.height
    );

    // 一時Canvasを作成してぼかしを適用
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = clampedRegion.width;
    tempCanvas.height = clampedRegion.height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    if (!tempCtx) {
      console.error('Failed to get 2d context for temp canvas');
      return;
    }

    // 画像データを一時Canvasに配置
    tempCtx.putImageData(imageData, 0, 0);

    // ぼかしフィルターを適用
    tempCtx.filter = `blur(${blurAmount}px)`;
    tempCtx.drawImage(tempCanvas, 0, 0);

    // ぼかした領域を元のCanvasに描画
    ctx.drawImage(
      tempCanvas,
      clampedRegion.x,
      clampedRegion.y,
      clampedRegion.width,
      clampedRegion.height
    );
  } catch (error) {
    console.error('Error applying blur to region:', error);
  }
}
