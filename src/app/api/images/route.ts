import { randomBytes } from "node:crypto";
import { compressImage } from "@/lib/compression/compress";
import { heavyJobLimiter } from "@/lib/compression/concurrency";
import { MAX_FILE_BYTES } from "@/lib/compression/config";
import { apiError } from "@/lib/compression/errors";
import { clientKey, enforceRateLimit } from "@/lib/compression/rate-limit";
import {
  detectImageFormat,
  isObviouslyAnimated,
  parseSettings,
  validateExtension,
  ValidationError
} from "@/lib/compression/validation";
import type { JobFileRecord } from "@/lib/compression/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MULTIPART_OVERHEAD_ALLOWANCE = 1024 * 1024;

export async function POST(request: Request) {
  try {
    const clientIp = clientKey(request);
    enforceRateLimit(`image:${clientIp}`, 60);

    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_FILE_BYTES + MULTIPART_OVERHEAD_ALLOWANCE) {
      throw new ValidationError("Images must be 50 MB or smaller.", "FILE_TOO_LARGE", 413);
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ValidationError("Choose an image to compress.");
    if (file.size <= 0) throw new ValidationError("The selected file is empty.");
    if (file.size > MAX_FILE_BYTES) {
      throw new ValidationError("Images must be 50 MB or smaller.", "FILE_TOO_LARGE", 413);
    }

    const input = Buffer.from(await file.arrayBuffer());
    const format = detectImageFormat(input);
    if (!format) {
      throw new ValidationError("Use a JPEG, PNG, WebP, or AVIF image.", "UNSUPPORTED_FORMAT", 415);
    }
    validateExtension(file.name, format);
    if (isObviouslyAnimated(input, format)) {
      throw new ValidationError("Animated images are not supported yet.", "ANIMATED_IMAGE", 422);
    }

    const settings = parseSettings(form.get("settings"));
    const release = await heavyJobLimiter.acquire(clientIp);
    let compressed;
    try {
      compressed = await compressImage(input, format, file.name, settings);
    } finally {
      release();
    }

    const record: JobFileRecord = {
      id: randomBytes(24).toString("hex"),
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

    return new Response(new Uint8Array(compressed.data), {
      status: 201,
      headers: {
        "Content-Type": record.mimeType,
        "Content-Length": String(compressed.data.length),
        "Content-Disposition": `attachment; filename="${record.fileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Sizvo-Result": encodeURIComponent(JSON.stringify(record))
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
