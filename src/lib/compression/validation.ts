import path from "node:path";
import { z } from "zod";
import type { CompressionSettings, ImageFormat, VideoCompressionSettings } from "./types";

const settingsSchema = z.object({
  mode: z.enum(["quality", "balanced", "smallest", "target", "custom"]).default("balanced"),
  quality: z.number().int().min(1).max(100).optional(),
  outputFormat: z.enum(["original", "jpeg", "png", "webp", "avif"]).default("original"),
  targetSizeKb: z.number().int().min(10).max(51_200).optional(),
  maxWidth: z.number().int().min(64).max(16_384).optional(),
  maxHeight: z.number().int().min(64).max(16_384).optional(),
  resizeMode: z.enum(["fit", "exact"]).default("fit"),
  keepMetadata: z.boolean().default(false)
}).superRefine((data, ctx) => {
  if (data.mode === "target" && !data.targetSizeKb) {
    ctx.addIssue({ code: "custom", path: ["targetSizeKb"], message: "Choose a target size." });
  }
  if (data.resizeMode === "exact" && (!data.maxWidth || !data.maxHeight)) {
    ctx.addIssue({ code: "custom", path: ["resizeMode"], message: "Exact size needs both a width and a height." });
  }
});

const videoSettingsSchema = z.object({
  mode: z.enum(["quality", "balanced", "smallest", "target"]).default("balanced"),
  targetSizeMb: z.number().min(0.1).max(500).optional(),
  maxWidth: z.number().int().min(64).max(7680).optional(),
  maxHeight: z.number().int().min(64).max(4320).optional(),
  resizeMode: z.enum(["fit", "exact"]).default("fit"),
  removeAudio: z.boolean().default(false)
}).superRefine((data, ctx) => {
  if (data.mode === "target" && !data.targetSizeMb) {
    ctx.addIssue({ code: "custom", path: ["targetSizeMb"], message: "Choose a target video size." });
  }
  if (data.resizeMode === "exact" && (!data.maxWidth || !data.maxHeight)) {
    ctx.addIssue({ code: "custom", path: ["resizeMode"], message: "Exact size needs both a width and a height." });
  }
});

const EXTENSIONS: Record<ImageFormat, string[]> = {
  jpeg: [".jpg", ".jpeg"],
  png: [".png"],
  webp: [".webp"],
  avif: [".avif"]
};

export class ValidationError extends Error {
  constructor(message: string, public code = "INVALID_INPUT", public status = 400) {
    super(message);
  }
}

export function parseSettings(value: FormDataEntryValue | null): CompressionSettings {
  try {
    const raw = typeof value === "string" ? JSON.parse(value) : {};
    return settingsSchema.parse(raw);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.issues[0]?.message ?? "Invalid compression settings.");
    }
    throw new ValidationError("Compression settings must be valid JSON.");
  }
}

export function parseVideoSettings(value: string | null): VideoCompressionSettings {
  try {
    return videoSettingsSchema.parse(JSON.parse(value ?? "{}"));
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.issues[0]?.message ?? "Invalid video settings.");
    }
    throw new ValidationError("Video settings must be valid JSON.");
  }
}

export function detectImageFormat(buffer: Buffer): ImageFormat | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12);
    if (["avif", "avis", "mif1"].includes(brand)) return "avif";
  }
  return null;
}

export function validateExtension(fileName: string, format: ImageFormat) {
  const ext = path.extname(fileName).toLowerCase();
  if (!EXTENSIONS[format].includes(ext)) {
    throw new ValidationError(`The file contents are ${format.toUpperCase()}, but the extension does not match.`);
  }
}

export function isObviouslyAnimated(buffer: Buffer, format: ImageFormat) {
  if (format === "png") return buffer.includes(Buffer.from("acTL"));
  if (format === "webp") return buffer.includes(Buffer.from("ANIM"));
  if (format === "avif") return buffer.subarray(0, Math.min(buffer.length, 128)).includes(Buffer.from("avis"));
  return false;
}

export function safeBaseName(fileName: string) {
  const ext = path.extname(fileName);
  const raw = path.basename(fileName, ext).normalize("NFKC");
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^[.-]+|[.-]+$/g, "").slice(0, 80);
  return cleaned || "image";
}

export function extensionFor(format: ImageFormat) {
  return format === "jpeg" ? "jpg" : format;
}

export function mimeFor(format: ImageFormat) {
  return format === "jpeg" ? "image/jpeg" : `image/${format}`;
}
