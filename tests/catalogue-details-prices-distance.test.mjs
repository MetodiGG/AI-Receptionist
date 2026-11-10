import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { CATALOGUE_DETAILS_V3, enrichCatalogueDetailsV3 } from '../lib/discovery/catalogue-data/details-enrichment-v3.mjs'
import { createServiceEvidenceMatcher, identifySearchService } from '../lib/discovery/service-lexicon.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { catalogueBusinessDetails, businessDetailServices, detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { distanceBadge, discoveryDistanceOrigin } from '../lib/discovery/distance-origin.mjs'

const now = DateTime.fromISO('2026-11-06T12:00:00Z'), clock = now.toMillis()
const byId = id => SOFIA_CATALOGUE.find(row => row.id === id)
const intent = (query, patch = {}) => ({ ...parseIntent(discoveryRequestSchema.parse({ query, cityCode: '68134', ...patch }), now, { v2: true }), searchV2: true })
const search = (query, patch) => normalizeCatalogueBusinesses(SOFIA_CATALOGUE, intent(query, patch), { now: clock })
const source = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('every new first-party price identifies its actual service, currency, date and source', () => {
  assert.equal(new Set(CATALOGUE_DETAILS_V3.map(row => row.id)).size, CATALOGUE_DETAILS_V3.length)
  for (const update of CATALOGUE_DETAILS_V3) {
    const row = byId(update.id)
    assert.ok(row, update.id)
    for (const service of update.services || []) {
      const price = service.price
      if (!price) continue
      assert.equal(price.currency, 'EUR')
      assert.equal(price.checkedOn, '2026-11-06')
      assert.match(price.sourceUrl, /^https:\/\//)
      assert.ok(Number.isFinite(price.amount) && price.amount >= 0)
      assert.ok(row.services.some(item => item.name === service.name && item.price?.amount === price.amount))
    }
  }
  assert.throws(() => enrichCatalogueDetailsV3([]), /Invalid first-party/)
})

test('car-wash prices distinguish vehicle types, per-seat costs and from prices, not self-service bays', () => {
  const zone = byId('sofia-zona-wash'), motor = byId('sofia-motorista-carwash'), wash = byId('sofia-wash-go-detailing')
  assert.equal(zone.services.find(row => /Комплексно.*лек автомобил/u.test(row.name)).price.amount, 25)
  assert.equal(zone.services.find(row => /Комплексно.*джип/u.test(row.name)).price.amount, 28)
  const seat = zone.services.find(row => /една.*седалка/u.test(row.name))
  assert.equal(seat.price.amount, 25); assert.match(seat.description, /една седалка, не за целия/)
  assert.ok(zone.services.every(row => !/самообслужване/u.test(row.name)))
  assert.equal(zone.booking.kind, 'form')
  assert.equal(new URL(zone.booking.url).hostname, 'book.timify.com')
  assert.equal(new URL(zone.booking.url).searchParams.get('accountId'), '65d0b03e97be140dc74e5ddd')
  const basic = motor.services.find(row => /Комплексно/u.test(row.name))
  assert.equal(basic.price.amount, 30); assert.match(basic.description, /седан или хечбек/)
  const upholstery = motor.services.find(row => /целия салон/u.test(row.name))
  assert.equal(upholstery.price.kind, 'from'); assert.match(upholstery.description, /200–340/)
  assert.equal(wash.services.find(row => /Basic/u.test(row.name)).price.kind, 'from')
  assert.equal(wash.openingHours, undefined, '00:00–00:00 is not proof of 24/7')
  const matches = search('автомивка')
  for (const row of [zone, motor, wash]) assert.ok(matches.some(item => item.id === row.id), row.id)
})

test('Abi branch-specific services keep the source conditions and do not become universal salon prices', () => {
  for (const branch of ['serdika', 'lozenets', 'druzhba-1', 'druzhba-2']) {
    const row = byId(`sofia-abi-beauty-${branch}`)
    assert.equal(row.services.find(service => service.name === 'Маникюр с гел лак').price.amount, 24.99)
    if (branch === 'serdika') assert.ok(row.services.every(service => !/педикюр/iu.test(service.name)))
    else assert.equal(row.services.find(service => service.name === 'Педикюр с гел лак').price.amount, 39.99)
    const hair = row.services.filter(service => service.category === 'hair')
    assert.equal(hair.length > 0, ['lozenets', 'druzhba-1'].includes(branch))
    assert.equal(row.openingHours.days.length, 7)
  }
  for (const branch of ['nadezhda', 'bul-bulgaria']) assert.ok(byId(`sofia-abi-beauty-${branch}`).services.every(service => service.category === 'beauty'))
  const laser = byId('sofia-abi-beauty-lozenets').services.find(service => service.price?.amount === 105)
  assert.match(laser.name, /цяло тяло.*жени/u)
  assert.match(laser.description, /Една процедура при онлайн резервация/)
  assert.equal(byId('sofia-abi-beauty-lozenets').services.find(service => service.name === 'Лазерно обезкосмяване').price, undefined)
})

test('monthly martial-arts passes and first trials are not misrepresented as ordinary single-session prices', () => {
  const bastet = byId('sofia-bastet-kickboxing')
  assert.equal(bastet.services.find(service => service.appointmentModel === 'individual_training').price.amount, 15.34)
  const monthly = bastet.services.find(service => service.price?.amount === 30.68)
  assert.match(monthly.name, /Месечна карта/u)
  assert.match(monthly.description, /не единично посещение/)
  const tsanev = byId('sofia-tsanev-manastirski').services[0]
  assert.equal(tsanev.price.amount, 0)
  assert.match(tsanev.description, /Само първата пробна/)
})

test('Marry lists published styling services and hours but never its 50 euro deposit as a service price', () => {
  for (const branch of ['moskovska', 'kuklata']) {
    const row = byId(`sofia-beauty-studio-marry-${branch}`)
    assert.ok(row.services.length >= 5)
    assert.ok(row.services.every(service => !service.price))
    assert.ok(row.services.some(service => /плитки/u.test(service.name)))
    assert.equal(row.openingHours.days.length, 6)
  }
})

test('generic Bulgarian and English martial-arts queries find real reserved disciplines, not yoga or gym entry', () => {
  for (const query of ['бойни изкуства', 'бойна зала', 'martial arts', 'combat sports']) {
    assert.equal(identifySearchService(query)?.category, 'fitness', query)
    const matches = search(query)
    assert.ok(matches.length >= 17, `${query}: ${matches.length}`)
    assert.ok(matches.every(row => row.services.every(service => /бокс|карате|джу джицу|таекуондо|джудо|кунг\s*фу/iu.test(service.name))))
    assert.ok(!matches.some(row => /pilates|йога|тенис|падел/iu.test(row.name)))
  }
  const matcher = createServiceEvidenceMatcher('бойни изкуства')
  for (const text of ['Пилатес', 'Достъп до фитнес', 'Йога', 'Спортни занимания']) assert.equal(matcher(text), false, text)
  for (const text of ['Индивидуален бокс', 'Карате за деца', 'Brazilian jiu jitsu', 'ММА']) assert.equal(matcher(text), true, text)
  assert.equal(createServiceEvidenceMatcher('бокс')('Карате'), false)
  assert.equal(createServiceEvidenceMatcher('бойни изкуства за деца')('Бокс за възрастни'), false)
})

test('owner-published points expose Twisted gyms in nearby searches without a runtime geocoder', () => {
  for (const branch of ['hladilnika', 'slatina']) {
    const row = byId(`sofia-twisted-${branch}`)
    assert.equal(row.coordinates.method, 'first_party_coordinates')
    assert.equal(row.coordinates.source, 'https://twistedjiujitsu.com/contact/?lang=en')
    const near = search('джу джицу', { cityCode: undefined, coordinates: { latitude: row.coordinates.latitude, longitude: row.coordinates.longitude, consent: true } })
    assert.ok(near.some(item => item.id === row.id))
    assert.match(distanceBadge(discoveryDistanceOrigin({ cityCode: '68134' }), row.coordinates).value, /\d.*km/)
  }
})

test('the approved-cache hospital point makes the reservable LUX wash visible near Manastirski Livadi', () => {
  const near = search('автомивка', { cityCode: undefined, coordinates: { latitude: 42.67, longitude: 23.29, consent: true } })
  const lux = near.find(row => row.id === 'sofia-lux-mbal-sveta-sofia-carwash')
  assert.ok(lux)
  assert.equal(lux.services.find(service => /Комплексно/u.test(service.name)).price, 20)
  assert.equal(lux.coordinateAttribution.label, '© OpenStreetMap contributors')
  assert.ok(near.every(row => row.coordinates), 'unlocated washes do not become 0 km')
})

test('reviewed service details retain linked exact prices and expire without a paid fallback', () => {
  const row = byId('sofia-motorista-carwash')
  const details = catalogueBusinessDetails(row, clock)
  const services = businessDetailServices({ details })
  assert.ok(services.every(service => service.priceSourceUrl === 'https://www.motorista.bg/avtomivka/leki-avtomobili'))
  assert.match(detailPriceLabel(services.find(service => service.priceKind === 'from')), /^от 200,00/u)
  const expired = catalogueBusinessDetails(row, Date.parse('2027-02-06T12:00:00Z'))
  assert.ok(expired.services.every(service => service.price == null))
})

test('a discreet photo label and whole-card trigger open the accessible lazy dialog without a third bottom button', async () => {
  const card = await source('components/discovery-business-card.js'), css = await source('app/discovery-home.css')
  assert.match(card, /home-business-details-label/)
  assert.match(card, /className="home-business-open" onClick=\{openDetails\} aria-haspopup="dialog"/)
  assert.doesNotMatch(card, /home-business-details-link/)
  assert.match(card, /dynamic\(\(\) => import\('\.\/discovery-business-details'\)/)
  assert.match(css, /\[data-uniform-cards="true"\] \.home-business-footer \{ margin-top: auto;/)
  assert.match(css, /\.home-business-open \{[^}]*inset: 0/)
  assert.match(css, /\.home-business-open:focus-visible/)
  assert.ok(card.indexOf('className="home-business-services"') < card.indexOf('<PartnerRailReviews'))
  const dialog = await source('components/discovery-business-details.js')
  assert.match(dialog, /trigger\?\.focus\(\)/)
  assert.match(dialog, /business.address && <section/)
})
