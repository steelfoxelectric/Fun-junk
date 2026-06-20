// Pure-Node PNG icon generator for "Vent or Seal?" — no external deps.
// Draws a dew droplet (accent) on the app's dark background. Supersampled edges.
const zlib = require('zlib');
const fs = require('fs');

// ── PNG encoding (truecolor + alpha, 8-bit) ──
function crc32(buf) {
  let c, table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  // raw scanlines with filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ── colors ──
const BG = [0x0B, 0x0F, 0x14];
const ACCENT = [0x4A, 0x9E, 0xCC];
const HILITE = [0xD8, 0xE4, 0xF0];

// teardrop coverage at a point (0..1) via supersampling
function dropletCoverage(px, py, S) {
  const cx = S * 0.5;
  const cy = S * 0.605;
  const r = S * 0.255;
  const tip = S * 0.205;
  const ss = 3; // 3x3 supersample
  let hits = 0;
  for (let sy = 0; sy < ss; sy++) {
    for (let sx = 0; sx < ss; sx++) {
      const x = px + (sx + 0.5) / ss;
      const y = py + (sy + 0.5) / ss;
      let inside = false;
      if (y >= cy) {
        inside = (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
      } else if (y >= tip) {
        const w = r * (y - tip) / (cy - tip);
        inside = Math.abs(x - cx) <= w;
      }
      if (inside) hits++;
    }
  }
  return hits / (ss * ss);
}

// small highlight ellipse inside droplet
function highlightCoverage(px, py, S) {
  const hx = S * 0.43, hy = S * 0.55;
  const rx = S * 0.045, ry = S * 0.075;
  const ss = 3;
  let hits = 0;
  for (let sy = 0; sy < ss; sy++) {
    for (let sx = 0; sx < ss; sx++) {
      const x = px + (sx + 0.5) / ss;
      const y = py + (sy + 0.5) / ss;
      if (((x - hx) / rx) ** 2 + ((y - hy) / ry) ** 2 <= 1) hits++;
    }
  }
  return hits / (ss * ss);
}

function blend(base, top, a) {
  return [
    Math.round(base[0] * (1 - a) + top[0] * a),
    Math.round(base[1] * (1 - a) + top[1] * a),
    Math.round(base[2] * (1 - a) + top[2] * a),
  ];
}

function makeIcon(S) {
  const rgba = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let col = BG.slice();           // full-bleed dark bg (maskable-safe)
      const dc = dropletCoverage(x, y, S);
      if (dc > 0) col = blend(col, ACCENT, dc);
      const hc = highlightCoverage(x, y, S);
      if (hc > 0) col = blend(col, HILITE, hc * 0.5);
      const i = (y * S + x) * 4;
      rgba[i] = col[0]; rgba[i + 1] = col[1]; rgba[i + 2] = col[2]; rgba[i + 3] = 255;
    }
  }
  return encodePNG(S, S, rgba);
}

const targets = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
];
for (const [name, size] of targets) {
  fs.writeFileSync(__dirname + '/' + name, makeIcon(size));
  console.log('wrote', name, size + 'x' + size);
}
