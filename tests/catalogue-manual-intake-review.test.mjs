import test from 'node:test'
import assert from 'node:assert/strict'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { COVERAGE_20261116_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-coverage-20261116.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { assessManualIntakeReview, manualIntakeIdentity } from '../scripts/catalogue-manual-intake-review.mjs'
import { cataloguePublicationState } from '../scripts/check-sofia-catalogue.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const providerId = 'sofia-diamant-dental-pashovi-obelya316'
const ownerId = 'sofia-art-masters-band-nadezhda1-172'
const ids = [providerId, ownerId]
function pair(id = providerId) {
  const row = structuredClone(SOFIA_CATALOGUE.find(item => item.id === id))
  const review = structuredClone(COVERAGE_20261116_REVIEWS.find(item => item.id === id))
  // Only a test fixture: root separately records the real attestation after
  // actual source review. No persisted proof or historical baseline is edited.
  review.manualIntakeResolution.recordIdentity = manualIntakeIdentity(row)
  return { row, review }
}
function rebind({ row, review }) {
  review.inventoryIdentity = pricingIdentity(row)
  review.manualIntakeResolution.recordIdentity = manualIntakeIdentity(row)
}

test('both actually reviewed source cases yield a bounded audit fact while ordinary intake still reports the different-host flag', () => {
  for (const id of ids) {
    const { row, review } = pair(id)
    assert.equal(review.inventoryIdentity, pricingIdentity(row))
    assert.deepEqual(assessManualIntakeReview(row, review, now), {
      id, reason: 'first_party_appointment_evidence_required',
      decision: review.manualIntakeResolution.decision, checkedOn: '2026-11-16',
    })
    assert.deepEqual(auditCatalogueBatch([], [row], now).pending,
      [{ id, reason: 'first_party_appointment_evidence_required' }])
  }
})

test('whole-record hashing normalizes property order and rejects invalid or extra source fields', () => {
  const { row } = pair()
  assert.match(manualIntakeIdentity(row), /^[a-f0-9]{64}$/u)
  const reversed = Object.fromEntries(Object.entries(row).reverse())
  reversed.services = row.services.map(service => Object.fromEntries(Object.entries(service).reverse()))
  assert.equal(manualIntakeIdentity(reversed), manualIntakeIdentity(row))
  assert.equal(manualIntakeIdentity({ ...row, unknown: true }), null)
  assert.equal(manualIntakeIdentity(null), null)
  assert.equal(manualIntakeIdentity({ ...row, phone: '0888 638 741' }), null)
})

test('a copied ID or changed address, quarter, phone, booking, service, hours or coordinates cannot reuse a whole-record receipt even after pricing rebind', () => {
  const mutations = [
    row => { row.id += '-copy' },
    row => { row.address += ', друг вход' },
    row => { row.neighborhood = 'Обеля 1' },
    row => { row.phone = '+359888111111' },
    row => { row.booking.url += '?changed=1'; row.verification.booking.url = row.booking.url },
    row => { row.services[0].description += ' Промяна.' },
    row => { row.openingHours = { days: [{ weekday: 1, periods: [{ open: '09:00', close: '17:00' }] }], sourceUrl: row.website, checkedOn: '2026-11-16' } },
    row => { row.coordinates = { latitude: 42.74, longitude: 23.26, method: 'first_party_coordinates', source: row.website, sourceAddress: row.address } },
  ]
  for (const mutate of mutations) {
    const { row, review } = pair(), identity = review.manualIntakeResolution.recordIdentity
    mutate(row)
    review.id = row.id
    review.inventoryIdentity = pricingIdentity(row)
    assert.notEqual(manualIntakeIdentity(row), identity)
    assert.equal(assessManualIntakeReview(row, review, now), null)
  }
})

test('absent, unknown or incomplete manual decisions never resolve a warning', () => {
  for (const mutate of [
    review => { delete review.manualIntakeResolution },
    review => { delete review.manualIntakeResolution.recordIdentity },
    review => { review.manualIntakeResolution.recordIdentity = '0'.repeat(64) },
    review => { review.manualIntakeResolution.flag = 'duplicate_identity' },
    review => { review.manualIntakeResolution.decision = 'automatically_approved' },
    review => { review.manualIntakeResolution.note = 'short' },
  ]) {
    const { row, review } = pair()
    mutate(review)
    assert.equal(assessManualIntakeReview(row, review, now), null)
  }
})

test('two distinct reviewer attestations including root are mandatory', () => {
  for (const reviewers of [[], ['/root'], ['/root', '/root'], ['/root/a', '/root/b'], ['/root', ''], ['/root', '/root/a', '/root/a'], ['/root', 1]]) {
    const { row, review } = pair()
    review.manualIntakeResolution.reviewedBy = reviewers
    assert.equal(assessManualIntakeReview(row, review, now), null)
  }
})

test('stale or future review dates, mismatched proof dates, non-approved and expired records fail closed', () => {
  for (const id of ids) {
    const value = pair(id)
    assert.equal(assessManualIntakeReview(value.row, value.review, Date.parse('2027-02-15T12:00:00Z')), null)
    assert.equal(assessManualIntakeReview(value.row, value.review, NaN), null)
    for (const mutate of [
      ({ review }) => { review.manualIntakeResolution.checkedOn = '2026-11-15' },
      ({ review }) => { review.checkedOn = '2026-11-17'; review.manualIntakeResolution.checkedOn = review.checkedOn },
      ({ row }) => { row.verification.checkedOn = '2026-11-15' },
      ({ row }) => { row.verification.status = 'draft' },
      ({ row }) => { row.verification.validUntil = '2026-11-15' },
    ]) {
      const changed = pair(id)
      mutate(changed)
      rebind(changed)
      assert.equal(assessManualIntakeReview(changed.row, changed.review, now), null)
    }
  }
})

test('a missing, conflicting or changed pricing review cannot be replaced by a manual intake note', () => {
  for (const mutate of [
    review => { delete review.inventoryIdentity },
    review => { review.inventoryIdentity = '0'.repeat(64) },
    review => { review.pricingDecision = 'hold_conflicting_sources' },
    review => { review.bookingReview = 'homepage_only' },
    review => { review.reviewedUrls = [] },
    review => { review.checkedOn = '2026-08-16'; review.manualIntakeResolution.checkedOn = review.checkedOn },
  ]) {
    const { row, review } = pair()
    mutate(review)
    assert.equal(assessManualIntakeReview(row, review, now), null)
  }
})

test('every proof URL must be safe HTTPS and explicitly present in the dated reviewed URL set', () => {
  for (const id of ids) {
    const value = pair(id), resolution = value.review.manualIntakeResolution
    const urls = id === providerId
      ? ['ownerContact', 'providerPractice'] : ['ownerWebsite', 'currentContact', 'currentPremises', 'appointmentEvidence', 'appointmentContact']
    for (const field of urls) {
      const { row, review } = pair(id)
      review.reviewedUrls = review.reviewedUrls.filter(url => url !== resolution[field])
      assert.equal(assessManualIntakeReview(row, review, now), null, `${id}: unreviewed ${field}`)
    }
  }
  const value = pair(ownerId)
  value.review.manualIntakeResolution.appointmentContact = 'http://artmastersband12.wixsite.com/amb12/contact'
  value.review.reviewedUrls.push(value.review.manualIntakeResolution.appointmentContact)
  assert.equal(assessManualIntakeReview(value.row, value.review, now), null)
})

test('matching published phones must be unique, valid and include the exact current primary contact', () => {
  for (const phones of [[], ['+359878180263'], ['+359888638741', '+359888638741'], ['+359888638741', '0888180263'], ['+359888638741']]) {
    const { row, review } = pair()
    review.manualIntakeResolution.matchingPhones = phones
    assert.equal(assessManualIntakeReview(row, review, now), null)
  }
})

test('provider review needs two distinct inspected profiles at the actual provider, not duplicate queries, a practice page or an alien host', () => {
  const base = pair(), [profile] = base.review.manualIntakeResolution.providerProfiles
  for (const profiles of [[], [profile], [profile, profile], [profile, `${profile}?different=1`], [profile, profile.replace('https://', 'https://www.')], [profile, base.row.booking.url],
    [profile, 'https://example.com/other-doctor']]) {
    const { row, review } = pair()
    review.manualIntakeResolution.providerProfiles = profiles
    review.reviewedUrls.push(...profiles)
    assert.equal(assessManualIntakeReview(row, review, now), null)
  }
  const missing = pair()
  missing.review.reviewedUrls = missing.review.reviewedUrls.filter(url => url !== profile)
  assert.equal(assessManualIntakeReview(missing.row, missing.review, now), null)
})

test('the exact owner contact and practice booking entry cannot be substituted even by another reviewed safe URL', () => {
  for (const field of ['ownerContact', 'providerPractice']) {
    const { row, review } = pair()
    review.manualIntakeResolution[field] = row.website
    assert.equal(assessManualIntakeReview(row, review, now), null)
  }
  const value = pair()
  value.row.verification.contact = 'https://example.com/contact'
  value.review.manualIntakeResolution.ownerContact = value.row.verification.contact
  value.review.reviewedUrls.push(value.row.verification.contact)
  rebind(value)
  assert.equal(assessManualIntakeReview(value.row, value.review, now), null)
})

test('even a freshly rebound whole-record hash cannot substitute an unreviewed coordinate source', () => {
  const value = pair()
  value.row.coordinates = { latitude: 42.74, longitude: 23.26, method: 'first_party_coordinates',
    source: 'https://diamantdental.wixsite.com/diamantdental/unreviewed-point', sourceAddress: value.row.address }
  rebind(value)
  assert.equal(assessManualIntakeReview(value.row, value.review, now), null)
})

test('same-owner proof must keep the phone action and distinct source hosts with owner premises and appointment-host contacts', () => {
  for (const mutate of [
    value => { value.review.manualIntakeResolution.ownerWebsite = value.row.verification.contact },
    value => { value.review.manualIntakeResolution.currentContact = value.row.website },
    value => { value.review.manualIntakeResolution.appointmentEvidence = value.row.website },
    value => { value.review.manualIntakeResolution.appointmentContact = value.row.verification.contact },
    value => { value.review.manualIntakeResolution.currentPremises = value.row.verification.booking.url },
    value => { value.row.booking = { kind: 'form', url: value.row.website } },
    value => { value.row.verification.booking.url = value.row.website; value.review.manualIntakeResolution.appointmentEvidence = value.row.website },
  ]) {
    const value = pair(ownerId)
    mutate(value)
    rebind(value)
    assert.equal(assessManualIntakeReview(value.row, value.review, now), null)
  }
})

test('assessment is read-only and malformed arguments do not throw or create an approval', () => {
  const value = pair(), before = structuredClone(value)
  assert.ok(assessManualIntakeReview(value.row, value.review, now))
  assert.deepEqual(value, before)
  for (const [row, review] of [[null, null], [{}, {}], [value.row, null], [value.row, { reviewedUrls: 'invalid' }]]) {
    assert.equal(assessManualIntakeReview(row, review, now), null)
  }
})

test('the actual publication gate reports the two persisted reviewed resolutions without changing ordinary intake', () => {
  const rows = ids.map(id => SOFIA_CATALOGUE.find(row => row.id === id))
  const state = cataloguePublicationState(rows, now)
  assert.deepEqual(state.current.map(row => row.id), ids)
  assert.deepEqual(state.manualIntakeResolutions.map(row => row.id), ids)
  assert.equal(state.recheck.length, 0)
  for (const row of rows) {
    const review = COVERAGE_20261116_REVIEWS.find(item => item.id === row.id)
    assert.equal(review.manualIntakeResolution.recordIdentity, manualIntakeIdentity(row))
    assert.ok(assessManualIntakeReview(row, review, now))
    assert.deepEqual(auditCatalogueBatch([], [row], now).pending,
      [{ id: row.id, reason: 'first_party_appointment_evidence_required' }])
  }
})

test('publication refuses missing receipts and changed records rather than silently discarding intake warnings', () => {
  const original = SOFIA_CATALOGUE.find(row => row.id === providerId)
  assert.throws(() => cataloguePublicationState([original], now, { manualReviews: [] }), /first_party_appointment_evidence_required/u)
  assert.throws(() => cataloguePublicationState([{ ...original, neighborhood: 'Обеля 1' }], now), /first_party_appointment_evidence_required/u)
  const row = structuredClone(original), review = structuredClone(COVERAGE_20261116_REVIEWS.find(item => item.id === providerId))
  row.id += '-unchecked'
  review.id = row.id
  review.inventoryIdentity = pricingIdentity(row)
  // Rebinding the old, narrower price identity does not authorize a new venue.
  assert.throws(() => cataloguePublicationState([row], now, { manualReviews: [review] }), /first_party_appointment_evidence_required/u)
})

test('a manual receipt never bypasses duplicate, malformed, excluded or expired publication rules', () => {
  const row = SOFIA_CATALOGUE.find(item => item.id === providerId)
  assert.throws(() => cataloguePublicationState([row, row], now), /Duplicate catalogue/u)
  assert.throws(() => cataloguePublicationState([{ ...row, unknownField: true }], now))
  const expired = cataloguePublicationState([row], Date.parse('2027-02-15T12:00:00Z'))
  assert.equal(expired.current.length, 0)
  assert.equal(expired.manualIntakeResolutions.length, 0)
  assert.deepEqual(expired.recheck.map(item => item.id), [providerId])
  const excluded = cataloguePublicationState([{ ...row, id: 'sofia-balance-clinic' }], now)
  assert.equal(excluded.current.length, 0)
  assert.equal(excluded.manualIntakeResolutions.length, 0)
  assert.equal(excluded.excluded.length, 1)
})

test('duplicate manual attestations fail closed rather than selecting an arbitrary receipt', () => {
  const row = SOFIA_CATALOGUE.find(item => item.id === providerId)
  const review = COVERAGE_20261116_REVIEWS.find(item => item.id === providerId)
  assert.throws(() => cataloguePublicationState([row], now, { manualReviews: [review, review] }), /Duplicate manual source review/u)
})

// Synthetic fixtures only: never persisted attestations or new merchant facts.
function readyAlias(row) {
  const alias = structuredClone(row)
  alias.id += '-ready-alias'
  alias.booking = { kind: 'form', url: alias.website }
  alias.verification.booking = { url: alias.website, excerpt: 'Synthetic independently reviewed owner booking entry' }
  return alias
}

test('publication rejects a ready identity alias beside an attested pending source in either input order', () => {
  const { row, review } = pair(), alias = readyAlias(row)
  // Different booking destinations pass the strict destination/ID validator.
  // The ordinary helper alone misses the pending-first ordering because it
  // does not reserve that pending identity; the publication wrapper must not.
  const ordinary = auditCatalogueBatch([], [row, alias], now)
  assert.deepEqual(ordinary.readyForReview, [alias.id])
  assert.deepEqual(ordinary.rejected, [])
  for (const rows of [[row, alias], [alias, row]]) {
    assert.throws(() => cataloguePublicationState(rows, now, { manualReviews: [review] }), /duplicate_identity/u)
  }
})

test('two independently bound pending attestations cannot authorize the same venue identity twice', () => {
  const original = pair(), alias = pair()
  alias.row.id += '-attested-alias'
  alias.row.booking.url += '?fixture=alias'
  alias.row.verification.booking.url = alias.row.booking.url
  alias.review.id = alias.row.id
  alias.review.bookingEntry = alias.row.booking.url
  alias.review.priceSearch.bookingUrl = alias.row.booking.url
  alias.review.manualIntakeResolution.providerPractice = alias.row.booking.url
  alias.review.reviewedUrls.push(alias.row.booking.url)
  rebind(alias)
  assert.ok(assessManualIntakeReview(original.row, original.review, now))
  assert.ok(assessManualIntakeReview(alias.row, alias.review, now))
  for (const rows of [[original.row, alias.row], [alias.row, original.row]]) {
    assert.throws(() => cataloguePublicationState(rows, now, { manualReviews: [original.review, alias.review] }), /duplicate_identity/u)
  }
})

test('duplicate preflight reuses the ordinary street identity key for suffix aliases rather than checking full addresses only', () => {
  const value = pair()
  value.row.address = 'София, ж.к. Обеля 2, ул. Кривините 30, кабинет 316'
  rebind(value)
  const alias = readyAlias(value.row)
  alias.address = 'София, ул. Кривините 30, друг вход'
  assert.ok(assessManualIntakeReview(value.row, value.review, now))
  for (const rows of [[value.row, alias], [alias, value.row]]) {
    assert.throws(() => cataloguePublicationState(rows, now, { manualReviews: [value.review] }), /duplicate_identity/u)
  }
})

test('cross-host resolution remains duplicate-safe across 5000-row boundaries and accepts distinct larger inventories', () => {
  const { row, review } = pair(), alias = readyAlias(row)
  const fillers = Array.from({ length: 5000 }, (_, index) => {
    const filler = readyAlias(row)
    filler.id = `sofia-manual-review-filler-${index}`
    filler.address = `София, ул. Тестова ${index + 1}`
    filler.coordinates = null
    return filler
  })
  const distinct = cataloguePublicationState([...fillers, row], now, { manualReviews: [review] })
  assert.equal(distinct.current.length, 5001)
  assert.deepEqual(distinct.manualIntakeResolutions.map(item => item.id), [row.id])
  for (const rows of [[row, ...fillers.slice(0, 4999), alias], [alias, ...fillers.slice(0, 4999), row]]) {
    assert.equal(rows.length, 5001)
    assert.throws(() => cataloguePublicationState(rows, now, { manualReviews: [review] }), /duplicate_identity/u)
  }
})
