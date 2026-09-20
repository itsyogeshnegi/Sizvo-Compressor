import { readFile } from "node:fs/promises";
import { apiError } from "@/lib/compression/errors";
import { getJob, outputPath } from "@/lib/compression/storage";
import { ValidationError } from "@/lib/compression/validation";
import { createZipArchive, type ZipEntry } from "@/lib/compression/zip";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const job = await getJob(jobId);
    if (!job.files.length) throw new ValidationError("Compress at least one image before downloading a ZIP.");

    const usedNames = new Map<string, number>();
    const entries: ZipEntry[] = [];
    for (const file of job.files) {
      const count = usedNames.get(file.fileName) ?? 0;
      usedNames.set(file.fileName, count + 1);
      const name = count ? file.fileName.replace(/(\.[^.]+)$/, `-${count + 1}$1`) : file.fileName;
      const content = await readFile(outputPath(jobId, file.id));
      entries.push({ name, content });
    }

    const zipBuffer = createZipArchive(entries);

    return new Response(new Uint8Array(zipBuffer), {
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

