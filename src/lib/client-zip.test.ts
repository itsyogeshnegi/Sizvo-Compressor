import { describe, expect, it } from "vitest";
import { createClientZip } from "./client-zip";

function localEntryNames(data: ArrayBuffer) {
  const bytes = new Uint8Array(data);
  const view = new DataView(data);
  const decoder = new TextDecoder();
  const names: string[] = [];
  let offset = 0;

  while (view.getUint32(offset, true) === 0x04034b50) {
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    names.push(decoder.decode(bytes.subarray(offset + 30, offset + 30 + nameLength)));
    offset += 30 + nameLength + extraLength + size;
  }

  return names;
}

describe("createClientZip", () => {
  it("creates a valid stored archive and resolves colliding names", async () => {
    const archive = await createClientZip([
      { name: "photo.jpg", blob: new Blob(["one"]) },
      { name: "photo.jpg", blob: new Blob(["two"]) },
      { name: "photo-2.jpg", blob: new Blob(["three"]) }
    ]);
    const data = await archive.arrayBuffer();

    expect(new DataView(data).getUint32(0, true)).toBe(0x04034b50);
    expect(localEntryNames(data)).toEqual(["photo.jpg", "photo-2.jpg", "photo-2-2.jpg"]);
  });
});
