import * as brandLoading from './helpers/brand-loading.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readBookableBusiness } from '../lib/public-business-query.mjs'
import { readDirectoryRows } from '../lib/public-directory.mjs'
import { readPublishedPartnerDetails, PUBLIC_DETAILS_FIELDS } from '../lib/discovery/public-details.mjs'
import { matchingServices, normalizeInternalBusinesses, readInternalCandidates, serviceFitsBudget } from '../lib/discovery/internal-search.mjs'
import * as profileUi from '../lib/business-profile-ui.mjs'
import * as directoryData from '../lib/directory.mjs'
import * as publicLocale from '../lib/public-locale.mjs'
import * as partnerCategories from '../lib/partner-categories.mjs'
import * as bookingMode from '../lib/booking-mode.mjs'
import { guidedServiceMenu } from '../lib/guided-assistant.mjs'
import * as bookingButtonContent from './helpers/booking-button-content.mjs'

const fee = (patch = {}) => ({ id: 'public-service-id', name: 'Подстригване', description: 'Реална публикувана услуга.', price: 20, currency: 'EUR', duration_min: 30, active: true, ...patch })
const business = services => ({ id: '10000000-0000-4000-8000-000000000001', name: 'QA public studio', slug: 'qa-public-studio', active: true, platform_status: 'enabled', industry: 'beauty', services, staff: [], workingHours: [], staffServices: [] })
function database(rows) {
  const calls = []
  return { calls, from(table) {
    const call = { table, filters: [], limits: [], orders: [] }; calls.push(call)
    const query = {
      select(value) { call.fields = value; return query },
      eq(...value) { call.filters.push(value); return query },
      order(...value) { call.orders.push(value); return query },
      limit(...value) { call.limits.push(value); return query },
      async maybeSingle() { return { data: rows[0] || null, error: null } },
      async range(start, end) { return { data: rows.slice(start, end + 1), error: null } },
      then(resolve) { return Promise.resolve({ data: rows, error: null }).then(resolve) },
    }
    return query
  } }
}

test('public profile and directory joined reads preserve literal amounts, currency, descriptions and price qualifications', async () => {
  const original = business([fee({ price: '20.00', price_details: { kind: 'range', maximum: 35, unit: 'процедура' } }), fee({ id: 'bgn', currency: 'BGN', price: 0, price_details: { kind: 'from' } })])
  const db = database([original]), profile = await readBookableBusiness(db, original.slug), directory = await readDirectoryRows(db)
  for (const row of [profile, directory[0]]) {
    assert.equal(row.services[0].price, 20)
    assert.equal(row.services[0].priceKind, 'range')
    assert.equal(row.services[0].priceMaximum, 35)
    assert.equal(row.services[0].priceUnit, 'процедура')
    assert.equal(row.services[0].description, original.services[0].description)
    assert.equal(row.services[1].price, 0)
    assert.equal(row.services[1].currency, 'BGN')
    assert.equal(row.services[1].priceKind, 'from')
  }
  assert.equal(db.calls.length, 2, 'no extra per-service data fetches')
  for (const call of db.calls) {
    assert.match(call.fields, /services\([^)]*price_details/)
    assert.doesNotMatch(call.fields, /\*|owner_id|customers\(|appointments\(|cancellation_token/)
    assert.ok(call.filters.some(([field, value]) => field === 'platform_status' && value === 'enabled'))
  }
  assert.equal(original.services[0].price, '20.00', 'read normalization does not mutate source records')
})

test('full details and discovery reads request public price metadata without weakening publication filters or bounds', async () => {
  const row = business([fee()]), db = database([row])
  await readPublishedPartnerDetails(db, row.id)
  await readInternalCandidates(db, { category: 'hair', cityCode: '68134' })
  assert.match(PUBLIC_DETAILS_FIELDS, /services\([^)]*price_details/)
  for (const call of db.calls) {
    assert.match(call.fields, /price_details/)
    assert.doesNotMatch(call.fields, /\*|owner_id|customers\(|appointments\(|billing/)
    assert.ok(call.filters.some(([field, value]) => field === 'active' && value === true))
    assert.ok(call.filters.some(([field, value]) => field === 'platform_status' && value === 'enabled'))
  }
  assert.ok(db.calls[0].limits.some(([maximum, options]) => maximum === 500 && options?.referencedTable === 'services'))
  assert.ok(db.calls[1].limits.some(([maximum]) => maximum === 100))
})

test('matching cards and full service menus retain range/from/unit/conditions but never arbitrary private service keys', () => {
  const rows = [fee({ price_details: { kind: 'range', maximum: 35, unit: 'процедура' }, owner_id: 'private', internalNotes: 'private' }), fee({ id: 'from', price_details: { kind: 'from' }, description: 'Само при онлайн записване.' })]
  const intent = { browse: true, searchV2: true, requirements: [] }
  const normalized = normalizeInternalBusinesses([business(rows)], intent)[0]
  for (const services of [matchingServices(business(rows), intent), normalized.services, normalized.details.services]) {
    assert.equal(services[0].priceKind, 'range')
    assert.equal(services[0].priceMaximum, 35)
    assert.equal(services[0].priceUnit, 'процедура')
    assert.equal(services[1].priceKind, 'from')
    assert.equal(services[1].description, 'Само при онлайн записване.')
    assert.ok(services.every(service => !Object.hasOwn(service, 'owner_id') && !Object.hasOwn(service, 'internalNotes')))
  }
})

test('budget guarantees use the full known visit total, not a starting or lower-bound price', () => {
  const budget = { currency: 'EUR', max: 30 }
  for (const patch of [{}, { price: 0 }, { price: 30 }, { price_details: { kind: 'range', maximum: 30 } }, { price_details: { kind: 'fixed', unit: 'процедура' } }]) assert.equal(serviceFitsBudget(fee(patch), budget), true)
  for (const patch of [
    { price: null }, { price: 31 }, { currency: 'USD' }, { price_details: { kind: 'from' } },
    { price_details: { kind: 'range', maximum: 31 } }, { price_details: { kind: 'range', maximum: 10 } },
    { price_details: { kind: 'fixed', unit: 'час' } }, { price_details: { kind: 'fixed', unit: 'пакет 10 посещения' } },
    { description: 'Ориентировъчно, без ДДС.' }, { description: 'Само при онлайн записване.' },
    { description: 'Only with a published discount.' },
  ]) assert.equal(serviceFitsBudget(fee(patch), budget), false, JSON.stringify(patch))
  assert.equal(serviceFitsBudget(fee({ currency: 'BGN' }), { currency: 'BGN', max: 30 }), true, 'raw BGN budgets still compare literal BGN values')
  assert.equal(serviceFitsBudget(fee({ currency: 'BGN', price: 80 }), { currency: 'EUR', max: 50 }), true, 'EUR budgets use the same derived conversion as the public label')
  assert.equal(serviceFitsBudget(fee({ currency: 'BGN', price: 80 }), { currency: 'EUR', max: 30 }), false)
  const intent = { browse: true, searchV2: true, requirements: [], budget }
  assert.equal(matchingServices(business([fee({ price_details: { kind: 'from' } })]), intent).length, 0, 'generic all-service browsing cannot bypass the budget check')
})

for (const locale of ['bg', 'en']) test(`${locale}: profile and assistant menu derive EUR labels from literal BGN without changing stored amounts or qualifications`, () => {
  const fixed = fee({ price: 0 }), from = fee({ price_details: { kind: 'from' } }), range = fee({ currency: 'BGN', price_details: { kind: 'range', maximum: 35, unit: 'процедура' } })
  assert.match(profileUi.profileServicePrice(fixed, locale), /0/)
  assert.match(profileUi.profileServicePrice(from, locale), locale === 'en' ? /^from / : /^от /)
  const label = profileUi.profileServicePrice(range, locale)
  assert.match(label, locale === 'en' ? /10\.23/ : /10,23/); assert.match(label, locale === 'en' ? /17\.90/ : /17,90/); assert.match(label, /€/); assert.match(label, /процедура/)
  assert.doesNotMatch(label, /BGN|лв/)
  assert.equal(range.price, 20); assert.equal(range.currency, 'BGN'); assert.equal(range.price_details.maximum, 35)
  assert.equal(profileUi.profileServicePrice(fee({ price_details: { kind: 'range', maximum: 1 } }), locale), locale === 'en' ? 'Ask the business' : 'Уточни с бизнеса')
  const menu = guidedServiceMenu(business([from, range]), locale)
  assert.equal(menu[0].priceLabel, profileUi.profileServicePrice(from, locale))
  assert.equal(menu[1].priceLabel, label)
})

const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const source = await readFile(new URL('../components/business-directory.js', import.meta.url), 'utf8')
const { code } = await transform(source, { filename: 'components/business-directory.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const Empty = () => null, module = { exports: {} }
new Function('require', 'module', 'exports', code)(name => {
  const imports = {
    './booking-button-content': bookingButtonContent,
    react: React, 'next/link': { __esModule: true, default: ({ children }) => React.createElement('span', null, children) },
    './icon': { Icon: Empty }, './directory-filters': { DirectoryFilters: Empty }, './business-photo-gallery': { BusinessPhotoGallery: Empty },
    './business-cover-photo': { BusinessCoverPhoto: Empty }, './service-thumbnail': { ServiceThumbnail: Empty }, './partner-categories': { PartnerCategories: Empty },
    './outbound-booking-button': { OutboundBookingButton: () => assert.fail('No outgoing action in preview') },
    '../hooks/use-directory': { useDirectory: (_, data) => data }, '../lib/public-locale.mjs': publicLocale,
    '../lib/directory.mjs': directoryData, '../lib/partner-categories.mjs': partnerCategories, '../lib/booking-mode.mjs': bookingMode,
    '../lib/business-profile-ui.mjs': profileUi, '../lib/product-events-client': { trackProductEvent: () => assert.fail('No booking event in SSR') },
  }
  return Object.hasOwn(imports, name) ? imports[name] : (name === './brand-loading' ? brandLoading : require(name))
}, module, module.exports)

for (const locale of ['bg', 'en']) test(`${locale}: actual directory component uses complete stored price labels instead of hardcoding fixed scalar amounts`, () => {
  const services = [fee({ price: 0 }), fee({ price_details: { kind: 'from' } }), fee({ currency: 'BGN', price_details: { kind: 'range', maximum: 35, unit: 'процедура' } })]
  const html = renderToStaticMarkup(React.createElement(module.exports.BusinessDirectory, { locale, data: { status: 'ready', businesses: [business(services)] }, showFilters: false, bookingDisabled: true }))
  const text = html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&')
  for (const service of services) assert.ok(text.includes(profileUi.profileServicePrice(service, locale)), service.name)
  assert.doesNotMatch(html, /<a\b|<form\b|type="submit"/)
})
