import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import sharp from 'sharp'
import { BRAND_MARK_SRC, BRAND_MARK_PNG, BRAND_VERSION } from '../lib/brand-assets.mjs'

const read = file => readFile(new URL(`../${file}`, import.meta.url), 'utf8')
const luminance = hex => hex.match(/\w{2}/g).map(part => parseInt(part, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05)

test('all BrandLogo variants use the complete owner-provided artwork, not the cropped legacy mark', async () => {
  const logo = await read('components/brand-logo.js')
  assert.match(logo, /<BrandMark eager=\{eager\}/)
  assert.match(logo, /src=\{BRAND_MARK_SRC\} srcSet=\{BRAND_MARK_SRC_SET\}/)
  assert.equal(BRAND_MARK_SRC, '/brand/gorez-mark-v4.webp')
  assert.doesNotMatch(logo, /gorez-mark\.png|gorez-logo\.png|clipPath/)
  assert.match(logo, /!decorative && <span className="sr-only">GoRez/)
  const css = await read('app/solar.css')
  assert.match(css, /\.gorez-lockup \.gorez-mark-image \{[^}]*height: 44px;[^}]*object-fit: contain/)
})

test('the current owner logo retains a visibly green check, orange G and transparent surrounding pixels', async () => {
  const { data } = await sharp(new URL(`../public${BRAND_MARK_PNG}`, import.meta.url).pathname).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let green = 0, orange = 0, transparent = 0
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = data.subarray(i, i + 4)
    if (a === 0) transparent++
    if (a > 240 && g > 80 && g > r * 1.2 && g > b * 1.2) green++
    if (a > 240 && r > 120 && r > g * 1.1 && g > b * 1.2) orange++
  }
  assert.ok(green > 400); assert.ok(orange > 1000); assert.ok(transparent > 20000)
})

test('the Solar layer loads last and provides accessible orange actions, graphite navigation and distinct factual status colours', async () => {
  const layout = await read('app/layout.js'), css = await read('app/solar.css')
  assert.ok(layout.indexOf("import './solar.css'") > layout.indexOf("import './home-navigation.css'"))
  assert.match(css, /--solar: #ff762f/)
  assert.match(css, /\.discovery-submit \{[^}]*background: var\(--solar-button\);[^}]*box-shadow: var\(--solar-depth\)/)
  assert.match(css, /\.sidebar \{ background: #23242a/)
  assert.match(css, /\.discovery-availability \{ background: #eef5f6/)
  for (const background of ['ffa561', 'ff823e', 'ff7029']) assert.ok(contrast('382014', background) >= 4.5)
  assert.ok(contrast('fff7ef', '353137') >= 7)
  assert.ok(contrast('9b3a17', 'f6f5f2') >= 4.5)
  assert.ok(contrast('2b5961', 'eef5f6') >= 4.5)
})

test('the service/place/visit illustration replaces the orb without inventing business data or cluttering mobile search', async () => {
  const ui = await read('components/discovery-search.js'), css = await read('app/solar.css'), art = await read('components/discovery-route-art.js')
  assert.match(ui, /!compact && !home && <DiscoveryRouteArt locale=\{locale\}/)
  assert.match(art, /className="discovery-route-art" aria-hidden="true"/)
  for (const label of ["'A service' : 'Услуга'", "'A place' : 'Място'", "'Your next visit' : 'Твоят час'"]) assert.ok(art.includes(label))
  assert.doesNotMatch(art, /<button|<a\b|fetch\(|\d\d:\d\d|rating|available|confirmed/)
  assert.doesNotMatch(`${ui}${css}`, /solar-orbit|solar-levitate|conic-gradient/)
  assert.match(css, /\.discovery-route-art \{ display: none; \}/)
  assert.doesNotMatch(ui, /three\/|canvas|WebGL|Math\.random\(/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.discovery-business-cta \{ animation: none/)
  assert.match(css, /:focus-visible \{ outline: 3px solid #ba4418/)
})

test('the search introduction explains natural-language discovery in Bulgarian and English', async () => {
  const ui = await read('components/discovery-search.js')
  assert.doesNotMatch(ui, /solar-kicker|GoRez AI Search/)
  assert.match(ui, /className="discovery-intro-hint">\{copy\.intro\}/)
  assert.equal(DISCOVERY_COPY.bg.intro, 'Намери бизнес и резервирай за секунди. Опиши какво търсиш със свои думи по-долу.')
  assert.equal(DISCOVERY_COPY.en.intro, 'Find a business and book in seconds. Describe what you’re looking for in your own words below.')
})

test('browser/PWA/social assets use the same complete mark and the service worker retires the old cache', async () => {
  const layout = await read('app/layout.js'), manifest = await read('app/manifest.js'), worker = await read('public/sw.js')
  assert.match(layout, /icon: BRAND_MARK_PNG, apple: '\/brand-icon\?size=180&v=4'/)
  assert.match(manifest, /src: '\/brand-icon\?size=512&v=4'/)
  assert.match(worker, /gorez-shell-solar-v6/)
  assert.ok(worker.includes(BRAND_MARK_SRC)); assert.equal(BRAND_VERSION, 4)
  assert.match(worker, /brand-icon\?size=512&v=4/)
  assert.match(worker, /key.startsWith\('gorez-'\) && key !== CACHE/)
  for (const file of ['app/share-image/route.js', 'app/brand-icon/route.js']) {
    const source = await read(file)
    assert.ok(source.includes(BRAND_MARK_PNG.slice(1)))
    assert.match(source, /data:image\/png;base64/)
    assert.doesNotMatch(source, /gorez-mark\.png|gorez-logo\.png|fetch\(/)
  }
})

test('the embed keeps its original booking flow while adopting the shared orange default', async () => {
  const widget = await read('public/ai-receptionist-widget.js')
  assert.match(widget, /script.dataset.color \|\| '#ff762f'/)
  assert.match(widget, /script.dataset.color \? '#fff' : '#382014'/)
  assert.match(widget, /\/book\/\$\{encodeURIComponent\(slug\)\}\?embed=1&lang=/)
  assert.doesNotMatch(widget, /fetch\(|apiKey|setInterval/)
})
