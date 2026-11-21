import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('approved quick choice is enabled on the customer homepage, not the owner/admin or detailed search shells', async () => {
  const [page, search, layout] = await Promise.all(['components/discovery-page.js', 'components/discovery-search.js', 'app/layout.js'].map(read))
  assert.match(page, /home \? ' customer-home quick-choice' : ''/)
  assert.match(search, /quickChoice=\{home\}/)
  for (const file of ['quick-choice-home.css', 'quick-choice-cards.css', 'quick-choice-onboarding.css']) {
    assert.ok(layout.indexOf(`import './${file}'`) > layout.indexOf("import './booking-actions.css'"))
  }
})

test('quick choice removes the oversized search panel without shrinking editable text or original header controls', async () => {
  const css = await read('app/quick-choice-home.css')
  assert.match(css, /\.discovery-home \{ width:min\(960px,calc\(100% - 40px\)\)/)
  assert.match(css, /\.home-search-panel \{[^}]*border:0;[^}]*border-radius:0; background:transparent; box-shadow:none/)
  assert.match(css, /\.discovery-query \{ min-height:52px/)
  assert.match(css, /\.discovery-query input \{ font-size:16px/)
  assert.doesNotMatch(css, /\.language-switch|\.country-flag|\.launch-menu-toggle|\.gorez-wordmark/)
  for (const line of css.split('\n')) if (/^\s*\./.test(line)) assert.match(line.trimStart(), /^\.customer-home\.quick-choice /)
})

test('homepage photographic choices use the single active guided stage, balanced labels and vertically stacked rows', async () => {
  const [css, search, guide] = await Promise.all(['app/guided-discovery.css', 'components/discovery-search.js', 'components/guided-service-discovery.js'].map(read))
  assert.match(search, /home && !compact && <GuidedServiceDiscovery/)
  assert.match(search, /!compact && !home && <DiscoverySubcategories/)
  assert.doesNotMatch(search, /<DiscoveryHomeRail/)
  assert.match(guide, /categories\.map\(item =>/)
  assert.match(guide, /label=\{item.label\} photo=\{item.photo\}/)
  assert.match(guide, /label=\{item\[locale\] \|\| item.label\} photo=\{item.photo\}/)
  assert.match(guide, /stage === 'categories' \? <ul className="guide-choices"/)
  assert.match(guide, /stage === 'closed' &&/)
  assert.match(guide, /stage === 'results' && parent/)
  assert.match(guide, /aria-expanded=\{expanded\} aria-controls=\{controls\}/)
  assert.match(css, /grid-template-columns: var\(--guide-slot\) minmax\(0, 1fr\) var\(--guide-slot\)/)
  assert.match(css, /\.guide-label \{[^}]*text-align: center;[^}]*white-space: normal; word-break: normal/)
  assert.match(css, /\.guide-side--end \{ justify-content: flex-end/ )
  assert.match(css, /\.guide-side--end svg \{ width: 16px; height: 16px/)
  assert.match(css, /\.guide-choices \{ display: grid; grid-template-columns: minmax\(0,1fr\)/)
  assert.match(css, /@media \(min-width: 700px\) \{ \.guide-choices \{ grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/)
  assert.match(css, /prefers-reduced-motion: reduce/)
  assert.doesNotMatch(css, /text-overflow:\s*ellipsis|line-clamp|overflow-x:\s*(?:auto|scroll)|word-break:\s*break-all/)
})

test('location context uses actual accepted selection; consent help and technical errors stay available', async () => {
  const [search, css] = await Promise.all(['components/discovery-search.js', 'app/quick-choice-home.css'].map(read))
  assert.match(search, /cities\.find\(city => city.code === selectedCity\)/)
  assert.match(search, /locationContext = coordinates \? \(en \? 'Around you' : 'Около Вас'\)/)
  assert.match(search, /home && !compact && !locationError \? <details/)
  assert.match(search, /<p>\{locationMessage\}<\/p><\/details> : <p className="discovery-notice" role="status">/)
  assert.match(css, /\.home-search-context \{[^}]*flex-wrap:wrap/)
  assert.match(css, /\.home-location-help\[open\] \{ flex-basis:100%/)
  assert.match(css, /\.home-search-context > \.discovery-notice \{ flex-basis:100%; font-size:16px/)
})
