import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { BRAND_MARK_SRC, BRAND_MARK_SMALL_SRC, BRAND_MARK_PNG, BRAND_MARK_SRC_SET } from '../lib/brand-assets.mjs'

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
const original = new URL('../assets/brand/gorez-original-v4.png', import.meta.url)
test('the owner logo original is unchanged, including its transparent background and provenance', async () => {
  const bytes = await readFile(original)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), 'c3ba1da1fbe1f3da6d11e69b63688cfddea7726ffa87fb27ffd06f2b52ba9d6d')
  const meta = await sharp(bytes).metadata()
  assert.equal(meta.width, 1024); assert.equal(meta.height, 1024); assert.equal(meta.hasAlpha, true)
})
test('static PNG/WebP variants preserve transparent margins without paid image optimization', async () => {
  let total = 0
  for (const [src, width] of [[BRAND_MARK_PNG, 192], [BRAND_MARK_SRC, 192], [BRAND_MARK_SMALL_SRC, 96]]) {
    const bytes = await readFile(new URL(`../public${src}`, import.meta.url)); total += bytes.length
    const meta = await sharp(bytes).metadata()
    assert.equal(meta.width, width); assert.equal(meta.height, width); assert.equal(meta.hasAlpha, true)
    assert.equal(meta.exif, undefined); assert.equal(meta.xmp, undefined)
    const { data } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    for (const index of [3, (width - 1) * 4 + 3, (width * (width - 1)) * 4 + 3, (width * width - 1) * 4 + 3]) assert.equal(data[index], 0)
  }
  assert.ok(total < 50000)
  assert.equal(BRAND_MARK_SRC_SET, `${BRAND_MARK_SMALL_SRC} 96w, ${BRAND_MARK_SRC} 192w`)
})
test('the lossless PNG is an exact whole-image resize, not a redraw, crop, recolour or background flatten', async () => {
  const expected = await sharp(original.pathname).resize(192, 192, { fit: 'contain' }).ensureAlpha().raw().toBuffer()
  const actual = await sharp(new URL(`../public${BRAND_MARK_PNG}`, import.meta.url).pathname).ensureAlpha().raw().toBuffer()
  assert.deepEqual(actual, expected)
  const css = await read('app/brand.css'), component = await read('components/brand-logo.js')
  assert.match(css, /object-fit:contain/)
  assert.doesNotMatch(css, /object-fit:cover|filter:|background:/)
  assert.doesNotMatch(component, /next\/image|clipPath|filter:/)
})
test('all active header/footer/partner marks share the current artwork; retired SVG references are not rendered', async () => {
  const search = await read('components/discovery-search.js'), browse = await read('components/discovery-home-browse.js')
  for (const source of [search, browse]) {
    assert.match(source, /import \{ BrandMark \} from '\.\/brand-logo'/)
    assert.match(source, /<BrandMark size=/)
    assert.doesNotMatch(source, /gorez-symbol\.svg/)
  }
  const script = await read('scripts/prepare-brand-v4.mjs')
  assert.match(script, /COPYFILE_EXCL/); assert.match(script, /Refusing to overwrite/)
  assert.doesNotMatch(script, /fetch\(|removeAlpha|flatten\(|extract\(|imagegen/)
})
