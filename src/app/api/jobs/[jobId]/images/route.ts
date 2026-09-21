import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { compressImage } from "@/lib/compression/compress";
import { MAX_FILE_BYTES, MAX_FILES } from "@/lib/compression/config";
import { apiError } from "@/lib/compression/errors";
import { clientKey, enforceRateLimit } from "@/lib/compression/rate-limit";
import { heavyJobLimiter } from "@/lib/compression/concurrency";
import { addJobFile, getJob, outputPath } from "@/lib/compression/storage";
import { detectImageFormat, isObviouslyAnimated, parseSettings, validateExtension, ValidationError } from "@/lib/compression/validation";
import type { JobFileRecord } from "@/lib/compression/types";

export const runtime = "nodejs";

const maxFileMegabytes = MAX_FILE_BYTES / (1024 * 1024);

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const clientIp = clientKey(request);
    enforceRateLimit(`upload:${clientIp}`, 60);
    const { jobId } = await params;
    const job = await getJob(jobId);
    if (job.files.length >= MAX_FILES) throw new ValidationError(`A job can contain up to ${MAX_FILES} images.`, "FILE_LIMIT", 413);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ValidationError("Choose an image to compress.");
    if (file.size <= 0) throw new ValidationError("The selected file is empty.");
    if (file.size > MAX_FILE_BYTES) throw new ValidationError(`Images must be ${maxFileMegabytes} MB or smaller.`, "FILE_TOO_LARGE", 413);

    const input = Buffer.from(await file.arrayBuffer());
    const format = detectImageFormat(input);
    if (!format) throw new ValidationError("Use a JPEG, PNG, WebP, or AVIF image.", "UNSUPPORTED_FORMAT", 415);
    validateExtension(file.name, format);
    if (isObviouslyAnimated(input, format)) throw new ValidationError("Animated images are not supported yet.", "ANIMATED_IMAGE", 422);
    const settings = parseSettings(form.get("settings"));

    const release = await heavyJobLimiter.acquire(clientIp);
    let compressed;
    try {
      compressed = await compressImage(input, format, file.name, settings);
    } finally {
      release();
    }

    const id = randomBytes(24).toString("hex");
    await writeFile(outputPath(jobId, id), compressed.data, { flag: "wx" });

    const record: JobFileRecord = {
      id,
      mediaType: "image",
      ...compressed.result,
      originalName: file.name,
      originalSize: file.size,
      originalWidth: compressed.originalWidth,
      originalHeight: compressed.originalHeight,
      savedBytes: Math.max(0, file.size - compressed.result.size),
      savedPercent: Math.max(0, Math.round((1 - compressed.result.size / file.size) * 1000) / 10),
      createdAt: new Date().toISOString()
    };
    await addJobFile(jobId, record);
    return NextResponse.json({ file: record }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
