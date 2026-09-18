import { spawn } from "node:child_process";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { FFMPEG_PATH, FFPROBE_PATH, MAX_VIDEO_DURATION_SECONDS } from "./config";
import type { VideoCompressionResult, VideoCompressionSettings } from "./types";
import { safeBaseName, ValidationError } from "./validation";

type VideoProbe = {
  format: { duration?: string; format_name?: string };
  streams: Array<{ codec_type?: string; width?: number; height?: number }>;
};

function run(command: string, args: string[], signal?: AbortSignal) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(new ValidationError("Video compression took too long and was stopped.", "VIDEO_TIMEOUT", 408));
    }, 30 * 60 * 1000);
    timer.unref();
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      if (error) reject(error); else resolve({ stdout, stderr });
    };
    const abort = () => {
      child.kill("SIGKILL");
      finish(new ValidationError("Video compression was cancelled.", "CANCELLED", 499));
    };
    signal?.addEventListener("abort", abort, { once: true });
    child.stdout.on("data", (chunk: Buffer) => { stdout = (stdout + chunk.toString()).slice(-1_000_000); });
    child.stderr.on("data", (chunk: Buffer) => { stderr = (stderr + chunk.toString()).slice(-100_000); });
    child.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") finish(new ValidationError("Video compression is unavailable because FFmpeg is not installed on this server.", "FFMPEG_UNAVAILABLE", 503));
      else finish(error);
    });
    child.on("close", (code) => {
      if (code === 0) finish();
      else finish(new ValidationError("This video could not be processed. It may be damaged or use an unsupported codec.", "VIDEO_PROCESSING_FAILED", 422));
    });
  });
}

export async function probeVideo(filePath: string, signal?: AbortSignal) {
  const { stdout } = await run(FFPROBE_PATH, ["-v", "error", "-show_format", "-show_streams", "-of", "json", filePath], signal);
  let probe: VideoProbe;
  try { probe = JSON.parse(stdout) as VideoProbe; }
  catch { throw new ValidationError("We could not read this video's details.", "VIDEO_PROBE_FAILED", 422); }
  const video = probe.streams.find((stream) => stream.codec_type === "video");
  const duration = Number(probe.format.duration);
  if (!video?.width || !video.height || !Number.isFinite(duration) || duration <= 0) {
    throw new ValidationError("The file does not contain a supported video track.", "UNSUPPORTED_VIDEO", 415);
  }
  if (duration > MAX_VIDEO_DURATION_SECONDS) {
    throw new ValidationError(`Videos must be ${MAX_VIDEO_DURATION_SECONDS / 60} minutes or shorter.`, "VIDEO_TOO_LONG", 413);
  }
  if (video.width > 7680 || video.height > 4320) {
    throw new ValidationError("Videos larger than 8K are not supported.", "VIDEO_DIMENSIONS", 413);
  }
  return { duration, width: video.width, height: video.height, formatName: probe.format.format_name ?? "" };
}

export function videoFilter(settings: VideoCompressionSettings) {
  if (settings.maxWidth && settings.maxHeight) {
    if (settings.resizeMode === "exact") {
      return `scale=${settings.maxWidth}:${settings.maxHeight}:force_original_aspect_ratio=increase,crop=${settings.maxWidth}:${settings.maxHeight}`;
    }
    return `scale=${settings.maxWidth}:${settings.maxHeight}:force_original_aspect_ratio=decrease:force_divisible_by=2`;
  }
  return "scale=trunc(iw/2)*2:trunc(ih/2)*2";
}

export async function compressVideo(
  inputPath: string,
  outputPath: string,
  originalName: string,
  settings: VideoCompressionSettings,
  signal?: AbortSignal
): Promise<VideoCompressionResult> {
  const input = await probeVideo(inputPath, signal);
  const extension = path.extname(originalName).toLowerCase();
  const expectedContainer = extension === ".webm" ? /webm|matroska/ : /mov|mp4|3gp|mj2/;
  if (!expectedContainer.test(input.formatName)) {
    throw new ValidationError("The video contents do not match its file extension.", "VIDEO_EXTENSION_MISMATCH", 415);
  }

  const common = ["-y", "-i", inputPath, "-map", "0:v:0", ...(settings.removeAudio ? ["-an"] : ["-map", "0:a:0?", "-c:a", "aac"]), "-vf", videoFilter(settings), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-map_metadata", "-1"];
  const warnings: string[] = [];

  if (settings.mode === "target") {
    const targetBytes = settings.targetSizeMb! * 1024 * 1024;
    const audioKbps = settings.removeAudio ? 0 : 96;
    const availableKbps = targetBytes * 8 * 0.92 / input.duration / 1000;
    const videoKbps = Math.max(100, Math.floor(availableKbps - audioKbps));
    const passLog = `${outputPath}-pass`;
    await run(FFMPEG_PATH, ["-y", "-i", inputPath, "-map", "0:v:0", "-vf", videoFilter(settings), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-b:v", `${videoKbps}k`, "-pass", "1", "-passlogfile", passLog, "-an", "-f", "null", "-"], signal);
    await run(FFMPEG_PATH, [...common, "-b:v", `${videoKbps}k`, "-pass", "2", "-passlogfile", passLog, ...(settings.removeAudio ? [] : ["-b:a", `${audioKbps}k`]), "-f", "mp4", outputPath], signal);
    await Promise.all(["-0.log", "-0.log.mbtree"].map((suffix) => unlink(`${passLog}${suffix}`).catch(() => undefined)));
  } else {
    const preset = {
      quality: { crf: "20", speed: "medium", audio: "128k" },
      balanced: { crf: "26", speed: "medium", audio: "96k" },
      smallest: { crf: "32", speed: "slow", audio: "64k" }
    }[settings.mode];
    await run(FFMPEG_PATH, [...common, "-crf", preset.crf, "-preset", preset.speed, ...(settings.removeAudio ? [] : ["-b:a", preset.audio]), "-f", "mp4", outputPath], signal);
  }

  const { stat } = await import("node:fs/promises");
  const outputInfo = await probeVideo(outputPath, signal);
  const size = (await stat(outputPath)).size;
  const targetAchieved = settings.mode === "target" ? size <= settings.targetSizeMb! * 1024 * 1024 : null;
  if (targetAchieved === false) warnings.push("The closest playable result is above your target size. Try smaller dimensions or remove audio.");
  return {
    fileName: `${safeBaseName(originalName)}-compressed.mp4`,
    mimeType: "video/mp4",
    width: outputInfo.width,
    height: outputInfo.height,
    duration: outputInfo.duration,
    originalWidth: input.width,
    originalHeight: input.height,
    size,
    format: "mp4",
    targetAchieved,
    warnings
  };
}
