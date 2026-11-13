import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_RECORDS as additions, NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueExpansionReport, reportBusinessType } from '../scripts/catalogue-expansion-report.mjs'
import { searchCatalogueForOnboarding, catalogueOnboardingDetail, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { DateTime } from 'luxon'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { discoverySearchInput } from '../lib/discovery/search-ui.mjs'
import approvedGrowthLocations from '../public/catalogue-official-address-growth-subset-20261113.json' with { type: 'json' }
import approved2000Locations from '../public/catalogue-official-address-2000-subset-20261113.json' with { type: 'json' }

const now = Date.parse('2026-11-13T12:00:00Z')
const ids = new Set(additions.map(row => row.id))
const baseline = JSON.parse(await readFile(new URL('../docs/catalogue-pricing/expansion-baseline-20261113.json', import.meta.url)))

test('new unique, source-reviewed Sofia businesses are imported without mutating any existing inventory', async () => {
  assert.ok(additions.length > 0)
  assert.equal(ids.size, additions.length)
  assert.equal(reviews.length, additions.length)
  assert.equal(validateCatalogue(additions).length, additions.length)
  const result = auditCatalogueBatch(SOFIA_CATALOGUE.filter(row => !ids.has(row.id)), additions, now)
  assert.equal(result.readyForReview.length, additions.length)
  assert.deepEqual(result.pending, [])
  assert.deepEqual(result.rejected, [])
  const oldIds = new Set(baseline.records.map(row => row.id))
  assert.equal(baseline.sourceCount, 981)
  assert.ok(additions.every(row => !oldIds.has(row.id)))
  assert.ok(baseline.records.every(row => SOFIA_CATALOGUE.some(item => item.id === row.id)))
  for (const row of additions) {
    const location = [...approvedGrowthLocations.points, ...approved2000Locations.points].find(item => item.id === row.id)
    assert.deepEqual(SOFIA_CATALOGUE.find(item => item.id === row.id), location ? { ...row, coordinates: location.coordinates } : row)
    assert.ok(approvedCatalogueRecord(row, now), row.id)
    const review = reviews.find(item => item.id === row.id)
    // Identities bind the schema-normalized public inventory, as the release
    // gate does, not the incidental property order in the source modules.
    const outcome = assessPricingReview(SOFIA_CATALOGUE.find(item => item.id === row.id), review, now)
    assert.ok(['reviewed', 'service_reviewed'].includes(outcome.state), `${row.id}: ${outcome.reason}`)
    assert.equal(outcome.state === 'reviewed', row.services.some(service => service.price), row.id)
    if (row.openingHours) {
      assert.equal(row.openingHours.checkedOn, '2026-11-13')
      assert.ok(review.reviewedUrls.includes(row.openingHours.sourceUrl), row.id)
    }
    if (row.locationKind === 'service_area') assert.equal(row.coordinates, null)
  }
})

test('every new business can be found in partner registration and imports all actual services and known prices', () => {
  for (const row of additions) {
    const found = searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: row.name.slice(0, 120), cityCode: '68134' }, { now })
    assert.ok(found.some(item => item.id === row.id), `Missing registration suggestion: ${row.name}`)
    const draft = catalogueOnboardingDetail(SOFIA_CATALOGUE, row.id, { now, cityCode: '68134' })
    assert.equal(draft.business.id, row.id)
    assert.equal(draft.business.website, row.website)
    assert.equal(draft.business.address, row.address)
    assert.equal(draft.serviceCount, row.services.length)
    assert.deepEqual(draft.services.map(service => service.name), row.services.map(service => service.name))
    row.services.forEach((service, index) => {
      const imported = draft.services[index]
      assert.equal(imported.price, service.price ? String(service.price.amount) : '', `${row.id}: ${service.name}`)
      if (service.price) {
        assert.equal(imported.currency, service.price.currency)
        assert.equal(imported.price_details.kind, service.price.kind)
        if (service.price.kind === 'range') assert.equal(imported.price_details.maximum, service.price.maximum)
        if (service.price.unit) assert.equal(imported.price_details.unit, service.price.unit)
      }
      assert.equal(imported.description, service.description || '')
    })
  }
})

test('public discovery exposes every added business and real services, without a simulated native calendar', () => {
  for (const row of additions) {
    const results = normalizeCatalogueBusinesses(SOFIA_CATALOGUE, { cityCode: '68134', category: row.category, browse: true, searchV2: true }, { now })
    const result = results.find(item => item.id === row.id)
    assert.ok(result, `Not publicly discoverable: ${row.id}`)
    assert.deepEqual(result.details.services.map(service => service.name), row.services.map(service => service.name))
    assert.equal(result.booking.kind, row.booking.kind)
    if (row.booking.kind === 'form') assert.equal(result.booking.url, row.booking.url)
    else assert.equal(result.booking.phone, row.booking.phone)
    assert.equal(result.availability.status, 'external')
    assert.deepEqual(result.availability.slots, [])
  }
})

test('public registration endpoint returns a complete imported inventory without a database or external lookup', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: SOFIA_CATALOGUE, now: () => now, allowAttempt: () => true })
  for (const row of additions) {
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${row.id}&city=68134`))
    assert.equal(response.status, 200, row.id)
    const body = await response.json()
    assert.equal(body.business.id, row.id)
    assert.equal(body.services.length, row.services.length)
  }
})

test('every complete new business name is publicly searchable, without interpreting its brand as a service or quarter', async () => {
  const forbidden = () => assert.fail('No external provider, booking, database mutation or paid lookup')
  const deps = { now: DateTime.fromMillis(now), config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }),
    readInternal: async () => [], readCatalogue: async () => SOFIA_CATALOGUE,
    fetcher: forbidden, claimBudget: forbidden, getBusiness: forbidden, getSlots: forbidden }
  for (const row of additions) {
    const result = await discoverBusinesses({ query: row.name, cityCode: '68134' }, deps)
    assert.equal(result.clarification, null, row.name)
    assert.ok(result.results.some(item => item.id === row.id), `Missing full-name result: ${row.name}`)
    const uiRequest = discoverySearchInput({ query: row.name })
    if (uiRequest.cityCode !== '68134') {
      const uiResult = await discoverBusinesses(uiRequest, deps)
      assert.equal(uiResult.clarification, null, row.name)
      assert.ok(uiResult.results.some(item => item.id === row.id), `Missing default UI full-name result: ${row.name}`)
    }
  }
  const school = additions.find(row => row.id === 'sofia-elina-lyuben-karavelov')
  for (const filters of [
    { cityCode: '56784' }, { cityCode: '68134', category: 'pets' },
    { cityCode: '68134', neighborhood: 'Драгалевци' },
    { coordinates: { latitude: 42.67, longitude: 23.29, consent: true }, radiusKm: 1 },
  ]) assert.equal((await discoverBusinesses({ query: school.name, ...filters }, deps)).results.length, 0)
  assert.equal((await discoverBusinesses({ query: school.name }, deps)).clarification?.field, 'city')
  const partner = { id: '123e4567-e89b-42d3-a456-426614174000', name: school.name, slug: 'qa-school',
    active: true, platform_status: 'enabled', industry: 'education', city_ekatte: '68134', city: 'София',
    neighborhood: 'Лозенец', address: 'QA only', public_profile: {},
    services: [{ id: 'qa-lesson', name: 'Индивидуален урок по математика', category: 'education', active: true, price: 30, duration_min: 45 }] }
  for (const serviceCategory of ['education', undefined]) {
    const native = { ...partner, services: partner.services.map(service => ({ ...service, category: serviceCategory })) }
    const mixed = { ...deps, readInternal: async () => [native] }
    assert.equal((await discoverBusinesses({ query: school.name, cityCode: '68134', category: 'pets' }, mixed)).results.length, 0)
    assert.ok((await discoverBusinesses({ query: school.name, cityCode: '68134', category: 'education' }, mixed)).results.some(row => row.id === partner.id))
  }
  const freeCategory = { ...partner, services: partner.services.map(service => ({ ...service, category: 'unrecognised' })) }
  assert.ok((await discoverBusinesses({ query: school.name, cityCode: '68134', category: 'education' }, { ...deps, readInternal: async () => [freeCategory] })).results.some(row => row.id === partner.id), 'legacy free categories retain actual mathematics service evidence')
  const noEvidence = { ...freeCategory, services: freeCategory.services.map(service => ({ ...service, name: 'Обща услуга' })) }
  assert.ok(!(await discoverBusinesses({ query: school.name, cityCode: '68134', category: 'education' }, { ...deps, readInternal: async () => [noEvidence] })).results.some(row => row.id === partner.id))
  const borovo = additions.find(row => row.id === 'sofia-puzzle-kids-borovo')
  assert.equal((await discoverBusinesses(discoverySearchInput({ query: borovo.name, cityCode: '56784', cityWasChosen: true }), deps)).results.length, 0)
  let partnerReads = 0
  const linkedPartner = { ...partner, name: borovo.name, industry: 'beauty', neighborhood: 'Борово',
    address: borovo.address, phone: borovo.phone, website_url: borovo.website,
    services: [{ id: 'qa-cut', name: 'Подстригване за момче', category: 'hair', active: true, price: 12, duration_min: 30 }] }
  const linked = await discoverBusinesses(discoverySearchInput({ query: borovo.name }), { ...deps, readInternal: async scope => {
    partnerReads++
    assert.equal(scope.cityCode, '68134', 'partners must be read after resolving the exact branch name, not in the inferred town Borovo')
    return [linkedPartner]
  } })
  assert.equal(partnerReads, 1)
  assert.ok(linked.results.some(row => row.id === partner.id))
  assert.ok(!linked.results.some(row => row.id === borovo.id), 'the verified same-phone/same-address native partner suppresses its unclaimed catalogue duplicate')
  const ordinaryCity = await discoverBusinesses(discoverySearchInput({ query: 'маникюр в Пловдив' }), deps)
  assert.equal(ordinaryCity.intent.cityCode, '56784')
  assert.equal(ordinaryCity.results.length, 0)
  // Dated source records cannot appear before they were actually reviewed.
  const historical = await discoverBusinesses({ query: school.name, cityCode: '68134' }, { ...deps, now: DateTime.fromISO('2026-11-11T12:00:00Z') })
  assert.ok(!historical.results.some(row => row.id === school.id))
})

test('new services have activity-specific photos, never emoji or neutral appointment workspaces', () => {
  for (const row of additions) for (const service of row.services) {
    const photo = serviceThumbnail({ ...service, ...catalogueServicePhotoFields(service, row) }, { business: row })
    assert.equal(photo.type, 'photo', `${row.id}: ${service.name}`)
    assert.ok(['exact', 'activity'].includes(photo.photoMatch), `${row.id}: ${service.name}: ${photo.src}`)
    assert.ok(photo.src.startsWith('/service-photos/'))
  }
})

test('neighborhood/category report counts businesses separately from services and citywide mobile providers', () => {
  const report = catalogueExpansionReport(SOFIA_CATALOGUE, { baseline, now })
  assert.equal(report.comparison.addedBusinesses, additions.length)
  assert.equal(report.comparison.addedServiceFacts, additions.reduce((count, row) => count + row.services.length, 0))
  assert.equal(report.comparison.addedByNeighborhood.reduce((count, row) => count + row.businesses, 0), additions.length)
  assert.equal(report.comparison.addedMobileProviders, additions.filter(row => row.locationKind === 'service_area').length)
  assert.equal(report.comparison.addedByBusinessType['Психология и психотерапия'], 33)
  assert.equal(report.comparison.addedByBusinessType['Психиатрия'], 2)
  assert.equal(report.sourceRecords, baseline.sourceCount + additions.length)
  assert.equal(report.excludedGeneralClinics.length, 23)
  assert.equal(report.currentlyEligible, baseline.sourceCount - 23 + additions.length)
})

test('reporting distinguishes selected psychology visits in mixed practices from the actual psychiatry visit', () => {
  for (const id of ['sofia-orpheus-psychotherapy-shipchenski52', 'sofia-kabinet-six-stefan-stambolov57']) {
    assert.equal(reportBusinessType(additions.find(row => row.id === id)), 'Психология и психотерапия')
  }
  assert.equal(reportBusinessType(additions.find(row => row.id === 'sofia-stimul-psychiatry-pimen-zografski38')), 'Психиатрия')
})
