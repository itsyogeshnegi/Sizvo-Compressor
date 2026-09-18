import { NextResponse } from "next/server";
import { apiError } from "@/lib/compression/errors";
import { deleteJob } from "@/lib/compression/storage";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    await deleteJob(jobId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
