import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'

test('the separately reviewed male eyebrow-threading photo is a small decoded local square with recorded generation provenance', async () => {
  const evidence = JSON.parse(await readFile(new URL('../docs/service-photo-prompts-brow-threading.json', import.meta.url), 'utf8'))
  const file = 'public/service-photos/barber-brow-threading-v1.webp'
  const records = evidence.assets.filter(record => record.file === file)
  assert.equal(records.length, 1)
  const record = records[0], bytes = await readFile(new URL(`../${file}`, import.meta.url))
  assert.match(evidence.generator, /ImageGen built-in/)
  assert.match(record.prompt, /adult male client/)
  assert.match(record.prompt, /COTTON THREAD/)
  assert.match(record.sourceFile, /^exec-[a-f0-9-]+\.png$/)
  assert.match(record.sourceSha256, /^[a-f0-9]{64}$/)
  assert.equal(record.sha256, createHash('sha256').update(bytes).digest('hex'))
  assert.equal(bytes.length, record.bytes)
  assert.ok(bytes.length > 0 && bytes.length < 30000)
  assert.equal(record.source, 'illustrative')
  assert.equal(record.review.status, 'accepted')
  assert.ok(record.review.reviewers.includes('/root/partner_photo_safety_review'))
  const image = sharp(bytes, { failOn: 'error', limitInputPixels: 16000000 })
  const { format, width, height, pages = 1 } = await image.metadata()
  assert.equal(format, 'webp'); assert.equal(pages, 1)
  assert.equal(width, 256); assert.equal(height, 256)
  assert.equal(width, record.width); assert.equal(height, record.height)
  await image.raw().toBuffer()
})
