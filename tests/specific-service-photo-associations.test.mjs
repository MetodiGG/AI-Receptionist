import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { specificServicePhotoKey, SPECIFIC_SERVICE_PHOTO_IDS } from '../lib/specific-service-photo-ids.mjs'
import { catalogueServicePhotoFields, catalogueDetailsWithServicePhotos } from '../lib/catalogue-service-photo-keys.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS } from '../lib/catalogue-service-photo-associations.mjs'
import { catalogueBusinessDetails, businessDetailServices } from '../lib/discovery/business-details.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { NONBOOKABLE_CATALOGUE_ITEMS, TEMPORARILY_HELD_CATALOGUE_SERVICES } from '../lib/discovery/catalogue-service-eligibility.mjs'

const now = Date.parse('2026-11-12T00:00:00Z')
const approved = SOFIA_CATALOGUE.map(row => approvedCatalogueRecord(row, now)).filter(Boolean)
const withoutPhoto = service => Object.fromEntries(Object.entries(service).filter(([key]) => key !== 'illustrativePhotoKey'))

test('browser photo keys are finite allowlisted local IDs, never arbitrary paths or URLs', () => {
  assert.ok(SPECIFIC_SERVICE_PHOTO_IDS.length > 0, 'specific assets must be integrated before release')
  assert.equal(new Set(SPECIFIC_SERVICE_PHOTO_IDS).size, SPECIFIC_SERVICE_PHOTO_IDS.length)
  for (const id of SPECIFIC_SERVICE_PHOTO_IDS) { assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/); assert.equal(specificServicePhotoKey(id), id) }
  for (const value of [null, undefined, {}, '__proto__', 'constructor', '../private', '/api/business-media/id', 'https://example.invalid/a.webp', 'data:image/png;base64,abc']) assert.equal(specificServicePhotoKey(value), null)
})

test('all approved catalogue services have an activity-specific photo, not the neutral workspace', () => {
  const before = JSON.stringify(SOFIA_CATALOGUE)
  let resolved = 0, total = 0
  for (const business of approved) for (const service of business.services) {
    const previous = serviceThumbnail(service, { business })
    const fields = catalogueServicePhotoFields(service, business)
    const image = serviceThumbnail({ ...service, ...fields }, { business })
    if (previous.photoMatch === 'neutral') { assert.ok(fields.illustrativePhotoKey, `${business.id}: ${service.name}`); resolved++ }
    assert.equal(image.type, 'photo'); assert.notEqual(image.photoMatch, 'neutral', `${business.id}: ${service.name}`)
    assert.doesNotMatch(image.src, /appointment-workspace|category-art/)
    total++
  }
  assert.ok(resolved >= 3500); assert.equal(total, 8936 - NONBOOKABLE_CATALOGUE_ITEMS.length - TEMPORARILY_HELD_CATALOGUE_SERVICES.length)
  assert.equal(JSON.stringify(SOFIA_CATALOGUE), before, 'names, prices, booking targets and source reviews are untouched')
})

test('exact associations cannot cross businesses, categories or service wording', () => {
  assert.ok(CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS.length > 0)
  for (const [businessId, category, name, photoId] of CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS) {
    assert.equal(catalogueServicePhotoFields({ name, category }, { id: businessId }).illustrativePhotoKey, photoId)
    assert.deepEqual(catalogueServicePhotoFields({ name, category: '__other_category__' }, { id: businessId }), {})
    assert.deepEqual(catalogueServicePhotoFields({ name: `${name} / UNREVIEWED`, category }, { id: businessId }), {})
    assert.deepEqual(catalogueServicePhotoFields({ name, category }, { id: '__other_business__' }), {})
  }
})

test('public browse and detail adapters retain exact service photo IDs without changing prices or booking data', () => {
  const rows = normalizeCatalogueBusinesses(SOFIA_CATALOGUE, { cityCode: '68134', browse: true, requirements: [] }, { now })
  assert.equal(rows.length, approved.length)
  for (const row of rows) {
    const raw = approved.find(item => item.id === row.id)
    const details = catalogueDetailsWithServicePhotos(raw, now)
    assert.deepEqual(details.services.map(withoutPhoto), catalogueBusinessDetails(raw, now).services)
    assert.deepEqual(details.hours, catalogueBusinessDetails(raw, now).hours)
    assert.deepEqual(row.booking, { ...raw.booking, verified: true, checkedOn: raw.verification.checkedOn, validUntil: raw.verification.validUntil })
    for (const service of [...row.services, ...businessDetailServices({ details })]) assert.notEqual(serviceThumbnail(service, { business: row }).photoMatch, 'neutral', `${row.id}: ${service.name}`)
  }
})

test('category browse reattaches the reviewed photo after the shared matching allowlist', () => {
  const business = approved.find(row => row.id === 'sofia-mokro-nosle')
  const service = business.services.find(row => row.name === 'Груминг за кучета')
  const expected = catalogueServicePhotoFields(service, business).illustrativePhotoKey
  assert.ok(expected)
  const [row] = normalizeCatalogueBusinesses([business], { cityCode: '68134', browse: true, requirements: [] }, { now })
  const shown = row.services.find(item => item.name === service.name)
  assert.equal(shown.illustrativePhotoKey, expected)
  assert.notEqual(serviceThumbnail(shown, { business: row }).photoMatch, 'neutral')
  assert.equal(shown.price, service.price?.amount ?? null)
})

test('the actual public details response carries the image key through to rendered detail services', async () => {
  const business = approved.find(row => row.services.some(service => catalogueServicePhotoFields(service, row).illustrativePhotoKey))
  assert.ok(business)
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true, environment: 'production' }, now: () => now,
    allowAttempt: async () => true, findCatalogue: async id => id === business.id ? business : null, readCataloguePhotos: async () => [] })
  const response = await handler(new Request(`https://www.gorez.co/api/public/discovery/business/${business.id}`, { headers: { origin: 'https://www.gorez.co', 'sec-fetch-site': 'same-origin' } }), business.id)
  assert.equal(response.status, 200)
  const body = await response.json()
  for (const service of businessDetailServices(body.business)) assert.notEqual(serviceThumbnail(service, { business: body.business }).photoMatch, 'neutral')
})

test('the exact-name association inventory is unreachable from the homepage client import graph', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url)), seen = new Set()
  async function walk(path) {
    if (seen.has(path)) return
    seen.add(path)
    const source = await readFile(path, 'utf8')
    const imports = [...source.matchAll(/(?:from\s*|import\s*\()\s*['"](\.[^'"]+)['"]/g)].map(match => match[1])
    for (const imported of imports) {
      const base = resolve(dirname(path), imported)
      for (const candidate of [base, `${base}.js`, `${base}.mjs`]) {
        try { if ((await stat(candidate)).isFile()) { await walk(candidate); break } } catch (error) { if (error.code !== 'ENOENT') throw error }
      }
    }
  }
  await walk(resolve(root, 'components/discovery-search.js'))
  assert.ok([...seen].some(path => path.endsWith('specific-service-photo-ids.mjs')))
  assert.ok(![...seen].some(path => /catalogue-service-photo-(?:associations|keys)\.mjs$/.test(path)), 'large business/name inventory must remain server-side')
})
