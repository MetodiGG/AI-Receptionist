import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import ledger from '../docs/catalogue-coverage/quarter-recovery-20261123.json' with { type: 'json' }
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { applyReviewedNeighborhoodRecovery20261123 } from '../lib/discovery/catalogue-data/neighborhood-recovery-20261123.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { businessMapsDirectionsUrl } from '../lib/business-directions.mjs'
import { businessDisplayAddress, serviceDisplayName } from '../lib/locale/public-content.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { QUARTER_RECOVERY_BASE, quarterRecoveryPriorCatalogue } from './quarter-recovery-20261123-scope.mjs'
import { autoAreaPriorCatalogue } from './catalogue-auto-20261123-scope.mjs'

const now = Date.parse('2026-11-23T12:00:00Z')
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const requiredIds = ['sofia-e-dental-clinic', 'sofia-asd-autoservice-lihachov33']
const present = id => SOFIA_CATALOGUE.find(row => row.id === id)
const prior = row => quarterRecoveryPriorCatalogue([row])[0]

test('the two existing records match exact receipts; only their neighborhood and point binding change', () => {
  assert.equal(ledger.baseCommit, QUARTER_RECOVERY_BASE)
  assert.equal(ledger.status, 'prepared_local_not_published')
  assert.equal(ledger.newBusinessesAdded, 0)
  assert.deepEqual(ledger.corrections.map(entry => entry.id), requiredIds)
  for (const entry of ledger.corrections) {
    const { id, existingPoint } = entry, row = present(id), old = prior(row)
    assert.equal(hash(RAW_SOFIA_CATALOGUE.find(candidate => candidate.id === id)), entry.newNormalizedRecordSha256, id)
    assert.equal(hash(row), entry.newNormalizedRecordSha256, id)
    assert.equal(hash(old), entry.oldNormalizedRecordSha256, id)
    assert.equal(pricingIdentity(row), entry.pricingIdentityUnchanged, id)
    assert.equal(pricingIdentity(old), entry.pricingIdentityUnchanged, id)
    const review = BOOKING_PRICE_REVIEWS.find(candidate => candidate.id === id)
    assert.deepEqual(assessPricingReview(row, review, now), assessPricingReview(old, review, now))
    assert.deepEqual(row, { ...old, neighborhood: entry.newNeighborhood,
      coordinates: { ...old.coordinates, sourceNeighborhood: entry.newNeighborhood } })
    assert.equal(old.neighborhood, entry.oldNeighborhood)
    assert.equal(row.address, entry.sourceAddressUnchanged)
    assert.equal(row.verification.contact, entry.ownerContact)
    assert.equal(row.booking.url, entry.existingBookingDest)
    const { changedField, ...pointEvidence } = existingPoint
    assert.equal(changedField, 'sourceNeighborhood')
    for (const [key, value] of Object.entries(pointEvidence)) assert.equal(row.coordinates[key], value, key)
    assert.equal(catalogueBoundCoordinates(old), old.coordinates)
    assert.equal(catalogueBoundCoordinates(row), row.coordinates)
    assert.equal(catalogueBoundCoordinates({ ...row, coordinates: old.coordinates }), null)
  }
})

test('the recovery is immutable and rejects mismatching premises, contact, appointment and municipal points', () => {
  for (const entry of ledger.corrections) {
    const row = present(entry.id), old = prior(row), original = hash(old)
    const [applied] = applyReviewedNeighborhoodRecovery20261123([old])
    assert.equal(hash(old), original)
    assert.deepEqual(applied, row)
    assert.equal(applyReviewedNeighborhoodRecovery20261123([applied])[0], applied)
    const context = { id: 'sofia-other-location', name: 'Other location', cityCode: '44238',
      address: 'София, ул. Друг адрес 1', website: 'https://example.test/', phone: '+359888000000',
      locationKind: 'service_area', neighborhood: 'Борово', booking: { kind: 'phone', phone: old.phone },
      verification: { ...old.verification, contact: 'https://example.test/contact' } }
    for (const [field, value] of Object.entries(context)) {
      const changed = { ...old, [field]: value }
      assert.equal(applyReviewedNeighborhoodRecovery20261123([changed])[0], changed, field)
    }
    for (const point of [null, { ...old.coordinates, extra: true }, ...Object.keys(old.coordinates).map(key => (
      { ...old.coordinates, [key]: typeof old.coordinates[key] === 'number' ? old.coordinates[key] + 0.001 : 'changed' }
    ))]) {
      const changed = { ...old, coordinates: point }
      assert.equal(applyReviewedNeighborhoodRecovery20261123([changed])[0], changed)
    }
  }
})

test('BG/EN results use the correct quarter without changing service prices, external booking or directions', async () => {
  const details = row => createPublicBusinessDetailsHandler({ config: { enabled: true }, now: () => now, allowAttempt: () => true,
    findCatalogue: id => id === row.id ? row : null, readCataloguePhotos: async () => [],
    readPartner: () => { throw Error('Catalogue details must not read partner data') } })
  for (const entry of ledger.corrections) {
    const row = present(entry.id), old = prior(row)
    const { latitude, longitude, attribution: label, source: url } = entry.existingPoint
    const category = ledger.coverage.cells.find(cell => cell.neighborhood === entry.newNeighborhood).category
    for (const locale of ['bg', 'en']) {
      const intent = { cityCode: '68134', neighborhood: entry.newNeighborhood, category, locale, browse: true, searchV2: true }
      const [match] = normalizeCatalogueBusinesses([row], intent, { now })
      const [previous] = normalizeCatalogueBusinesses([old], { ...intent, neighborhood: undefined }, { now })
      assert.equal(match.id, entry.id)
      assert.equal(match.neighborhood, entry.newNeighborhood)
      assert.deepEqual(match.coordinates, { latitude, longitude })
      assert.deepEqual(match.coordinateAttribution, { label, url })
      assert.deepEqual(match.services, previous.services)
      assert.ok(match.services.length && match.services.every(service => service.price === null))
      assert.deepEqual(match.booking, previous.booking)
      assert.deepEqual(railExternalAction(match, now), { kind: 'form', href: entry.existingBookingDest })
      assert.deepEqual(match.availability, { status: 'external', slots: [] })
      for (const nearby of [
        normalizeCatalogueBusinesses([old], intent, { now }),
        normalizeCatalogueBusinesses([row], { ...intent, neighborhood: 'Борово' }, { now }),
        normalizeCatalogueBusinesses([row], { ...intent, cityCode: '44238' }, { now }),
      ]) assert.deepEqual(nearby, [])
    }
    const request = () => new Request('https://gorez.test/api/public/discovery/business/' + entry.id)
    const response = await details(row)(request(), entry.id), priorResponse = await details(old)(request(), entry.id)
    assert.equal(response.status, 200); assert.equal(priorResponse.status, 200)
    const { business } = await response.json(), { business: previous } = await priorResponse.json()
    assert.equal(business.neighborhood, entry.newNeighborhood)
    assert.match(business.presentationEn.neighborhood, /^[\x20-\x7e]+$/u)
    assert.deepEqual(business.coordinates, { latitude, longitude })
    assert.deepEqual(business.details.services, previous.details.services)
    for (const locale of ['bg', 'en']) {
      assert.equal(businessDisplayAddress(business, locale), businessDisplayAddress(previous, locale))
      assert.deepEqual(business.details.services.map(service => serviceDisplayName(service, locale)),
        previous.details.services.map(service => serviceDisplayName(service, locale)))
    }
    assert.equal(businessMapsDirectionsUrl(row), businessMapsDirectionsUrl(old))
    assert.equal(new URL(businessMapsDirectionsUrl(row)).searchParams.get('destination'), row.address + ', България')
  }
})

test('the exact existing cohort gains one real, located entry in each of two formerly empty cells; the quota is not met', () => {
  // The separate dated intake is not part of these receipts. Do not exclude other IDs.
  const intake = new Set(['sofia-vr-sofia-west-mall-lyulin7', 'sofia-brainland-lyulin3-block319v'])
  const current = autoAreaPriorCatalogue(SOFIA_CATALOGUE).filter(row => !intake.has(row.id))
  const old = quarterRecoveryPriorCatalogue(current)
  assert.equal(current.length, 1733)
  assert.equal(hash(old), '5d47345ca472232cbe9a78edb7918b67556809f17cdc5aefcaea0df42e44d52b')
  assert.equal(hash(current), '889eac241b3a0fa4be5fd1bac4a18bbd9011990fcc09df5660626d26f2950f72')
  assert.deepEqual(current.filter((row, index) => row !== old[index]).map(row => row.id).sort(), [...requiredIds].sort())
  const reports = [old, current].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  assert.equal(ledger.targetPerQuarterCategory, 30)
  for (const [key, field] of Object.entries({ approvedSofiaBusinesses: 'approvedBusinesses',
    premisesWithBoundCoordinates: 'premisesWithBoundCoordinates', premisesWithMissingNeighborhood: 'missingNeighborhoodPremises',
    zeroPhysicalCells: 'zeroCells', cellsAtTarget: 'cellsAtTarget' })) {
    assert.deepEqual(reports.map(report => report.counts[field]), ledger.coverage[key], key)
  }
  assert.equal(ledger.coverage.cells.length, 2)
  for (const entry of ledger.coverage.cells) {
    const [before, after] = reports.map(report => [...report.neighborhoods, ...report.additionalNamedAreas]
      .find(area => area.name === entry.neighborhood).cells.find(cell => cell.categoryId === entry.category))
    assert.deepEqual([before.count, after.count], entry.physical)
    assert.deepEqual([before.locatedCount, after.locatedCount], entry.located)
    const id = ledger.corrections.find(correction => correction.newNeighborhood === entry.neighborhood).id
    assert.deepEqual(after.businessIds, [id]); assert.equal(after.gap, 29)
  }
})
