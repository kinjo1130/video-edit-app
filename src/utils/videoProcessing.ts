import { MosaicRegion } from '../types/mosaic';
import { VideoMetadata } from '../types/video';
import { TextOverlay } from '../types/textOverlay';
import { processVideoWithCanvas } from './canvasVideoProcessing';

export async function applyMosaicRegions(
  videoFile: File,
  regions: MosaicRegion[],
  textOverlays: TextOverlay[],
  metadata: VideoMetadata,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  console.log('Starting video processing with Canvas API...');
  console.log('Regions:', regions);
  console.log('Text overlays:', textOverlays);
  console.log('Metadata:', metadata);

  const blob = await processVideoWithCanvas({
    videoFile,
    regions,
    textOverlays,
    metadata,
    onProgress,
  });

  console.log('Video processing complete');
  return blob;
}
