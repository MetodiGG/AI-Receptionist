import test from 'node:test'
import { locationRecoveryPriorRecord } from './location-recovery-20261122-scope.mjs'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import batch from '../lib/discovery/catalogue-data/neighborhood-coverage-photo-20261116.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { COVERAGE_20261116_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-coverage-20261116.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBusinessDetails, currentPublishedFact } from '../lib/discovery/business-details.mjs'
import { catalogueOnboardingDetail, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const margoId = 'sofia-photo-studio-margo-svoboda'
const mariaId = 'sofia-maria-nemska-photo-suhodol'
const margoBook = 'https://margaritaangelova.com/професионален-сватбен-фотограф/'
const margoFamily = 'https://margaritaangelova.com/детски-и-семейни-фотосесии/'
const mariaBook = 'https://marianemska.com/студио-софия-цени-и-условия/'
const record = id => SOFIA_CATALOGUE.find(row => row.id === id)
const expectedPhotos = {
  [margoId]: ['sx-outdoor-family-photoshoot'],
  [mariaId]: ['sx-business-portrait', 'sx-baby-child-photoshoot', 'sx-newborn-studio-photo'],
}

test('photo coverage admits exactly two distinct premises and four selected priced services, not contradictory offers or products', () => {
  assert.deepEqual(batch.records.map(row => row.id), [margoId, mariaId])
  assert.deepEqual(record(margoId).services.map(service => service.name), ['Детска и семейна фотосесия'])
  assert.deepEqual(record(mariaId).services.map(service => service.name), [
    'Портретна фотосесия в студио', 'Фотосесия за бебета в студио', 'Фотосесия за новородени',
  ])
  for (const source of batch.records) {
    const row = record(source.id)
    assert.equal(SOFIA_CATALOGUE.filter(item => item.id === source.id).length, 1)
    assert.equal(row.locationKind, 'premises')
    assert.equal(row.category, 'other')
    assert.ok(row.services.every(service => service.category === 'other' && service.appointmentModel === 'appointment'))
    assert.ok(row.services.every(service => !/ваучер|допълнителен кадър|smash|cake|бремен|сватб|индивидуална фотосесия/iu.test(service.name)))
    const reviewed = assessPricingReview(row, COVERAGE_20261116_REVIEWS.find(review => review.id === row.id), now)
    assert.equal(reviewed.state, 'reviewed', row.id)
    assert.equal(reviewed.reviewedPriceCount, row.services.length)
  }
})

test('Margo keeps the actual EUR range, agreed outdoor setting and variable duration rather than inventing a fixed studio booking', () => {
  const row = record(margoId), service = row.services[0]
  assert.deepEqual(service.price, {
    amount: 200, maximum: 250, currency: 'EUR', kind: 'range',
    unit: 'фотосесия; според желанията и локацията', sourceUrl: margoFamily,
    checkedOn: '2026-11-16', validUntil: '2027-02-14',
  })
  assert.match(service.description, /уговорена външна локация/u)
  assert.match(service.description, /не задължително в студиото/u)
  assert.match(service.description, /60–90 минути/u)
  assert.match(service.description, /10 работни дни/u)
  assert.match(service.description, /потвърждават при запитване/u)
  assert.equal(service.durationMin, undefined)
  assert.equal(service.durationSourceUrl, undefined)
  assert.equal(row.openingHours, undefined, 'Evening meeting guidance is not a complete weekly schedule')
  assert.deepEqual(row.booking, { kind: 'form', url: margoBook })
  assert.equal(row.phone, '+359899866672')
})

test('Margo retains only the exact owner-published point bound to its Svoboda address; Maria has no guessed point', () => {
  const row = record(margoId)
  assert.equal(row.neighborhood, 'Свобода')
  assert.equal(row.address, 'София, ж.к. Свобода, бул. Н. Жеков, бл. 4А (до CBA)')
  assert.deepEqual(row.coordinates, {
    latitude: 42.73572582730182, longitude: 23.30583665727182,
    method: 'first_party_coordinates', source: margoBook, sourceAddress: row.address,
  })
  assert.deepEqual(catalogueBoundCoordinates(row), row.coordinates)
  assert.equal(catalogueBoundCoordinates({ ...row, address: 'София, ж.к. Свобода, друг адрес 5' }), null)
  // Preserve the Nov16 intake claim; the later exact municipal match is
  // tested against the actual current row in its separate Nov22 feature test.
  const maria = locationRecoveryPriorRecord(record(mariaId))
  assert.equal(maria.neighborhood, 'Суходол')
  assert.equal(maria.address, 'София, Суходол, ул. Траян Танев 21')
  assert.equal(maria.coordinates, null)
})

test('Maria prices are single ten-image session packages with the additional-image qualification and announced-date limitation', () => {
  const row = record(mariaId)
  assert.deepEqual(row.services.map(service => service.price.amount), [100, 100, 190])
  for (const service of row.services) {
    assert.deepEqual(service.price, {
      amount: service.price.amount, currency: 'EUR', kind: 'fixed', unit: 'фотосесия с минимум 10 снимки',
      sourceUrl: mariaBook, checkedOn: '2026-11-16', validUntil: '2026-12-16',
    })
    assert.match(service.description, /Студийна фотосесия с минимум 10 снимки/u)
    assert.match(service.description, /допълнителен кадър 10 €/u)
    assert.match(service.description, /Само с предварителна уговорка на обявените дати за София/u)
    assert.match(service.description, /фотографът потвърждава часа/u)
    assert.equal(service.durationMin, undefined)
  }
  assert.equal(row.openingHours, undefined, 'Four announced attendance dates are not recurring opening hours')
  assert.deepEqual(row.booking, { kind: 'form', url: mariaBook })
  assert.equal(row.phone, '+359878464445')
  assert.equal(row.verification.validUntil, '2026-12-16')
  assert.equal(row.verification.contact, 'https://marianemska.com/contact/')
})

test('Maria date-limited listing and tariffs expire after 16 December without changing the longer-lived Margo review', async () => {
  const row = record(mariaId)
  const lastDay = Date.parse('2026-12-16T12:00:00Z'), nextDay = Date.parse('2026-12-17T00:00:00Z')
  assert.ok(approvedCatalogueRecord(row, lastDay))
  assert.ok(row.services.every(service => currentPublishedFact(service.price, lastDay)))
  assert.equal(approvedCatalogueRecord(row, nextDay), null)
  assert.ok(row.services.every(service => !currentPublishedFact(service.price, nextDay)))
  assert.equal(catalogueOnboardingDetail(SOFIA_CATALOGUE, row.id, { now: nextDay }), null)
  assert.ok(approvedCatalogueRecord(record(margoId), nextDay))
  const handler = createCatalogueOnboardingHandler({ catalogue: SOFIA_CATALOGUE, now: () => nextDay, allowAttempt: () => true })
  const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${row.id}&city=68134&lang=bg`))
  assert.equal(response.status, 404)
})

test('both BG and EN partner-intake responses preserve package units, range maxima and qualifications without invented durations', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: SOFIA_CATALOGUE, now: () => now, allowAttempt: () => true })
  for (const source of batch.records) for (const locale of ['bg', 'en']) {
    const row = record(source.id)
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${row.id}&city=68134&lang=${locale}`))
    assert.equal(response.status, 200)
    const draft = await response.json()
    assert.equal(draft.business.address, row.address)
    assert.equal(draft.business.neighborhood, row.neighborhood)
    assert.equal(draft.serviceCount, row.services.length)
    row.services.forEach((service, index) => {
      const imported = draft.services[index]
      assert.equal(imported.name, service.name)
      assert.equal(imported.price, String(service.price.amount))
      assert.equal(imported.currency, 'EUR')
      assert.equal(imported.duration_min, '')
      assert.deepEqual(imported.price_details, { kind: service.price.kind, ...(service.price.maximum ? { maximum: service.price.maximum } : {}), unit: service.price.unit })
      assert.equal(imported.description, service.description)
      assert.equal(imported.catalogueHint.description, service.description)
      assert.ok(imported.catalogueHint.priceLabel.includes(service.price.unit))
      assert.match(imported.catalogueHint.priceLabel, /€/u)
    })
    if (row.id === margoId) assert.match(draft.services[0].catalogueHint.priceLabel, /200.*250/u)
    if (row.id === mariaId) assert.equal(draft.business.coordinates, undefined)
  }
})

test('public photography discovery returns each exact source quarter with external inquiry only and complete qualified prices', () => {
  for (const source of batch.records) {
    const row = record(source.id)
    const result = normalizeCatalogueBusinesses(SOFIA_CATALOGUE, { cityCode: '68134', neighborhood: row.neighborhood, category: 'other', browse: true, searchV2: true }, { now })
      .find(item => item.id === row.id)
    assert.ok(result, `${row.id}: explicit-quarter discovery`)
    assert.equal(result.neighborhood, row.neighborhood)
    assert.equal(result.address, row.address)
    assert.deepEqual(result.details.hours, [])
    assert.equal(result.details.hoursSourceUrl, null)
    assert.deepEqual(result.availability, { status: 'external', slots: [] })
    assert.deepEqual(railExternalAction(result, now), { kind: 'form', href: new URL(row.booking.url).href })
    const otherQuarter = row.id === margoId ? 'Суходол' : 'Свобода'
    assert.ok(!normalizeCatalogueBusinesses([row], { cityCode: '68134', neighborhood: otherQuarter, category: 'other', browse: true, searchV2: true }, { now }).length)
    row.services.forEach((service, index) => {
      const detail = result.details.services[index]
      assert.equal(detail.price, service.price.amount)
      assert.equal(detail.priceKind, service.price.kind)
      assert.equal(detail.priceMaximum, service.price.maximum ?? null)
      assert.equal(detail.priceUnit, service.price.unit)
      assert.equal(detail.priceSourceUrl, service.price.sourceUrl)
      assert.equal(detail.description, service.description)
      assert.equal(detail.durationMin, null)
    })
    assert.deepEqual(result.details.services.map(service => service.description), catalogueBusinessDetails(row, now).services.map(service => service.description))
  }
})

test('the four photo services use their exact reviewed scene keys including an outdoor family shoot, not neutral camera/notebook art', async () => {
  for (const source of batch.records) for (const [index, service] of source.services.entries()) for (const locale of ['bg', 'en']) {
    const row = record(source.id)
    const fields = catalogueServicePhotoFields(service, row)
    assert.equal(fields.illustrativePhotoKey, expectedPhotos[row.id][index])
    const image = serviceThumbnail({ ...service, ...fields }, { business: row, locale })
    assert.equal(image.type, 'photo')
    assert.equal(image.src, `/service-photos/${expectedPhotos[row.id][index]}-v1.webp`)
    assert.equal(image.photoMatch, 'activity')
    assert.ok(image.alt)
    const bytes = await readFile(new URL(`../public${image.src}`, import.meta.url))
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF')
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP')
  }
})
