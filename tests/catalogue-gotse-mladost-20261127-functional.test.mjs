import assert from 'node:assert/strict'
import test from 'node:test'
import { DateTime } from 'luxon'
import { businessDirectionsUrl, businessMapUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { applyGotseMladostVisitPoints20261127 } from '../lib/discovery/catalogue-data/gotse-mladost-visit-points-20261127.mjs'
import garageIntake from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-004-20261113.mjs'
import barberIntake from '../lib/discovery/catalogue-data/neighborhood-barber-21-cutz-20261111.mjs'
import { validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railDirections, railExternalAction, railServiceItems } from '../lib/discovery/rail.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'

const now = Date.parse('2026-11-27T12:00:00Z')
const cases = [{
  id: 'sofia-21-cutz-gotse-delchev', intake: barberIntake,
  neighborhood: 'Гоце Делчев', category: 'barber', subcategory: 'barber-haircut',
  address: 'София, ж.к. Гоце Делчев, бл. 52Е', point: { latitude: 42.6674572, longitude: 23.2917974 },
  source: 'https://www.21cutz.com/', phone: '+359877310884', action: { kind: 'form', href: 'https://book.21cutz.com/' },
}, {
  id: 'sofia-dirty-garage-mladost2-block272b', intake: garageIntake,
  neighborhood: 'Младост 2', category: 'detailing', subcategory: 'detailing-wrap-tint',
  address: 'София, Младост 2, Марбъл Резиденс, бл. 272Б', point: { latitude: 42.6475816, longitude: 23.3680674 },
  source: 'https://dirtygarage.bg/products/polirane-na-farove-sofia', phone: '+359898443755',
  action: { kind: 'phone', href: 'tel:+359898443755' },
}]
const before = validateCatalogue(cases.map(proof => proof.intake.records.find(row => row.id === proof.id)))
const live = cases.map(proof => SOFIA_CATALOGUE.find(row => row.id === proof.id))
const localHeaders = { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }
let providerCalls = 0
const forbidden = () => {
  providerCalls++
  assert.fail('Read-only location correction cannot call providers or the native booking and calendar adapters')
}
test.afterEach(() => assert.equal(providerCalls, 0))

function scopeCell(report, proof) {
  return [...report.neighborhoods, ...report.additionalNamedAreas].find(item => item.name === proof.neighborhood)
    .cells.find(item => item.categoryId === proof.category)
}

function discovery(rows) {
  return createDiscoveryHandler({
    config: discoveryConfig({ DISCOVERY_ENABLED: 'true', DISCOVERY_PROVIDER_MODE: 'catalogue' }),
    sofiaOnly: true, allowAttempt: () => true, now: DateTime.fromMillis(now),
    readCatalogue: async () => rows, readInternal: async () => [], fetcher: forbidden, claimBudget: forbidden,
    readLinks: forbidden, readPartnerPlaces: forbidden, readBookablePlaces: forbidden, getBusiness: forbidden, getSlots: forbidden,
  })
}

async function browse(handler, proof, locale, coordinates) {
  const { category, subcategory, neighborhood } = proof
  const response = await handler(new Request('https://gorez.test/api/public/discovery', { method: 'POST', headers: localHeaders,
    body: JSON.stringify({ browse: true, cityCode: '68134', neighborhood, category, subcategory, locale,
      ...(coordinates ? { coordinates: { ...coordinates, consent: true }, radiusKm: 1 } : {}) }),
  }))
  assert.equal(response.status, 200)
  return (await response.json()).results
}

const details = createPublicBusinessDetailsHandler({ config: { enabled: true }, now: () => now,
  allowAttempt: () => true, findCatalogue: id => live.find(row => row.id === id), readPartner: forbidden })

test('the two original profiles gain the first verified point in their cells without adding premises or changing services', () => {
  const historical = new Map(before.map(row => [row.id, row]))
  const reports = [SOFIA_CATALOGUE.map(row => historical.get(row.id) || row), SOFIA_CATALOGUE]
    .map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  assert.equal(reports[1].counts.approvedBusinesses, reports[0].counts.approvedBusinesses)
  assert.equal(reports[1].counts.premisesWithBoundCoordinates - reports[0].counts.premisesWithBoundCoordinates, 2)
  for (const [i, proof] of cases.entries()) {
    const [from, to] = reports.map(report => scopeCell(report, proof))
    assert.equal(to.count, from.count)
    assert.deepEqual([from.locatedCount, to.locatedCount], [0, 1])
    assert.deepEqual(to.businessIds, from.businessIds)
    assert.deepEqual(to.locatedBusinessIds, [proof.id])
    const expected = { ...proof.point, source: proof.source, method: 'first_party_coordinates', sourceAddress: proof.address }
    assert.deepEqual(catalogueBoundCoordinates(live[i]), expected)
    assert.deepEqual(live[i], { ...before[i], coordinates: expected })
    assert.equal(pricingIdentity(live[i]), pricingIdentity(before[i]))
  }
})

test('different tenant, shortened suffix, changed booking/contact and previous verified point do not receive a transferred pin', () => {
  assert.deepEqual(applyGotseMladostVisitPoints20261127(before), live)
  for (const [i, row] of before.entries()) {
    const current = live[i]
    assert.equal(applyGotseMladostVisitPoints20261127([current])[0], current)
    assert.equal(catalogueBoundCoordinates({ ...current, address: row.address.slice(0, -1) }), null)
    const changed = [
      { ...row, address: row.address.slice(0, -1) }, { ...row, phone: '+359988123456' },
      { ...row, name: row.name + ' · друг обект' }, { ...row, neighborhood: 'Друг квартал' },
      { ...row, locationKind: 'service_area' }, { ...row, coordinates: { latitude: 42.7, longitude: 23.3 } },
      { ...row, booking: { kind: 'form', url: 'https://book.example.org/another-branch' } },
      { ...row, verification: { ...row.verification, contact: 'https://example.org/different-branch' } },
      { ...row, verification: { ...row.verification, booking: { ...row.verification.booking, url: 'https://example.org/another-service' } } },
    ]
    applyGotseMladostVisitPoints20261127(changed).forEach((candidate, j) => assert.equal(candidate, changed[j]))
  }
})

test('only the updated locations qualify for a nearby radius; browse, details, and profile keep the real booking and same map destination', async () => {
  const oldBrowse = discovery(before), newBrowse = discovery(live)
  const distant = { latitude: 42.766, longitude: 23.397 }
  for (const [i, proof] of cases.entries()) {
    const oldProfile = catalogueProfileView(before[i], { now })
    const newProfile = catalogueProfileView(live[i], { now })
    assert.equal(businessDirectionsUrl(oldProfile), null)
    assert.equal(businessMapUrl(oldProfile), null)
    assert.deepEqual(railExternalAction(oldProfile, now), proof.action)
    const opened = await details(new Request('https://gorez.test/api/public/discovery/business/' + proof.id, { headers: localHeaders }), proof.id)
    assert.equal(opened.status, 200)
    const detail = (await opened.json()).business
    for (const locale of ['bg', 'en']) {
      const [oldCard] = await browse(oldBrowse, proof, locale)
      assert.equal(oldCard.id, proof.id)
      assert.equal(oldCard.distanceKm ?? null, null)
      assert.deepEqual(await browse(oldBrowse, proof, locale, proof.point), [])
      assert.deepEqual(await browse(newBrowse, proof, locale, distant), [])
      const matching = await browse(newBrowse, proof, locale, proof.point)
      assert.deepEqual(matching.map(row => row.id), [proof.id])
      const [card] = matching
      assert.deepEqual(card.availability, { status: 'external', slots: [] })
      assert.equal(card.distanceKm, 0)
      assert.deepEqual(railServiceItems(card), railServiceItems(oldCard))
      for (const view of [card, detail, newProfile]) {
        assert.equal(view.address, proof.address)
        assert.equal(view.phone, proof.phone)
        assert.deepEqual(railExternalAction(view, now), proof.action)
        const coordinate = `${proof.point.latitude},${proof.point.longitude}`
        const direction = new URL(businessDirectionsUrl(view))
        assert.equal(direction.href, railDirections(view))
        assert.equal(direction.searchParams.get('api'), '1')
        assert.equal(direction.searchParams.get('destination'), coordinate)
        assert.equal(direction.searchParams.get('destination_place_id'), null)
        assert.equal(new URL(businessMapUrl(view)).searchParams.get('marker'), coordinate)
      }
    }
    assert.deepEqual(newProfile.details.services, oldProfile.details.services)
    assert.deepEqual(detail.details.services, oldProfile.details.services)
  }
})
