export interface VideoMetadata {
  duration: number; // Duration in seconds
  width: number; // Video width in pixels
  height: number; // Video height in pixels
  fps: number; // Frames per second
  size: number; // File size in bytes
}

export interface VideoFile {
  file: File;
  url: string;
  metadata?: VideoMetadata;
}
