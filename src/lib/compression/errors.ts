import { NextResponse } from "next/server";
import { ValidationError } from "./validation";
import { RateLimitError } from "./rate-limit";

export function apiError(error: unknown) {
  if (error instanceof ValidationError || error instanceof RateLimitError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  if (error && typeof error === "object" && "status" in error && "code" in error) {
    const err = error as { code: string; message: string; status: number };
    return NextResponse.json({ error: { code: err.code, message: err.message } }, { status: err.status });
  }
  console.error(error);
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong while processing your media." } }, { status: 500 });
}
