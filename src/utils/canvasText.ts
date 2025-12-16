import { VideoMetadata } from '../types/video';
import { TextOverlay } from '../types/textOverlay';

interface TextOverlayPixels {
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontColor: string;
  backgroundColor?: string;
}

export function normalizeTextToPixels(
  overlay: TextOverlay,
  metadata: VideoMetadata
): TextOverlayPixels {
  return {
    x: Math.round(overlay.x * metadata.width),
    y: Math.round(overlay.y * metadata.height),
    text: overlay.text,
    fontSize: overlay.fontSize,
    fontColor: overlay.fontColor,
    backgroundColor: overlay.backgroundColor,
  };
}

export function renderTextOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: TextOverlayPixels
): void {
  try {
    ctx.save();

    // フォント設定
    ctx.font = `${overlay.fontSize}px sans-serif`;
    ctx.fillStyle = overlay.fontColor;
    ctx.textBaseline = 'top';

    // テキストの寸法を測定
    const metrics = ctx.measureText(overlay.text);
    const textWidth = metrics.width;
    const textHeight = overlay.fontSize * 1.2; // フォントサイズの約1.2倍を高さとして使用

    // 背景ボックスを描画（設定されている場合）
    if (overlay.backgroundColor) {
      const padding = 8;
      ctx.fillStyle = overlay.backgroundColor;
      ctx.fillRect(
        overlay.x - padding,
        overlay.y - padding,
        textWidth + padding * 2,
        textHeight + padding * 2
      );
    }

    // テキストを描画
    ctx.fillStyle = overlay.fontColor;
    ctx.fillText(overlay.text, overlay.x, overlay.y);

    ctx.restore();
  } catch (error) {
    console.error('Error rendering text overlay:', error);
  }
}
