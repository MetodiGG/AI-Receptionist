import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { catalogueRecordSchema } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBusinessDetails, businessDetailServices, businessDetailHours, currentPublishedFact, detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { normalizeInternalBusinesses } from '../lib/discovery/internal-search.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'

const now = Date.parse('2026-11-10T12:00:00Z')
const original = () => structuredClone(SOFIA_CATALOGUE.find(row => row.id === 'sofia-underground-barbershop'))
const intent = { browse: true, category: 'barber', requirements: [], searchV2: true }
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('published price/hour facts require a safe source and a current independent review', () => {
  const fact = { sourceUrl: 'https://undergroundbarber.shop/', checkedOn: '2026-11-06' }
  assert.equal(currentPublishedFact(fact, now), true)
  for (const patch of [{ checkedOn: '2026-11-11' }, { checkedOn: '2026-05-01' }, { checkedOn: '' }, { sourceUrl: 'javascript:alert(1)' }, { sourceUrl: 'https://127.0.0.1/' }]) assert.equal(currentPublishedFact({ ...fact, ...patch }, now), false)
})

test('catalogue schema rejects invented or malformed prices and hours instead of passing arbitrary payloads', () => {
  for (const price of [{ amount: -1 }, { amount: Infinity }, { currency: 'unknown' }, { sourceUrl: 'https://localhost/' }, { kind: 'estimated' }, { checkedOn: '2026-02-31' }]) {
    const row = original(); Object.assign(row.services[0].price, price)
    assert.equal(catalogueRecordSchema.safeParse(row).success, false)
  }
  for (const days of [
    [{ weekday: 1, periods: [{ open: '20:00', close: '10:00' }] }],
    [{ weekday: 1, periods: [] }, { weekday: 1, periods: [] }],
    [{ weekday: 1, periods: [{ open: '10:00', close: '12:00' }, { open: '11:00', close: '13:00' }] }],
    [{ weekday: 1, periods: [{ open: '10:00', close: '12:00' }], byAppointment: true }],
  ]) { const row = original(); row.openingHours.days = days; assert.equal(catalogueRecordSchema.safeParse(row).success, false) }
})

test('catalogue business details retain all published services, real prices and independently sourced hours', () => {
  const row = original(), details = catalogueBusinessDetails(row, now)
  assert.equal(details.services[0].price, 15)
  row.services.push({ name: 'Услуга без публикувана цена', category: 'barber', appointmentModel: 'appointment' })
  assert.equal(catalogueBusinessDetails(row, now).services.at(-1).price, null, 'an unpriced service is never free')
  assert.equal(details.services[0].priceSourceUrl, row.website)
  assert.equal(details.hours.length, 7)
  assert.deepEqual(details.hours.find(day => day.weekday === 1).periods, [])
  assert.deepEqual(details.hours.find(day => day.weekday === 2).periods, ['12:00–20:00'])
  row.services[0].price.checkedOn = '2026-01-01'; row.openingHours.checkedOn = '2026-01-01'
  const stale = catalogueBusinessDetails(row, now)
  assert.equal(stale.services[0].price, null); assert.deepEqual(stale.hours, [])
  delete row.openingHours
  assert.deepEqual(catalogueBusinessDetails(row, now).hours, [])
})

test('a reviewed fixed price can filter a budget but a from-price or stale price cannot promise a maximum', () => {
  const row = original(), search = { ...intent, budget: { max: 16, currency: 'EUR' } }
  // Isolate the budget assertion from subsequent genuine menu enrichment.
  for (const service of row.services.slice(1)) delete service.price
  const result = normalizeCatalogueBusinesses([row], search, { now })
  assert.equal(result.length, 1); assert.equal(result[0].services.length, 1)
  assert.equal(result[0].details.services.length, row.services.length, 'the details are not narrowed to matching budget services')
  row.services[0].price.kind = 'from'
  assert.equal(normalizeCatalogueBusinesses([row], search, { now }).length, 0)
  row.services[0].price.kind = 'fixed'; row.services[0].price.checkedOn = '2026-01-01'
  assert.equal(normalizeCatalogueBusinesses([row], search, { now }).length, 0)
})

test('partners retain their active public menu, prices and descriptions without private booking/customer fields', () => {
  const rows = normalizeInternalBusinesses([{ id: 'partner', name: 'Partner fixture', slug: 'partner', industry: 'beauty',
    services: [{ id: 'one', name: 'Мъжко подстригване', description: 'Публично описание', price: '20', currency: 'EUR', duration_min: 30 }, { id: 'off', name: 'Неактивна услуга', active: false }],
    customers: [{ email: 'private@example.org' }], appointments: [{ notes: 'Private note' }],
  }], intent)
  assert.equal(rows.length, 1)
  assert.deepEqual(businessDetailServices(rows[0]).map(row => [row.name, row.price, row.durationMin]), [['Мъжко подстригване', 20, 30]])
  assert.doesNotMatch(JSON.stringify(rows[0].details), /private@example|Private note|customers|appointments/)
  assert.deepEqual(businessDetailHours(rows[0]), [], 'no staff schedule must not mean closed all week')
})

test('partial published hours do not invent missing weekdays and by-appointment is not a closed day', () => {
  const gtp = SOFIA_CATALOGUE.find(row => row.id === 'sofia-gtp-prezident-lincoln')
  const hours = businessDetailHours({ details: catalogueBusinessDetails(gtp, now) })
  assert.equal(hours.length, 6); assert.ok(!hours.some(day => day.weekday === 7))
  const beauty = SOFIA_CATALOGUE.find(row => row.id === 'sofia-beauty-studio-99')
  const saturday = businessDetailHours({ details: catalogueBusinessDetails(beauty, now) }).find(day => day.weekday === 6)
  assert.equal(saturday.byAppointment, true)
})

test('service display omits hidden services and unknown prices, formats actual euro prices in BG/EN', () => {
  const services = businessDetailServices({ services: [{ name: 'One', price: 0, currency: 'EUR' }, { name: 'Two', price: null }, { name: 'Hidden', active: false }, { name: 'Bad', price: -2 }] })
  assert.equal(services.length, 3); assert.equal(services[1].price, null); assert.equal(services[2].price, null)
  assert.match(detailPriceLabel(services[0]), /0,00/)
  assert.equal(detailPriceLabel(services[1]), null)
  assert.match(detailPriceLabel({ price: 56, priceKind: 'from', currency: 'EUR' }), /^от 56,00/)
  assert.match(detailPriceLabel({ price: 56, priceKind: 'from', currency: 'EUR' }, 'en'), /^from €56\.00/)
})

test('details are lazy-loaded, keyboard-accessible and local; exact address moves out of the compact cards', async () => {
  const card = await read('components/discovery-business-card.js'), dialog = await read('components/discovery-business-details.js')
  assert.match(card, /dynamic\(\(\) => import\('\.\/discovery-business-details'\)/)
  assert.match(card, /detailsOpen && <DiscoveryBusinessDetails/)
  assert.match(card, /aria-haspopup="dialog"/); assert.doesNotMatch(card, /home-business-address/)
  for (const required of ['showModal()', 'containDialogTab', 'aria-labelledby', 'onCancel=', 'trigger?.focus()', 'document.body.style.overflow = overflow', 'business.address && <section', 'services.map', 'hours.map']) assert.ok(dialog.includes(required), required)
  assert.match(dialog, /\/api\/public\/discovery\/business\//)
  assert.doesNotMatch(dialog, /dangerouslySetInnerHTML|innerHTML|GoogleDiscoveryList/)
  const css = await read('app/discovery-home.css')
  assert.match(css, /\.discovery-business-details \{[^}]*max-height: 88svh;[^}]*overflow-y: auto/)
  assert.match(css, /\.business-details-services li \{[^}]*gap: 16px/)
  assert.match(css, /\.discovery-business-details \.home-maps-label \{ min-width: 0; white-space: normal/)
})
