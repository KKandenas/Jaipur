// Dependency-free PNG icon generator. There's no licensed Jaipur artwork to
// use here, so this draws a simple, on-brand mark instead: a warm orange
// square (matching the app's theme color) with a centered white diamond -
// diamonds being one of Jaipur's six goods. Produces every icon size the
// manifest/index.html reference. Run with `npm run icons`.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const BACKGROUND = [0xc1, 0x68, 0x2f]; // #c1682f
const FOREGROUND = [0xff, 0xff, 0xff];

/** @param {number} size @param {number} diamondScale fraction of size the diamond's half-width spans */
function renderIcon(size, diamondScale) {
  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size * diamondScale) / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.abs(x + 0.5 - cx);
      const dy = Math.abs(y + 0.5 - cy);
      const inDiamond = dx / r + dy / r <= 1;
      const [r8, g8, b8] = inDiamond ? FOREGROUND : BACKGROUND;
      const i = (y * size + x) * 4;
      pixels[i] = r8;
      pixels[i + 1] = g8;
      pixels[i + 2] = b8;
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) {
    c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Each scanline prefixed with a filter-type byte (0 = None).
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0;
    raw.set(pixels.subarray(y * size * 4, (y + 1) * size * 4), rowStart + 1);
  }
  const idatData = zlib.deflateSync(raw);

  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idatData), chunk("IEND", Buffer.alloc(0))]);
}

function writeIcon(name, size, diamondScale) {
  const png = encodePng(size, renderIcon(size, diamondScale));
  writeFileSync(join(outDir, name), png);
  console.log(`wrote ${name} (${size}x${size}, ${png.length} bytes)`);
}

writeIcon("icon-192.png", 192, 0.62);
writeIcon("icon-512.png", 512, 0.62);
writeIcon("icon-maskable-512.png", 512, 0.42); // smaller so it survives circular/rounded OS cropping
writeIcon("apple-touch-icon.png", 180, 0.62);
