import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'

function crc32(buf) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  let c = 0xFFFFFFFF
  for (const byte of buf) c = table[(c ^ byte) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcVal = Buffer.alloc(4)
  crcVal.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcVal])
}

function makePNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  const raw = []
  for (let y = 0; y < size; y++) {
    raw.push(0) // filter byte
    for (let x = 0; x < size; x++) {
      raw.push(r, g, b)
    }
  }
  const idat = deflateSync(Buffer.from(raw))

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public', { recursive: true })

// Amber #C9920A = rgb(201, 146, 10)
const R = 201, G = 146, B = 10

writeFileSync('public/icon-192.png', makePNG(192, R, G, B))
writeFileSync('public/icon-512.png', makePNG(512, R, G, B))
writeFileSync('public/apple-touch-icon.png', makePNG(180, R, G, B))

console.log('Generated: icon-192.png, icon-512.png, apple-touch-icon.png')
