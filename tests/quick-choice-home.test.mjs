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

test('homepage photographic choices keep every category and active service visible with whole readable labels', async () => {
  const [css, search, grid, services] = await Promise.all(['app/inline-discovery.css', 'components/discovery-search.js', 'components/inline-category-grid.js', 'components/discovery-subcategories.js'].map(read))
  assert.match(search, /home && !compact && <InlineCategoryGrid/)
  assert.match(search, /const inlinePanelOpen = Boolean\(category\)/)
  assert.match(search, /home && !compact && <InlineDiscoveryPanel open=\{inlinePanelOpen\}>\{inlinePanelOpen \? <DiscoverySubcategories inline/)
  assert.match(search, /home && !compact && <InlineDiscoverySummary/)
  assert.match(search, /!compact && <DiscoveryHomeBusinesses/)
  assert.match(search, /!compact && !home && <DiscoverySubcategories/)
  assert.doesNotMatch(search, /<DiscoveryHomeRail/)
  assert.match(grid, /homeCategories\(language\)\.map\(item =>/)
  assert.match(grid, /<CategoryPhoto category=\{item\}/)
  assert.match(grid, /aria-pressed=\{category === item.id\}/)
  assert.doesNotMatch(grid, /\.slice\(|showMore/)
  const inlineServices = services.slice(services.indexOf('  if (inline) {'), services.indexOf('\n  if (!category'))
  const inlineTile = services.slice(services.indexOf('function InlineSubcategoryTile'), services.indexOf('function LegacySubcategory'))
  assert.match(inlineServices, /choices\.map\(item => <InlineSubcategoryTile key=\{item.id\} item=\{item\} active=\{selected === item.id\}/)
  assert.match(inlineTile, /<SubcategoryPhoto src=\{item.photo\}/)
  assert.match(inlineTile, /aria-pressed=\{active\}/)
  assert.doesNotMatch(inlineServices, /\.slice\(|discovery-subcategory-more|aria-expanded/)
  assert.doesNotMatch(search, /GuidedServiceDiscovery|guideStage/)
  assert.match(css, /\.inline-category-label,\.inline-service-label \{[^}]*text-align: center;[^}]*white-space: normal; overflow-wrap: normal; word-break: normal/)
  assert.match(css, /\.inline-category-grid,\.inline-service-grid(?:,\.inline-services-skeleton)? \{\s*display: grid; grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
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
