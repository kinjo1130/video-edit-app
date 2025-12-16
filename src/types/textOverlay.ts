export interface TextOverlay {
  id: string;
  text: string;
  x: number;              // Normalized coordinate (0-1)
  y: number;              // Normalized coordinate (0-1)
  startTime: number;      // Start time in seconds
  endTime: number;        // End time in seconds
  fontSize: number;       // Font size in pixels
  fontColor: string;      // Color ('white', '#FFFFFF', etc.)
  backgroundColor?: string; // Optional background color
}

export interface TextOverlayPixels {
  id: string;
  text: string;
  x: number;              // Pixel coordinate
  y: number;              // Pixel coordinate
  startTime: number;
  endTime: number;
  fontSize: number;
  fontColor: string;
  backgroundColor?: string;
}
