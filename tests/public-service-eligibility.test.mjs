import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { OWNER_HIDDEN_PUBLIC_SERVICE_PLACEHOLDERS, isPublicServiceVisible, visiblePublicServices } from '../lib/public-service-eligibility.mjs'
import { matchingServices, normalizeInternalBusinesses } from '../lib/discovery/internal-search.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { readDirectoryRows } from '../lib/public-directory.mjs'
import { readBookableBusiness } from '../lib/public-business-query.mjs'
import { guidedServiceMenu, buildGuidedReply } from '../lib/guided-assistant.mjs'

const businessId = '6b57b901-acd8-494b-a992-2cec551b4b00'
const serviceIds = ['a8bfd4a9-1249-4a72-a1d3-5b78edfe2dd5', '146da856-04ad-40d2-8095-cdf34dc65bc6', '76f91048-afae-47ba-8d8b-003a99efe2c7']
const placeholders = serviceIds.map(id => ({ id, name: 'Нова услуга', description: null, price: 0, price_details: {}, currency: 'EUR', duration_min: 60, active: true }))
const real = [
  { id: '9b74aa5f-2735-4d41-8c8b-fae2422c8a6f', name: 'Ремонт двигатели', price: 1200, description: null, currency: 'EUR', duration_min: 60, active: true },
  { id: '46ff9c8d-2eba-4f07-a71c-714c01b55d59', name: 'Компютърна диагностика', price: 50, description: null, currency: 'EUR', duration_min: 45, active: true },
  { id: 'f1000000-0000-4000-8000-000000000001', name: 'Безплатна консултация', price: 0, description: 'Реална безплатна услуга.', currency: 'EUR', duration_min: 15, active: true },
]
const business = (services = [...placeholders, ...real], patch = {}) => ({ id: businessId, name: 'autocomplexrs ltd', slug: 'autocomplexrs-ltd', industry: 'auto', active: true, platform_status: 'enabled', services, staff: [], staffServices: services.map(service => ({ service_id: service.id, staff_id: 'f2000000-0000-4000-8000-000000000001' })), workingHours: [], ...patch })
const intent = { browse: true, searchV2: true, requirements: [] }
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
function database(row) {
  const calls = []
  return { calls, from(table) {
    const call = { table, filters: [] }; calls.push(call)
    const query = {
      select(fields) { call.fields = fields; return query },
      eq(...filter) { call.filters.push(filter); return query },
      order() { return query },
      limit() { return query },
      async maybeSingle() { return { data: row, error: null } },
      async range(start) { return { data: start === 0 ? [row] : [], error: null } },
    }
    return query
  } }
}

test('public placeholder registry contains only the three owner-approved exact service identities', () => {
  assert.equal(OWNER_HIDDEN_PUBLIC_SERVICE_PLACEHOLDERS.length, 3)
  assert.ok(Object.isFrozen(OWNER_HIDDEN_PUBLIC_SERVICE_PLACEHOLDERS))
  assert.deepEqual(OWNER_HIDDEN_PUBLIC_SERVICE_PLACEHOLDERS.map(row => row.serviceId), serviceIds)
  for (const item of OWNER_HIDDEN_PUBLIC_SERVICE_PLACEHOLDERS) {
    assert.ok(Object.isFrozen(item)); assert.equal(item.businessId, businessId)
    assert.equal(item.name, 'Нова услуга'); assert.equal(item.price, 0); assert.equal(item.approvedOn, '2026-11-13')
  }
})

test('only exact blank-description zero-price placeholders are hidden; unrelated and genuine free services remain', () => {
  const raw = business(), before = JSON.stringify(raw), visible = visiblePublicServices(raw)
  assert.deepEqual(visible.map(row => row.id), real.map(row => row.id))
  for (const [index, row] of visible.entries()) assert.equal(row, real[index])
  assert.equal(JSON.stringify(raw), before)
  for (const price of [0, '0', '0.00']) for (const description of [null, undefined, '', '  ']) {
    assert.equal(isPublicServiceVisible({ ...placeholders[0], price, description }, raw), false)
  }
  const unrelated = business(raw.services, { id: 'f3000000-0000-4000-8000-000000000001' })
  assert.equal(visiblePublicServices(unrelated), unrelated.services)
  assert.equal(isPublicServiceVisible({ ...placeholders[0], id: real[0].id }, raw), true)
  assert.equal(isPublicServiceVisible(real[2], raw), true, 'a real free appointment never disappears')
})

test('renaming, describing, repricing or qualifying an approved placeholder restores public visibility', () => {
  const raw = business()
  for (const patch of [
    { name: 'Нова услуга · Проверка' }, { name: 'нова услуга' }, { name: ' Нова услуга ' },
    { description: 'Преглед и консултация' }, { description: {} },
    { price: 1 }, { price: '1.00' }, { price: null }, { price: '' }, { price: false }, { price: NaN },
    { price_details: { kind: 'from' } }, { price_details: { kind: 'range', maximum: 30 } },
    { price_details: { unit: 'час' } }, { price_details: { unrecognized: true } }, { price_details: [] },
    { priceKind: 'from' }, { priceMaximum: 30 }, { priceUnit: 'час' },
  ]) assert.equal(isPublicServiceVisible({ ...placeholders[0], ...patch }, raw), true, JSON.stringify(patch))
  const renamed = { ...placeholders[0], name: 'Безплатен първоначален преглед' }
  assert.equal(visiblePublicServices(business([renamed]))[0], renamed)
})

test('the presentation helper is pure, idempotent and does not alter schedules or owner/appointment references', () => {
  const raw = business(), before = JSON.stringify(raw)
  Object.freeze(raw.services); raw.services.forEach(Object.freeze); Object.freeze(raw)
  const visible = visiblePublicServices(raw)
  assert.equal(visiblePublicServices(raw, visible), visible)
  assert.deepEqual(visiblePublicServices(null), [])
  assert.equal(visiblePublicServices(business(real)), real)
  const untouched = new Proxy([...real], { get(target, key, receiver) {
    if (key === 'some' || key === 'filter') throw Error('unrelated public service arrays must not be scanned')
    return Reflect.get(target, key, receiver)
  } })
  assert.equal(visiblePublicServices({ id: 'unrelated-business', services: untouched }), untouched)
  assert.equal(raw.staffServices.length, 6)
  assert.equal(JSON.stringify(raw), before)
})

test('search, category/name browse, public service names and full discovery details all omit only those three rows', () => {
  const raw = business(), before = JSON.stringify(raw), expected = real.map(row => row.id)
  assert.deepEqual(matchingServices(raw, intent).map(row => row.id), expected)
  assert.deepEqual(matchingServices(raw, { ...intent, browse: false, businessNameQuery: raw.name }).map(row => row.id), expected)
  const [shown] = normalizeInternalBusinesses([raw], intent)
  assert.deepEqual(shown.services.map(row => row.id), expected)
  assert.deepEqual(shown.details.services.map(row => row.id), expected)
  assert.deepEqual(shown.publicServiceNames, real.map(row => row.name))
  for (const [index, row] of shown.services.entries()) { assert.equal(row.price, real[index].price); assert.equal(row.name, real[index].name) }
  assert.equal(JSON.stringify(raw), before)
})

test('actual public partner details handler does not reintroduce placeholders or mutate its raw source', async () => {
  const raw = business(), before = JSON.stringify(raw)
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true, environment: 'production' }, allowAttempt: async () => true, readPartner: async id => id === raw.id ? raw : null })
  const response = await handler(new Request(`https://www.gorez.co/api/public/discovery/business/${raw.id}`, { headers: { origin: 'https://www.gorez.co', 'sec-fetch-site': 'same-origin' } }), raw.id)
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.deepEqual(body.business.details.services.map(row => row.id), real.map(row => row.id))
  assert.equal(JSON.stringify(raw), before)
})

test('public directory filters the view while the authoritative joined booking read keeps all source services and staff mappings', async () => {
  const raw = business(), before = JSON.stringify(raw), db = database(raw)
  const [directory] = await readDirectoryRows(db), bookable = await readBookableBusiness(db, raw.slug)
  assert.deepEqual(directory.services.map(row => row.id), real.map(row => row.id))
  assert.deepEqual(bookable.services.map(row => row.id), raw.services.map(row => row.id))
  assert.equal(bookable.staffServices, raw.staffServices)
  assert.equal(bookable.services[0].price, 0)
  assert.equal(JSON.stringify(raw), before)
  for (const call of db.calls) {
    assert.equal(call.table, 'businesses')
    assert.ok(call.filters.some(([key, value]) => key === 'platform_status' && value === 'enabled'))
    assert.doesNotMatch(call.fields, /customers\(|appointments\(|token/)
  }
  assert.doesNotMatch(await read('lib/public-business-query.mjs'), /public-service-eligibility|visiblePublicServices/)
})

test('native profile DTO filters only presentation; raw getPublicBusiness and existing-owner availability remain authoritative', async () => {
  const source = await read('lib/public-booking.js')
  const fn = source.match(/export function toPublicBusiness\(business\) \{[\s\S]*?\n\}/u)?.[0]
  assert.ok(fn)
  const toPublicBusiness = new Function('visiblePublicServices', 'publicProfileDetails', 'getBusinessPhotos', 'notificationAvailability', 'process', `return (${fn.replace(/^export /, '')})`)(visiblePublicServices, () => ({}), row => row.photos || [], () => ({}), { env: {} })
  const raw = business(undefined, { contact_email: 'private@example.invalid', privacy_contact_email: 'privacy@example.invalid', email_notifications_enabled: true }), before = JSON.stringify(raw)
  const dto = toPublicBusiness(raw)
  assert.deepEqual(dto.services.map(row => row.id), real.map(row => row.id))
  assert.equal(dto.staffServices, raw.staffServices)
  assert.ok(!('contact_email' in dto) && !('privacy_contact_email' in dto))
  assert.equal(JSON.stringify(raw), before)
  const rawRead = source.slice(source.indexOf('export async function getPublicBusiness'), source.indexOf('export async function getAvailableSlots'))
  assert.match(rawRead, /readBookableBusiness\(supabase, normalizedSlug\)/)
  assert.doesNotMatch(rawRead, /visiblePublicServices|isPublicServiceVisible/)
  assert.match(await read('app/api/owner/appointment-availability/route.js'), /getPublicBusiness\(b\.data\.slug\)/)
})

test('BG/EN public assistant menus and replies cannot reintroduce the three hidden rows', () => {
  const raw = business(), before = JSON.stringify(raw)
  for (const locale of ['bg', 'en']) {
    assert.deepEqual(guidedServiceMenu(raw, locale).map(row => row.id), real.map(row => row.id))
    assert.doesNotMatch(buildGuidedReply(raw, 'services', locale), /Нова услуга/)
    assert.match(buildGuidedReply(raw, 'services', locale), /Ремонт двигатели/)
    const onlyHidden = business(placeholders)
    assert.deepEqual(guidedServiceMenu(onlyHidden, locale), [])
    assert.match(buildGuidedReply(onlyHidden, 'services', locale), locale === 'en' ? /no active services/ : /няма активни услуги/)
    assert.match(buildGuidedReply(onlyHidden, 'booking', locale), locale === 'en' ? /no active services/ : /няма активни услуги/)
  }
  assert.equal(JSON.stringify(raw), before)
})
