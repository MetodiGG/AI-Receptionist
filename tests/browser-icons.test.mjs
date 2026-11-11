import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import { BRAND_MARK_PNG, BRAND_FAVICON_PNG, BRAND_FAVICON_ICO, BRAND_APPLE_ICON, BRAND_PWA_ICON } from '../lib/brand-assets.mjs'
import { websiteStructuredData } from '../lib/seo.mjs'

const asset = path => readFile(new URL(`../public${path}`, import.meta.url))

test('standard browser favicon and transparent search icon contain only the current uploaded mark', async () => {
  const master = await asset(BRAND_MARK_PNG)
  const ico = await asset(BRAND_FAVICON_ICO)
  assert.equal(ico.readUInt16LE(0), 0)
  assert.equal(ico.readUInt16LE(2), 1)
  assert.equal(ico.readUInt16LE(4), 4)
  for (const [index, size] of [16, 32, 48, 96].entries()) {
    const entry = 6 + 16 * index
    assert.equal(ico[entry], size)
    assert.equal(ico[entry + 1], size)
    const offset = ico.readUInt32LE(entry + 12)
    const pixels = ico.subarray(offset, offset + ico.readUInt32LE(entry + 8))
    const expected = await sharp(master).resize(size, size).ensureAlpha().raw().toBuffer()
    assert.deepEqual(await sharp(pixels).ensureAlpha().raw().toBuffer(), expected)
    if (size === 96) assert.deepEqual(pixels, await asset(BRAND_FAVICON_PNG))
  }
})

test('Apple and install icons are square, opaque and visibly carry the new mark', async () => {
  for (const [path, size] of [[BRAND_APPLE_ICON, 180], [BRAND_PWA_ICON, 512]]) {
    const { data, info } = await sharp(await asset(path)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    assert.equal(info.width, size)
    assert.equal(info.height, size)
    assert.deepEqual([...data.subarray(0, 4)], [255, 247, 238, 255])
    let orange = 0, green = 0
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, alpha] = data.subarray(i, i + 4)
      assert.equal(alpha, 255)
      if (r > 160 && g < 190 && b < 100) orange++
      if (g > r + 20 && g > b + 20) green++
      if (size === 512) {
        const x = (i / 4) % size, y = Math.floor(i / 4 / size)
        if (Math.hypot(x - 255.5, y - 255.5) > size * .4) assert.deepEqual([r, g, b], [255, 247, 238])
      }
    }
    assert.ok(orange > 100 && green > 100)
  }
})

test('Search structured data still names the website GoRez and uses the owner mark', () => {
  const [organization, website] = websiteStructuredData()['@graph']
  assert.equal(website.name, 'GoRez')
  assert.equal(website['@type'], 'WebSite')
  assert.ok(organization.logo.endsWith(BRAND_MARK_PNG))
})
