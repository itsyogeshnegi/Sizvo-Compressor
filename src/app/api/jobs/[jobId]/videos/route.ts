import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Video compression endpoint - Temporarily deferred to Phase 2.
 * The full implementation is preserved below for Phase 2 activation.
 */
export async function POST() {
  return NextResponse.json(
    { message: "Video compression is coming in Phase 2." },
    { status: 501 }
  );
}

/*
================================================================================
PHASE 2 IMPLEMENTATION PRESERVED FOR FUTURE ACTIVATION:
================================================================================
import { randomBytes } from "node:crypto";
import { createWriteStream } from "node:fs";
import { rm } from "node:fs/promises";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { MAX_VIDEO_FILE_BYTES, MAX_VIDEO_FILES } from "@/lib/compression/config";
import { apiError } from "@/lib/compression/errors";
import { clientKey, enforceRateLimit } from "@/lib/compression/rate-limit";
import { heavyJobLimiter } from "@/lib/compression/concurrency";
import { addJobFile, getJob, outputPath } from "@/lib/compression/storage";
import type { JobFileRecord } from "@/lib/compression/types";
import { parseVideoSettings, ValidationError } from "@/lib/compression/validation";
import { compressVideo } from "@/lib/compression/video";

export async function POST_PHASE_2(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  let inputPath: string | null = null;
  let outputFilePath: string | null = null;
  try {
    const clientIp = clientKey(request);
    enforceRateLimit(`video:${clientIp}`, 10, 60 * 60 * 1000);
    const { jobId } = await params;
    const job = await getJob(jobId);
    if (job.files.filter((file) => file.mediaType === "video").length >= MAX_VIDEO_FILES) {
      throw new ValidationError(`A job can contain up to ${MAX_VIDEO_FILES} videos.`, "VIDEO_FILE_LIMIT", 413);
    }
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_VIDEO_FILE_BYTES) throw new ValidationError("Videos must be 500 MB or smaller.", "VIDEO_TOO_LARGE", 413);
    if (!request.body) throw new ValidationError("Choose a video to compress.");
    let originalName = "video.mp4";
    try { originalName = decodeURIComponent(request.headers.get("x-file-name") ?? originalName); } catch { throw new ValidationError("The video filename is invalid."); }
    if (!/\.(mp4|mov|webm)$/i.test(originalName)) throw new ValidationError("Use an MP4, MOV, or WebM video.", "UNSUPPORTED_VIDEO", 415);
    const settings = parseVideoSettings(request.headers.get("x-compression-settings"));
    const inputId = randomBytes(24).toString("hex");
    const outputId = randomBytes(24).toString("hex");
    inputPath = outputPath(jobId, inputId);
    outputFilePath = outputPath(jobId, outputId);
    let received = 0;
    const limiter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        received += chunk.length;
        if (received > MAX_VIDEO_FILE_BYTES) callback(new ValidationError("Videos must be 500 MB or smaller.", "VIDEO_TOO_LARGE", 413));
        else callback(null, chunk);
      }
    });
    await pipeline(Readable.fromWeb(request.body as import("node:stream/web").ReadableStream), limiter, createWriteStream(inputPath, { flags: "wx" }));
    if (received === 0) throw new ValidationError("The selected video is empty.");

    const release = await heavyJobLimiter.acquire(clientIp);
    let compressed;
    try {
      compressed = await compressVideo(inputPath, outputFilePath, originalName, settings, request.signal);
    } finally {
      release();
    }
    const record: JobFileRecord = {
      id: outputId,
      mediaType: "video",
      ...compressed,
      originalName,
      originalSize: received,
      savedBytes: Math.max(0, received - compressed.size),
      savedPercent: Math.max(0, Math.round((1 - compressed.size / received) * 1000) / 10),
      createdAt: new Date().toISOString()
    };
    await addJobFile(jobId, record);
    await rm(inputPath, { force: true });
    inputPath = null;
    return NextResponse.json({ file: record }, { status: 201 });
  } catch (error) {
    if (inputPath) await rm(inputPath, { force: true }).catch(() => undefined);
    if (outputFilePath) await rm(outputFilePath, { force: true }).catch(() => undefined);
    return apiError(error);
  }
}
================================================================================
*/
