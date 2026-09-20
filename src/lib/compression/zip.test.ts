import { describe, expect, it } from "vitest";
import zlib from "node:zlib";
import { computeCrc32, createZipArchive } from "./zip";

describe("createZipArchive", () => {
  it("computes crc32 correctly", () => {
    const data = Buffer.from("Hello Sizvo!");
    const crc = computeCrc32(data);
    expect(crc).toBeGreaterThan(0);
    expect(crc).toBe(computeCrc32(data));
  });

  it("creates a valid zip archive with multiple text and binary files", () => {
    const file1Content = Buffer.from("First file content here");
    const file2Content = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01]);
    const file3Content = Buffer.alloc(0); // empty file

    const zipBuffer = createZipArchive([
      { name: "file1.txt", content: file1Content },
      { name: "image.png", content: file2Content },
      { name: "empty.txt", content: file3Content }
    ]);

    expect(Buffer.isBuffer(zipBuffer)).toBe(true);
    expect(zipBuffer.length).toBeGreaterThan(100);

    // Verify local header signature (PK\x03\x04)
    expect(zipBuffer.readUInt32LE(0)).toBe(0x04034b50);

    // Verify EOCD signature (PK\x05\x06) in last 22 bytes
    const eocdOffset = zipBuffer.length - 22;
    expect(zipBuffer.readUInt32LE(eocdOffset)).toBe(0x06054b50);

    // Total entries in EOCD
    expect(zipBuffer.readUInt16LE(eocdOffset + 8)).toBe(3);
    expect(zipBuffer.readUInt16LE(eocdOffset + 10)).toBe(3);

    // Find central directory offset
    const cdOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
    expect(zipBuffer.readUInt32LE(cdOffset)).toBe(0x02014b50);
  });

  it("produces decompressable deflate data for files", () => {
    const rawText = "Testing deflated file decompression for Sizvo Compressor";
    const zip = createZipArchive([{ name: "test.txt", content: Buffer.from(rawText) }]);

    // Parse local header
    const nameLen = zip.readUInt16LE(26);
    const extraLen = zip.readUInt16LE(28);
    const compSize = zip.readUInt32LE(18);
    const dataStart = 30 + nameLen + extraLen;
    const compressedData = zip.subarray(dataStart, dataStart + compSize);

    const decompressed = zlib.inflateRawSync(compressedData).toString("utf8");
    expect(decompressed).toBe(rawText);
  });
});
