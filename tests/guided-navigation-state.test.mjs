import test from 'node:test'
import assert from 'node:assert/strict'
import { readGuidedNavigation, serializeGuidedNavigation } from '../lib/discovery/guided-navigation.mjs'
import { CATEGORY_IDS } from '../lib/discovery/categories.mjs'
import { DISCOVERY_SUBCATEGORIES, subcategoryById } from '../lib/discovery/subcategories.mjs'
import { DEFAULT_DISCOVERY_CITY, DEFAULT_DISCOVERY_RADIUS_KM, DISCOVERY_RADIUS_CHOICES } from '../lib/discovery/defaults.mjs'

const state = (patch = {}) => ({
  query: '', category: '', subcategory: '', cityCode: DEFAULT_DISCOVERY_CITY,
  cityWasChosen: false, neighborhood: '', radiusKm: DEFAULT_DISCOVERY_RADIUS_KM,
  stage: 'closed', ...patch,
})
const params = href => new URL(href, 'https://www.gorez.co').searchParams

test('a normal first visit has no inferred choice, including locale/preview/unknown-only query strings', () => {
  for (const search of [undefined, null, '', '?', '?lang=bg', '?lang=en&case=spacing', '?unrelated=1', '?lat=42.6&lng=23.3']) {
    assert.equal(readGuidedNavigation(search), null)
  }
  assert.deepEqual(readGuidedNavigation('?discover=closed'), state())
  assert.deepEqual(readGuidedNavigation('?category=not-a-category'), state())
})

test('all stable category identifiers restore results without selecting an arbitrary first child', () => {
  assert.equal(CATEGORY_IDS.length, 14)
  for (const category of CATEGORY_IDS) assert.deepEqual(readGuidedNavigation(`?category=${category}`), state({ category, stage: 'results' }))
})

test('every valid child-only direct link derives its actual parent and can survive refresh', () => {
  for (const child of DISCOVERY_SUBCATEGORIES) {
    const restored = readGuidedNavigation(new URLSearchParams({ subcategory: child.id }))
    assert.deepEqual(restored, state({ category: child.category, subcategory: child.id, stage: 'results' }))
    const href = serializeGuidedNavigation('/?lang=bg', restored, restored.stage)
    assert.deepEqual(readGuidedNavigation(params(href)), restored)
  }
  assert.equal(readGuidedNavigation('?subcategory=fitness-folk-dance').subcategory, 'fitness-folk-dance')
})

test('an explicit valid parent wins over an incompatible child; unknown identifiers never become service filters', () => {
  assert.deepEqual(readGuidedNavigation('?category=nails&subcategory=fitness-folk-dance'), state({ category: 'nails', stage: 'results' }))
  assert.deepEqual(readGuidedNavigation('?category=hair&subcategory=not-real'), state({ category: 'hair', stage: 'results' }))
  assert.deepEqual(readGuidedNavigation('?category=not-real&subcategory=fitness-folk-dance'), state({ category: 'fitness', subcategory: 'fitness-folk-dance', stage: 'results' }))
  for (const value of ['__proto__', 'constructor', 'hair;DROP TABLE services', '<script>alert(1)</script>']) {
    assert.deepEqual(readGuidedNavigation(new URLSearchParams({ category: value, subcategory: value })), state())
  }
})

test('each presentation stage restores; services without a valid parent returns to category selection', () => {
  for (const stage of ['closed', 'categories', 'services', 'results']) {
    assert.equal(readGuidedNavigation(new URLSearchParams({ category: 'hair', discover: stage })).stage, stage)
  }
  assert.equal(readGuidedNavigation('?discover=services').stage, 'categories')
  assert.equal(readGuidedNavigation('?discover=invalid').stage, 'closed')
  assert.equal(readGuidedNavigation('?q=маникюр&discover=invalid').stage, 'results')
})

test('Bulgarian and English query text round-trips intact rather than being replaced by a category label', () => {
  for (const query of ['маникюр до 30 евро в Борово', 'Hair colouring & styling', '  Народни танци  ', 'Желаех \"A&B\" + цена €']) {
    const current = state({ query, category: 'fitness', stage: 'results' })
    const snapshot = structuredClone(current)
    const href = serializeGuidedNavigation('/?lang=en&case=real#results', current, 'results')
    assert.equal(params(href).get('q'), query)
    assert.equal(readGuidedNavigation(params(href)).query, query)
    assert.deepEqual(current, snapshot, 'URL serialization must not mutate the authoritative form state')
    assert.equal(params(href).get('lang'), 'en')
    assert.equal(params(href).get('case'), 'real')
    assert.ok(href.endsWith('#results'))
  }
})

test('compatibility aliases restore but serializer emits only the canonical query/city/radius keys', () => {
  const restored = readGuidedNavigation('?query=маникюр&cityCode=56784&radiusKm=5&neighborhood=Тракия')
  assert.deepEqual(restored, state({ query: 'маникюр', cityCode: '56784', cityWasChosen: true, neighborhood: 'Тракия', radiusKm: 5, stage: 'results' }))
  const href = serializeGuidedNavigation('/?lang=bg&query=old&cityCode=68134&radiusKm=25', restored, 'results')
  const next = params(href)
  assert.equal(next.get('q'), 'маникюр')
  assert.equal(next.get('city'), '56784')
  assert.equal(next.get('radius'), '5')
  for (const alias of ['query', 'cityCode', 'radiusKm']) assert.equal(next.has(alias), false)
  assert.deepEqual(readGuidedNavigation(next), restored)
})

test('canonical values take precedence over aliases, without accepting ambiguous duplicate filters', () => {
  const restored = readGuidedNavigation('?q=правилен&query=wrong&city=56784&cityCode=68134&radius=3&radiusKm=25')
  assert.equal(restored.query, 'правилен')
  assert.equal(restored.cityCode, '56784')
  assert.equal(restored.radiusKm, 3)
  assert.deepEqual(readGuidedNavigation('?category=hair&category=nails&subcategory=not-real'), state())
  assert.equal(readGuidedNavigation('?q=first&q=second&query=third').query, '')
  assert.equal(readGuidedNavigation('?radius=3&radius=5').radiusKm, DEFAULT_DISCOVERY_RADIUS_KM)
  assert.equal(readGuidedNavigation('?city=68134&city=56784&neighborhood=Борово').neighborhood, '')
})

test('only registry-supported city and quarter combinations restore, never an invalid city defaulting into the same quarter', () => {
  assert.deepEqual(readGuidedNavigation('?city=68134&neighborhood=Борово'), state({ cityWasChosen: true, neighborhood: 'Борово', stage: 'results' }))
  assert.deepEqual(readGuidedNavigation('?city=56784&neighborhood=Тракия'), state({ cityCode: '56784', cityWasChosen: true, neighborhood: 'Тракия', stage: 'results' }))
  assert.equal(readGuidedNavigation('?city=56784&neighborhood=Борово').neighborhood, '')
  assert.deepEqual(readGuidedNavigation('?city=unknown&neighborhood=Борово'), state())
  assert.equal(readGuidedNavigation('?neighborhood=Борово').cityWasChosen, true)
  assert.equal(readGuidedNavigation('?neighborhood=not-a-quarter').neighborhood, '')
})

test('radius is one of the shared existing choices; decimals, infinity and appended text are not silently coerced', () => {
  for (const radiusKm of DISCOVERY_RADIUS_CHOICES) {
    assert.equal(readGuidedNavigation(`?radius=${radiusKm}`).radiusKm, radiusKm)
  }
  for (const value of ['NaN', 'Infinity', '-1', '0', '1000', '5km', '2.5', '05', ' 5 ']) {
    assert.deepEqual(readGuidedNavigation(new URLSearchParams({ radius: value })), state())
  }
})

test('an implicit Sofia city stays implicit in links, while manually chosen cities and valid quarters remain explicit', () => {
  const implicit = params(serializeGuidedNavigation('/?lang=bg', state({ category: 'hair' }), 'services'))
  assert.equal(implicit.has('city'), false)
  assert.equal(implicit.has('radius'), false)
  const explicit = params(serializeGuidedNavigation('/', state({ cityWasChosen: true }), 'results'))
  assert.equal(explicit.get('city'), DEFAULT_DISCOVERY_CITY)
  const quarter = params(serializeGuidedNavigation('/', state({ neighborhood: 'Борово' }), 'results'))
  assert.equal(quarter.get('city'), DEFAULT_DISCOVERY_CITY)
  assert.equal(quarter.get('neighborhood'), 'Борово')
  const invalid = params(serializeGuidedNavigation('/', state({ cityCode: 'bad', cityWasChosen: true, neighborhood: 'Борово' }), 'results'))
  assert.equal(invalid.has('city'), false)
  assert.equal(invalid.has('neighborhood'), false)
})

test('precise consented coordinates are neither read from URLs nor projected from current form state into them', () => {
  const selection = state({ query: 'маникюр', category: 'nails', coordinates: { latitude: 42.665321, longitude: 23.286654, consent: true }, observedAt: 123, accuracyMeters: 15 })
  const snapshot = structuredClone(selection)
  const href = serializeGuidedNavigation('/?lang=bg&lat=42.6&lng=23.3&coordinates[latitude]=42.6&coordinates.longitude=23.3&origin=42.6,23.3&consent=true&expandNearby=true&locationMetadata[observedAt]=123#results', selection, 'results')
  assert.doesNotMatch(href, /42\.6|23\.3|latitude|longitude|coords|coordinates|origin=|consent|observedAt|expandNearby|locationMetadata/i)
  assert.deepEqual(selection, snapshot)
  const restored = readGuidedNavigation('?category=nails&latitude=42.6&longitude=23.3&consent=true')
  assert.equal('coordinates' in restored, false)
  assert.equal('latitude' in restored, false)
  assert.equal(restored.cityWasChosen, false)
})

test('legacy coordinate fragments are not forwarded; normal section anchors and unrelated parameters survive', () => {
  for (const hash of ['#lat=42.6&lng=23.3', '#map?coordinates=42.6,23.3', '#origin=42.6,23.3']) {
    assert.equal(new URL(serializeGuidedNavigation('/' + hash, state(), 'closed'), 'https://www.gorez.co').hash, '')
  }
  const href = serializeGuidedNavigation('/?lang=en&case=portrait&feature=one&feature=two#selection', state(), 'categories')
  assert.equal(new URL(href, 'https://www.gorez.co').hash, '#selection')
  assert.deepEqual(params(href).getAll('feature'), ['one', 'two'])
})

test('URLs are relative and cannot become protocol-relative or javascript navigation targets', () => {
  for (const current of ['javascript:alert(1)', 'data:text/html,test', 'https://example.com//evil.example', '//evil.example/path', '/\\\\evil.example/path']) {
    const href = serializeGuidedNavigation(current, state(), 'categories')
    assert.ok(href.startsWith('/'), href)
    assert.equal(href.startsWith('//'), false, href)
    assert.equal(new URL(href, 'https://www.gorez.co').origin, 'https://www.gorez.co')
  }
})

test('duplicate navigation, overlong text and control characters cannot restore a misleading request', () => {
  assert.equal(readGuidedNavigation(new URLSearchParams({ q: 'x'.repeat(301) })).query, '')
  for (const query of ['a\u0000b', 'a\nb', 'a\u007fb']) assert.equal(readGuidedNavigation(new URLSearchParams({ q: query })).query, '')
  const query = 'x'.repeat(300)
  assert.equal(readGuidedNavigation(new URLSearchParams({ q: query })).query, query)
  assert.equal(readGuidedNavigation('?discover=categories&discover=services').stage, 'closed')
})

test('back/forward snapshots restore distinct canonical parent/child selections without losing valid geography', () => {
  const initial = state()
  const category = state({ category: 'fitness', cityCode: '56784', cityWasChosen: true, neighborhood: 'Тракия', radiusKm: 3 })
  const selected = { ...category, subcategory: 'fitness-folk-dance' }
  const snapshots = [
    serializeGuidedNavigation('/?lang=bg', initial, 'closed'),
    serializeGuidedNavigation('/?lang=bg', initial, 'categories'),
    serializeGuidedNavigation('/?lang=bg', category, 'services'),
    serializeGuidedNavigation('/?lang=bg', selected, 'results'),
  ]
  for (const offset of [0, 1, 2, 3, 2, 1, 2, 3]) {
    const restored = readGuidedNavigation(params(snapshots[offset]))
    assert.equal(restored.stage, ['closed', 'categories', 'services', 'results'][offset])
    if (offset >= 2) {
      assert.equal(restored.cityCode, '56784')
      assert.equal(restored.neighborhood, 'Тракия')
      assert.equal(restored.radiusKm, 3)
      assert.equal(restored.category, 'fitness')
      assert.equal(restored.subcategory, offset === 3 ? 'fitness-folk-dance' : '')
    }
  }
  assert.equal(subcategoryById(readGuidedNavigation(params(snapshots[3])).subcategory).category, 'fitness')
})

test('default serialization is compact and closed unless the authoritative selection supplies a real constraint', () => {
  assert.deepEqual(readGuidedNavigation(params(serializeGuidedNavigation('/?lang=en', state()))), state())
  assert.equal(readGuidedNavigation(params(serializeGuidedNavigation('/', state({ category: 'hair' })))).stage, 'results')
  assert.equal(readGuidedNavigation(params(serializeGuidedNavigation('/', state({ query: 'йога' })))).stage, 'results')
  assert.equal(readGuidedNavigation(params(serializeGuidedNavigation('/', state(), 'services'))).stage, 'categories')
})
