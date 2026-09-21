import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("temporary storage configuration", () => {
  it("ignores blank temp directory variables on Vercel", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("SIZVO_TEMP_DIR", "");
    vi.stubEnv("COMPRESSLY_TEMP_DIR", "   ");
    vi.resetModules();

    const { TEMP_ROOT } = await import("./config");
    expect(TEMP_ROOT).toBe(path.join(os.tmpdir(), "sizvo"));
  });
});
