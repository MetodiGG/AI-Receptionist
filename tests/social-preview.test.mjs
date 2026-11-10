import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { pageMetadata } from '../lib/seo.mjs'
import { BRAND_VERSION } from '../lib/brand-assets.mjs'
import { SOCIAL_PREVIEW_TITLE, SOCIAL_PREVIEW_VERSION, SOCIAL_PREVIEW_ARTWORK, SOCIAL_PREVIEW_SIZE, socialPreviewImage } from '../lib/social-preview.mjs'
import { socialPreviewSvg } from '../lib/social-preview-image.mjs'

const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8')

test('BG and EN home/search/business previews lead with GoRez followed by the tagline', () => {
  for (const locale of ['bg', 'en']) for (const path of ['/', '/search', '/for-businesses']) {
    const metadata = pageMetadata(path, locale)
    assert.equal(metadata.title.absolute, 'GoRez — Online Booking Made Easy')
    assert.equal(metadata.openGraph.title, SOCIAL_PREVIEW_TITLE)
    assert.equal(metadata.twitter.title, SOCIAL_PREVIEW_TITLE)
    assert.equal(metadata.openGraph.siteName, 'GoRez')
    assert.doesNotMatch(JSON.stringify(metadata), /GoRez AI Search/)
    const image = metadata.openGraph.images[0]
    assert.equal(image.width, 1200); assert.equal(image.height, 630); assert.equal(image.type, 'image/png')
    assert.equal(metadata.twitter.images[0], image.url)
    assert.equal(new URL(image.url, 'https://www.gorez.co').searchParams.get('v'), SOCIAL_PREVIEW_VERSION)
    assert.notEqual(SOCIAL_PREVIEW_VERSION, '20261110-1')
    assert.notEqual(SOCIAL_PREVIEW_VERSION, String(BRAND_VERSION), 'refresh social caches without changing PWA/logo versions')
  }
})

test('individual business names, descriptions, booking URLs and localised canonicals remain distinct', () => {
  for (const locale of ['bg', 'en']) {
    const title = 'ВЕСИ СТУДИО — book online · GoRez'
    const metadata = pageMetadata('/book/vesi-studio', locale, { title, description: 'Real business information' })
    assert.equal(metadata.title.absolute, title)
    assert.equal(metadata.openGraph.title, title)
    assert.equal(metadata.twitter.description, 'Real business information')
    assert.match(metadata.alternates.canonical, new RegExp(`/book/vesi-studio\\?lang=${locale}$`))
    assert.equal(metadata.openGraph.images[0].url, socialPreviewImage(locale).url)
  }
  assert.match(pageMetadata('/for-businesses', 'bg').description, /безплатни/)
  assert.match(pageMetadata('/for-businesses', 'en').openGraph.images[0].url, /page=business.*offer=free$/)
})

test('image parameters are fixed public choices, not arbitrary image, token or private booking URLs', () => {
  const image = socialPreviewImage('en&token=private', 'https://attacker.example/image')
  assert.equal(image.url, socialPreviewImage('bg', 'home').url)
  assert.equal(SOCIAL_PREVIEW_ARTWORK, '/brand/gorez-social-banner-v1.jpg')
  assert.deepEqual(SOCIAL_PREVIEW_SIZE, { width: 1200, height: 630 })
})

test('the exact supplied artwork is retained, without generative logo/text edits', async () => {
  const asset = await readFile(new URL(`../public${SOCIAL_PREVIEW_ARTWORK}`, import.meta.url))
  assert.equal(createHash('sha256').update(asset).digest('hex'), '338b82a981a6e152a242ddfd87bc441d7441f7acbca9ff245c01b8a6182a17e7')
  const metadata = await sharp(asset).metadata()
  assert.equal(metadata.width, 1280); assert.equal(metadata.height, 320)
  assert.ok(asset.length < 100_000)
})

test('all public metadata entry points share the new title/image rather than stale overrides', async () => {
  for (const name of ['app/page.js', 'app/search/page.js', 'app/layout.js']) {
    const source = await read(name)
    assert.match(source, /SOCIAL_PREVIEW_TITLE/)
    assert.doesNotMatch(source, /GoRez AI Search|share-image\?lang=bg&v=4/)
  }
  const layout = await read('app/layout.js')
  assert.match(layout, /images: \[socialPreviewImage\('bg'\)\]/)
  assert.match(layout, /images: \[socialPreviewImage\('bg'\)\.url\]/)
  assert.match(layout, /applicationName: 'GoRez'/)
  assert.match(await read('app/book/[slug]/page.js'), /title:`\$\{business.name\}/)
})

test('social rendering uses local artwork, a bounded canvas and no client/API/provider changes', async () => {
  const source = await read('app/share-image/route.js')
  assert.match(source, /SOCIAL_PREVIEW_ARTWORK/)
  assert.match(source, /\.\.\.SOCIAL_PREVIEW_SIZE/)
  assert.match(source, /data:image\/svg\+xml;base64/)
  assert.match(source, /socialPreviewSvg\(banner\)/)
  assert.doesNotMatch(source, /SOCIAL_PREVIEW_TITLE|PRICING_COPY|homePreview|searchParams|padding:|linear-gradient/)
  assert.doesNotMatch(source, /fetch\(|supabase|request\.headers|cookies\(|searchParams\.get\('(url|image|token|slug)'\)/)
})

test('the share frame is opaque edge-to-edge without extra title/footer panels', async () => {
  const asset = await readFile(new URL(`../public${SOCIAL_PREVIEW_ARTWORK}`, import.meta.url))
  const svg = socialPreviewSvg(asset)
  assert.doesNotMatch(svg, /<text|<rect|Online Booking|gorez\.co/)
  assert.equal((svg.match(/data:image\/jpeg;base64/g) || []).length, 1)
  const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  assert.equal(info.width, 1200); assert.equal(info.height, 630)
  const pixel = (x, y) => data.subarray((y * info.width + x) * 4, (y * info.width + x) * 4 + 4)
  for (const x of [0, 150, 400, 800, 1100, 1199]) {
    for (const y of [0, 60, 122, 123, 506, 507, 570, 629]) {
      const rgba = pixel(x, y)
      assert.equal(rgba[3], 255, 'the full canvas has artwork, not a transparent/white letterbox')
      assert.ok(rgba[0] + rgba[1] + rgba[2] < 760)
    }
    for (const [a, b] of [[122, 123], [506, 507]]) {
      const above = pixel(x, a), below = pixel(x, b)
      assert.ok([0, 1, 2].every(channel => Math.abs(above[channel] - below[channel]) < 15), 'background edges meet without a rectangular colour seam')
    }
  }
})
