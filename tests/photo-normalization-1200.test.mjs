import test from 'node:test'
import assert from 'node:assert/strict'
import { randomFillSync } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { normalizeBusinessImage } from '../lib/image-normalization.mjs'
import { MAX_UPLOAD_BYTES } from '../lib/business-media.mjs'
import { MAX_PHOTO_EDGE, MAX_NORMALIZED_PHOTO_BYTES } from '../lib/photo-policy.mjs'
import { prepareApplicationPhotos } from '../lib/application-photos.mjs'

const photo = (bytes, type = 'image/jpeg') => new File([bytes], 'private-original-name', { type })
async function verifyOutput(input, expected) {
  const output = await normalizeBusinessImage(input), meta = await sharp(output.data).metadata()
  assert.equal(meta.format, 'webp')
  assert.deepEqual([output.width, output.height], expected)
  assert.deepEqual([meta.width, meta.height], expected)
  assert.ok(Math.max(output.width, output.height) <= MAX_PHOTO_EDGE)
  assert.equal(output.bytes, output.data.length)
  assert.ok(output.bytes > 0 && output.bytes <= MAX_NORMALIZED_PHOTO_BYTES)
  for (const key of ['exif', 'xmp', 'iptc', 'icc', 'orientation']) assert.equal(meta[key], undefined, key)
  assert.equal(output.name, undefined)
  return output
}

for (const [width, height, expected, format] of [
  [2400, 1800, [1200, 900], 'jpeg'],
  [1800, 2400, [900, 1200], 'png'],
  [1800, 1800, [1200, 1200], 'webp'],
  [320, 480, [320, 480], 'jpeg'],
  [480, 320, [480, 320], 'png'],
]) test(`actual server decoder preserves ${width}x${height} ${format} proportions inside 1200px without enlargement`, async () => {
  const bytes = await sharp({ create: { width, height, channels: 3, background: '#df8d52' } })[format]().toBuffer()
  await verifyOutput(photo(bytes, `image/${format}`), expected)
})

test('server applies EXIF orientation before fitting and strips embedded metadata instead of rotating twice or cropping', async () => {
  const width = 2400, height = 1600, raw = Buffer.alloc(width * height * 3)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = (y * width + x) * 3
    raw[index] = x < width / 2 ? 240 : 15
    raw[index + 1] = 15
    raw[index + 2] = x < width / 2 ? 15 : 240
  }
  const bytes = await sharp(raw, { raw: { width, height, channels: 3 } }).jpeg()
    .withMetadata({ orientation: 6, exif: { IFD0: { Artist: 'Offline synthetic test' } } })
    .withXmp('<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"/></x:xmpmeta>')
    .toBuffer()
  const source = await sharp(bytes).metadata()
  assert.equal(source.orientation, 6); assert.ok(source.exif); assert.ok(source.xmp); assert.ok(source.icc)
  const output = await verifyOutput(photo(bytes), [800, 1200])
  const top = await sharp(await sharp(output.data).extract({ left: 350, top: 50, width: 10, height: 10 }).toBuffer()).stats()
  const bottom = await sharp(await sharp(output.data).extract({ left: 350, top: 1100, width: 10, height: 10 }).toBuffer()).stats()
  assert.ok(top.channels[0].mean > 200 && top.channels[2].mean < 50, 'clockwise orientation puts the original red left half at the top')
  assert.ok(bottom.channels[2].mean > 200 && bottom.channels[0].mean < 50)
})

test('detailed transparent images reduce further when necessary while keeping the unchanged 1MiB server byte limit', async () => {
  const width = 1000, height = 1000, raw = randomFillSync(Buffer.alloc(width * height * 4))
  const bytes = await sharp(raw, { raw: { width, height, channels: 4 } }).png().toBuffer()
  assert.ok(bytes.length < MAX_UPLOAD_BYTES)
  const output = await normalizeBusinessImage(photo(bytes, 'image/png')), meta = await sharp(output.data).metadata()
  assert.ok(output.bytes <= MAX_NORMALIZED_PHOTO_BYTES)
  assert.ok(output.width <= width && output.height <= height)
  assert.equal(output.width, output.height)
  assert.equal(meta.format, 'webp'); assert.equal(meta.hasAlpha, true)
})

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

test('malformed, unsupported, animated and pixel-bomb inputs fail closed without exposing decoder errors', async () => {
  const jpeg = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#c78f66' } }).jpeg().toBuffer()
  const gif = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#c78f66' } }).gif().toBuffer()
  const animationPixels = Buffer.from([...Array(4).fill([255, 0, 0]).flat(), ...Array(4).fill([0, 0, 255]).flat()])
  const animated = await sharp(animationPixels, { raw: { width: 2, height: 4, channels: 3, pageHeight: 2 } }).webp({ loop: 0, delay: [100, 100] }).toBuffer()
  assert.equal((await sharp(animated).metadata()).pages, 2)
  const bomb = await sharp({ create: { width: 1, height: 1, channels: 3, background: '#c78f66' } }).png().toBuffer()
  // A tiny, CRC-correct PNG claiming 100MP must be rejected from its header,
  // without allocating those pixels or trusting the small compressed byte size.
  bomb.writeUInt32BE(10000, 16); bomb.writeUInt32BE(10000, 20)
  bomb.writeUInt32BE(crc32(bomb.subarray(12, 29)), 29)
  for (const [bytes, type] of [[jpeg.subarray(0, Math.floor(jpeg.length / 2)), 'image/jpeg'], [gif, 'image/png'], [bomb, 'image/png'], ['<svg xmlns="http://www.w3.org/2000/svg"/>', 'image/png'], ['broken', 'image/webp'], [animated, 'image/webp']]) {
    await assert.rejects(normalizeBusinessImage(photo(bytes, type)), { message: 'INVALID_IMAGE' })
  }
  await assert.rejects(normalizeBusinessImage({ size: 1, type: 'image/jpeg', arrayBuffer: async () => { throw new Error('private decoder detail') } }), { message: 'INVALID_IMAGE' })
  await assert.rejects(normalizeBusinessImage({ size: MAX_UPLOAD_BYTES + 1, type: 'image/png', arrayBuffer: async () => assert.fail('oversized file must not be read') }), { message: 'IMAGE_TOO_LARGE' })
  await assert.rejects(normalizeBusinessImage({ size: 1, type: 'image/png', arrayBuffer: async () => Buffer.alloc(MAX_UPLOAD_BYTES + 1) }), { message: 'IMAGE_TOO_LARGE' })
})

test('gallery and staff application images share authoritative normalization, retaining exact staff positions', async () => {
  const bytes = await sharp({ create: { width: 1800, height: 2400, channels: 3, background: '#c78f66' } }).png().toBuffer()
  const images = await prepareApplicationPhotos([{ staffIndex: null, file: photo(bytes, 'image/png') }, { staffIndex: 0, file: photo(bytes, 'image/png') }], 1, normalizeBusinessImage)
  assert.deepEqual(images.map(row => row.staffIndex), [null, 0])
  assert.ok(images.every(row => row.image.width === 900 && row.image.height === 1200 && row.image.bytes <= MAX_NORMALIZED_PHOTO_BYTES))
})

test('every existing upload entry point reuses the processor, with no separate unnormalized service-photo endpoint', async () => {
  for (const path of ['app/api/businesses/[id]/media/route.js', 'app/api/public/business-applications/route.js', 'lib/catalogue-admin-server.js']) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8')
    assert.match(source, /normalizeBusinessImage/)
  }
  for (const path of ['components/business-media-editor.js', 'components/admin-catalogue.js', 'components/business-setup.js']) assert.match(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'), /PhotoPicker/)
})
