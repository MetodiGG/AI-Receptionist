import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE, REGIONAL_CATALOGUE, PUBLIC_CATALOGUE_PRICE_REVIEWS, readPublicCatalogue, findPublicCatalogueEntry } from '../lib/discovery/public-catalogue.mjs'
import { REGIONAL_RAW_RECORDS, REGIONAL_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/lom-brusartsi-20261122.mjs'
import { LOM_GPOINT_RAW_RECORDS, LOM_GPOINT_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/lom-gpoint-20261122.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, auditCataloguePricing, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { searchCatalogueForOnboarding, catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261122 } from '../lib/catalogue-service-photo-associations-20261122.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { presentPublicService } from '../lib/locale/public-content-server.mjs'
import { serviceDisplayName, serviceDisplayUnit } from '../lib/locale/public-content.mjs'

const now = Date.parse('2026-11-22T12:00:00Z')
const initialIds = ['lom-studio-krasota-elena-dunavska18', 'lom-europe-schools-slavyanska7']
const ids = [...initialIds, 'lom-gpoint-slavyanska51']
const row = id => REGIONAL_CATALOGUE.find(item => item.id === id)

test('the append-only public inventory retains all Sofia rows and admits only the three source-reviewed Lom premises, never held Brusartsi leads', async () => {
  assert.deepEqual(REGIONAL_RAW_RECORDS.map(item => item.id), initialIds)
  assert.deepEqual(LOM_GPOINT_RAW_RECORDS.map(item => item.id), [ids[2]])
  assert.deepEqual(REGIONAL_CATALOGUE.map(item => item.id), ids)
  assert.equal(validateCatalogue([...REGIONAL_RAW_RECORDS, ...LOM_GPOINT_RAW_RECORDS]).length, 3)
  assert.equal(PUBLIC_CATALOGUE.length, SOFIA_CATALOGUE.length + 3)
  assert.deepEqual(PUBLIC_CATALOGUE.slice(0, SOFIA_CATALOGUE.length), SOFIA_CATALOGUE)
  assert.deepEqual(PUBLIC_CATALOGUE.slice(SOFIA_CATALOGUE.length), REGIONAL_CATALOGUE)
  assert.equal(await readPublicCatalogue(), PUBLIC_CATALOGUE)
  assert.equal(new Set(PUBLIC_CATALOGUE.map(item => item.id)).size, PUBLIC_CATALOGUE.length)
  for (const entry of REGIONAL_CATALOGUE) {
    assert.equal(findPublicCatalogueEntry(entry.id), entry)
    assert.equal(entry.cityCode, '44238'); assert.equal(entry.coordinates, null); assert.equal(entry.neighborhood, null)
    assert.equal(entry.locationKind, 'premises'); assert.ok(approvedCatalogueRecord(entry, now))
    assert.ok(Object.isFrozen(entry) && Object.isFrozen(entry.services))
  }
  assert.equal(PUBLIC_CATALOGUE.filter(item => item.cityCode === '06570').length, 0)
  assert.equal(findPublicCatalogueEntry('brusartsi-not-reviewed-yet') ?? null, null)
})

test('literal Elena fees, named specialist, real weekly hours and course-enrolment qualifiers survive the regional review gate', () => {
  const elena = row(ids[0]), europe = row(ids[1])
  assert.deepEqual(elena.services.map(service => [service.name, service.price.amount, service.price.currency, service.price.kind]), [
    ['Подстригване', 10, 'EUR', 'fixed'], ['Оформяне на брада', 5, 'EUR', 'fixed'], ['Официална прическа', 60, 'EUR', 'fixed'],
  ])
  for (const service of elena.services) {
    assert.match(service.description, /фризьор Елена/u)
    assert.equal(service.price.sourceUrl, 'https://studiozakrasotaelena.com/elena/')
    assert.equal(service.durationMin, undefined)
  }
  assert.deepEqual(elena.openingHours.days.map(day => [day.weekday, day.periods]), [
    ...[1, 2, 3, 4, 5].map(weekday => [weekday, [{ open: '09:00', close: '18:00' }]]),
    [6, [{ open: '09:00', close: '13:00' }]], [7, []],
  ])
  assert.equal(europe.openingHours, undefined, 'course frequency is not fabricated office opening hours')
  for (const service of europe.services) {
    assert.equal(service.price, undefined); assert.equal(service.durationMin, undefined)
    assert.equal(service.appointmentModel, 'group_reservation')
    assert.match(service.description, /определяне на нивото.*курс, графикът и таксата.*не е резервация за единичен урок/u)
  }
  const outcomes = auditCataloguePricing(REGIONAL_CATALOGUE, [], PUBLIC_CATALOGUE_PRICE_REVIEWS, now)
  assert.deepEqual(outcomes.blocking, [])
  assert.deepEqual(outcomes.records.map(item => [item.id, item.state]), [[ids[0], 'reviewed'], [ids[1], 'service_reviewed'], [ids[2], 'reviewed']])
  assert.ok(outcomes.records.every(item => item.legacy === false), 'none of the regional rows gains a Sofia legacy exemption')
  for (const entry of REGIONAL_CATALOGUE) {
    const review = PUBLIC_CATALOGUE_PRICE_REVIEWS.find(item => item.id === entry.id)
    assert.equal(review.inventoryIdentity, pricingIdentity(entry), entry.id)
    assert.match(review.inventoryIdentity, /^[a-f0-9]{64}$/u)
    assert.equal(assessPricingReview(entry, review, Date.parse('2026-11-21T12:00:00Z')).state, 'pending')
  }
})

test('the separately selected G Point Lom branch preserves its actual gender menus and conditional online-only tariff', () => {
  const entry = row(ids[2])
  assert.equal(entry.name, 'G Point · Лом'); assert.equal(entry.address, 'Лом, ул. Славянска 51')
  assert.equal(entry.phone, null); assert.equal(entry.openingHours, undefined)
  assert.deepEqual(entry.booking, { kind: 'form', url: 'https://gpoint.bg/запазване-час' })
  assert.equal(entry.services.length, 41)
  assert.equal(entry.services.filter(service => /· жени$/u.test(service.name)).length, 24)
  assert.equal(entry.services.filter(service => /· мъже$/u.test(service.name)).length, 17)
  assert.ok(!entry.services.some(service => /Интим · мъже/u.test(service.name)), 'a zone absent from the Lom menu is never copied from another branch')
  for (const service of entry.services) {
    assert.equal(service.price.currency, 'EUR'); assert.equal(service.price.kind, 'fixed'); assert.equal(service.price.unit, 'процедура')
    assert.equal(service.price.checkedOn, '2026-11-22'); assert.equal(service.price.validUntil, '2026-11-29')
    assert.equal(service.price.sourceUrl, entry.booking.url)
    assert.match(service.description, /САМО при онлайн записване/u)
    assert.equal(service.durationSourceUrl, entry.booking.url); assert.equal(service.durationCheckedOn, '2026-11-22')
    assert.ok(Number.isInteger(service.durationMin) && service.durationMin >= 5)
  }
  assert.equal(LOM_GPOINT_PRICE_REVIEWS.length, 1)
  assert.equal(approvedCatalogueRecord(entry, Date.parse('2026-11-30T12:00:00Z')), null, 'the short conditional-tariff review cannot silently roll forward')
})

test('regional source reviews bind manually normalized literal identities instead of recomputing their own approval after an edit', async () => {
  for (const filename of ['lom-brusartsi-20261122.mjs', 'lom-gpoint-20261122.mjs']) {
    const source = await readFile(new URL('../lib/discovery/catalogue-data/' + filename, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /pricingIdentity\s*\(/u, filename + ': the runtime source cannot automatically approve its own changed inventory')
  }
  for (const entry of REGIONAL_CATALOGUE) {
    const review = PUBLIC_CATALOGUE_PRICE_REVIEWS.find(item => item.id === entry.id)
    const changed = { ...entry, services: entry.services.map((service, index) => index ? service : { ...service, description: (service.description || '') + ' Променено условие.' }) }
    assert.equal(assessPricingReview(changed, review, now).state, 'pending', entry.id + ': source edits need a fresh manual review')
  }
})

test('each admitted real business and every service is discoverable and reusable in registration only within its actual city', () => {
  for (const entry of REGIONAL_CATALOGUE) {
    const found = normalizeCatalogueBusinesses(PUBLIC_CATALOGUE, { cityCode: '44238', category: entry.category, browse: true, searchV2: true, requirements: [] }, { now }).find(item => item.id === entry.id)
    assert.ok(found, entry.id); assert.equal(found.city, 'Лом'); assert.equal(found.coordinates, null)
    assert.deepEqual(found.availability, { status: 'external', slots: [] })
    assert.ok(searchCatalogueForOnboarding(PUBLIC_CATALOGUE, { query: entry.name, cityCode: '44238' }, { now }).some(item => item.id === entry.id))
    assert.ok(!searchCatalogueForOnboarding(PUBLIC_CATALOGUE, { query: entry.name, cityCode: '68134' }, { now }).some(item => item.id === entry.id))
    const draft = catalogueOnboardingDetail(PUBLIC_CATALOGUE, entry.id, { now, cityCode: '44238' })
    assert.equal(draft.business.coordinates, undefined); assert.equal(draft.services.length, entry.services.length)
    for (const [index, service] of entry.services.entries()) {
      assert.equal(draft.services[index].name, service.name)
      assert.equal(draft.services[index].description, service.description)
      assert.equal(draft.services[index].price, service.price ? String(service.price.amount) : '')
      assert.equal(draft.services[index].duration_min, service.durationMin ? String(service.durationMin) : '')
    }
  }
  assert.deepEqual(normalizeCatalogueBusinesses(REGIONAL_CATALOGUE, { cityCode: '68134', browse: true, searchV2: true, requirements: [] }, { now }), [])
  assert.deepEqual(normalizeCatalogueBusinesses(PUBLIC_CATALOGUE, { cityCode: '06570', browse: true, searchV2: true, requirements: [] }, { now }), [])
})

test('all 47 real regional services reuse exact existing photographic assets and complete offline English presentation', async () => {
  let serviceCount = 0
  for (const entry of REGIONAL_CATALOGUE) for (const service of entry.services) {
    const fields = catalogueServicePhotoFields(service, entry)
    const alias = CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261122.find(([id, category, name]) => id === entry.id && category === service.category && name === service.name)
    assert.ok(alias, entry.id + ':' + service.name)
    assert.equal(fields.illustrativePhotoKey, alias[3])
    const photo = serviceThumbnail({ ...service, ...fields }, { business: entry })
    assert.equal(photo.type, 'photo'); assert.equal(photo.source, 'illustrative'); assert.equal(photo.photoMatch, 'activity')
    assert.equal(photo.src, `/service-photos/${alias[3]}-v1.webp`, 'the exact reviewed alias is rendered; this is not a photograph of the business itself')
    if (/· мъже$/u.test(service.name)) assert.equal(alias[3], 'laser-equipment', 'female-client photos must never stand for a male laser service')
    assert.doesNotMatch(photo.src, /notebook|neutral/u)
    await access(new URL('../public' + photo.src, import.meta.url))
    const translated = presentPublicService(service, entry)
    assert.equal(translated.name, service.name, 'raw matching identity is never translated or replaced')
    assert.deepEqual(translated.price, service.price, 'literal price/qualifications remain source facts')
    for (const value of [serviceDisplayName(translated, 'en'), translated.presentationEn.description, serviceDisplayUnit(translated, 'en')].filter(Boolean)) assert.doesNotMatch(value, /[а-яѝ]|translation pending/iu, entry.id + ':' + service.name)
    serviceCount++
  }
  assert.equal(serviceCount, 47)
  assert.equal(CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261122.length, serviceCount)
  assert.equal(new Set(CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261122.map(([id, category, name]) => JSON.stringify([id, category, name]))).size, serviceCount)
})

test('the pending Brusartsi candidates remain absent from the admitted source inventory and price-review receipts', async () => {
  const receipt = JSON.parse(await readFile(new URL('../docs/catalogue-regions/research-brusartsi-20261122.json', import.meta.url), 'utf8'))
  assert.equal(receipt.admitted, 0)
  for (const candidate of receipt.candidates) assert.ok(!PUBLIC_CATALOGUE.some(entry => entry.cityCode === '06570' && entry.name === candidate.name))
  assert.ok([...REGIONAL_PRICE_REVIEWS, ...LOM_GPOINT_PRICE_REVIEWS].every(review => review.id.startsWith('lom-')))
})
