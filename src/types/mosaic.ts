export interface MosaicRegion {
  id: string;
  x: number; // Normalized coordinate (0-1)
  y: number; // Normalized coordinate (0-1)
  width: number; // Normalized width (0-1)
  height: number; // Normalized height (0-1)
  startTime: number; // Start time in seconds
  endTime: number; // End time in seconds
  blurStrength?: number; // Optional blur intensity
}

export interface MosaicRegionPixels {
  id: string;
  x: number; // Pixel coordinate
  y: number; // Pixel coordinate
  width: number; // Pixel width
  height: number; // Pixel height
  startTime: number;
  endTime: number;
  blurStrength?: number;
}
