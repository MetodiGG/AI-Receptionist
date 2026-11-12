import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('business results stay one per row at every width; categories retain the horizontal rail', async () => {
  const [css, list, search, layout] = await Promise.all(['app/business-results.css', 'components/discovery-business-list.js', 'components/discovery-search.js', 'app/layout.js'].map(read))
  assert.match(css, /--business-columns: 1/)
  assert.doesNotMatch(css, /--business-columns:\s*[2-9]/)
  assert.match(css, /\.home-business-grid \.home-business-card:is\([^\n]*display: grid; grid-template-columns: minmax\(210px,32%\) minmax\(0,1fr\)/)
  assert.match(css, /\.home-business-photo \{ grid-column: 1; grid-row: 1 \/ -1/)
  assert.doesNotMatch(css, /overflow(?:-y)?: (?:auto|scroll)|max-height:/)
  assert.match(search, /<DiscoveryHomeRail title=\{homeCopy.categories\} locale=\{locale\} kind="categories"/)
  assert.doesNotMatch(list, /onWheel=|onScroll=|home-rail-arrows|home-discovery-rail/)
  assert.ok(layout.indexOf("import './business-results.css'") > layout.indexOf("import './service-photo-surfaces.css'"))
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
