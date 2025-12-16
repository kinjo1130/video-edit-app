import { TextOverlay, TextOverlayPixels } from '../types/textOverlay';
import { VideoMetadata } from '../types/video';

export function normalizeTextToPixels(
  overlay: TextOverlay,
  metadata: VideoMetadata
): TextOverlayPixels {
  return {
    ...overlay,
    x: Math.round(overlay.x * metadata.width),
    y: Math.round(overlay.y * metadata.height),
  };
}

export function buildTextFilterChain(
  overlays: TextOverlay[],
  metadata: VideoMetadata
): string {
  if (overlays.length === 0) return '';

  const pixelOverlays = overlays.map(o => normalizeTextToPixels(o, metadata));

  const filters = pixelOverlays.map((overlay) => {
    // エスケープ処理
    const escapedText = overlay.text
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/:/g, '\\:');

    const bg = overlay.backgroundColor
      ? `,box=1,boxcolor=${overlay.backgroundColor}`
      : '';

    return `drawtext=text='${escapedText}':` +
           `x=${overlay.x}:y=${overlay.y}:` +
           `fontsize=${overlay.fontSize}:` +
           `fontcolor=${overlay.fontColor}${bg}:` +
           `enable='between(t,${overlay.startTime},${overlay.endTime})'`;
  });

  return filters.join(',');
}
