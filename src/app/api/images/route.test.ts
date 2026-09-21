import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/images", () => {
  it("returns compressed bytes and download metadata without filesystem storage", async () => {
    const input = await sharp({
      create: { width: 320, height: 240, channels: 3, background: { r: 90, g: 70, b: 210 } }
    }).jpeg({ quality: 95 }).toBuffer();
    const form = new FormData();
    form.set("file", new File([input], "sample.jpg", { type: "image/jpeg" }));
    form.set("settings", JSON.stringify({
      mode: "custom",
      quality: 70,
      outputFormat: "webp",
      resizeMode: "fit",
      keepMetadata: false
    }));

    const response = await POST(new Request("http://localhost/api/images", { method: "POST", body: form }));
    const metadataHeader = response.headers.get("x-sizvo-result");

    expect(response.status).toBe(201);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(metadataHeader).toBeTruthy();
    expect(JSON.parse(decodeURIComponent(metadataHeader!))).toMatchObject({
      fileName: "sample-compressed.webp",
      format: "webp",
      originalName: "sample.jpg"
    });
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });
});
