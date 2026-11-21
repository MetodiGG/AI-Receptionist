import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { discoveryInitialInput, discoverySearchInput } from '../lib/discovery/search-ui.mjs'
import { discoveryRequestSchema } from '../lib/discovery/intent.mjs'

test('fresh homepage leaves category choice closed and does not infer hair or request location', () => {
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

test('introductory category releases on typing; explicit choices keep their context and results stay inline', async () => {
  const source = await readFile(new URL('../components/discovery-search.js', import.meta.url), 'utf8')
  assert.match(source, /discoveryInitialInput\(initial, \{ home, compact \}\)/)
  assert.match(source, /if \(entryCategory\) \{ setCategory\(''\); setEntryCategory\(false\) \}/)
  for (const action of ['chooseCategory', 'chooseSubcategory', 'selectSuggestion', 'applyFilters']) {
    assert.match(source, new RegExp(`function ${action}\\([^)]*\\) \\{\\s*cancelPendingLocation\\(\\)\\s*setEntryCategory\\(false\\)`))
  }
  assert.match(source, /search\(input, \{ navigate: Boolean\(initial\) \}\)/)
  assert.match(source, /<DiscoverySubcategories category=\{category\}/)
  assert.match(source, /<DiscoveryHomeBusinesses/)
  assert.match(source, /initialPreview=\{false\}/)
  assert.match(source, /useState\(initial \? 'results' : 'closed'\)/)
  assert.match(source, /<GuidedServiceDiscovery locale=\{locale\} stage=\{guideStage\}/)
  assert.match(source, /home && !compact && !locationError \? <details className="home-location-help"/)
  assert.match(source, /<p>\{locationMessage\}<\/p>/)
})
