import { PassThrough, Readable } from "node:stream";
import archiver from "archiver";
import { apiError } from "@/lib/compression/errors";
import { getJob, outputPath } from "@/lib/compression/storage";
import { ValidationError } from "@/lib/compression/validation";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const job = await getJob(jobId);
    if (!job.files.length) throw new ValidationError("Compress at least one image before downloading a ZIP.");
    const output = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 1 } });
    archive.on("error", (error) => output.destroy(error));
    archive.pipe(output);
    const usedNames = new Map<string, number>();
    for (const file of job.files) {
      const count = usedNames.get(file.fileName) ?? 0;
      usedNames.set(file.fileName, count + 1);
      const name = count ? file.fileName.replace(/(\.[^.]+)$/, `-${count + 1}$1`) : file.fileName;
      archive.file(outputPath(jobId, file.id), { name });
    }
    void archive.finalize();
    return new Response(Readable.toWeb(output) as ReadableStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=sizvo-images.zip",
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
