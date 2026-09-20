import zlib from "node:zlib";

export interface ZipEntry {
  name: string;
  content: Buffer | Uint8Array;
  mtime?: Date;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

export function computeCrc32(data: Uint8Array): number {
  if (typeof (zlib as { crc32?: (buf: Uint8Array) => number }).crc32 === "function") {
    return (zlib as { crc32: (buf: Uint8Array) => number }).crc32(data);
  }
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = crcTable[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const d = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: d };
}

/**
 * Creates a standard PKZIP archive buffer from an array of file entries.
 * Self-contained with zero external dependencies, using Node.js built-in zlib.
 */
export function createZipArchive(entries: ZipEntry[]): Buffer {
  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name.replace(/\\/g, "/"), "utf8");
    const content = Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content);
    const uncompressedSize = content.length;
    const crc = computeCrc32(content);
    const compressed = uncompressedSize > 0 ? zlib.deflateRawSync(content, { level: 6 }) : Buffer.alloc(0);
    const compressedSize = compressed.length;
    const now = dosDateTime(entry.mtime ?? new Date());

    // Local file header (30 bytes + nameBuf.length)
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0); // Local header signature
    local.writeUInt16LE(20, 4);          // Version needed (2.0)
    local.writeUInt16LE(0x0800, 6);       // Flags (bit 11: UTF-8)
    local.writeUInt16LE(8, 8);           // Compression method (8 = Deflate)
    local.writeUInt16LE(now.time, 10);
    local.writeUInt16LE(now.date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressedSize, 18);
    local.writeUInt32LE(uncompressedSize, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);           // Extra field length
    nameBuf.copy(local, 30);

    localChunks.push(local, compressed);

    // Central directory file header (46 bytes + nameBuf.length)
    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0); // Central directory signature
    central.writeUInt16LE(20, 4);         // Version made by
    central.writeUInt16LE(20, 6);         // Version needed
    central.writeUInt16LE(0x0800, 8);      // Flags (bit 11: UTF-8)
    central.writeUInt16LE(8, 10);         // Compression method (8 = Deflate)
    central.writeUInt16LE(now.time, 12);
    central.writeUInt16LE(now.date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressedSize, 20);
    central.writeUInt32LE(uncompressedSize, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);          // Extra field length
    central.writeUInt16LE(0, 32);          // File comment length
    central.writeUInt16LE(0, 34);          // Disk number start
    central.writeUInt16LE(0, 36);          // Internal file attributes
    central.writeUInt32LE(0, 38);          // External file attributes
    central.writeUInt32LE(offset, 42);     // Relative offset of local header
    nameBuf.copy(central, 46);

    centralChunks.push(central);
    offset += local.length + compressed.length;
  }

  const centralDirOffset = offset;
  const centralDirSize = centralChunks.reduce((acc, chunk) => acc + chunk.length, 0);

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4);          // Number of this disk
  eocd.writeUInt16LE(0, 6);          // Disk where central directory starts
  eocd.writeUInt16LE(entries.length, 8);  // Entries on this disk
  eocd.writeUInt16LE(entries.length, 10); // Total entries
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20);         // Comment length

  return Buffer.concat([...localChunks, ...centralChunks, eocd]);
}
