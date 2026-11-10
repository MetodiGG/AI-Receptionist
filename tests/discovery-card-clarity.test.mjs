import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { railCategory, railBusinessCategory, railServiceDescription, railExternalAction } from '../lib/discovery/rail.mjs'
import { normalizeInternalBusinesses } from '../lib/discovery/internal-search.mjs'
import { googleSearchRequest } from '../lib/discovery/google-places.mjs'
import { homeCategories } from '../lib/discovery/home.mjs'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const partner = patch => ({ source: 'gorez', industry: 'beauty', name: 'Real-name-independent fixture', category: 'hair', services: [], ...patch })

test('barber identity survives a hair-search category without hardcoded tenant names', () => {
  const row = partner({ name: 'Example Barber', services: [{ name: 'Оформяне на брада' }] })
  assert.equal(railBusinessCategory(row), 'barber')
  assert.equal(railCategory(row), 'Бръснарница')
  assert.equal(railCategory(row, 'en'), 'Barbers')
  assert.equal(railCategory(partner({ services: [{ name: 'Дамско подстригване' }] })), 'Фризьор')
  assert.equal(railCategory({ source: 'google', category: 'hair', primaryType: 'barber_shop' }), 'Бръснарница')
  assert.equal(homeCategories('bg').find(row => row.id === 'barber').label, 'Бръснар')
})
test('the Bulgarian barber display label keeps the precise existing nearby-search type', () => {
  const request = googleSearchRequest({ category: 'barber', service: 'бръснарница', coordinates: { latitude: 42.66, longitude: 23.28 }, radiusKm: 2 })
  assert.equal(request.method, 'nearby')
  assert.deepEqual(request.body.includedTypes, ['barber_shop'])
})
test('nail services appear as Manicure, pedicure only when the public services actually support both', () => {
  const row = partner({ category: 'nails', services: [{ name: 'Маникюр' }, { name: 'Педикюр' }] })
  assert.equal(railCategory(row), 'Маникюр, педикюр')
  assert.equal(railCategory(row, 'en'), 'Manicure, pedicure')
  assert.equal(railCategory({ ...row, services: [{ name: 'Педикюр' }] }), 'Педикюр')
  assert.equal(railCategory({ ...row, services: [{ name: 'Маникюр' }, { name: 'Педикюр', active: false }] }), 'Маникюр')
  assert.equal(railServiceDescription(row), 'Педикюр')
})
test('consulting specialty and concise details use first-party service evidence, not guesses from a name', () => {
  const row = partner({ category: 'consulting', industry: 'consulting', services: [{ name: 'Счетоводна консултация за фирми' }, { name: '  Годишен отчет  ' }, { name: 'Годишен отчет' }, { name: 'Скрита услуга', active: false }] })
  assert.equal(railCategory(row), 'Счетоводни консултации')
  assert.equal(railCategory(row, 'en'), 'Accounting consultations')
  assert.equal(railServiceDescription(row), 'Счетоводна консултация за фирми · Годишен отчет')
  assert.equal(railCategory({ ...row, services: [{ name: 'Данъчна консултация' }] }), 'Данъчни консултации')
  assert.equal(railCategory({ ...row, name: 'Financial Expert', services: [] }), 'Консултации')
  assert.equal(railServiceDescription({ source: 'google', category: 'consulting', services: row.services }), '')
})
test('internal normalization preserves the actual business category and full public service-name evidence separately from matching slots', () => {
  const rows = normalizeInternalBusinesses([{ id: 'a', name: 'Example Barber', slug: 'example-barber', industry: 'beauty', services: [{ id: 's', name: 'Мъжко подстригване', active: true }, { id: 'b', name: 'Оформяне на брада', active: true }, { id: 'hidden', name: 'Неактивно', active: false }] }], { browse: true, category: null, requirements: [] })
  assert.equal(rows[0].businessCategory, 'barber')
  assert.deepEqual(rows[0].publicServiceNames, ['Мъжко подстригване', 'Оформяне на брада'])
})
test('reserve actions retain validated website-first/phone-fallback behavior and never invent contacts', () => {
  assert.equal(railExternalAction({ source: 'google', website: 'https://example.com/', phone: '+359000000000' }).kind, 'website')
  assert.equal(railExternalAction({ source: 'google', phone: '+359000000000' }).kind, 'phone')
  assert.equal(railExternalAction({ source: 'google' }), null)
})
test('GoRez cards do not stretch to a tall provider chunk or push actions to its far bottom', async () => {
  const css = await read('app/discovery-home.css')
  assert.match(css, /\.home-businesses \.home-discovery-rail \{ align-items: flex-start;/)
  assert.match(css, /\.home-business-card \{[^}]*height: auto;/)
  assert.match(css, /\.home-business-actions \{[^}]*margin-top: 0; padding-top: 8px;/)
  assert.doesNotMatch(css, /\.home-business-reviews \{[^}]*min-height:/)
  const card = await read('components/discovery-business-card.js')
  assert.ok(card.indexOf('className="home-business-category"') < card.indexOf('<PartnerRailReviews'))
  assert.ok(card.indexOf('className="home-business-services"') < card.indexOf('<PartnerRailReviews'))
  assert.match(card, /const reserve = copy.reserveAppointment/)
  assert.doesNotMatch(card, /Visit website|Виж сайта/)
  assert.match(card, /онлайн резервацията не е потвърдена/)
})
test('native Google compact styling uses documented controls, without rewriting fixed labels or scraping content', async () => {
  const kit = await read('components/google-discovery-list.js'), css = await read('app/discovery-home.css')
  assert.match(kit, /setAttribute\('truncation-preferred', ''\)/)
  assert.match(css, /--gmp-mat-color-secondary-container: #ffb067/)
  assert.match(css, /--gmp-mat-spacing-medium: 10px/)
  assert.doesNotMatch(kit, /shadowRoot|fetchFields|innerHTML|textContent\s*=/)
  assert.match(kit, /gmp-place-attribution/)
})
test('layout regression fixture is development-only, explicitly fictional and provider-free', async () => {
  const page = await read('app/dev/business-cards/page.js')
  assert.match(page, /NODE_ENV !== 'development'\) notFound\(\)/)
  assert.match(page, /850/)
  assert.match(page, /nearby preview/)
  assert.doesNotMatch(page, /fetch\(|GoogleDiscoveryList|loadPlacesLibrary|<script/)
})
