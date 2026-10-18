import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// Minimal 1x1 base PNG generation helper or simple canvas-less PNG data generator
// We can generate clean standalone SVG and PNGs using pure Node zlib + PNG chunks
import zlib from 'zlib';

function createPNG(width, height, r, g, b) {
  // Construct a valid RGBA PNG buffer directly
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter byte 0 per scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Draw border & inner "LQ" pixel pattern
      const isBorder = x < 8 || x >= width - 8 || y < 8 || y >= height - 8;
      const isInnerBorder = x < 16 || x >= width - 16 || y < 16 || y >= height - 16;
      
      if (isBorder) {
        rawData[pxOffset] = 0x1a;     // R
        rawData[pxOffset + 1] = 0x0f; // G
        rawData[pxOffset + 2] = 0x1d; // B
        rawData[pxOffset + 3] = 0xff; // A
      } else if (isInnerBorder) {
        rawData[pxOffset] = 0x4a;
        rawData[pxOffset + 1] = 0x2e;
        rawData[pxOffset + 2] = 0x4e;
        rawData[pxOffset + 3] = 0xff;
      } else {
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = 0xff;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

// Standard CRC32 table
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

const icon192 = createPNG(192, 192, 0x2d, 0x1b, 0x2e);
const icon512 = createPNG(512, 512, 0x2d, 0x1b, 0x2e);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icon192);
console.log('Generated placeholder PWA icons successfully.');
