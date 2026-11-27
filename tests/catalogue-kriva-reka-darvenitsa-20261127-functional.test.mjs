import assert from 'node:assert/strict'
import test from 'node:test'
import { DateTime } from 'luxon'
import { businessDirectionsUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { applySamaIzgrevNeighborhood20261127 } from '../lib/discovery/catalogue-data/neighborhood-verified-kriva-reka-darvenitsa-20261127.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { serviceDisplayName } from '../lib/locale/public-content.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'

const now = Date.parse('2026-11-27T12:00:00Z')
const cityCode = '68134', samaId = 'sofia-sama-pilates'
const expected = [
  {
    id: 'sofia-divna-stoyanova-geyamed-kriva-reka-bogdanovets6',
    neighborhood: 'Крива река', category: 'other', subcategory: 'other-psychology',
    address: 'София, кв. Крива река, ул. Богдановец 6', addressId: '19608',
    point: [42.686903, 23.302523], phone: '+359883727676',
    bg: 'Индивидуална психологическа консултация', en: 'Individual psychological consultation',
    baseline: [0, 0], current: [1, 1],
  },
  {
    id: 'sofia-stamovident-darvenitsa-plovdivsko11',
    neighborhood: 'Дървеница', category: 'other', subcategory: 'other-dental',
    address: 'София, ж.к. Дървеница, ул. Пловдивско поле 11, вх. 4', addressId: '96741',
    point: [42.659005, 23.362732], phone: '+359899474786',
    bg: 'Първична дентална консултация', en: 'Initial dental consultation',
    baseline: [1, 1], current: [2, 2],
  },
]
const newIds = new Set(expected.map(proof => proof.id))
const rows = [...expected.map(proof => SOFIA_CATALOGUE.find(row => row.id === proof.id)), SOFIA_CATALOGUE.find(row => row.id === samaId)]
const [,,sama] = rows
let externalCalls = 0
const localOnly = () => {
  externalCalls++
  assert.fail('External providers and native booking mechanisms must not be queried')
}
test.afterEach(() => {
  assert.equal(externalCalls, 0, 'Calls must stay at zero even if a handler swallows the adapter error')
})
const requestHeaders = { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }
const handler = createDiscoveryHandler({
  config: discoveryConfig({ DISCOVERY_ENABLED: 'true', DISCOVERY_PROVIDER_MODE: 'catalogue' }),
  sofiaOnly: true, now: DateTime.fromMillis(now), allowAttempt: () => true, readInternal: async () => [],
  readCatalogue: async () => rows, fetcher: localOnly, claimBudget: localOnly,
  readLinks: localOnly, readBookablePlaces: localOnly, readPartnerPlaces: localOnly,
  getBusiness: localOnly, getSlots: localOnly,
})
const detail = createPublicBusinessDetailsHandler({
  config: { enabled: true }, now: () => now, allowAttempt: () => true,
  findCatalogue: id => rows.find(row => row.id === id), readPartner: localOnly,
})

async function search(input) {
  const response = await handler(new Request('https://gorez.test/api/public/discovery', {
    method: 'POST', headers: requestHeaders, body: JSON.stringify({ browse: true, cityCode, ...input }),
  }))
  assert.equal(response.status, 200)
  return response.json()
}

function areaCategory(report, neighborhood, category) {
  const area = [...report.neighborhoods, ...report.additionalNamedAreas].find(item => item.name === neighborhood)
  const cell = area?.cells.find(item => item.categoryId === category)
  assert.ok(cell, `${neighborhood} × ${category}`)
  return cell
}

test('the exact quarter cells track two real premises and a neighborhood-only correction separately', () => {
  assert.ok(rows.every(Boolean))
  const priorRows = SOFIA_CATALOGUE.filter(row => !newIds.has(row.id))
    .map(row => row.id === samaId ? { ...row, neighborhood: null } : row)
  const [before, after] = [priorRows, SOFIA_CATALOGUE].map(catalogue => catalogueCoverageReport(catalogue, { now, target: 30 }))
  for (const proof of [...expected, {
    id: samaId, neighborhood: 'Изгрев', category: 'fitness', baseline: [0, 0], current: [1, 0],
  }]) {
    const cells = [before, after].map(report => areaCategory(report, proof.neighborhood, proof.category))
    assert.deepEqual(cells.map(cell => [cell.count, cell.locatedCount]), [proof.baseline, proof.current], proof.id)
    assert.equal(cells[0].businessIds.includes(proof.id), false)
    assert.equal(cells[1].businessIds.includes(proof.id), true)
    assert.equal(cells[1].locatedBusinessIds.includes(proof.id), proof.id !== samaId)
  }
  assert.equal(after.counts.approvedBusinesses - before.counts.approvedBusinesses, 2)
  assert.equal(after.counts.premisesWithBoundCoordinates - before.counts.premisesWithBoundCoordinates, 2)
  const oldSama = priorRows.find(row => row.id === samaId)
  assert.deepEqual(applySamaIzgrevNeighborhood20261127([oldSama]), [sama])
  const differentEntrance = { ...oldSama, address: oldSama.address + ', вх. 2' }
  const changedBooking = { ...oldSama, booking: { ...oldSama.booking, url: 'https://www.samapilates.bg/' } }
  const existingPoint = { ...oldSama, coordinates: rows[0].coordinates }
  for (const changed of [differentEntrance, changedBooking, existingPoint]) {
    assert.equal(applySamaIzgrevNeighborhood20261127([changed])[0], changed)
  }
})

test('each clinic-hosted service has a single supported visit, an address-bound pin, and no invented tariff or duration', () => {
  for (const [index, proof] of expected.entries()) {
    const row = rows[index]
    assert.equal(row.category, proof.category)
    assert.equal(row.cityCode, cityCode)
    assert.equal(row.neighborhood, proof.neighborhood)
    assert.equal(row.address, proof.address)
    assert.equal(row.locationKind, 'premises')
    const point = catalogueBoundCoordinates(row)
    assert.deepEqual([point.latitude, point.longitude], proof.point)
    assert.equal(point.addressId, proof.addressId)
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'А' }), null)
    assert.deepEqual(row.services.map(service => service.name), [proof.bg])
    assert.ok(row.services.every(service => service.price === undefined && service.durationMin === undefined))
    const review = BOOKING_PRICE_REVIEWS.find(entry => entry.id === row.id)
    const assessed = assessPricingReview(row, review, now)
    assert.equal(assessed.state, 'service_reviewed')
    assert.equal(assessed.pricingState, 'not_publicly_listed')
    assert.equal(assessed.reviewedPriceCount, 0)
  }
})

test('BG/EN local discovery and details agree on the telephone handoff, correct pin and exact service filter', async () => {
  for (const proof of expected) {
    const [latitude, longitude] = proof.point
    const scopes = { category: proof.category, subcategory: proof.subcategory, neighborhood: proof.neighborhood,
      coordinates: { latitude, longitude, consent: true }, radiusKm: 1 }
    for (const locale of ['bg', 'en']) {
      const matching = await search({ ...scopes, locale })
      assert.deepEqual(matching.results.map(item => item.id), [proof.id])
      const [card] = matching.results
      assert.deepEqual(card.availability, { status: 'external', slots: [] })
      assert.equal(card.source, 'catalogue')
      assert.equal(card.neighborhood, proof.neighborhood)
      const distant = await search({ ...scopes, locale, coordinates: { latitude: 42.766, longitude: 23.397, consent: true } })
      assert.deepEqual(distant.results, [])
      const crossed = await search({ category: 'other', subcategory: proof.subcategory, locale })
      assert.deepEqual(crossed.results.map(item => item.id), [proof.id])
      const psychiatry = await search({ category: 'other', subcategory: 'other-psychiatry', locale })
      assert.deepEqual(psychiatry.results, [])
      const opened = await detail(new Request('https://gorez.test/api/public/discovery/business/' + proof.id, { headers: requestHeaders }), proof.id)
      assert.equal(opened.status, 200)
      const detailBusiness = (await opened.json()).business
      const profile = catalogueProfileView(rows.find(row => row.id === proof.id), { now })
      for (const view of [card, detailBusiness, profile]) {
        assert.equal(view.address, proof.address)
        assert.deepEqual(railExternalAction(view, now), { kind: 'phone', href: 'tel:' + proof.phone })
        const route = new URL(businessDirectionsUrl(view))
        assert.equal(route.searchParams.get('api'), '1')
        assert.equal(route.searchParams.get('destination'), latitude + ',' + longitude)
        assert.equal(route.searchParams.get('destination_place_id'), null)
      }
      for (const view of [detailBusiness, profile]) {
        assert.deepEqual(view.details.services.map(service => serviceDisplayName(service, locale)), [proof[locale]])
        if (locale === 'en') assert.match(view.details.services[0].presentationEn.description, /^[^\p{Script=Cyrillic}]+$/u)
      }
    }
  }
})

test('SAMA remains a separate external form-only listing with no GPS distance or guessed routing', async () => {
  assert.equal(sama.neighborhood, 'Изгрев')
  assert.equal(sama.coordinates, null)
  assert.equal(catalogueBoundCoordinates(sama), null)
  const scope = { category: 'fitness', subcategory: 'fitness-pilates', neighborhood: 'Изгрев' }
  const { results } = await search({ ...scope, locale: 'bg' })
  const card = results.find(item => item.id === samaId)
  assert.ok(card)
  assert.equal(card.distanceKm ?? null, null)
  assert.deepEqual(railExternalAction(card, now), { kind: 'form', href: 'https://www.samapilates.bg/en/login' })
  assert.equal(businessDirectionsUrl(card), null)
  const nearby = await search({ ...scope, locale: 'en', coordinates: { latitude: 42.6710, longitude: 23.3567, consent: true }, radiusKm: 1 })
  assert.equal(nearby.results.some(item => item.id === samaId), false)
})
