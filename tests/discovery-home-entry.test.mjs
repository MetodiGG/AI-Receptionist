import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { discoveryInitialInput, discoverySearchInput } from '../lib/discovery/search-ui.mjs'
import { discoveryRequestSchema } from '../lib/discovery/intent.mjs'

test('fresh homepage leaves inline categories unselected and does not infer hair or request location', () => {
  for (const locale of ['bg', 'en']) {
    const selection = discoveryInitialInput(null, { home: true })
    assert.equal(selection, null)
    const request = discoverySearchInput({ ...selection, locale, browse: true, categoryBrowse: true })
    assert.equal(request.category, undefined)
    assert.equal(request.query, '')
    assert.equal(request.browse, true)
    assert.equal(request.coordinates, undefined)
    assert.equal(request.subcategory, undefined)
    assert.equal(discoveryRequestSchema.safeParse(request).success, true)
  }
})

test('incoming queries and intentional empty/all-category searches override the homepage default', () => {
  for (const request of [{ query: 'груминг', category: '' }, { query: '', category: '' }, { query: '', category: 'fitness', subcategory: 'fitness-folk-dance' }]) {
    assert.equal(discoveryInitialInput(request, { home: true }), request)
    assert.equal(discoveryInitialInput({ request }, { home: true }), request)
  }
  assert.equal(discoveryInitialInput(null), null)
  assert.equal(discoveryInitialInput({ query: 'тест' }, { home: true, compact: true }), null)
})

test('explicit choices keep their context while the unselected homepage browses immediately and stays inline', async () => {
  const source = await readFile(new URL('../components/discovery-search.js', import.meta.url), 'utf8')
  assert.match(source, /discoveryInitialInput\(initial, \{ home, compact \}\)/)
  assert.match(source, /if \(entryCategory\) \{ setCategory\(''\); setEntryCategory\(false\) \}/)
  for (const action of ['chooseCategory', 'chooseSubcategory', 'selectSuggestion', 'applyFilters']) {
    assert.match(source, new RegExp(`function ${action}\\([^)]*\\) \\{\\s*cancelPendingLocation\\(\\)\\s*setEntryCategory\\(false\\)`))
  }
  assert.match(source, /search\(input, \{ navigate: Boolean\(initial\), earlyHomepageBrowse: !initial && home \}\)/)
  assert.match(source, /<DiscoverySubcategories category=\{category\}/)
  assert.match(source, /<DiscoveryHomeBusinesses/)
  assert.match(source, /initialPreview=\{false\}/)
  assert.match(source, /useState\(!compact && \(home \|\| Boolean\(initial\)\)\)/)
  assert.match(source, /if \(!initial && !home\) return/)
  assert.match(source, /home && !compact && <InlineCategoryGrid locale=\{locale\} category=\{category\} onSelect=\{chooseInlineCategory\}/)
  assert.match(source, /const inlinePanelOpen = Boolean\(category\)/)
  assert.match(source, /home && !compact && <InlineDiscoveryPanel open=\{inlinePanelOpen\}>\{inlinePanelOpen \? <DiscoverySubcategories inline/)
  assert.match(source, /home && !compact && <InlineDiscoverySummary/)
  assert.match(source, /!compact && <DiscoveryHomeBusinesses/)
  assert.doesNotMatch(source, /guideStage|GuidedServiceDiscovery/)
  assert.match(source, /home && !compact && !locationError \? <details className="home-location-help"/)
  assert.match(source, /<p>\{locationMessage\}<\/p>/)
})
