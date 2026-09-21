import os from "node:os";
import path from "node:path";

export const MAX_FILES = Number(process.env.SIZVO_MAX_FILES ?? process.env.COMPRESSLY_MAX_FILES ?? 20);
export const MAX_FILE_BYTES = Number(process.env.SIZVO_MAX_FILE_MB ?? process.env.COMPRESSLY_MAX_FILE_MB ?? 50) * 1024 * 1024;
export const MAX_VIDEO_FILE_BYTES = Number(process.env.SIZVO_MAX_VIDEO_MB ?? process.env.COMPRESSLY_MAX_VIDEO_MB ?? 500) * 1024 * 1024;
export const MAX_VIDEO_FILES = Number(process.env.SIZVO_MAX_VIDEOS ?? process.env.COMPRESSLY_MAX_VIDEOS ?? 5);
export const MAX_VIDEO_DURATION_SECONDS = Number(process.env.SIZVO_MAX_VIDEO_MINUTES ?? process.env.COMPRESSLY_MAX_VIDEO_MINUTES ?? 30) * 60;
export const MAX_INPUT_PIXELS = 40_000_000;
export const MAX_DIMENSION = 16_384;
export const JOB_TTL_MS = Number(process.env.SIZVO_JOB_TTL_MINUTES ?? process.env.COMPRESSLY_JOB_TTL_MINUTES ?? 30) * 60 * 1000;

function nonEmptyEnvironmentValue(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value));
}

const configuredTempRoot = nonEmptyEnvironmentValue(
  process.env.SIZVO_TEMP_DIR,
  process.env.COMPRESSLY_TEMP_DIR
);

export const TEMP_ROOT = configuredTempRoot ?? (
  process.env.VERCEL
    ? path.join(os.tmpdir(), "sizvo")
    : path.join(process.cwd(), "tmp", "sizvo")
);
export const FFMPEG_PATH = process.env.FFMPEG_PATH ?? "ffmpeg";
export const FFPROBE_PATH = process.env.FFPROBE_PATH ?? "ffprobe";
