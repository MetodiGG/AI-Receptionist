import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import batch from '../lib/discovery/catalogue-data/neighborhood-coverage-artmasters-20261116.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBusinessDetails } from '../lib/discovery/business-details.mjs'
import { catalogueOnboardingDetail, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const id = 'sofia-art-masters-band-nadezhda1-172'
const site = 'https://amb2016.wixsite.com/music-school'
const tariff = `${site}/blank-2`, contact = `${site}/blank-citr`, premises = `${site}/blank-br2ta`
const appointment = 'https://artmastersband12.wixsite.com/amb12/----c15bq'
const appointmentContact = 'https://artmastersband12.wixsite.com/amb12/contact'
const [business] = validateCatalogue(batch.records)
const [sourceReview] = batch.reviews
// Standalone candidate checks deliberately do not rewrite or depend on the
// persisted identity file; root binds the final inventory after review.
const review = { ...sourceReview, inventoryIdentity: pricingIdentity(business) }

test('Art Masters is one exact Nadezhda1 studio with two individual piano variants, not teachers or other branches', () => {
  assert.deepEqual(batch.records.map(row => row.id), [id])
  assert.deepEqual(batch.reviews.map(row => row.id), [id])
  assert.equal(business.name, 'Музикална школа Арт Мастърс Бенд · Надежда 1')
  assert.equal(business.cityCode, '68134')
  assert.equal(business.neighborhood, 'Надежда 1')
  assert.equal(business.address, 'София, ж.к. Надежда 1, бл. 172, вх. Г')
  assert.equal(business.locationKind, 'premises')
  assert.equal(business.coordinates, null)
  assert.equal(business.category, 'education')
  assert.equal(business.gorezBusinessId, undefined)
  assert.deepEqual(business.services.map(service => service.name), [
    'Индивидуален урок по пиано · 60 мин', 'Индивидуален урок по пиано · 30 мин',
  ])
  assert.ok(business.services.every(service => service.category === 'education' && service.appointmentModel === 'appointment'))
  assert.ok(business.services.every(service => !/китара|солфеж|наем|ансамбъл|пакет|безплат|промоция/iu.test(service.name)))
  assert.ok(approvedCatalogueRecord(business, now))
  assert.equal(approvedCatalogueRecord(business, Date.parse('2027-02-15T12:00:00Z')), null)
})

test('only literal single-session EUR amounts and sourced arrival/departure-inclusive durations are retained', () => {
  assert.deepEqual(business.services.map(service => [service.durationMin, service.price.amount]), [[60, 30], [30, 16]])
  for (const service of business.services) {
    assert.equal(service.durationSourceUrl, tariff)
    assert.equal(service.durationCheckedOn, '2026-11-16')
    assert.deepEqual(service.price, {
      amount: service.durationMin === 60 ? 30 : 16, currency: 'EUR', kind: 'fixed', unit: 'единично занятие',
      sourceUrl: tariff, checkedOn: '2026-11-16', validUntil: '2027-02-14',
    })
    assert.match(service.description, /включват пристигане и тръгване/u)
    assert.doesNotMatch(service.price.unit, /месец|пакет|наем|отстъпка/u)
  }
  assert.match(business.services[0].description, /Плащане в края на часа/u)
  assert.match(business.services[1].description, /по-малки деца/u)
  assert.match(business.services[1].description, /Предплащане; отмяна до предходния ден, иначе урокът се отчита/u)
})

test('the real owner sites and scheduling phone stay explicitly cross-bound without pretending the generic form is a calendar', () => {
  assert.equal(business.website, site)
  assert.equal(business.phone, '+359888357317')
  assert.deepEqual(business.booking, { kind: 'phone', phone: '+359888357317' })
  assert.equal(business.verification.booking.url, appointment)
  assert.equal(business.verification.contact, contact)
  assert.match(business.verification.booking.excerpt, /За свободните часове и графика/u)
  const resolution = review.manualIntakeResolution
  assert.equal(resolution.flag, 'first_party_appointment_evidence_required')
  assert.equal(resolution.decision, 'manually_verified_same_owner_websites')
  assert.equal(resolution.checkedOn, '2026-11-16')
  assert.equal(resolution.ownerWebsite, site)
  assert.equal(resolution.currentContact, contact)
  assert.equal(resolution.currentPremises, premises)
  assert.equal(resolution.appointmentEvidence, appointment)
  assert.equal(resolution.appointmentContact, appointmentContact)
  assert.deepEqual(resolution.matchingPhones, ['+359888357317'])
  assert.equal(resolution.premises, 'Надежда 1, бл. 172, вх. Г')
  assert.deepEqual(resolution.reviewedBy, ['/root', '/root/catalogue_workflow_audit'])
  assert.match(resolution.note, /founder\/teacher Todorov/u)
  assert.match(resolution.note, /same amb12 professional email/u)
  assert.match(resolution.note, /generic inquiry, not a calendar/u)
  for (const url of [site, contact, premises, appointment, appointmentContact, tariff, `${site}/blank-c1yws`]) {
    assert.ok(review.reviewedUrls.includes(url), url)
  }
  assert.notEqual(new URL(site).hostname, new URL(appointment).hostname)
})

test('the unchanged offline helper keeps the different-host warning, while the exact manually reviewed inventory passes pricing checks', () => {
  const result = auditCatalogueBatch(SOFIA_CATALOGUE.filter(row => row.id !== id), batch.records, now)
  assert.deepEqual(result.readyForReview, [])
  assert.deepEqual(result.rejected, [])
  assert.deepEqual(result.pending, [{ id, reason: 'first_party_appointment_evidence_required' }])
  assert.equal(review.bookingEntry, 'phone')
  assert.equal(review.bookingReview, 'phone_booking_reviewed')
  assert.equal(review.pricingDecision, undefined, 'A published tariff is not not_publicly_listed')
  assert.deepEqual(assessPricingReview(business, review, now), {
    id, state: 'reviewed', checkedOn: '2026-11-16', reviewedPriceCount: 2,
  })
  const changed = { ...business, services: [{ ...business.services[0], durationMin: 75 }, business.services[1]] }
  assert.equal(assessPricingReview(changed, review, now).reason, 'reviewed_service_inventory_changed')
  assert.deepEqual(auditCatalogueBatch([], [{ ...batch.records[0], id: `${id}-unchecked` }], now).pending,
    [{ id: `${id}-unchecked`, reason: 'first_party_appointment_evidence_required' }])
})

test('school opening hours retain the complete sourced seven-day schedule without creating lesson availability', () => {
  assert.equal(business.openingHours.sourceUrl, premises)
  assert.equal(business.openingHours.checkedOn, '2026-11-16')
  assert.deepEqual(business.openingHours.days, [
    ...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '08:30', close: '20:00' }] })),
    ...[6, 7].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '18:00' }] })),
  ])
  const details = catalogueBusinessDetails(business, now)
  assert.deepEqual(details.services.map(service => [service.price, service.durationMin, service.priceUnit]), [[30, 60, 'единично занятие'], [16, 30, 'единично занятие']])
  assert.equal(details.hoursSourceUrl, premises)
  assert.equal(details.hours.length, 7)
})

test('BG and EN guest partner lookup/import preserve the two exact services, prices, minutes, units and qualifications', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: [business], now: () => now, allowAttempt: () => true })
  for (const locale of ['bg', 'en']) {
    const search = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?q=${encodeURIComponent(business.name)}&city=68134&lang=${locale}`))
    assert.equal(search.status, 200)
    assert.deepEqual((await search.json()).businesses.map(row => [row.id, row.serviceCount, row.currentPriceCount]), [[id, 2, 2]])
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${id}&city=68134&lang=${locale}`))
    assert.equal(response.status, 200)
    const draft = await response.json()
    assert.deepEqual(draft, catalogueOnboardingDetail([business], id, { now, cityCode: '68134', locale }))
    assert.equal(draft.business.website, site)
    assert.equal(draft.business.phone, business.phone)
    assert.equal(draft.business.neighborhood, 'Надежда 1')
    assert.equal(draft.business.address, business.address)
    assert.equal(draft.business.coordinates, undefined)
    assert.equal(draft.serviceCount, 2)
    draft.services.forEach((service, index) => {
      const source = business.services[index]
      assert.equal(service.name, source.name)
      assert.equal(service.price, String(source.price.amount))
      assert.equal(service.currency, 'EUR')
      assert.equal(service.duration_min, String(source.durationMin))
      assert.equal(service.description, source.description)
      assert.deepEqual(service.price_details, { kind: 'fixed', unit: 'единично занятие' })
      assert.match(service.catalogueHint.priceLabel, /единично занятие/u)
      assert.equal(service.catalogueHint.description, source.description)
    })
  }
})

test('public Nadezhda1 discovery keeps the phone action and no native slots, with no invented adjacent quarter or branch', () => {
  const query = { cityCode: '68134', neighborhood: 'Надежда 1', category: 'education', browse: true, searchV2: true }
  const [row] = normalizeCatalogueBusinesses([business], query, { now })
  assert.ok(row)
  assert.equal(row.id, id)
  assert.equal(row.neighborhood, 'Надежда 1')
  assert.equal(row.coordinates, null)
  assert.deepEqual(row.details.services.map(service => [service.name, service.price, service.durationMin]),
    business.services.map(service => [service.name, service.price.amount, service.durationMin]))
  assert.deepEqual(row.availability, { status: 'external', slots: [] })
  assert.deepEqual(railExternalAction(row, now), { kind: 'phone', href: 'tel:+359888357317' })
  for (const neighborhood of ['Надежда 2', 'Обеля 1', 'Младост 1', 'Свобода']) {
    assert.deepEqual(normalizeCatalogueBusinesses([business], { ...query, neighborhood }, { now }), [])
  }
})

test('both piano variants use the already approved precise piano instruction photo, not generic keyboard or notebook artwork', async () => {
  for (const locale of ['bg', 'en']) for (const service of business.services) {
    const semantic = serviceThumbnail(service, { business, locale })
    assert.equal(semantic.type, 'photo')
    assert.equal(semantic.photoMatch, 'exact')
    assert.equal(semantic.src, '/service-photos/piano-lesson-v1.webp')
    const image = serviceThumbnail({ ...service, ...catalogueServicePhotoFields(service, business) }, { business, locale })
    assert.equal(image.type, 'photo')
    assert.equal(image.src, semantic.src)
    assert.ok(image.alt)
    assert.doesNotMatch(image.src, /keyboard|neutral|notebook|appointment-workspace|consultation/u)
  }
  const data = await readFile(new URL('../public/service-photos/piano-lesson-v1.webp', import.meta.url))
  assert.equal(data.subarray(0, 4).toString(), 'RIFF')
  assert.equal(data.subarray(8, 12).toString(), 'WEBP')
})
