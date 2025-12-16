import { MosaicRegion } from '../types/mosaic';
import { VideoMetadata } from '../types/video';
import { TextOverlay } from '../types/textOverlay';
import { buildTextFilterChain } from './textOverlayCommands';

interface PixelRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  startTime: number;
  endTime: number;
}

export function normalizeToPixels(
  region: MosaicRegion,
  metadata: VideoMetadata
): PixelRegion {
  return {
    x: Math.round(region.x * metadata.width),
    y: Math.round(region.y * metadata.height),
    width: Math.round(region.width * metadata.width),
    height: Math.round(region.height * metadata.height),
    startTime: region.startTime,
    endTime: region.endTime,
  };
}

export function buildMosaicFilterChain(
  regions: MosaicRegion[],
  metadata: VideoMetadata
): string {
  if (regions.length === 0) {
    return '[0:v]copy[v]';
  }

  const pixelRegions = regions.map((r) => normalizeToPixels(r, metadata));

  // For single region, use simpler filter
  if (pixelRegions.length === 1) {
    const region = pixelRegions[0];
    const blurAmount = 20; // Strong blur for mosaic effect

    return `[0:v]split[main][blur];` +
           `[blur]crop=${region.width}:${region.height}:${region.x}:${region.y},` +
           `boxblur=${blurAmount}:5,` +
           `scale=${region.width}:${region.height}[blurred];` +
           `[main][blurred]overlay=${region.x}:${region.y}:` +
           `enable='between(t,${region.startTime},${region.endTime})'[v]`;
  }

  // For multiple regions, chain overlays
  let filterChain = '';

  // Create all blurred regions first
  pixelRegions.forEach((region, index) => {
    const blurAmount = 20;
    if (index > 0) filterChain += ';';
    filterChain += `[0:v]crop=${region.width}:${region.height}:${region.x}:${region.y},` +
                   `boxblur=${blurAmount}:5[blur${index}]`;
  });

  // Apply overlays sequentially
  pixelRegions.forEach((region, index) => {
    const inputLabel = index === 0 ? '[0:v]' : `[v${index - 1}]`;
    const outputLabel = index === pixelRegions.length - 1 ? '[v]' : `[v${index}]`;

    filterChain += `;${inputLabel}[blur${index}]overlay=${region.x}:${region.y}:` +
                   `enable='between(t,${region.startTime},${region.endTime})'${outputLabel}`;
  });

  return filterChain;
}

export function buildCompleteFilterChain(
  mosaicRegions: MosaicRegion[],
  textOverlays: TextOverlay[],
  metadata: VideoMetadata
): string {
  const mosaicFilter = buildMosaicFilterChain(mosaicRegions, metadata);
  const textFilters = buildTextFilterChain(textOverlays, metadata);

  if (!textFilters) {
    // テキストなし、モザイクのみ
    return mosaicFilter;
  }

  // モザイクの出力[v]を[tmp]に変更し、テキストフィルターを追加
  const mosaicWithTemp = mosaicFilter.replace('[v]', '[tmp]');
  return `${mosaicWithTemp};[tmp]${textFilters}[v]`;
}
