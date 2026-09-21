import os from "node:os";
import path from "node:path";

function nonEmptyEnvironmentValue(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value));
}

function positiveEnvironmentNumber(fallback: number, ...values: Array<string | undefined>) {
  for (const value of values) {
    if (!value?.trim()) continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

function positiveEnvironmentInteger(fallback: number, ...values: Array<string | undefined>) {
  for (const value of values) {
    if (!value?.trim()) continue;
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

export const MAX_FILES = positiveEnvironmentInteger(20, process.env.SIZVO_MAX_FILES, process.env.COMPRESSLY_MAX_FILES);
export const MAX_FILE_BYTES = positiveEnvironmentNumber(50, process.env.SIZVO_MAX_FILE_MB, process.env.COMPRESSLY_MAX_FILE_MB) * 1024 * 1024;
export const MAX_VIDEO_FILE_BYTES = positiveEnvironmentNumber(500, process.env.SIZVO_MAX_VIDEO_MB, process.env.COMPRESSLY_MAX_VIDEO_MB) * 1024 * 1024;
export const MAX_VIDEO_FILES = positiveEnvironmentInteger(5, process.env.SIZVO_MAX_VIDEOS, process.env.COMPRESSLY_MAX_VIDEOS);
export const MAX_VIDEO_DURATION_SECONDS = positiveEnvironmentNumber(30, process.env.SIZVO_MAX_VIDEO_MINUTES, process.env.COMPRESSLY_MAX_VIDEO_MINUTES) * 60;
export const MAX_INPUT_PIXELS = 40_000_000;
export const MAX_DIMENSION = 16_384;
export const JOB_TTL_MS = positiveEnvironmentNumber(30, process.env.SIZVO_JOB_TTL_MINUTES, process.env.COMPRESSLY_JOB_TTL_MINUTES) * 60 * 1000;

const configuredTempRoot = nonEmptyEnvironmentValue(
  process.env.SIZVO_TEMP_DIR,
  process.env.COMPRESSLY_TEMP_DIR
);

export const TEMP_ROOT = configuredTempRoot ?? (
  process.env.VERCEL
    ? path.join(os.tmpdir(), "sizvo")
    : path.join(process.cwd(), "tmp", "sizvo")
);
export const FFMPEG_PATH = nonEmptyEnvironmentValue(process.env.FFMPEG_PATH) ?? "ffmpeg";
export const FFPROBE_PATH = nonEmptyEnvironmentValue(process.env.FFPROBE_PATH) ?? "ffprobe";
