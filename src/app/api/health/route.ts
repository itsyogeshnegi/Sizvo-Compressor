import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ status: "ok", service: "sizvo-compressor", time: new Date().toISOString() });
}
