import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("runtime configuration", () => {
  it("ignores blank temp directory variables on Vercel", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("SIZVO_TEMP_DIR", "");
    vi.stubEnv("COMPRESSLY_TEMP_DIR", "   ");
    vi.resetModules();

    const { TEMP_ROOT } = await import("./config");
    expect(TEMP_ROOT).toBe(path.join(os.tmpdir(), "sizvo"));
  });

  it("uses safe defaults when numeric environment variables are blank", async () => {
    vi.stubEnv("SIZVO_MAX_FILES", "");
    vi.stubEnv("SIZVO_MAX_FILE_MB", "   ");
    vi.stubEnv("SIZVO_MAX_VIDEO_MB", "");
    vi.stubEnv("SIZVO_MAX_VIDEOS", "");
    vi.stubEnv("SIZVO_MAX_VIDEO_MINUTES", "");
    vi.stubEnv("SIZVO_JOB_TTL_MINUTES", "");
    vi.resetModules();

    const config = await import("./config");
    expect(config.MAX_FILES).toBe(20);
    expect(config.MAX_FILE_BYTES).toBe(50 * 1024 * 1024);
    expect(config.MAX_VIDEO_FILE_BYTES).toBe(500 * 1024 * 1024);
    expect(config.MAX_VIDEO_FILES).toBe(5);
    expect(config.MAX_VIDEO_DURATION_SECONDS).toBe(30 * 60);
    expect(config.JOB_TTL_MS).toBe(30 * 60 * 1000);
  });

  it("skips invalid primary values and accepts valid legacy fallbacks", async () => {
    vi.stubEnv("SIZVO_MAX_FILE_MB", "not-a-number");
    vi.stubEnv("COMPRESSLY_MAX_FILE_MB", "25");
    vi.stubEnv("SIZVO_MAX_FILES", "2.5");
    vi.stubEnv("COMPRESSLY_MAX_FILES", "12");
    vi.resetModules();

    const config = await import("./config");
    expect(config.MAX_FILE_BYTES).toBe(25 * 1024 * 1024);
    expect(config.MAX_FILES).toBe(12);
  });
});
