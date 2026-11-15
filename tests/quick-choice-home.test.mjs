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
  assert.match(css, /\.home-search-panel \{[^}]*border:0;[^}]*border-radius:0; background:transparent; box-shadow:none/)
  assert.match(css, /\.discovery-query \{ min-height:52px/)
  assert.match(css, /\.discovery-query input \{ font-size:16px/)
  assert.doesNotMatch(css, /\.language-switch|\.country-flag|\.launch-menu-toggle|\.gorez-wordmark/)
  for (const line of css.split('\n')) if (/^\s*\./.test(line)) assert.match(line.trimStart(), /^\.customer-home\.quick-choice /)
})

test('all existing photographic categories stay horizontal and children wrap with photos and full labels', async () => {
  const [css, search, children] = await Promise.all(['app/quick-choice-home.css', 'components/discovery-search.js', 'components/discovery-subcategories.js'].map(read))
  assert.match(css, /\.home-categories \.home-discovery-rail button \{ flex-direction:row/)
  assert.match(css, /\.home-categories \.home-discovery-rail button \{[^}]*border-radius:999px/)
  assert.match(css, /\.home-categories img \{[^}]*width:50px; height:50px/)
  assert.match(css, /\.home-categories \.home-discovery-rail button \{[^}]*min-height:66px/)
  assert.match(css, /\.home-categories button > span \{[^}]*font-size:18px/)
  assert.match(css, /\.discovery-subcategory-grid \{ display:grid; grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,216px\),1fr\)\)/)
  assert.match(css, /\.discovery-subcategories \{[^}]*--subcategory-photo-size:44px/)
  assert.match(css, /\.discovery-subcategory-option \{[^}]*flex-wrap:nowrap;[^}]*min-height:56px;[^}]*border-radius:999px;[^}]*font-size:17px/)
  assert.match(css, /\.discovery-subcategory-photo \{[^}]*width:var\(--subcategory-photo-size\); height:var\(--subcategory-photo-size\)/)
  assert.match(search, /homeCategories\(locale\)\.map/)
  assert.match(search, /<DiscoveryHomeRail title=\{homeCopy.categories\} locale=\{locale\} kind="categories" hideHeading>/)
  assert.match(children, /<SubcategoryPhoto src=\{item.photo\}/)
  assert.match(children, /aria-expanded=\{expanded\}/)
  assert.doesNotMatch(css, /text-overflow:\s*ellipsis|line-clamp|overflow-x:\s*hidden|word-break:\s*break-all/)
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
