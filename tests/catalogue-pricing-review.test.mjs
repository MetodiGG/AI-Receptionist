import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { pricingIdentity, assessPricingReview, auditCataloguePricing } from '../lib/discovery/catalogue-pricing-review.mjs'
import report from '../docs/catalogue-pricing/booking-flow-audit-20261110.json' with { type: 'json' }
import { NEIGHBORHOOD_20261111_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261111.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { COVERAGE_20261116_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-coverage-20261116.mjs'
import { SUHODOL_20261122_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-suhodol-20261122.mjs'
import { INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-intake-20261123.mjs'
import { AUTO_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-auto-intake-20261123.mjs'
import { VERIFIED_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-intake-20261123.mjs'
import { EDUCATION_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-education-intake-20261123.mjs'
import { GALILEODENT_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-galileodent-intake-20261123.mjs'
import { VM_AUTO_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-vm-auto-intake-20261123.mjs'
import { SPORT_EDUCATION_GAP_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-sport-education-gap-20261123.mjs'
import { DOICHINOVA_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-doichinova-intake-20261123.mjs'
import { DBROS_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-dbros-intake-20261123.mjs'
import { PRIORITY_DENTAL_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-dental-20261123.mjs'
const now = Date.parse('2026-11-11T12:00:00Z')
const record = () => structuredClone(SOFIA_CATALOGUE.find(row => row.id === 'sofia-cut-n-chill'))
const review = () => structuredClone(BOOKING_PRICE_REVIEWS.find(row => row.id === 'sofia-cut-n-chill'))

test('new catalogue listings require an actual dated booking-flow and published-price review', () => {
  const row = record()
  assert.equal(assessPricingReview(row, null, now).state, 'pending')
  assert.equal(assessPricingReview(row, review(), now).state, 'reviewed')
  assert.equal(auditCataloguePricing([row], [], [], now).blocking.length, 1)
  assert.equal(auditCataloguePricing([row], [], [review()], now).blocking.length, 0)
})

test('a changed website or booking destination invalidates a legacy exception and its review', () => {
  const row = record(), baseline = [{ id: row.id, identity: pricingIdentity(row) }]
  assert.equal(auditCataloguePricing([row], baseline, [], now).blocking.length, 0)
  row.booking.url = 'https://other-provider.example.com/book'
  assert.equal(auditCataloguePricing([row], baseline, [], now).blocking.length, 1)
  assert.equal(assessPricingReview(row, review(), now).reason, 'business_or_booking_target_changed')
})

test('adding or changing services also requires review rather than inheriting a legacy exception', () => {
  const row = record(), baseline = [{ id: row.id, identity: pricingIdentity(row) }]
  row.services.push({ name: 'Нова услуга без проверена цена', category: 'barber', appointmentModel: 'appointment' })
  assert.equal(auditCataloguePricing([row], baseline, [], now).blocking.length, 1)
  assert.equal(auditCataloguePricing([row], baseline, [], now).records[0].legacy, false)
  assert.equal(auditCataloguePricing([row], baseline, [review()], now).blocking.length, 1)
  assert.equal(assessPricingReview(row, review(), now).reason, 'reviewed_service_inventory_changed')
})

test('crawler signals, a blocked provider or homepage-only review never count as complete', () => {
  const row = record(), receipt = review()
  receipt.bookingReview = 'provider_menu_not_rendered'
  assert.equal(assessPricingReview(row, receipt, now).state, 'pending')
  receipt.bookingReview = 'owned_booking_reviewed'; receipt.reviewedUrls = [receipt.website]
  assert.equal(assessPricingReview(row, receipt, now).reason, 'rendered_booking_flow_review_required')
})

test('expiry, future/invalid dates and missing source prices cannot pass the intake gate', () => {
  const row = record()
  for (const checkedOn of ['2026-01-01', '2027-01-01', '2026-99-99', '2026-02-30', null]) {
    assert.equal(assessPricingReview(row, { ...review(), checkedOn }, now).state, 'pending')
  }
  row.services = row.services.map(({ price, ...rest }) => rest)
  assert.equal(assessPricingReview(row, { ...review(), inventoryIdentity: pricingIdentity(row) }, now).reason, 'published_sourced_price_required')
})

test('the existing catalogue stays available and unresolved records remain explicitly pending', async () => {
  const baseline = JSON.parse(await readFile(new URL('../lib/discovery/catalogue-data/pricing-review-baseline-20261110.json', import.meta.url)))
  // This historical fixture is explicitly as of November 11. Later dated
  // additions are exercised against their own current source receipts. The
  // 43 G Point inventories revalidated on November 22 are likewise not their
  // old November 11 state; their past/fresh assessment is tested separately.
  const revalidatedGPointIds = new Set(BOOKING_PRICE_REVIEWS.filter(row =>
    row.id.startsWith('sofia-gpoint-') && row.website === 'https://gpoint.bg/' && row.checkedOn === '2026-11-22'
  ).map(row => row.id))
  assert.equal(revalidatedGPointIds.size, 43)
  const historical = SOFIA_CATALOGUE.filter(row => row.verification.checkedOn <= '2026-11-11' && !revalidatedGPointIds.has(row.id))
  const ids = new Set(historical.map(row => row.id))
  const result = auditCataloguePricing(historical, baseline, BOOKING_PRICE_REVIEWS.filter(row => ids.has(row.id)), now)
  assert.equal(result.summary.total, historical.length)
  assert.equal(result.blocking.length, 0)
  assert.ok(result.summary.pending > 0)
  assert.ok(result.records.some(row => row.hasPrices && row.state === 'pending'))
  assert.throws(() => auditCataloguePricing(SOFIA_CATALOGUE, baseline, [review(), review()], now), /duplicate/)
})

test('dated audit receipts cover every current ID without rewriting the historical source queue', () => {
  const historicalIds = new Set(report.businesses.map(row => row.id))
  assert.equal(historicalIds.size, report.businesses.length)
  const newIds = new Set(NEIGHBORHOOD_20261111_REVIEWS.map(row => row.id))
  assert.ok([...newIds].every(id => !historicalIds.has(id)))
  const latestIds = NEIGHBORHOOD_20261113_REVIEWS.map(row => row.id)
  assert.ok(latestIds.every(id => !historicalIds.has(id) && !newIds.has(id)))
  const coverageIds = COVERAGE_20261116_REVIEWS.map(row => row.id)
  assert.ok(coverageIds.every(id => !historicalIds.has(id) && !newIds.has(id) && !latestIds.includes(id)))
  assert.equal(new Set(coverageIds).size, coverageIds.length)
  // Append only the new independently bound receipt, never rewrite old queues.
  const suhodolIds = SUHODOL_20261122_REVIEWS.map(row => row.id)
  assert.deepEqual(suhodolIds, ['sofia-maria-kamenova-suhodol-shtit9'])
  assert.ok(suhodolIds.every(id => !historicalIds.has(id) && !newIds.has(id) && !latestIds.includes(id) && !coverageIds.includes(id)))
  const earlierIds = new Set([...historicalIds, ...newIds, ...latestIds, ...coverageIds, ...suhodolIds])
  const intakeIds = INTAKE_20261123_REVIEWS.map(row => row.id)
  assert.deepEqual(intakeIds, ['sofia-vr-sofia-west-mall-lyulin7', 'sofia-brainland-lyulin3-block319v'])
  assert.ok(intakeIds.every(id => !earlierIds.has(id)))
  assert.deepEqual(AUTO_INTAKE_20261123_REVIEWS.map(row => row.id), ['sofia-mline-auto-detailing-gorublyane-pionerska2'])
  assert.deepEqual(VERIFIED_INTAKE_20261123_REVIEWS.map(row => row.id), ['sofia-luckydent-dragalevtsi-gluharche10'])
  const additions = [...EDUCATION_INTAKE_20261123_REVIEWS, ...GALILEODENT_INTAKE_20261123_REVIEWS, ...VM_AUTO_INTAKE_20261123_REVIEWS]
  assert.deepEqual(additions.map(row => row.id), [
    'sofia-part-time-pavlovo-duychev12v', 'sofia-galileodent-nadezhda4-lomsko182', 'sofia-vm-auto-service-obelya-2-lomsko248a',
  ])
  const auditedIds = new Set([...earlierIds, ...intakeIds, ...AUTO_INTAKE_20261123_REVIEWS.map(row => row.id), ...VERIFIED_INTAKE_20261123_REVIEWS.map(row => row.id)])
  for (const [index, review] of additions.entries()) {
    assert.equal(auditedIds.has(review.id), false)
    auditedIds.add(review.id)
    assert.ok(BOOKING_PRICE_REVIEWS.includes(review))
    const business = SOFIA_CATALOGUE.find(row => row.id === review.id)
    assert.equal(assessPricingReview(business, review, Date.parse('2026-11-23T12:00:00Z')).state, index === 2 ? 'reviewed' : 'service_reviewed')
    assert.equal(assessPricingReview(business, review, now).state, 'pending')
  }
  for (const [reviews, id, state] of [
    [SPORT_EDUCATION_GAP_20261123_REVIEWS, 'sofia-umni-deca-obelya2-106-3', 'service_reviewed'],
    [DOICHINOVA_INTAKE_20261123_REVIEWS, 'sofia-doichinova-lyulin3-block368', 'reviewed'],
    [DBROS_INTAKE_20261123_REVIEWS, 'sofia-dbros-vrazhdebna-botevgradsko431', 'service_reviewed'],
    [PRIORITY_DENTAL_INTAKE_20261123_REVIEWS, 'sofia-kabident-lyulin9-vlaikov27', 'service_reviewed'],
  ]) {
    assert.deepEqual(reviews.map(row => row.id), [id])
    assert.equal(auditedIds.has(id), false)
    auditedIds.add(id)
    const [review] = reviews
    assert.ok(BOOKING_PRICE_REVIEWS.includes(review))
    const business = SOFIA_CATALOGUE.find(row => row.id === id)
    assert.equal(assessPricingReview(business, review, Date.parse('2026-11-23T12:00:00Z')).state, state)
    assert.equal(assessPricingReview(business, review, now).state, 'pending')
  }
  assert.equal(auditedIds.size, SOFIA_CATALOGUE.length)
  assert.ok(SOFIA_CATALOGUE.every(row => auditedIds.has(row.id)))
  for (const review of NEIGHBORHOOD_20261111_REVIEWS) {
    const record = SOFIA_CATALOGUE.find(row => row.id === review.id)
    assert.equal(assessPricingReview(record, review, now).state, 'reviewed', review.id)
  }
  for (const review of SUHODOL_20261122_REVIEWS) {
    const record = SOFIA_CATALOGUE.find(row => row.id === review.id)
    assert.ok(BOOKING_PRICE_REVIEWS.includes(review), 'the standard gate uses the exact new receipt object')
    assert.equal(assessPricingReview(record, review, Date.parse('2026-11-22T12:00:00Z')).state, 'reviewed', review.id)
    assert.equal(assessPricingReview(record, review, now).state, 'pending', 'a future receipt cannot fill the old November11 queue')
  }
  for (const [index, review] of INTAKE_20261123_REVIEWS.entries()) {
    const record = SOFIA_CATALOGUE.find(row => row.id === review.id)
    assert.ok(BOOKING_PRICE_REVIEWS.includes(review), 'the standard gate uses the exact intake receipt')
    assert.equal(assessPricingReview(record, review, Date.parse('2026-11-23T12:00:00Z')).state, index === 0 ? 'reviewed' : 'service_reviewed', review.id)
    assert.equal(assessPricingReview(record, review, now).state, 'pending')
  }
  assert.equal(report.summary.reservationsSubmitted, 0)
  assert.equal(report.summary.publicDiscovery.paidRequests, 0)
  assert.equal(report.summary.liveDatabaseWrites, 0)
  assert.ok(report.summary.pending > 0)
  for (const row of report.businesses) {
    assert.ok(Array.isArray(row.automatedAttempts))
    if (row.state === 'reviewed') assert.ok(row.sourceReview?.reviewedUrls.length)
    for (const attempt of row.automatedAttempts) assert.equal(new URL(attempt.url).search, '')
  }
})

test('reviewed packages retain starting prices, weight/staff scopes, units and booking durations', () => {
  const find = (id, name) => SOFIA_CATALOGUE.find(row => row.id === id).services.find(row => row.name === name)
  // A real source conflict is held, not silently published from either site.
  assert.equal(find('sofia-mokro-nosle', 'Пакет Хигиена'), undefined)
  const held = BOOKING_PRICE_REVIEWS.find(row => row.id === 'sofia-mokro-nosle')
  assert.equal(assessPricingReview(SOFIA_CATALOGUE.find(row => row.id === held.id), held, now).reason, 'conflicting_published_prices_require_owner_confirmation')
  assert.equal(find('sofia-tobbys-grooming', 'Обработка на сплъстена козина').price.unit, 'час')
  assert.equal(find('sofia-kaya-grooming', 'Цялостен груминг за обемни козини · над 35 кг').price.amount, 115)
  assert.equal(find('sofia-kaya-grooming', 'Цялостен груминг за обемни козини · над 35 кг').durationMin, 180)
  assert.equal(find('sofia-cut-n-chill', 'Мъжко подстригване').durationMin, 30)
  assert.equal(find('sofia-el-gato', 'Маникюр с гел лак · Мадлена Миткова').price.amount, 28)
  assert.equal(find('sofia-el-gato', 'Маникюр с гел лак').price, undefined)
  assert.equal(find('sofia-pet-stop-place', 'Пълен груминг за куче').price.maximum, 120)
  assert.equal(find('sofia-pet-stop-place', 'Пълен груминг за куче').durationMin, undefined)
  assert.equal(find('sofia-luxury-nails-cherkovna', 'Класически маникюр без лак').price.amount, 20)
  assert.equal(find('sofia-luxury-nails-cherkovna', 'Класически маникюр без лак').price.kind, 'from')
  assert.equal(find('sofia-luxury-nails-cherkovna', 'Вграден френски маникюр с дизайн').price.amount, 110)
  assert.equal(find('sofia-luxury-nails-cherkovna', 'Вграден френски маникюр с дизайн').durationMin, 210)
  assert.equal(find('sofia-luxury-nails-cherkovna', 'Класически маникюр · Десислава Ганчева'), undefined)
})

test('chain pricing is branch-specific and never copies an academy or missing menu choice', () => {
  const reviews = BOOKING_PRICE_REVIEWS.filter(row => row.website === 'https://gpoint.bg/')
  assert.equal(reviews.length, 43)
  assert.equal(reviews.filter(row => row.services.some(item => item.name === 'Лазерна епилация · Интим · мъже')).length, 9)
  assert.ok(!reviews.find(row => row.id === 'sofia-gpoint-borovo').services.some(item => item.name === 'Лазерна епилация · Интим · мъже'))
  assert.ok(reviews.every(row => row.services.every(item => item.price.validUntil === '2026-11-29' && /САМО при онлайн/.test(item.description) && !item.durationMin)))
  const head = BOOKING_PRICE_REVIEWS.filter(row => row.website === 'https://head-hunters.net/')
  assert.equal(head.length, 7)
  const haircut = slug => head.find(row => row.id.endsWith(slug)).services.find(item => item.name === 'Мъжко подстригване')
  assert.equal(haircut('alabin').price.amount, 23)
  assert.equal(haircut('dondukov').price.amount, 10)
  assert.equal(haircut('alabin').price.maximum, 25.5)
  const stephan = id => BOOKING_PRICE_REVIEWS.find(row => row.id === id)
  assert.equal(stephan('sofia-stephan-mladost').services.find(item => item.name === 'Маникюр с гел лак').price.amount, 32)
  assert.equal(stephan('sofia-stephan-nails-academy').services.find(item => item.name === 'Маникюр с гел лак').price.amount, 13)
  assert.ok(stephan('sofia-stephan-academy-stephan').services.every(item => item.category === 'hair'))
})

test('new phone tariffs, consultation exclusions and per-person packages keep their published scope', () => {
  const find = (id, name) => SOFIA_CATALOGUE.find(row => row.id === id).services.find(item => item.name === name)
  assert.equal(find('sofia-noxic-beauty', 'Маникюр с гел лак').price.amount, 28.12)
  assert.match(find('sofia-noxic-beauty', 'Маникюр с гел лак').description, /декорацията е отделно/)
  assert.equal(find('sofia-noxic-beauty', 'Класически маникюр').price.amount, 15.34)
  assert.equal(find('sofia-noxic-beauty', 'Класически педикюр без лак').durationMin, 40)
  assert.match(BOOKING_PRICE_REVIEWS.find(row => row.id === 'sofia-noxic-beauty').notes, /no staff found/)
  assert.equal(find('sofia-sofia-vet-grooming', 'Подстригване на куче над 50 кг'), undefined)
  assert.equal(find('sofia-vet-city-nishava', 'Консултация'), undefined)
  assert.equal(find('sofia-vet-city-nishava', 'Почистване на зъбен камък · степен 1').price.amount, 55)
  assert.equal(find('sofia-monster-cleaning', 'Почистване след ремонт · до 45 м²').price.kind, 'from')
  assert.equal(find('sofia-pink-cormorant', 'Клас по керамика за възрастни').price.unit, 'човек')
  assert.equal(find('sofia-pink-cormorant', 'Пакет 4 посещения по избор').price.amount, 160)
  assert.equal(find('sofia-hrisiyana-varbanska', 'Пакет 5 онлайн консултации').price.amount, 150)
  assert.equal(find('sofia-hrisiyana-varbanska', 'Пакет 5 онлайн консултации').price.unit, 'пакет')
  assert.equal(find('sofia-hrisiyana-varbanska', 'Психологична консултация за възрастни').durationMin, undefined)
})
