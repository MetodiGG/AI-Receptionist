import test from 'node:test'
import assert from 'node:assert/strict'
import { GPOINT_SHARED_COVER, sharedCataloguePhotoIds, attachSharedCataloguePhotos } from '../lib/catalogue-shared-covers.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { businessPhotoStyle } from '../lib/business-photo-layout.mjs'
import { searchFreeCatalogue } from '../lib/discovery/catalogue-search.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'

const { sourceCatalogueId, sourcePhotoId, catalogueIds } = GPOINT_SHARED_COVER
const target = 'sofia-gpoint-manastirski-iztok'
const now = Date.parse('2026-11-13T12:00:00Z')
const sourceRow = (patch = {}) => ({ catalogue_id: sourceCatalogueId, photo_id: sourcePhotoId,
  object_key: `catalogue/${sourceCatalogueId}/${sourcePhotoId}.webp`, width: 1170, height: 1157,
  alt_text: 'Source branch logo', rights_basis: 'owner_permission', rights_reference: 'Recorded owner permission',
  revision: 1, byte_size: 12345, ...patch })
const resultRow = (id = target, patch = {}) => ({ id, source: 'catalogue', website: 'https://gpoint.bg/', photo: null,
  name: 'G Point', address: 'Actual branch address', coordinates: { latitude: 42.67, longitude: 23.3 },
  services: [{ id: `${id}-0`, name: 'Actual service', price: 30, currency: 'EUR' }], ...patch })
const sourceUrl = `/api/catalogue-media/${sourcePhotoId}`
const entry = id => SOFIA_CATALOGUE.find(row => row.id === id)

test('shared cover registry is frozen and exactly matches the 43 reviewed gpoint.bg locations', () => {
  const actual = SOFIA_CATALOGUE.filter(row => row.website === 'https://gpoint.bg/')
  assert.equal(actual.length, 43)
  assert.equal(new Set(catalogueIds).size, 43)
  assert.deepEqual([...catalogueIds].sort(), actual.map(row => row.id).sort())
  assert.ok(actual.every(row => approvedCatalogueRecord(row, now)))
  assert.ok(Object.isFrozen(GPOINT_SHARED_COVER)); assert.ok(Object.isFrozen(catalogueIds))
  assert.equal(catalogueIds.includes('sofia-g-point-lashes-ovcha-kupel'), false)
  assert.equal(entry('sofia-g-point-lashes-ovcha-kupel').website, 'https://www.notino.bg/saloni/g-point-lashes/')
})

test('shared lookup adds only one source ID to a deduplicated bounded page', () => {
  const page = catalogueIds.filter(id => id !== sourceCatalogueId).slice(0, 15)
  const original = structuredClone(page)
  const ids = sharedCataloguePhotoIds([...page, page[0]])
  assert.equal(ids.length, 16); assert.deepEqual(ids, [...page, sourceCatalogueId])
  assert.deepEqual(page, original)
  assert.deepEqual(sharedCataloguePhotoIds([sourceCatalogueId, sourceCatalogueId]), [sourceCatalogueId])
  assert.deepEqual(sharedCataloguePhotoIds(['sofia-mokro-nosle']), ['sofia-mokro-nosle'])
  assert.deepEqual(sharedCataloguePhotoIds([target], { sourceApproved: false }), [target])
  for (const input of [null, undefined, {}, 'not-an-array', []]) assert.deepEqual(sharedCataloguePhotoIds(input), [])
  assert.deepEqual(sharedCataloguePhotoIds([null, {}, '../unsafe', target]), [target, sourceCatalogueId])
})

test('all 43 public chain rows reuse the live authorized logo without copying private records or changing facts', () => {
  const rows = catalogueIds.map(id => resultRow(id)), records = [sourceRow()]
  const before = structuredClone({ rows, records })
  const attached = attachSharedCataloguePhotos(rows, records)
  assert.equal(attached.length, 43)
  assert.ok(attached.every(row => row.photo.src === sourceUrl))
  assert.equal(attached.filter(row => row.id !== sourceCatalogueId).length, 42)
  for (const row of attached) {
    assert.deepEqual(Object.keys(row.photo).sort(), ['alt', 'height', 'src', 'width'])
    assert.deepEqual(businessPhotoStyle(row.photo), { objectFit: 'contain', objectPosition: 'center', backgroundColor: '#fff' })
    const original = rows.find(item => item.id === row.id)
    const { photo, ...facts } = row, { photo: oldPhoto, ...oldFacts } = original
    assert.deepEqual(facts, oldFacts)
    if (row.id !== sourceCatalogueId) assert.equal(photo.alt, 'G Point')
  }
  assert.deepEqual({ rows, records }, before)
  assert.doesNotMatch(JSON.stringify(attached), /rights_reference|Recorded owner permission|object_key|byte_size|revision/)
})

test('each valid direct branch photo overrides the shared logo, even if source approval is withdrawn', () => {
  const ownId = '10000000-0000-4000-8000-000000000001'
  const own = sourceRow({ catalogue_id: target, photo_id: ownId, object_key: `catalogue/${target}/${ownId}.webp`, alt_text: 'Own branch photo' })
  for (const sourceApproved of [true, false]) {
    const row = attachSharedCataloguePhotos([resultRow()], [sourceRow(), own], { sourceApproved })[0]
    assert.equal(row.photo.src, `/api/catalogue-media/${ownId}`); assert.equal(row.photo.alt, 'Own branch photo')
  }
  const existing = { src: '/catalogue-media/existing.webp', alt: 'Existing approved image' }
  assert.equal(attachSharedCataloguePhotos([resultRow(target, { photo: existing })], [sourceRow()])[0].photo, existing)
})

test('no alias leaks to unrelated businesses, native partners, unreviewed IDs or spoofed chain identity', () => {
  const unrelated = [resultRow('sofia-g-point-lashes-ovcha-kupel', { website: 'https://www.notino.bg/saloni/g-point-lashes/' }),
    resultRow('sofia-gpoint-new-unreviewed'), resultRow(target, { source: 'gorez' }),
    ...['https://gpoint.bg.evil.test/', 'https://evil.test/', 'http://gpoint.bg/', undefined].map(website => resultRow(target, { website }))]
  const attached = attachSharedCataloguePhotos(unrelated, [sourceRow()])
  attached.forEach((row, index) => { assert.equal(row, unrelated[index]); assert.equal(row.photo, null) })
})

test('missing, removed, replaced, unapproved or incorrectly authorized source cannot supply inherited covers', () => {
  const patches = [
    { catalogue_id: 'sofia-gpoint-borovo' }, { photo_id: '10000000-0000-4000-8000-000000000001' },
    { object_key: 'foreign/private.webp' }, { rights_basis: null }, { rights_reference: '' },
    { width: 0 }, { height: 2001 }, { photo_id: null },
  ]
  for (const records of [[], [null], ...patches.map(patch => [sourceRow(patch)])]) {
    const original = resultRow()
    assert.equal(attachSharedCataloguePhotos([original], records)[0], original)
  }
  assert.equal(attachSharedCataloguePhotos([resultRow()], [sourceRow()], { sourceApproved: false })[0].photo, null)
  for (const invalid of [null, {}, 'not-an-array']) assert.deepEqual(attachSharedCataloguePhotos(invalid, null), [])
  assert.equal(attachSharedCataloguePhotos([resultRow()], null)[0].photo, null)
})

test('the real public catalogue search attaches the shared source from one expanded metadata read and tolerates outages', async () => {
  const reads = []
  const deps = { config: { maxResults: 15 }, now: { toMillis: () => now },
    readInternal: async () => [], readCatalogue: async () => [entry(target)],
    readCataloguePhotos: async ids => { const expanded = sharedCataloguePhotoIds(ids); reads.push(expanded); return [sourceRow()] } }
  const input = { query: '', browse: true, locale: 'bg', category: 'beauty', cityCode: '68134', radiusKm: 10 }
  const interpretation = { mode: 'rules', intent: { ...input, requirements: [] } }
  const result = await searchFreeCatalogue(input, interpretation, deps)
  assert.equal(reads.length, 1); assert.deepEqual(reads[0], [target, sourceCatalogueId])
  assert.equal(result.results[0].photo.src, sourceUrl)
  const offline = await searchFreeCatalogue(input, interpretation, { ...deps, readCataloguePhotos: async () => { throw Error('offline') } })
  assert.equal(offline.results[0].photo, null); assert.equal(offline.results[0].id, target)
  assert.deepEqual(offline.results[0].services, result.results[0].services)
})

test('the real public detail handler attaches the same cover without changing actual branch information or booking', async () => {
  const reads = []
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true, environment: 'development' }, now: () => now,
    findCatalogue: id => entry(id), allowAttempt: async () => true,
    readCataloguePhotos: async ids => { reads.push(sharedCataloguePhotoIds(ids)); return [sourceRow()] } })
  const response = await handler(new Request('https://gorez.test/api/public/discovery/business/' + target,
    { headers: { Origin: 'https://gorez.test' } }), target)
  assert.equal(response.status, 200)
  const { business } = await response.json()
  assert.deepEqual(reads, [[target, sourceCatalogueId]])
  assert.equal(business.photo.src, sourceUrl); assert.equal(business.photo.alt, 'G Point')
  assert.equal(business.address, entry(target).address)
  assert.deepEqual(business.booking, { ...entry(target).booking, verified: true, checkedOn: entry(target).verification.checkedOn, validUntil: entry(target).verification.validUntil })
  assert.equal(business.details.services.length, entry(target).services.length)
})

test('all 43 actual public branch details differ only by their cover photo, not prices, addresses, coordinates or booking destinations', async () => {
  const before = JSON.stringify(SOFIA_CATALOGUE)
  const deps = { config: { enabled: true, environment: 'development' }, now: () => now,
    findCatalogue: id => entry(id), allowAttempt: async () => true }
  const shared = createPublicBusinessDetailsHandler({ ...deps, readCataloguePhotos: async () => [sourceRow()] })
  const original = createPublicBusinessDetailsHandler({ ...deps, readCataloguePhotos: async () => [] })
  for (const id of catalogueIds) {
    const request = () => new Request(`https://gorez.test/api/public/discovery/business/${id}`, { headers: { Origin: 'https://gorez.test' } })
    const [afterResponse, beforeResponse] = await Promise.all([shared(request(), id), original(request(), id)])
    assert.equal(afterResponse.status, 200, id); assert.equal(beforeResponse.status, 200, id)
    const { business: after } = await afterResponse.json(), { business: previous } = await beforeResponse.json()
    assert.equal(after.photo.src, sourceUrl, id)
    const { photo, ...afterFacts } = after, { photo: previousPhoto, ...previousFacts } = previous
    assert.deepEqual(afterFacts, previousFacts, id)
  }
  assert.equal(JSON.stringify(SOFIA_CATALOGUE), before)
})
