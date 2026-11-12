import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { preparePhotoFile, fitPhotoFilesToBudget, PREPARED_PHOTO_BYTES, MAX_SOURCE_PHOTO_BYTES } from '../lib/photo-selection.js'
import { APPLICATION_PHOTO_BUDGET } from '../lib/business-media.mjs'
import { readApplicationPhotos } from '../lib/application-photos.mjs'
import { MAX_PHOTO_EDGE } from '../lib/photo-policy.mjs'

function browser(t, { width = 4032, height = 3024, encode = () => new Blob([new Uint8Array(150000)], { type: 'image/webp' }), decodeError = false } = {}) {
  const calls = [], revoked = [], image = { naturalWidth: width, naturalHeight: height, src: '', async decode() { if (decodeError) throw new Error('decode') } }
  const context = { clearRect() {}, fillRect() { calls.push({ white: true }) }, drawImage() {} }
  const canvas = { width: 0, height: 0, getContext: () => context, toBlob(callback, type, quality) { calls.push({ type, quality, width: this.width, height: this.height }); callback(encode(type, quality, this.width, this.height)) } }
  t.mock.method(URL, 'createObjectURL', () => 'blob:local-only')
  t.mock.method(URL, 'revokeObjectURL', value => revoked.push(value))
  for (const [key, value] of Object.entries({ Image: function () { return image }, document: { createElement: tag => { assert.equal(tag, 'canvas'); return canvas } } })) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, key)
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
    t.after(() => descriptor ? Object.defineProperty(globalThis, key, descriptor) : Reflect.deleteProperty(globalThis, key))
  }
  return { calls, revoked, canvas, image }
}
const file = (type = 'image/jpeg', name = 'private-original.jpg', bytes = 1000) => new File([new Uint8Array(bytes)], name, { type })

test('browser preparation resizes a phone photo, emits small correctly typed bytes and releases memory/URLs', async t => {
  const b = browser(t), output = await preparePhotoFile(file())
  assert.equal(output.type, 'image/webp'); assert.equal(output.name, 'photo.webp'); assert.ok(output.size <= PREPARED_PHOTO_BYTES)
  assert.equal(b.calls[0].width, MAX_PHOTO_EDGE); assert.equal(b.calls[0].height, 900)
  assert.deepEqual(b.revoked, ['blob:local-only']); assert.equal(b.canvas.width, 1); assert.equal(b.image.src, '')
})
for (const [width, height, expectedWidth, expectedHeight] of [[3000, 4000, 900, 1200], [4000, 3000, 1200, 900], [320, 480, 320, 480]]) test(`browser preparation preserves ${width}x${height} proportions without enlargement or cropping`, async t => {
  const b = browser(t, { width, height })
  await preparePhotoFile(file())
  assert.equal(b.calls[0].width, expectedWidth); assert.equal(b.calls[0].height, expectedHeight)
  assert.ok(b.calls.filter(call => call.width).every(call => Math.max(call.width, call.height) <= MAX_PHOTO_EDGE))
})
test('Safari-style PNG fallback for WebP uses a real JPEG encoder, not a false too-large error or a mislabeled file', async t => {
  const b = browser(t, { encode: type => new Blob([new Uint8Array(type === 'image/jpeg' ? 160000 : 900000)], { type: type === 'image/webp' ? 'image/png' : type }) })
  const output = await preparePhotoFile(file())
  assert.equal(output.type, 'image/jpeg'); assert.equal(output.name, 'photo.jpg')
  assert.equal(b.calls.filter(call => call.type === 'image/webp').length, 1)
  assert.ok(b.calls.some(call => call.white)); assert.ok(output.size <= PREPARED_PHOTO_BYTES)
})
test('high-detail photos reduce dimensions until they fit rather than requiring manual file editing', async t => {
  const b = browser(t, { encode: (type, quality, width) => new Blob([new Uint8Array(width > 1024 ? 400000 : 180000)], { type }) })
  const output = await preparePhotoFile(file())
  assert.equal(output.size, 180000); assert.ok(b.calls.some(call => call.width === 1024))
})
test('48-megapixel images and natively decoded HEIC are supported without sending their originals', async t => {
  browser(t, { width: 8064, height: 6048 })
  const output = await preparePhotoFile(file('image/heic', 'private-gps.heic'))
  assert.equal(output.type, 'image/webp'); assert.equal(output.name, 'photo.webp')
})
test('unsupported HEIC gets a format-specific message and releases the source URL', async t => {
  const b = browser(t, { decodeError: true })
  await assert.rejects(preparePhotoFile(file('image/heic', 'photo.heic')), /HEIC_UNSUPPORTED/)
  assert.deepEqual(b.revoked, ['blob:local-only'])
})
test('bounded originals, invalid formats, excessive dimensions and encoding failure still fail safely', async t => {
  await assert.rejects(preparePhotoFile({ size: MAX_SOURCE_PHOTO_BYTES + 1, type: 'image/jpeg' }), /SOURCE_IMAGE_TOO_LARGE/)
  await assert.rejects(preparePhotoFile(file('image/svg+xml', 'x.svg')), /INVALID_IMAGE/)
  const b = browser(t, { width: 10000, height: 10000 })
  await assert.rejects(preparePhotoFile(file()), /INVALID_IMAGE/); assert.equal(b.calls.length, 0)
})
test('a null encoder reports processing failure, not a misleading request for smaller originals', async t => {
  const b = browser(t, { encode: () => null })
  await assert.rejects(preparePhotoFile(file()), /IMAGE_PROCESSING_FAILED/)
  assert.deepEqual(b.revoked, ['blob:local-only'])
})
test('a normal multi-photo selection is preserved byte-for-byte when it already fits the application', async () => {
  const files = Array.from({ length: 12 }, () => file('image/jpeg', 'photo.jpg', 190000))
  assert.equal(await fitPhotoFilesToBudget(files, APPLICATION_PHOTO_BUDGET), files)
})
test('12 gallery photos plus 20 team photos fit one bounded application without losing order or staff positions', async t => {
  browser(t, { encode: () => new Blob([new Uint8Array(120000)], { type: 'image/webp' }) })
  const files = Array.from({ length: 32 }, () => file('image/jpeg', 'photo.jpg', 200000))
  const fitted = await fitPhotoFilesToBudget(files, APPLICATION_PHOTO_BUDGET)
  assert.equal(fitted.length, 32); assert.ok(fitted.reduce((sum, row) => sum + row.size, 0) <= APPLICATION_PHOTO_BUDGET)
  assert.ok(fitted.every(row => row.type === 'image/webp'))
  const form = new FormData(); form.append('payload', '{}'); form.append('photoConsent', 'true')
  fitted.forEach((file, index) => form.append(index < 12 ? `gallery_${index}` : `staff_${index - 12}`, file))
  const parsed = await readApplicationPhotos(new Request('https://example.com/api', { method: 'POST', body: form }))
  assert.equal(parsed.files.length, 32); assert.equal(parsed.files.filter(row => row.staffIndex === null).length, 12)
  assert.deepEqual(parsed.files.filter(row => row.staffIndex !== null).map(row => row.staffIndex), Array.from({ length: 20 }, (_, i) => i))
  await assert.rejects(fitPhotoFilesToBudget([...files, files[0]], APPLICATION_PHOTO_BUDGET), /IMAGE_PROCESSING_FAILED/)
})
test('local photo QA cannot expose a processing endpoint or page in Production', async () => {
  for (const path of ['app/dev/photo-upload/page.js', 'app/dev/photo-upload/check/route.js']) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8')
    assert.match(source, /process\.env\.NODE_ENV !== 'development'/)
    assert.doesNotMatch(source, /getSupabase|RESEND|storage\.from/)
  }
})
test('picker keeps successfully prepared photos when another selected file fails, and disables stale/concurrent changes', async () => {
  const picker = await readFile(new URL('../components/photo-picker.js', import.meta.url), 'utf8')
  assert.match(picker, /failures\.push\(problem\.message\)/); assert.match(picker, /if \(prepared\.length\) onChange/)
  assert.match(picker, /locked\.current \|\| disabled/); assert.match(picker, /generation\.current !== current/)
  assert.match(picker, /accept=\{PHOTO_INPUT_ACCEPT\}/)
  const setup = await readFile(new URL('../components/business-setup.js', import.meta.url), 'utf8')
  assert.match(setup, /fitPhotoFilesToBudget\(selectedPhotos\.map/); assert.doesNotMatch(setup, /The photos together are too large|Общият размер на снимките е твърде голям/)
})
