import test from 'node:test'
import assert from 'node:assert/strict'
import auto005 from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-005-20261113.mjs'
import auto006 from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-006-20261113.mjs'
import beauty006 from '../lib/discovery/catalogue-data/neighborhood-beauty-2000-006-20261113.mjs'
import dental003 from '../lib/discovery/catalogue-data/neighborhood-dental-2000-003-20261113.mjs'
import home008 from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-008-20261113.mjs'
import identities from '../lib/discovery/catalogue-data/neighborhood-reviewed-identities-20261113.json' with { type: 'json' }
import points from '../public/catalogue-official-address-points-2000-20261113.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { reportBusinessType } from '../scripts/catalogue-expansion-report.mjs'
import { DateTime } from 'luxon'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { discoverySearchInput } from '../lib/discovery/search-ui.mjs'

const now = Date.parse('2026-11-13T23:45:00Z')
const sources = [auto005, auto006, beauty006, dental003, home008].flatMap(batch => batch.records)
const row = id => SOFIA_CATALOGUE.find(item => item.id === id)
const photo = (business, index = 0) => serviceThumbnail({ ...business.services[index], ...catalogueServicePhotoFields(business.services[index], business) }, { business })

test('forty-one independent businesses retain fifty-eight actual services, receipt identities and exact activity photos', () => {
  assert.equal(sources.length, 41)
  assert.equal(new Set(sources.map(item => item.id)).size, 41)
  assert.equal(sources.flatMap(item => item.services).length, 58)
  for (const source of sources) {
    const business = row(source.id)
    assert.ok(approvedCatalogueRecord(business, now), source.id)
    assert.equal(assessPricingReview(business, reviews.find(item => item.id === business.id), now).state, business.services.some(service => service.price) ? 'reviewed' : 'service_reviewed', business.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: business.name.slice(0, 120), cityCode: '68134' }, { now }).some(item => item.id === business.id), business.id)
    const draft = catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now })
    assert.deepEqual(draft.services.map(service => service.name), business.services.map(service => service.name))
    business.services.forEach((service, index) => {
      assert.equal(draft.services[index].price, service.price ? String(service.price.amount) : '', business.id)
      if (service.price) assert.equal(draft.services[index].currency, service.price.currency)
      const image = photo(business, index)
      assert.equal(image.type, 'photo', business.id)
      assert.ok(['exact', 'activity'].includes(image.photoMatch), `${business.id}: ${service.name}`)
      assert.ok(!image.src.includes('appointment-workspace'), business.id)
    })
  }
})

test('package totals, private couple fees and branch-specific group fees are not flattened', () => {
  const tango = row('sofia-andtango-borovo-rodopski-izvor45b').services[0]
  assert.equal(tango.price.amount, 60)
  assert.match(tango.name, /8 посещения/)
  assert.equal(tango.durationMin, undefined)
  const salsa = row('sofia-ritmo-studentski-yordan-yosifov8b').services[0]
  assert.equal(salsa.price.amount, 32)
  assert.match(salsa.name, /до двама/)
  assert.equal(row('sofia-dance-academy-bulgaria73').services[0].price.amount, 50)
  assert.equal(row('sofia-swingin-monkeys-20ti-april13').services[0].price.amount, 9)
  assert.equal(row('sofia-swingin-monkeys-osogovo2').services[0].price.amount, 8)
  assert.match(photo(row('sofia-salsa-diva-europa-liditse1')).src, /sx-group-salsa-bachata-combined-v1\.webp$/)
  assert.match(photo(row('sofia-swingin-monkeys-20ti-april13')).src, /sx-group-solo-jazz-v1\.webp$/)
  assert.match(photo(row('sofia-swingin-monkeys-osogovo2')).src, /sx-group-boogie-woogie-v1\.webp$/)
  assert.equal(row('sofia-ot-izvora-armenski-todor-aleksandrov31').services[0].price, undefined)
  assert.equal(row('sofia-vitosha-auto-tsarigradsko166').services[0].price, undefined)
  assert.equal(row('sofia-ot-izvora-voenna-han-omurtag42').coordinates, null, 'large courtyard does not identify the actual sports building')
})

test('tiny-dog coats, female brows and child dental appointments keep distinct photos and literal fees', () => {
  const dog = row('sofia-studio-pompon-nartsis3')
  assert.deepEqual(dog.services.map(service => service.price.amount), [80, 90, 95])
  assert.ok(dog.services.every(service => service.price.currency === 'BGN' && /до 4 кг/.test(service.name)))
  for (const [index, id] of ['sx-groom-small-shortcoat', 'sx-groom-small-flowing-coat', 'sx-groom-small-double-coat'].entries()) assert.match(photo(dog, index).src, new RegExp(id + '-v1\\.webp$'))
  const newVision = row('sofia-new-vision-sveta-troitsa367a')
  assert.equal(newVision.services[1].durationMin, undefined, '50–60 minute interval is not a scalar')
  assert.match(photo(newVision, 1).src, /sx-brow-lamination-only-v1\.webp$/)
  assert.match(photo(row('sofia-beauty-cultura-trakia17'), 2).src, /sx-brow-tint-only-v1\.webp$/)
  const dental = row('sofia-yovadent-shumen5')
  assert.deepEqual(dental.services.map(service => service.price.amount), [50, 40])
  assert.match(photo(dental).src, /sx-dental-child-first-visit-v1\.webp$/)
  assert.match(photo(dental, 1).src, /sx-dental-sealant-v1\.webp$/)
  assert.equal(reportBusinessType(dental), 'Стоматология')
})

test('psychologists use the psychology reporting type, not the massage filter, and free legal offers remain limited', () => {
  const psychologists = home008.records.filter(item => /paneva|gidikova|filipova/.test(item.id))
  assert.equal(psychologists.length, 3)
  for (const source of psychologists) {
    const business = row(source.id)
    assert.equal(business.category, 'other')
    assert.equal(business.services[0].category, 'other')
    assert.equal(reportBusinessType(business), 'Психология и психотерапия')
    assert.equal(business.services[0].price, undefined)
  }
  const free = home008.records.filter(item => item.services[0].price?.amount === 0)
  assert.deepEqual(free.map(item => item.id).sort(), ['sofia-tfb-city-tower-makedonia', 'sofia-zdravkov-legal-pozitano3'])
  assert.equal(row('sofia-galina-chankova-tri-ushi1').services[0].price, undefined, 'normative amounts are not this firm tariff')
  assert.equal(row('sofia-ies-pozitano3-office10').services[0].price, undefined, 'conditional campaigns are not a blanket free office visit')
  assert.equal(row('sofia-tfb-city-tower-makedonia').coordinates, null)
  assert.equal(row('sofia-colomba-home-cleaning').locationKind, 'service_area')
  assert.equal(row('sofia-colomba-home-cleaning').address, null)
})

test('Classic M literal owner GPS is bound to the actual Dimitar Dobrev address and fails closed after address edits', () => {
  const business = row('sofia-balet-classic-m-dimitar-dobrev8a')
  assert.deepEqual([business.coordinates.latitude, business.coordinates.longitude], [42.649434, 23.347886])
  assert.match(business.coordinates.sourceAddress, /Димитър Добрев 8/)
  assert.equal(business.coordinates.method, 'first_party_coordinates')
  assert.equal(catalogueBoundCoordinates({ ...business, address: business.address + 'Б' }), null)
})

test('unpublished restricted-provider holds are absent from catalogue, onboarding, reviews, identities and postal subset', () => {
  for (const id of ['sofia-hair-garden-sladura7', 'sofia-sense-wellness-tsar-osvoboditel16',
    'sofia-artista-visarion-belinski', 'sofia-mens-cave-kipriyan44',
    'sofia-newlook-parchevich22a', 'sofia-sibova-nails-cherni-vrah75']) {
    assert.equal(row(id), undefined)
    assert.equal(identities[id], undefined)
    assert.ok(!reviews.some(item => item.id === id))
    assert.ok(!points.points.some(item => item.id === id))
    assert.equal(catalogueOnboardingDetail(SOFIA_CATALOGUE, id, { now }), null)
  }
  assert.ok(row('sofia-padmalaya-sedmochislenitsi9'), 'independent owner phone/tariff evidence remains valid')
})

test('an exact brand containing Sofia and Borovo resolves its identity without overriding explicit filters', async () => {
  const business = row('sofia-andtango-borovo-rodopski-izvor45b')
  const forbidden = () => assert.fail('No provider, booking, geocoder or paid lookup')
  const deps = { now: DateTime.fromMillis(now), config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }),
    readInternal: async () => [], readCatalogue: async () => SOFIA_CATALOGUE,
    fetcher: forbidden, claimBudget: forbidden, getBusiness: forbidden, getSlots: forbidden }
  const ui = discoverySearchInput({ query: business.name })
  const result = await discoverBusinesses(ui, deps)
  assert.equal(result.clarification, null)
  assert.ok(result.results.some(item => item.id === business.id))
  for (const filter of [{ cityCode: '56784' }, { cityCode: '68134', category: 'pets' },
    { cityCode: '68134', neighborhood: 'Люлин' },
    { coordinates: { latitude: 42.67, longitude: 23.45, consent: true }, radiusKm: 1 }]) {
    assert.ok(!(await discoverBusinesses({ query: business.name, ...filter }, deps)).results.some(item => item.id === business.id))
  }
  const ambiguous = await discoverBusinesses({ query: business.name + ' Пловдив', category: 'fitness' }, deps)
  assert.equal(ambiguous.clarification?.field, 'city', 'extra location words are not an exact public name')
  const noCity = await discoverBusinesses({ query: 'Old School Barber Shop' }, deps)
  assert.equal(noCity.clarification?.field, 'city', 'a name without any city still asks for location')
})
