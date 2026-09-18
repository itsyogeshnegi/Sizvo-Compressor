import { describe, expect, it } from "vitest";
import { detectImageFormat, extensionFor, parseSettings, safeBaseName, validateExtension, ValidationError } from "./validation";

describe("image validation", () => {
  it("detects supported signatures", () => {
    expect(detectImageFormat(Buffer.from([0xff, 0xd8, 0xff]))).toBe("jpeg");
    expect(detectImageFormat(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe("png");
    expect(detectImageFormat(Buffer.from("RIFF0000WEBP"))).toBe("webp");
    expect(detectImageFormat(Buffer.from("0000ftypavif"))).toBe("avif");
    expect(detectImageFormat(Buffer.from("not-an-image"))).toBeNull();
  });

  it("requires the extension to match contents", () => {
    expect(() => validateExtension("photo.jpg", "jpeg")).not.toThrow();
    expect(() => validateExtension("photo.png", "jpeg")).toThrow(ValidationError);
  });

  it("sanitizes hostile file names", () => {
    expect(safeBaseName("../../summer photo?.jpg")).toBe("summer-photo");
    expect(extensionFor("jpeg")).toBe("jpg");
  });

  it("validates target settings", () => {
    expect(() => parseSettings(JSON.stringify({ mode: "target", outputFormat: "webp", keepMetadata: false }))).toThrow("Choose a target size");
    expect(parseSettings(JSON.stringify({ mode: "target", outputFormat: "webp", targetSizeKb: 100, keepMetadata: false }))).toMatchObject({ targetSizeKb: 100 });
  });

  it("requires both dimensions for exact resizing", () => {
    expect(() => parseSettings(JSON.stringify({ mode: "balanced", outputFormat: "webp", resizeMode: "exact", maxWidth: 320 }))).toThrow("both a width and a height");
    expect(parseSettings(JSON.stringify({ mode: "balanced", outputFormat: "webp", resizeMode: "exact", maxWidth: 320, maxHeight: 180 }))).toMatchObject({ resizeMode: "exact", maxWidth: 320, maxHeight: 180 });
  });
});
