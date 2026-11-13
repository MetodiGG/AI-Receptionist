import test from 'node:test'
import assert from 'node:assert/strict'
import approvedLocations from '../public/catalogue-official-address-points-20261113.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261111_RECORDS as sourceRecords, NEIGHBORHOOD_20261111_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261111.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../lib/discovery/official-sofia-address-source.mjs'

const now = Date.parse('2026-11-11T12:00:00Z')
const get = id => {
  const row = SOFIA_CATALOGUE.find(row => row.id === id)
  assert.ok(row, id)
  return row
}
const amounts = row => row.services.map(service => service.price?.amount)
const sources = new Map(sourceRecords.map(row => [row.id, row]))
const approvedPoints = new Map(approvedLocations.points.map(row => [row.id, row]))
const officialRns = Object.freeze({
  'sofia-royalbarbershop-nikolayhaytov18': '118166',
  'sofia-sassy-faces-siyana-bigla64': '96806',
  'sofia-lstyle-beauty-belitebrezi43': '19263',
  'sofia-osanna-relax-sheynovo': '41457',
  'sofia-float-zone-doyran': '20915',
  'sofia-autokings-ekaterina-nencheva': '114931',
})
const assertReviewedCoordinates = row => {
  const original = sources.get(row.id), expected = approvedPoints.get(row.id), rn = officialRns[row.id]
  assert.ok(original, row.id)
  assert.equal(original.coordinates, null, 'raw owner records must not acquire inferred points')
  assert.equal(Boolean(expected), rn !== undefined, 'only the explicitly reviewed batch subset may become located')
  if (rn === undefined) assert.equal(row.coordinates, null, row.id)
  else {
    assert.deepEqual(row.coordinates, expected.coordinates, row.id)
    assert.equal(expected.officialAddress.rn, rn, row.id)
    assert.deepEqual(row.coordinates, { ...expected.coordinates, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
      sourceAddress: row.address, sourceCityCode: row.cityCode, sourceNeighborhood: row.neighborhood, sourceWebsite: row.website,
      addressId: rn, checkedOn: '2026-11-13', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION }, row.id)
    assert.equal(expected.previousCoordinates, null, row.id)
  }
  assert.deepEqual(row.services, original.services, 'location review must not change literal service or price facts')
  assert.deepEqual(row.booking, original.booking, 'location review must not change booking destinations')
}
const cohort = [
  'sofia-studio617-vrabnitsa-zlatenklas27', 'sofia-royalbarbershop-nikolayhaytov18',
  'sofia-djotex-home-appliance-service', 'sofia-sosuslugite-home-appliance-diagnostic',
  'sofia-domserviz-home-appliance-diagnostic', 'sofia-sassy-faces-siyana-bigla64',
  'sofia-lstyle-beauty-belitebrezi43', 'sofia-naura-beauty-dragalevtsi',
  'sofia-grimior-mobile-makeup', 'sofia-osanna-relax-sheynovo',
  'sofia-kristor-massage-lom', 'sofia-massage-corner-srebarna',
  'sofia-jenshen-mladost3', 'sofia-yoni-wellness-yavorov',
  'sofia-float-zone-doyran', 'sofia-topdiagnostika-mobile',
  'sofia-autokings-ekaterina-nencheva',
]

test('batch301 adds17 unique independently reviewed operators and49 literal fee facts', () => {
  const rows = cohort.map(get)
  assert.equal(new Set(rows.map(row => row.id)).size, 17)
  assert.equal(new Set(rows.map(row => new URL(row.website).hostname.replace(/^www\./, ''))).size, 17)
  assert.equal(rows.reduce((n, row) => n + row.services.length, 0), 49)
  assert.deepEqual(cohort.filter(id => approvedPoints.has(id)).sort(), Object.keys(officialRns).sort())
  for (const row of rows) {
    assert.ok(approvedCatalogueRecord(row, now), row.id)
    assert.equal(assessPricingReview(row, reviews.find(review => review.id === row.id), now).state, 'reviewed', row.id)
    assertReviewedCoordinates(row)
    assert.ok(row.services.every(service => service.price?.currency === 'EUR'))
    assert.equal(SOFIA_CATALOGUE.filter(item => item.id === row.id).length, 1)
  }
})

test('hair fees retain owner qualifications and barbershop eyebrows explicitly use thread', () => {
  const hair = get(cohort[0]), barber = get(cohort[1])
  assert.equal(hair.category, 'hair')
  assert.equal(hair.neighborhood, 'Връбница 2')
  assert.deepEqual(amounts(hair), [12.78, 17.9, 23.01, 12.78])
  assert.ok(hair.services.every(service => /гъстотата.*продукти/.test(service.description) && !service.durationMin))
  assert.equal(barber.category, 'barber')
  assert.deepEqual(amounts(barber), [17, 12, 12, 23, 5])
  assert.equal(barber.services.at(-1).name, 'Оформяне на вежди с конец')
  assert.ok(barber.services.every(service => service.category === 'barber'))
})

test('home repair prices distinguish parts, arrival windows, diagnostics and repair quotations', () => {
  const djotex = get(cohort[2]), sos = get(cohort[3]), dom = get(cohort[4])
  assert.deepEqual(amounts(djotex), [55, 100, 55])
  assert.equal(djotex.services[1].price.maximum, 110)
  assert.ok(djotex.services.every(service => !service.durationMin))
  assert.match(djotex.services[0].description, /части.*отделно/iu)
  assert.equal(djotex.booking.kind, 'form')
  assert.match(decodeURI(djotex.booking.url), /поръчай-онлайн/)
  assert.deepEqual(amounts(sos), [25])
  assert.match(sos.services[0].price.unit, /ориентировъчна.*приспада/)
  assert.deepEqual(amounts(dom), [35])
  assert.match(dom.services[0].description, /не за целия ремонт/)
  for (const row of [djotex, sos, dom]) {
    assert.equal(row.locationKind, 'service_area')
    assert.equal(row.address, null)
    assert.ok(row.services.every(service => service.appointmentModel === 'home_visit'))
  }
})

test('makeup keeps FROM prices, actual visit supplements and mobile reconfirmation rules', () => {
  const sassy = get(cohort[5]), mobile = get(cohort[8])
  assert.deepEqual(amounts(sassy), [50, 65, 80])
  assert.ok(sassy.services.every(service => service.price.kind === 'from' && /капаро 30/.test(service.description)))
  assert.match(sassy.services[0].description, /добавят 15.*Извън София/s)
  assert.match(sassy.services[2].description, /включено посещение.*не е включен/s)
  assert.equal(mobile.locationKind, 'service_area')
  assert.equal(mobile.address, null)
  assert.deepEqual(amounts(mobile), [200])
  assert.match(mobile.services[0].price.unit, /09–19.*\+50%/)
  assert.match(mobile.services[0].description, /2–3 дни/)
})

test('lash extensions and lamination use their real service variants and owner callback flow', () => {
  const lstyle = get(cohort[6]), naura = get(cohort[7])
  assert.deepEqual(amounts(lstyle), [46.13, 43.57, 38.44])
  assert.equal(lstyle.phone, '+359886750691')
  assert.equal(lstyle.neighborhood, 'Белите брези')
  assert.equal(lstyle.booking.kind, 'phone')
  assert.deepEqual(amounts(naura), [36, 31, 25, 35, 29])
  assert.equal(naura.booking.url, 'https://www.naura.bg/chasove')
  assert.ok(naura.services.every(service => !service.durationMin && /уточняват след заявка/.test(service.description)))
  assert.ok(naura.services.every(service => !/Black Friday|гарантира|безопасна/iu.test(service.description)))
})

test('wellness current owner fees do not become cached prices, medical promises or simulated slots', () => {
  const osanna = get(cohort[9]), kristor = get(cohort[10]), corner = get(cohort[11])
  assert.deepEqual(amounts(osanna), [35, 25, 15])
  assert.deepEqual(osanna.services.map(service => service.durationMin), [60, 40, 30])
  assert.deepEqual(amounts(kristor), [40, 70, 40])
  assert.ok(kristor.services.every(service => !service.durationMin && /около/.test(service.price.unit)))
  assert.ok(kristor.services.every(service => /регистрация/.test(service.description)))
  assert.deepEqual(corner.services.map(service => [service.durationMin, service.price.amount]), [[60, 55], [60, 65], [30, 40]])
  assert.deepEqual(amounts(get(cohort[12])), [35, 45, 55, 70])
  assert.deepEqual(amounts(get(cohort[13])), [50, 65])
  assert.deepEqual(amounts(get(cohort[14])), [45, 30, 30, 64])
  assert.equal(SOFIA_CATALOGUE.some(row => row.id === 'sofia-mts-milena-tsvetkova-krasna-polyana'), false)
})

test('automotive prices retain mandatory visit surcharges and actual Sofia branch binding', () => {
  const mobile = get(cohort[15]), shop = get(cohort[16])
  assert.deepEqual(amounts(mobile), [60, 100])
  assert.equal(mobile.services[1].price.maximum, 120)
  assert.ok(mobile.services.every(service => /20 €/.test(service.price.unit) && /20 €/.test(service.description)))
  assert.equal(mobile.locationKind, 'service_area')
  assert.equal(mobile.address, null)
  assert.deepEqual(amounts(shop), [80, 50])
  assert.match(shop.address, /Екатерина Ненчева 1а/)
  assert.equal(shop.booking.phone, '+359883355541')
  assert.equal(SOFIA_CATALOGUE.filter(row => row.website === shop.website).length, 1)
})
