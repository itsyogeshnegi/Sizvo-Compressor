export const SUPPORTED_FORMATS = ["jpeg", "png", "webp", "avif"] as const;
export type ImageFormat = (typeof SUPPORTED_FORMATS)[number];
export type OutputFormat = ImageFormat | "original";
export type CompressionMode = "quality" | "balanced" | "smallest" | "target" | "custom";
export type ResizeMode = "fit" | "exact";
export type MediaType = "image" | "video";
export type VideoFormat = "mp4";
export type VideoCompressionMode = "quality" | "balanced" | "smallest" | "target";

export interface CompressionSettings {
  mode: CompressionMode;
  quality?: number;
  outputFormat: OutputFormat;
  targetSizeKb?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizeMode: ResizeMode;
  keepMetadata: boolean;
}

export interface CompressionResult {
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
  format: ImageFormat;
  targetAchieved: boolean | null;
  warnings: string[];
}

export interface VideoCompressionSettings {
  mode: VideoCompressionMode;
  targetSizeMb?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizeMode: ResizeMode;
  removeAudio: boolean;
}

export interface VideoCompressionResult {
  fileName: string;
  mimeType: "video/mp4";
  width: number;
  height: number;
  duration: number;
  originalWidth: number;
  originalHeight: number;
  size: number;
  format: VideoFormat;
  targetAchieved: boolean | null;
  warnings: string[];
}

export interface JobFileRecord {
  id: string;
  mediaType: MediaType;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
  format: ImageFormat | VideoFormat;
  targetAchieved: boolean | null;
  warnings: string[];
  originalName: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  savedBytes: number;
  savedPercent: number;
  createdAt: string;
  duration?: number;
}

export interface JobManifest {
  id: string;
  createdAt: string;
  expiresAt: string;
  files: JobFileRecord[];
}
