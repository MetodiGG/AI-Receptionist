import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { presentPublicBusiness } from '../lib/locale/public-content-server.mjs'
import { getBusinessPhotos } from '../lib/business-photos.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const snapshot = JSON.parse(await read('tests/fixtures/guided-public-partners-20261121.json'))
const partners = snapshot.businesses.map(row => presentPublicBusiness({ ...row, photos: snapshot.localPhotos[row.id] || getBusinessPhotos(row) }))
const filename = 'app/dev/guided-discovery/page.js'
const { code } = await transform(await read(filename), {
  filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
})
const Review = () => null
function pageFor(env) {
  const module = { exports: {} }, stubs = {
    'next/navigation': { notFound() { throw Error('NOT_FOUND') } },
    '../../../lib/discovery/config.mjs': { discoveryConfig },
    './preview': { GuidedDiscoveryPreview: Review },
    '../../../lib/locale/public-content-server.mjs': { presentPublicBusiness },
    '../../../lib/business-photos.mjs': { getBusinessPhotos },
    '../../../tests/fixtures/guided-public-partners-20261121.json': snapshot,
  }
  new Function('require', 'module', 'exports', 'process', code)(name => Object.hasOwn(stubs, name) ? stubs[name] : require(name), module, module.exports, { env })
  return module.exports.default
}

test('large-text review cannot bypass the existing dev-only page gate in production or hosted preview', async () => {
  for (const env of [
    { NODE_ENV: 'production', DISCOVERY_DEV_MOCK: 'true' },
    { NODE_ENV: 'development', VERCEL_ENV: 'preview', DISCOVERY_DEV_MOCK: 'true' },
    { NODE_ENV: 'development', VERCEL_ENV: 'production', DISCOVERY_DEV_MOCK: 'true' },
    { NODE_ENV: 'development', DISCOVERY_DEV_MOCK: 'false' },
  ]) await assert.rejects(pageFor(env)({ searchParams: Promise.resolve({ text: 'large', lang: 'en' }) }), /NOT_FOUND/)
})

test('only exact text=large enables a review prop while language and photo-review routing retain their existing behavior', async () => {
  const page = pageFor({ NODE_ENV: 'development', DISCOVERY_DEV_MOCK: 'true' })
  const large = await page({ searchParams: Promise.resolve({ text: 'large', lang: 'en', view: 'photos' }) })
  assert.equal(large.type, Review)
  assert.deepEqual(large.props, { locale: 'en', photos: true, largeText: true, partners })
  for (const text of [undefined, '', 'normal', '150%', 'LARGE', ['large']]) {
    const ordinary = await page({ searchParams: Promise.resolve({ text, lang: 'bg' }) })
    assert.deepEqual(ordinary.props, { locale: 'bg', photos: false, largeText: false, partners })
  }
})

test('root-font emulation is constant, review-marker scoped and removed with the preview rather than a production UI setting', async () => {
  const preview = await read('app/dev/guided-discovery/preview.js')
  assert.match(preview, /largeText = false/)
  assert.match(preview, /largeText && <style>\{'html:has\(\[data-guided-review-text="large"\]\) \{ font-size: 150%; \}'\}<\/style>/)
  assert.match(preview, /data-guided-review-text=\{largeText \? 'large' : undefined\}/)
  assert.doesNotMatch(preview, /document\.documentElement|localStorage|sessionStorage|dangerouslySetInnerHTML|zoom:/)
  assert.match(preview, /preview cataloguePreview previewSearchEndpoint="\/dev\/guided-discovery\/search"/)
  assert.match(preview, /locale=\{locale\} preview quickChoice/)
})

test('essential guide text scales from its original sixteen/eighteen pixel baselines without shrinking or clipping enlarged labels', async () => {
  const css = await read('app/guided-discovery.css')
  assert.match(css, /\.guide-label \{[^}]*font-size: 1\.125rem;/)
  assert.match(css, /@media \(max-width: 420px\)[^\n]*\.guide-label \{ font-size: 1rem; \}/)
  assert.match(css, /\.guide-summary-choice > span \{[^}]*font-size: 1rem;/)
  assert.match(css, /\.guide-panel h2 \{[^}]*clamp\(1\.375rem, 2\.8vw, 1\.6875rem\)/)
  assert.doesNotMatch(css, /font-size:\s*[\d.]+px|line-clamp|text-overflow:\s*ellipsis|word-break:\s*break-all/)
  assert.match(css, /grid-template-columns: var\(--guide-slot\) minmax\(0, 1fr\) var\(--guide-slot\)/)
})

test('font-relative container fallback provides a single readable column when larger type no longer fits two columns', async () => {
  const css = await read('app/guided-discovery.css')
  assert.match(css, /container-type: inline-size; container-name: guided-choice/)
  assert.match(css, /@media \(min-width: 700px\) \{ \.guide-choices \{ grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/)
  assert.match(css, /@container guided-choice \(max-width: 43\.99rem\) \{\s*\.guide-choices \{ grid-template-columns: minmax\(0,1fr\); \}/)
  assert.doesNotMatch(css, /@container[^}]+font-size|overflow-x:\s*(?:auto|scroll)/)
})

test('narrow enlarged-text rows share shrinking side tracks, preserve whole words and reserve the complete vector footprint', async () => {
  const css = await read('app/guided-discovery.css')
  assert.match(css, /grid-template-columns: minmax\(16px,var\(--guide-slot\)\) minmax\(min-content,1fr\) minmax\(16px,var\(--guide-slot\)\)/)
  assert.match(css, /\.guide-side \{[^}]*width: 100%; max-width: var\(--guide-slot\)/)
  assert.match(css, /\.guide-photo \{[^}]*width: min\(62px,100%\); height: auto; aspect-ratio: 1/)
  assert.match(css, /\.guide-photo \{ width: min\(50px,100%\); height: auto;/)
  assert.match(css, /@media \(max-width: 360px\) \{\s*\.guide-panel-toolbar \{ grid-template-columns: minmax\(0,1fr\) auto; \}\s*\.guide-step \{ display: none; \}/)
  assert.doesNotMatch(css, /word-break:\s*break-all|overflow-wrap:\s*anywhere|font-size:\s*[\d.]+px/)
})
