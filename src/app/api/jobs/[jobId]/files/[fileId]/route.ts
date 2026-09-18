import { readFile } from "node:fs/promises";
import { apiError } from "@/lib/compression/errors";
import { getJob, outputPath } from "@/lib/compression/storage";
import { ValidationError } from "@/lib/compression/validation";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string; fileId: string }> }) {
  try {
    const { jobId, fileId } = await params;
    const job = await getJob(jobId);
    const file = job.files.find((entry) => entry.id === fileId);
    if (!file) throw new ValidationError("Compressed file not found.", "FILE_NOT_FOUND", 404);
    const data = await readFile(outputPath(jobId, fileId));
    return new Response(data, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(data.length),
        "Content-Disposition": `${new URL(request.url).searchParams.has("preview") ? "inline" : "attachment"}; filename="${file.fileName.replace(/["\\]/g, "-")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
