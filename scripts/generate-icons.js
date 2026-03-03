/**
 * Generates placeholder PWA icons as solid-color PNGs using only Node.js
 * built-in modules (zlib + fs). No external dependencies required.
 *
 * Colors: background #0A0B12, crescent gold #C9A84C
 * Run: node scripts/generate-icons.js
 */

const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

// CRC32 lookup table (used by PNG chunk checksums)
const CRC_TABLE = (() => {
  const t = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'ascii')
  const crcVal = Buffer.alloc(4)
  crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])), 0)
  return Buffer.concat([len, t, data, crcVal])
}

/**
 * Creates a PNG with a dark background (#0A0B12) and a centred gold crescent.
 * The crescent is drawn by checking per-pixel: inside outer circle, outside
 * inner offset circle → gold pixel, otherwise background.
 */
function createIcon(size) {
  const bg = [0x0a, 0x0b, 0x12]  // #0A0B12
  const gold = [0xc9, 0xa8, 0x4c] // #C9A84C

  const cx = size / 2
  const cy = size / 2
  const outerR = size * 0.30
  const innerR = size * 0.22
  const offset = size * 0.12 // inner circle offset creates the crescent gap

  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3)
    row[0] = 0 // PNG filter byte: None
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const distOuter = Math.sqrt(dx * dx + dy * dy)
      const dx2 = x - (cx + offset)
      const dy2 = y - cy
      const distInner = Math.sqrt(dx2 * dx2 + dy2 * dy2)

      const inCrescent = distOuter <= outerR && distInner > innerR
      const [r, g, b] = inCrescent ? gold : bg
      row[1 + x * 3] = r
      row[1 + x * 3 + 1] = g
      row[1 + x * 3 + 2] = b
    }
    rows.push(row)
  }

  const raw = Buffer.concat(rows)
  const compressed = zlib.deflateSync(raw, { level: 9 })

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8  // bit depth
  ihdrData[9] = 2  // color type: RGB
  // bytes 10-12 stay 0 (compression, filter, interlace)

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const publicDir = path.join(__dirname, '..', 'public')
fs.mkdirSync(publicDir, { recursive: true })

for (const size of [192, 512]) {
  const outPath = path.join(publicDir, `icon-${size}.png`)
  fs.writeFileSync(outPath, createIcon(size))
  console.log(`Created ${outPath} (${size}×${size})`)
}
