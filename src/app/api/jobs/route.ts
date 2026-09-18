import { NextResponse } from "next/server";
import { apiError } from "@/lib/compression/errors";
import { clientKey, enforceRateLimit } from "@/lib/compression/rate-limit";
import { cleanupExpiredJobs, createJob } from "@/lib/compression/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    enforceRateLimit(`create:${clientKey(request)}`, 20);
    void cleanupExpiredJobs().catch(console.error);
    const job = await createJob();
    return NextResponse.json({ job: { id: job.id, expiresAt: job.expiresAt } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
