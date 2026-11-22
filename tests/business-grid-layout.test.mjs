import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('business results stay one per row while complete inline categories wrap into two, three and four columns', async () => {
  const [css, list, search, layout, inline] = await Promise.all(['app/business-results.css', 'components/discovery-business-list.js', 'components/discovery-search.js', 'app/layout.js', 'app/inline-discovery.css'].map(read))
  assert.match(css, /--business-columns: 1/)
  assert.doesNotMatch(css, /--business-columns:\s*[2-9]/)
  assert.match(css, /\.home-business-grid \.home-business-card:is\([^\n]*display: grid; grid-template-columns: minmax\(210px,32%\) minmax\(0,1fr\)/)
  assert.match(css, /\.home-business-photo \{ grid-column: 1; grid-row: 1 \/ -1/)
  assert.doesNotMatch(css, /overflow(?:-y)?: (?:auto|scroll)|max-height:/)
  assert.match(search, /home && !compact && <InlineCategoryGrid locale=\{locale\}/)
  assert.doesNotMatch(search, /<DiscoveryHomeRail/)
  assert.match(inline, /\.inline-category-grid,\.inline-service-grid(?:,\.inline-services-skeleton)? \{\s*display: grid; grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/)
  assert.match(inline, /@media \(min-width:700px\) \{[\s\S]*?\.inline-category-grid,\.inline-service-grid(?:,\.inline-services-skeleton)? \{ grid-template-columns: repeat\(3,minmax\(0,1fr\)\)/)
  assert.match(inline, /@media \(min-width:1000px\) \{[\s\S]*?\.inline-category-grid,\.inline-service-grid(?:,\.inline-services-skeleton)? \{ grid-template-columns: repeat\(4,minmax\(0,1fr\)\)/)
  assert.doesNotMatch(inline, /overflow-x:\s*(?:auto|scroll)|scroll-snap-type|grid-auto-flow:\s*column/)
  assert.doesNotMatch(list, /onWheel=|onScroll=|home-rail-arrows|home-discovery-rail/)
  assert.ok(layout.indexOf("import './business-results.css'") > layout.indexOf("import './service-photo-surfaces.css'"))
  assert.ok(layout.indexOf("import './inline-discovery.css'") > layout.indexOf("import './quick-choice-home.css'"))
})

test('local vertical preview is development-only, finite and uses inert real UI components', async () => {
  const [page, preview] = await Promise.all(['app/dev/business-grid/page.js', 'app/dev/business-grid/preview.js'].map(read))
  assert.match(page, /process.env.NODE_ENV !== 'development'\) notFound\(\)/)
  assert.match(page, /index: false, follow: false/)
  assert.match(preview, /pageSize = 6, total = 18/)
  assert.match(preview, /<DiscoveryHomeBusinesses[^\n]*preview data=\{directory\}/)
  assert.match(preview, /version !== generation.current/)
  assert.doesNotMatch(preview, /fetch\(|supabase|createAppointment|window.location|\.submit\(/)
})
