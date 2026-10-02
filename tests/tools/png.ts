import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** rgba: Uint32Array of 0xRRGGBBAA, scaled by integer factor */
export function writePng(path: string, w: number, h: number, px: Uint32Array, scale = 1, bg = 0): void {
  const W = w * scale;
  const H = h * scale;
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    for (let x = 0; x < W; x++) {
      let c = px[Math.floor(y / scale) * w + Math.floor(x / scale)];
      if ((c & 255) === 0) c = bg;
      else if ((c & 255) < 255 && bg) {
        const a = (c & 255) / 255;
        const mixc = (s: number) => Math.round(((c >>> s) & 255) * a + ((bg >>> s) & 255) * (1 - a));
        c = ((mixc(24) << 24) | (mixc(16) << 16) | (mixc(8) << 8) | 255) >>> 0;
      }
      const o = y * (W * 4 + 1) + 1 + x * 4;
      raw[o] = (c >>> 24) & 255;
      raw[o + 1] = (c >>> 16) & 255;
      raw[o + 2] = (c >>> 8) & 255;
      raw[o + 3] = c & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  writeFileSync(path, Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
