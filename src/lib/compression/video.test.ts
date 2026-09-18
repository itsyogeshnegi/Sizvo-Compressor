import { describe, expect, it } from "vitest";
import { parseVideoSettings } from "./validation";
import { videoFilter } from "./video";

describe("video compression settings", () => {
  it("uses an even-dimension filter when preserving the original resolution", () => {
    expect(videoFilter({ mode: "balanced", resizeMode: "fit", removeAudio: false })).toContain("trunc(iw/2)");
  });

  it("builds aspect-preserving and exact dimension filters", () => {
    expect(videoFilter({ mode: "balanced", resizeMode: "fit", maxWidth: 1280, maxHeight: 720, removeAudio: false })).toContain("force_original_aspect_ratio=decrease");
    expect(videoFilter({ mode: "smallest", resizeMode: "exact", maxWidth: 640, maxHeight: 360, removeAudio: true })).toContain("crop=640:360");
  });

  it("validates target size and exact dimensions", () => {
    expect(() => parseVideoSettings(JSON.stringify({ mode: "target", resizeMode: "fit" }))).toThrow("target video size");
    expect(() => parseVideoSettings(JSON.stringify({ mode: "balanced", resizeMode: "exact", maxWidth: 640 }))).toThrow("both a width and a height");
    expect(parseVideoSettings(JSON.stringify({ mode: "target", targetSizeMb: 20, resizeMode: "fit" }))).toMatchObject({ targetSizeMb: 20, removeAudio: false });
  });
});
