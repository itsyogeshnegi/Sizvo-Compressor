import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { compressImage } from "./compress";

async function samplePng() {
  return sharp({ create: { width: 800, height: 600, channels: 4, background: { r: 104, g: 86, b: 229, alpha: 0.75 } } }).png().toBuffer();
}

describe("compressImage", () => {
  it("converts formats, removes metadata, and returns result metadata", async () => {
    const input = await samplePng();
    const output = await compressImage(input, "png", "sample.png", { mode: "balanced", outputFormat: "webp", resizeMode: "fit", keepMetadata: false });
    expect(output.result.format).toBe("webp");
    expect(output.result.fileName).toBe("sample-compressed.webp");
    expect(output.result.width).toBe(800);
    expect(output.result.height).toBe(600);
    expect(output.data.length).toBeGreaterThan(0);
  });

  it("respects maximum dimensions", async () => {
    const input = await samplePng();
    const output = await compressImage(input, "png", "sample.png", { mode: "quality", outputFormat: "jpeg", maxWidth: 400, resizeMode: "fit", keepMetadata: false });
    expect(output.result.width).toBe(400);
    expect(output.result.height).toBe(300);
  });

  it("reports target-size status", async () => {
    const input = await samplePng();
    const output = await compressImage(input, "png", "sample.png", { mode: "target", outputFormat: "webp", targetSizeKb: 10, resizeMode: "fit", keepMetadata: false });
    expect(output.result.targetAchieved).toBe(true);
    expect(output.result.size).toBeLessThanOrEqual(10 * 1024);
  });

  it("keeps resizing a difficult photo until it reaches 10 KB", async () => {
    const pixels = Buffer.alloc(800 * 600 * 3);
    let value = 123456789;
    for (let index = 0; index < pixels.length; index += 1) {
      value = (value * 1664525 + 1013904223) >>> 0;
      pixels[index] = value & 255;
    }
    const input = await sharp(pixels, { raw: { width: 800, height: 600, channels: 3 } }).jpeg({ quality: 92 }).toBuffer();
    const output = await compressImage(input, "jpeg", "detailed-photo.jpg", { mode: "target", outputFormat: "webp", targetSizeKb: 10, resizeMode: "fit", keepMetadata: false });
    expect(input.length).toBeGreaterThan(250 * 1024);
    expect(output.result.targetAchieved).toBe(true);
    expect(output.result.size).toBeLessThanOrEqual(10 * 1024);
    expect(output.result.width).toBeLessThan(800);
  });

  it("creates the exact requested width and height", async () => {
    const input = await samplePng();
    const output = await compressImage(input, "png", "banner.png", {
      mode: "balanced",
      outputFormat: "webp",
      maxWidth: 320,
      maxHeight: 180,
      resizeMode: "exact",
      keepMetadata: false
    });
    expect(output.result.width).toBe(320);
    expect(output.result.height).toBe(180);
  });

  it("compresses with custom quality percentage", async () => {
    const pixels = Buffer.alloc(200 * 200 * 3);
    for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 37) % 256;
    const input = await sharp(pixels, { raw: { width: 200, height: 200, channels: 3 } }).jpeg().toBuffer();
    const output40 = await compressImage(input, "jpeg", "test.jpg", {
      mode: "custom",
      quality: 40,
      outputFormat: "jpeg",
      resizeMode: "fit",
      keepMetadata: false
    });
    const output90 = await compressImage(input, "jpeg", "test.jpg", {
      mode: "custom",
      quality: 90,
      outputFormat: "jpeg",
      resizeMode: "fit",
      keepMetadata: false
    });
    expect(output40.result.format).toBe("jpeg");
    expect(output40.result.size).toBeLessThan(output90.result.size);
  });

  it("respects both quality percentage and target KB size together", async () => {
    const input = await samplePng();
    const output = await compressImage(input, "png", "sample.png", {
      mode: "target",
      quality: 62,
      targetSizeKb: 15,
      outputFormat: "jpeg",
      resizeMode: "fit",
      keepMetadata: false
    });
    expect(output.result.targetAchieved).toBe(true);
    expect(output.result.size).toBeLessThanOrEqual(15 * 1024);
  });
});
