import sharp, { type Sharp } from "sharp";
import { MAX_DIMENSION, MAX_INPUT_PIXELS } from "./config";
import type { CompressionResult, CompressionSettings, ImageFormat, ResizeMode } from "./types";
import { extensionFor, mimeFor, safeBaseName, ValidationError } from "./validation";

const PRESET_QUALITY = { quality: 88, balanced: 74, smallest: 48 } as const;

function outputFormat(input: ImageFormat, requested: CompressionSettings["outputFormat"]): ImageFormat {
  return requested === "original" ? input : requested;
}

function applyEncoder(pipeline: Sharp, format: ImageFormat, quality: number) {
  switch (format) {
    case "jpeg": return pipeline.jpeg({ quality, mozjpeg: true, progressive: true });
    case "png": return pipeline.png({ compressionLevel: 9, palette: quality < 90, quality });
    case "webp": return pipeline.webp({ quality, smartSubsample: true });
    case "avif": return pipeline.avif({ quality, effort: 5 });
  }
}

async function encode(
  input: Buffer,
  format: ImageFormat,
  quality: number,
  width: number | undefined,
  height: number | undefined,
  resizeMode: ResizeMode,
  keepMetadata: boolean
) {
  let pipeline = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "warning" }).rotate();
  if (width || height) {
    pipeline = pipeline.resize({
      width,
      height,
      fit: resizeMode === "exact" ? "cover" : "inside",
      withoutEnlargement: resizeMode !== "exact",
      position: "centre"
    });
  }
  if (keepMetadata) pipeline = pipeline.withMetadata();
  return applyEncoder(pipeline, format, quality).toBuffer({ resolveWithObject: true });
}

async function encodeForTarget(
  input: Buffer,
  format: ImageFormat,
  targetBytes: number,
  originalWidth: number,
  originalHeight: number,
  requestedWidth: number | undefined,
  requestedHeight: number | undefined,
  resizeMode: ResizeMode,
  keepMetadata: boolean,
  preferredQuality?: number
) {
  const widthScale = requestedWidth ? Math.min(1, requestedWidth / originalWidth) : 1;
  const heightScale = requestedHeight ? Math.min(1, requestedHeight / originalHeight) : 1;
  let scale = resizeMode === "exact" ? 1 : Math.min(widthScale, heightScale);
  const initialScale = scale;
  let smallestOverall: Awaited<ReturnType<typeof encode>> | null = null;

  for (let resizeAttempt = 0; resizeAttempt < 24; resizeAttempt += 1) {
    const baseWidth = resizeMode === "exact" ? requestedWidth! : originalWidth;
    const baseHeight = resizeMode === "exact" ? requestedHeight! : originalHeight;
    const width = Math.max(64, Math.round(baseWidth * scale));
    const height = Math.max(64, Math.round(baseHeight * scale));
    const high = preferredQuality ? Math.min(98, Math.max(20, preferredQuality)) : 92;
    let searchHigh = high;
    let low = Math.min(18, searchHigh - 4);
    let smallest: Awaited<ReturnType<typeof encode>> | null = null;
    let bestAtThisSize: Awaited<ReturnType<typeof encode>> | null = null;

    for (let qualityAttempt = 0; qualityAttempt < 7; qualityAttempt += 1) {
      const quality = Math.floor((low + searchHigh) / 2);
      const candidate = await encode(input, format, quality, width, height, resizeMode, keepMetadata);
      if (!smallest || candidate.data.length < smallest.data.length) smallest = candidate;
      if (!smallestOverall || candidate.data.length < smallestOverall.data.length) smallestOverall = candidate;
      if (candidate.data.length <= targetBytes) {
        bestAtThisSize = candidate;
        low = quality + 1;
      } else {
        searchHigh = quality - 1;
      }
    }
    if (bestAtThisSize) return { output: bestAtThisSize, achieved: true, resized: scale < initialScale };
    // Exact dimensions take precedence over the byte target. If quality alone
    // cannot reach it, return the closest result without changing W×H.
    if (resizeMode === "exact") break;
    if (width <= 64 && height <= 64) break;

    // Estimate the next dimensions from the remaining byte gap, but keep each
    // step bounded so difficult images converge without dozens of encodes.
    const ratio = smallest ? Math.sqrt(targetBytes / smallest.data.length) * 0.92 : 0.75;
    scale *= Math.min(0.82, Math.max(0.45, ratio));
  }
  const fallbackQuality = preferredQuality ? Math.min(preferredQuality, 18) : 18;
  const output = smallestOverall ?? await encode(input, format, fallbackQuality, 64, 64, resizeMode, keepMetadata);
  return { output, achieved: output.data.length <= targetBytes, resized: true };
}

export async function compressImage(
  input: Buffer,
  inputFormat: ImageFormat,
  originalName: string,
  settings: CompressionSettings
): Promise<{ data: Buffer; result: CompressionResult; originalWidth: number; originalHeight: number }> {
  let metadata;
  try {
    metadata = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "warning" }).metadata();
  } catch {
    throw new ValidationError("This image is damaged, unsafe, or too large to decode.", "DECODE_FAILED", 422);
  }
  if (!metadata.width || !metadata.height) throw new ValidationError("We could not read this image's dimensions.", "DECODE_FAILED", 422);
  if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION || metadata.width * metadata.height > MAX_INPUT_PIXELS) {
    throw new ValidationError("This image has too many pixels. Use an image under 40 megapixels and 16,384px per side.", "PIXEL_LIMIT", 413);
  }
  if ((metadata.pages ?? 1) > 1) throw new ValidationError("Animated images are not supported yet.", "ANIMATED_IMAGE", 422);

  const format = outputFormat(inputFormat, settings.outputFormat);
  const warnings: string[] = [];
  let encoded: Awaited<ReturnType<typeof encode>>;
  let targetAchieved: boolean | null = null;

  if (settings.mode === "target") {
    const target = await encodeForTarget(
      input,
      format,
      settings.targetSizeKb! * 1024,
      metadata.width,
      metadata.height,
      settings.maxWidth,
      settings.maxHeight,
      settings.resizeMode,
      settings.keepMetadata,
      settings.quality
    );
    encoded = target.output;
    targetAchieved = target.achieved;
    if (target.resized) warnings.push("Dimensions were reduced to help meet your target size.");
    if (!target.achieved) warnings.push("The closest safe result is still above your requested target.");
  } else {
    const quality = settings.quality ?? (settings.mode in PRESET_QUALITY ? PRESET_QUALITY[settings.mode as keyof typeof PRESET_QUALITY] : 75);
    encoded = await encode(
      input,
      format,
      quality,
      settings.maxWidth,
      settings.maxHeight,
      settings.resizeMode,
      settings.keepMetadata
    );
  }

  const width = encoded.info.width;
  const height = encoded.info.height;
  if (encoded.data.length >= input.length) warnings.push("This image was already well optimized; the result may not be smaller.");
  const fileName = `${safeBaseName(originalName)}-compressed.${extensionFor(format)}`;
  return {
    data: encoded.data,
    originalWidth: metadata.width,
    originalHeight: metadata.height,
    result: {
      fileName,
      mimeType: mimeFor(format),
      width,
      height,
      size: encoded.data.length,
      format,
      targetAchieved,
      warnings
    }
  };
}
