import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { applyReviewedAutoAreaRecovery20261123 } from '../lib/discovery/catalogue-data/auto-area-recovery-20261123.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { OSM_ATTRIBUTION, OSM_COPYRIGHT_URL } from '../lib/discovery/catalogue-attribution.mjs'
import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../lib/discovery/official-sofia-address-source.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'

const now = Date.parse('2026-11-23T12:00:00Z')
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
// Old normalized row/review hashes were independently read from e4c4ca1.
// Inverting only the permitted fields must recover those exact historic facts.
const fixtures = [
  {
    id: 'sofia-po-manyashkiya-detailing', name: 'По-Маняшкия Детайлинг', category: 'detailing',
    from: null, to: 'Зона Б-19', previousAddress: 'София, ул. Царибродска 107', address: 'София, ул. Царибродска 107',
    point: ['47458', 42.70063093487165, 23.29953644773413], pointDate: '2026-11-13', previousPoint: true,
    oldHash: '6092dfb3b4b102a4383d6eec2239507d202aa0e792f41f38d0a39725b72ee497',
    reviewHash: '74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b',
    beforeCell: [0, 0], afterCell: [1, 1],
  },
  {
    id: 'sofia-georgis-garage-sofia', name: 'Georgi’s Garage · София', category: 'detailing',
    from: 'Студентски град', to: 'Студентски град', previousAddress: 'София, Студентски град, ул. Рашо Рашев 4',
    address: 'София, Студентски град, ул. Проф. Рашо Рашев 4',
    point: ['98477', 42.649666, 23.342937], pointDate: '2026-11-22',
    oldHash: 'f791d149777cc134654bb2a4cc11b538d72bca926a0c39bccedbd6374ea6d4ea',
    reviewHash: 'dfe2604143469b8aa35df12142170cf91fa7bd4fb97454977c5419753bc0252f',
    beforeCell: [1, 0], afterCell: [1, 1],
  },
  {
    id: 'sofia-pulse-car-wash-mladost', name: 'Pulse Car Wash · Mladost', category: 'car_wash',
    from: 'Младост', to: 'Младост 4', previousAddress: 'София, ж.к. Младост, Околовръстен път 251А',
    address: 'София, ж.к. Младост 4, Околовръстен път 251А',
    point: ['104368', 42.624312, 23.3728], pointDate: '2026-11-22',
    oldHash: '068d5cde43cb51ddacb0ab1c8641836fabe370070cbd86fdd0d3befe503257db',
    reviewHash: 'c65d1e6ed80652eb482dec189713ac4f540bbf9a746292c572388ca8e4b6820c',
    beforeCell: [1, 1], afterCell: [2, 2],
  },
  {
    id: 'sofia-lux-mbal-sveta-sofia-carwash', name: 'Автомивка LUX · МБАЛ Света София', category: 'car_wash',
    from: null, to: 'Манастирски ливади', previousAddress: 'София, бул. България 104, Корпус 2, ниво -1',
    address: 'София, бул. България 104, Корпус 2, ниво -1',
    retainedPoint: { latitude: 42.6595902, longitude: 23.2843285,
      source: 'https://www.openstreetmap.org/way/1551254006', method: 'verified_address_geocode',
      sourceAddress: 'София, бул. България 104, Корпус 2, ниво -1', checkedOn: '2026-11-06',
      licence: 'ODbL-1.0', attribution: OSM_ATTRIBUTION },
    oldHash: '42bc9a0bcf883ed25f73817efdd533294220777d573ca724d800ecce946d73f0',
    newHash: 'a54144ab4be33677c5d6a560195e8a39f68664665a203a3916753e324c37439f',
    pricingHash: 'dd3cafe56730bb91d4316853b385aaf8a160ff3277ff87d60a976eb87a6b9e90',
    reviewHash: '74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b',
    beforeCell: [2, 1], afterCell: [3, 2],
    secondary: { category: 'detailing', beforeCell: [1, 0], afterCell: [2, 1] },
  },
]
const byId = new Map(fixtures.map(item => [item.id, item]))
const record = id => SOFIA_CATALOGUE.find(row => row.id === id)
function prior(row) {
  const item = byId.get(row.id)
  return item ? { ...row, address: item.previousAddress, neighborhood: item.from,
    coordinates: item.retainedPoint ? row.coordinates
      : item.previousPoint ? { ...row.coordinates, sourceNeighborhood: item.from } : null } : row
}

test('four exact existing premises are corrected without rewriting titles, inventories, fees, booking or expiry', () => {
  for (const item of fixtures) {
    const row = record(item.id)
    assert.equal(SOFIA_CATALOGUE.filter(entry => entry.id === item.id).length, 1)
    assert.equal(row.name, item.name)
    assert.equal(row.category, item.category)
    assert.equal(row.address, item.address)
    assert.equal(row.neighborhood, item.to)
    const old = prior(row)
    assert.equal(hash(old), item.oldHash, item.id)
    assert.equal(pricingIdentity(row), pricingIdentity(old), item.id)
    assert.equal(hash(BOOKING_PRICE_REVIEWS.find(review => review.id === item.id) ?? null), item.reviewHash, item.id)
    if (item.retainedPoint) {
      assert.equal(hash(row), item.newHash)
      assert.equal(pricingIdentity(row), item.pricingHash)
      assert.deepEqual(row, { ...old, neighborhood: item.to })
      assert.deepEqual(catalogueBoundCoordinates(row), item.retainedPoint)
      const changedGeocode = { ...old, coordinates: { ...old.coordinates, checkedOn: '2026-11-22' } }
      assert.equal(applyReviewedAutoAreaRecovery20261123([changedGeocode])[0], changedGeocode)
    } else {
      const [addressId, latitude, longitude] = item.point
      assert.deepEqual(catalogueBoundCoordinates(row), {
        latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
        sourceAddress: item.address, sourceCityCode: '68134', sourceNeighborhood: item.to, sourceWebsite: row.website,
        checkedOn: item.pointDate, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
      })
    }
    assert.deepEqual(applyReviewedAutoAreaRecovery20261123([old]), [row])
    const changedBooking = { ...old, booking: { kind: 'form', url: old.website } }
    assert.equal(applyReviewedAutoAreaRecovery20261123([changedBooking])[0], changedBooking)
    assert.equal(catalogueBoundCoordinates({ ...row, address: item.address + ' 9' }), null)
  }
})

test('exact-quarter GPS browsing returns the appropriate existing business with its original telephone action, not appointment slots', () => {
  for (const item of fixtures) {
    const row = record(item.id), { latitude, longitude } = row.coordinates
    for (const { category } of [item, item.secondary].filter(Boolean)) {
      const intent = { cityCode: '68134', neighborhood: item.to, category, browse: true, searchV2: true,
        coordinates: { latitude, longitude, consent: true }, radiusKm: 0.25 }
      const [match] = normalizeCatalogueBusinesses([row], intent, { now })
      assert.equal(match.id, row.id)
      assert.equal(rankCatalogueBusinesses([], [match], intent)[0].distanceKm, 0)
      assert.deepEqual(match.coordinateAttribution, item.retainedPoint
        ? { label: OSM_ATTRIBUTION, url: OSM_COPYRIGHT_URL }
        : { label: OFFICIAL_SOFIA_ATTRIBUTION, url: OFFICIAL_SOFIA_SOURCE_URL })
      assert.deepEqual(railExternalAction(match, now), { kind: 'phone', href: 'tel:' + row.phone })
      assert.deepEqual(match.availability, { status: 'external', slots: [] })
      for (const other of [
        normalizeCatalogueBusinesses([prior(row)], intent, { now }),
        normalizeCatalogueBusinesses([row], { ...intent, neighborhood: 'Обеля 1' }, { now }),
        normalizeCatalogueBusinesses([row], { ...intent, coordinates: { latitude: 42.75, longitude: 23.25, consent: true } }, { now }),
      ]) assert.deepEqual(other, [])
    }
  }
})

test('the address-only batch adds two located premises and improves five target cells without creating businesses', () => {
  const opts = { now, target: 30 }
  const before = catalogueCoverageReport(SOFIA_CATALOGUE.map(prior), opts)
  const after = catalogueCoverageReport(SOFIA_CATALOGUE, opts)
  for (const key of ['sourceRecords', 'approvedBusinesses', 'premises', 'serviceAreaProviders', 'totalTargetCells']) {
    assert.equal(after.counts[key], before.counts[key], key)
  }
  assert.equal(after.counts.premisesWithBoundCoordinates, before.counts.premisesWithBoundCoordinates + 2)
  assert.equal(after.counts.premisesWithoutBoundCoordinates, before.counts.premisesWithoutBoundCoordinates - 2)
  assert.equal(after.counts.businessCategoryIncidences, before.counts.businessCategoryIncidences + 4)
  const cell = (report, item) => [...report.neighborhoods, ...report.additionalNamedAreas]
    .find(area => area.name === item.to).cells.find(value => value.categoryId === item.category)
  const expectedCells = fixtures.flatMap(item => [item, ...(item.secondary ? [{ ...item, ...item.secondary }] : [])])
  assert.equal(new Set(expectedCells.map(item => item.to + ':' + item.category)).size, 5)
  for (const item of expectedCells) {
    const previous = cell(before, item), current = cell(after, item)
    assert.deepEqual([previous.count, previous.locatedCount], item.beforeCell)
    assert.deepEqual([current.count, current.locatedCount], item.afterCell)
    assert.equal(current.businessIds.filter(id => id === item.id).length, 1)
  }
})
