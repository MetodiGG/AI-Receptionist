import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { VERIFIED_EDUCATION_GROWTH_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-education-growth-20261127.mjs'
import { VERIFIED_CONSULTATIONS_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-consultations-20261127.mjs'
import { VERIFIED_BANISHA_SALON_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-banisha-salon-20261127.mjs'
import { VERIFIED_DIANABAD_INSPECTION_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-dianabad-inspection-20261127.mjs'
import { VERIFIED_HLADILNIKA_NN_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-hladilnika-nn-20261127.mjs'
import { VERIFIED_HIPODRUMA_HAIRLESS_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-hipodruma-hairless-20261127.mjs'
import { VERIFIED_REDUTA_ABV_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-reduta-abv-20261127.mjs'
import { GARAGE46_SERDIKA_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-garage46-serdika-20261127.mjs'
import { AURA_B19_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-aura-b19-20261127.mjs'
import { VERIFIED_MTS_KRASNA_POLYANA3_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-mts-krasna-polyana3-20261127.mjs'
import { YAVOROV_GEO_MILEV_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-yavorov-geo-milev-20261127.mjs'
import { IVON_GORNA_BANYA_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-ivon-gorna-banya-20261127.mjs'
import { FLAIS_NADEZHDA1_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-flais-nadezhda1-20261127.mjs'
import { SIHIA_NADEZHDA2_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-sihia-nadezhda2-20261127.mjs'
import { VERIFIED_SEDEMCHAKRI_LYULIN5_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-sedemchakri-lyulin5-20261127.mjs'
import { VERIFIED_RAMIRUS_LEVSKI_V_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-ramirus-levski-v-20261127.mjs'
import { VERIFIED_CLEAN_CARPET_SMIRNENSKI_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-clean-carpet-smirnenski-20261127.mjs'
import { VERIFIED_VEDA_JUNIOR_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-veda-junior-20261127.mjs'
import { KOTEV_MLADOST1A_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-kotev-mladost1a-20261127.mjs'
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
import { NEKSAS_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-neksas-20261123.mjs'
import { PAKOSTI_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-pakosti-20261123.mjs'
import { ACPOWER_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-acpower-20261123.mjs'
import { MIKRON_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-mikron-20261123.mjs'
import { MY_REFORMER_SPACE_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-my-reformer-space-20261123.mjs'
import { UNIGAS_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-unigas-20261123.mjs'
import { SM_GROUP_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-sm-group-20261123.mjs'
import { SPECIALIST_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-specialist-intake-20261123.mjs'
import { KOBA_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-koba-intake-20261123.mjs'
import { COURSES_RECREATION_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-courses-recreation-20261123.mjs'
import { INFINITY_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-infinity-intake-20261123.mjs'
import { HORO_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-horo-intake-20261123.mjs'
import { SHARENSVYAT_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-sharen-svyat-intake-20261123.mjs'
import { SALT_HUG_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-salt-hug-intake-20261123.mjs'
import { FRANTSOV_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-frantsov-intake-20261123.mjs'
import { SOLUX_AUTO_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-solux-auto-intake-20261123.mjs'
import { MASTERS_DANCE_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-masters-dance-intake-20261123.mjs'
import { CANDY_HOUSE_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-candy-house-intake-20261123.mjs'
import { KOBA_PARIS_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-koba-paris-intake-20261123.mjs'
import { VITOSHA_PAIR_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-vitosha-pair-intake-20261123.mjs'
import { GEMINI4_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-gemini4-intake-20261123.mjs'
import { ALVA_DENTAL_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-alva-dental-intake-20261123.mjs'
import { SPARSE_EAST_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-sparse-east-intake-20261123.mjs'
import { SPARSE_SOUTH_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-sparse-south-intake-20261123.mjs'
import { EMIKA_DRUZHBA2_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-emika-druzhba2-20261123.mjs'
import { SILVERSTAR_RING_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-silverstar-ring-intake-20261123.mjs'
import { VERIFIED_SOUTH_NEXT_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-south-next-20261123.mjs'
import { NORTH_NEXT_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-north-next-20261123.mjs'
import { VERIFIED_EAST_NEXT_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-east-next-20261123.mjs'
import { VERIFIED_EAST_GROWTH_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-east-growth-20261123.mjs'
import { VERIFIED_SOUTH_GROWTH_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-south-growth-20261123.mjs'
import { NORTH_GROWTH_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-north-growth-20261123.mjs'
import { SPARSE_MARKET_SOUTH_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-sparse-market-south-20261123.mjs'
import { DCA_LEVSKI_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-dca-levski-20261123.mjs'
import { ELIT_CHESS_INTAKE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-elit-chess-20261123.mjs'
import { PRIORITY_DISTINCT_EAST_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-distinct-east-20261123.mjs'
import { PRIORITY_DISTINCT_NORTH_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-distinct-north-20261123.mjs'
import { PRIORITY_DISTINCT_SOUTH_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-distinct-south-20261123.mjs'
import { PRIORITY_CONTINUED_EAST_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-continued-east-20261123.mjs'
import { PRIORITY_NEXT_EAST_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-next-east-20261123.mjs'
import { PRIORITY_NEXT_NORTH_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-next-north-20261123.mjs'
import { PRIORITY_NEXT_SOUTH_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-next-south-20261123.mjs'
import { PRIORITY_FRESH_EAST_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-fresh-east-20261123.mjs'
import { PRIORITY_FRESH_NORTH_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-fresh-north-20261123.mjs'
import { PRIORITY_FRESH_SOUTH_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-fresh-south-20261123.mjs'
import { PRIORITY_FOUND_CORE_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-found-core-20261123.mjs'
import { PRIORITY_FOUND_EAST_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-found-east-20261123.mjs'
import { PRIORITY_FOUND_SOUTH_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-found-south-20261123.mjs'
import { PRIORITY_SPARSE2_NORTH_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-sparse2-north-20261123.mjs'
import { PRIORITY_SPARSE2_SOUTH_20261123_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-priority-sparse2-south-20261123.mjs'
import { MOPART_INTAKE_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-mopart-intake-20261127.mjs'
import { VERIFIED_LYULIN_BATCH_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-lyulin-batch-20261127.mjs'
import { VERIFIED_SOFIA_CROSS_QUARTER_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-sofia-cross-quarter-20261127.mjs'
import { pricedGrowthPriorCatalogue } from './catalogue-priced-growth-20261123-scope.mjs'
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
  const historical = pricedGrowthPriorCatalogue(SOFIA_CATALOGUE).filter(row =>
    row.verification.checkedOn <= '2026-11-11' && !revalidatedGPointIds.has(row.id))
  const ids = new Set(historical.map(row => row.id))
  const waveHistory = NEIGHBORHOOD_20261111_REVIEWS.find(row => row.id === 'sofia-wave-studio-lyulin7-nails')
  const historicalReviews = BOOKING_PRICE_REVIEWS.filter(row => ids.has(row.id)).map(row => row.id === waveHistory.id ? waveHistory : row)
  const result = auditCataloguePricing(historical, baseline, historicalReviews, now)
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
  for (const [reviews, id, state, reviewedAt = '2026-11-23T12:00:00Z'] of [
    [SPORT_EDUCATION_GAP_20261123_REVIEWS, 'sofia-umni-deca-obelya2-106-3', 'service_reviewed'],
    [DOICHINOVA_INTAKE_20261123_REVIEWS, 'sofia-doichinova-lyulin3-block368', 'reviewed'],
    [DBROS_INTAKE_20261123_REVIEWS, 'sofia-dbros-vrazhdebna-botevgradsko431', 'service_reviewed'],
    [PRIORITY_DENTAL_INTAKE_20261123_REVIEWS, 'sofia-kabident-lyulin9-vlaikov27', 'service_reviewed'],
    [NEKSAS_INTAKE_20261123_REVIEWS, 'sofia-neksas-academy-chelopechene-yane28', 'service_reviewed'],
    [PAKOSTI_INTAKE_20261123_REVIEWS, 'sofia-pakosti-chudati-botunets-levski5', 'reviewed'],
    [ACPOWER_INTAKE_20261123_REVIEWS, 'sofia-ac-power-suhodol-badeshte4a', 'reviewed'],
    [MIKRON_INTAKE_20261123_REVIEWS, 'sofia-mikron-dotsev-knyazhevo-tsarboris298', 'reviewed'],
    [MY_REFORMER_SPACE_INTAKE_20261123_REVIEWS, 'sofia-my-reformer-space-levski-g-vazov39', 'reviewed'],
    [UNIGAS_INTAKE_20261123_REVIEWS, 'sofia-unigas-romano-voenna-rampa-konstantin3', 'reviewed'],
    [SM_GROUP_INTAKE_20261123_REVIEWS, 'sofia-sm-group-korekt-druzhba1-block182', 'reviewed'],
    [SPECIALIST_INTAKE_20261123_REVIEWS, 'sofia-mushmula-poligona-tsarigradsko111v', 'reviewed'],
    [KOBA_INTAKE_20261123_REVIEWS, 'sofia-koba-auto-bosch-rodopi27', 'service_reviewed'],
    [COURSES_RECREATION_INTAKE_20261123_REVIEWS, 'sofia-ucha-land-dianabad-novachnitsa3', 'reviewed'],
    [INFINITY_INTAKE_20261123_REVIEWS, 'sofia-infinity-team-strelbishte-bulgaria43', 'service_reviewed'],
    [HORO_INTAKE_20261123_REVIEWS, 'sofia-horo-moderno-predgradie-evropa20', 'service_reviewed'],
    [SHARENSVYAT_INTAKE_20261123_REVIEWS, 'sofia-sharen-svyat-lyulin5-block519g', 'reviewed'],
    [SALT_HUG_INTAKE_20261123_REVIEWS, 'sofia-salt-hug-druzhba1-block195v', 'reviewed'],
    [FRANTSOV_INTAKE_20261123_REVIEWS, 'sofia-nikolay-frantsov-druzhba1-block18v', 'reviewed'],
    [SOLUX_AUTO_INTAKE_20261123_REVIEWS, 'sofia-solux-auto-pavlina4', 'service_reviewed'],
    [MASTERS_DANCE_INTAKE_20261123_REVIEWS, 'sofia-masters-dance-lyulin-centre-nenov29', 'service_reviewed'],
    [CANDY_HOUSE_INTAKE_20261123_REVIEWS, 'sofia-candy-house-lyulin10-mayski-den22', 'reviewed'],
    [KOBA_PARIS_INTAKE_20261123_REVIEWS, 'sofia-koba-auto-paris14', 'service_reviewed'],
    [[VITOSHA_PAIR_20261123_REVIEWS[0]], 'sofia-kis-auto-simeonovo-bosilek3', 'reviewed'],
    [[VITOSHA_PAIR_20261123_REVIEWS[1]], 'sofia-next-level-knyazhevo-tsar-boris272', 'reviewed'],
    [GEMINI4_INTAKE_20261123_REVIEWS, 'sofia-gemini4-republika-729-22', 'service_reviewed'],
    [ALVA_DENTAL_INTAKE_20261123_REVIEWS, 'sofia-alva-dental-hadzhi-dimitar107v', 'service_reviewed'],
    [SPARSE_EAST_INTAKE_20261123_REVIEWS, 'sofia-salt-home-druzhba2-block302a', 'reviewed'],
    [SPARSE_SOUTH_INTAKE_20261123_REVIEWS, 'sofia-logos152-simeonovo-krairechna10', 'service_reviewed'],
    [EMIKA_DRUZHBA2_20261123_REVIEWS, 'sofia-emika-druzhba2-block204', 'service_reviewed'],
    [SILVERSTAR_RING_INTAKE_20261123_REVIEWS, 'sofia-silver-star-ring-mall-okolovrasten214', 'service_reviewed'],
    [VERIFIED_SOUTH_NEXT_20261123_REVIEWS, 'sofia-elizabet-ritmika-dragalevtsi-bela-dona1', 'service_reviewed'],
    [NORTH_NEXT_INTAKE_20261123_REVIEWS, 'sofia-avtotapicera-iliyantsi-balcho7', 'service_reviewed'],
    [VERIFIED_EAST_NEXT_20261123_REVIEWS, 'sofia-carplay-bulgaria-gorublyane-pionerska2', 'service_reviewed'],
    [VERIFIED_EAST_GROWTH_20261123_REVIEWS, 'sofia-partydots-druzhba2-block280e', 'reviewed'],
    [VERIFIED_SOUTH_GROWTH_20261123_REVIEWS, 'sofia-karting-ring-academy-simeonovo-214', 'reviewed'],
    [NORTH_GROWTH_INTAKE_20261123_REVIEWS, 'sofia-terpsihora-lyulin5-504-1', 'service_reviewed'],
    [SPARSE_MARKET_SOUTH_20261123_REVIEWS, 'sofia-kanev-carpet-knyazhevo-buket55', 'reviewed'],
    [DCA_LEVSKI_INTAKE_20261123_REVIEWS, 'sofia-dca-garage-levski-v-letostruy27', 'reviewed'],
    [ELIT_CHESS_INTAKE_20261123_REVIEWS, 'sofia-elit-chess-sveta-troitsa-hisarya3a', 'reviewed'],
    [[PRIORITY_DISTINCT_EAST_20261123_REVIEWS[0]], 'sofia-studio-s-hadzhi-dimitar-vastanik5', 'reviewed'],
    [[PRIORITY_DISTINCT_NORTH_20261123_REVIEWS[0]], 'sofia-smartykids-lyulin9-block954', 'reviewed'],
    [[PRIORITY_DISTINCT_NORTH_20261123_REVIEWS[1]], 'sofia-limoncello-kids-buxton-gortalov1', 'reviewed'],
    [PRIORITY_DISTINCT_SOUTH_20261123_REVIEWS, 'sofia-sr-cars-ovcha-kupel-boychev4', 'service_reviewed'],
    [PRIORITY_CONTINUED_EAST_20261123_REVIEWS, 'sofia-yonitrade-suhata-reka-block10a', 'service_reviewed'],
    [PRIORITY_NEXT_EAST_20261123_REVIEWS, 'sofia-active-dental-mladost2-block295', 'service_reviewed'],
    [PRIORITY_NEXT_NORTH_20261123_REVIEWS, 'sofia-sokol-tennis-benkovski-stadium', 'reviewed'],
    [PRIORITY_NEXT_SOUTH_20261123_REVIEWS, 'sofia-drive-school-knyazhevo-tsar-boris365', 'reviewed'],
    [PRIORITY_FRESH_EAST_20261123_REVIEWS, 'sofia-anev-barber-mladost1a-ahmatova532', 'reviewed'],
    [PRIORITY_FRESH_NORTH_20261123_REVIEWS, 'sofia-one-service-vrabnitsa1-276-13', 'reviewed'],
    [PRIORITY_FRESH_SOUTH_20261123_REVIEWS, 'sofia-magazinche-za-znanie-lyulin2', 'reviewed'],
    [PRIORITY_FOUND_CORE_20261123_REVIEWS, 'sofia-sparklab-mladost3-block304-3', 'reviewed'],
    [PRIORITY_FOUND_EAST_20261123_REVIEWS, 'sofia-little-smiles-mladost1-nikola-genadiev5g', 'reviewed'],
    [PRIORITY_FOUND_SOUTH_20261123_REVIEWS, 'sofia-jolly-kids-pavlovo-duychev12v', 'reviewed'],
    [PRIORITY_SPARSE2_NORTH_20261123_REVIEWS, 'sofia-lokomotiv-tennis-voenna-rampa-rozhen23', 'reviewed'],
    [PRIORITY_SPARSE2_SOUTH_20261123_REVIEWS, 'sofia-kindyroo-lyulin8-tsaritsa-yoanna68', 'reviewed'],
    [MOPART_INTAKE_20261127_REVIEWS, 'sofia-mopart-lyulin3-okolovrasten803', 'service_reviewed', '2026-11-27T12:00:00Z'],
    [[VERIFIED_LYULIN_BATCH_20261127_REVIEWS[0]], 'sofia-solema-lyulin3-block348', 'reviewed', '2026-11-27T12:00:00Z'],
    [[VERIFIED_LYULIN_BATCH_20261127_REVIEWS[1]], 'sofia-alice-academy-lyulin3-block389', 'reviewed', '2026-11-27T12:00:00Z'],
    [[VERIFIED_SOFIA_CROSS_QUARTER_20261127_REVIEWS[0]], 'sofia-bs-wrap-studio-studentski-stranski3b', 'service_reviewed', '2026-11-27T12:00:00Z'],
    [[VERIFIED_SOFIA_CROSS_QUARTER_20261127_REVIEWS[1]], 'sofia-as-vavilon-vrabnitsa2-block632d', 'service_reviewed', '2026-11-27T12:00:00Z'],
    [[VERIFIED_SOFIA_CROSS_QUARTER_20261127_REVIEWS[2]], 'sofia-best-moments-photography-lyulin6-block641', 'reviewed', '2026-11-27T12:00:00Z'],
    [[VERIFIED_EDUCATION_GROWTH_20261127_REVIEWS[0]], 'sofia-reya-kids-ovcha-kupel2-ivan-hadzhiyski3', 'service_reviewed', '2026-11-27T12:00:00Z'],
    [[VERIFIED_EDUCATION_GROWTH_20261127_REVIEWS[1]], 'sofia-art-academy-banishora-kozloduy128', 'service_reviewed', '2026-11-27T12:00:00Z'],
    [VERIFIED_CONSULTATIONS_20261127_REVIEWS, 'sofia-va-consulting-lyulin10-block135', 'service_reviewed', '2026-11-27T12:00:00Z'],
    [VERIFIED_BANISHA_SALON_20261127_REVIEWS, 'sofia-essentisimo-banishora-karlovo7', 'reviewed', '2026-11-27T12:00:00Z'],
    [VERIFIED_DIANABAD_INSPECTION_20261127_REVIEWS, 'sofia-avtokontrol-plus-dianabad', 'service_reviewed', '2026-11-27T12:00:00Z'],
    [VERIFIED_HLADILNIKA_NN_20261127_REVIEWS, 'sofia-nn-architecture-hladilnika-banat34', 'reviewed', '2026-11-27T12:00:00Z'],
    [VERIFIED_HIPODRUMA_HAIRLESS_20261127_REVIEWS, 'sofia-hairless-hipodruma-hanpresiyan15', 'service_reviewed', '2026-11-27T12:00:00Z'],
    [VERIFIED_REDUTA_ABV_20261127_REVIEWS, 'sofia-abv-academy-reduta-velcho-atanasov53', 'service_reviewed', '2026-11-27T12:00:00Z'],
    [GARAGE46_SERDIKA_20261127_REVIEWS, 'sofia-garage46-serdika-ivanivanov67', 'reviewed', '2026-11-27T12:00:00Z'],
    [AURA_B19_20261127_REVIEWS, 'sofia-aura-music-stamboliyski175', 'reviewed', '2026-11-27T12:00:00Z'],
    [VERIFIED_MTS_KRASNA_POLYANA3_20261127_REVIEWS, 'sofia-mts-massage-pchinya31b', 'reviewed', '2026-11-27T12:00:00Z'],
    [YAVOROV_GEO_MILEV_20261127_REVIEWS, 'sofia-yavorov1920-geo-milev24', 'service_reviewed', '2026-11-27T12:00:00Z'],
    [IVON_GORNA_BANYA_20261127_REVIEWS, 'sofia-ivon-service-gorna-banya-eho1', 'service_reviewed', '2026-11-27T12:00:00Z'],
    [FLAIS_NADEZHDA1_20261127_REVIEWS, 'sofia-flais-nadezhda1-lyuborodie2', 'reviewed', '2026-11-27T12:00:00Z'],
    [SIHIA_NADEZHDA2_20261127_REVIEWS, 'sofia-sihia-nadezhda2-velezhki49g', 'reviewed', '2026-11-27T12:00:00Z'],
    [VERIFIED_SEDEMCHAKRI_LYULIN5_20261127_REVIEWS, 'sofia-sedemchakri-lyulin5-dertliev99', 'reviewed', '2026-11-27T12:00:00Z'],
    [VERIFIED_RAMIRUS_LEVSKI_V_20261127_REVIEWS, 'sofia-ramirus-levski-v-letostruy91a', 'service_reviewed', '2026-11-27T12:00:00Z'],
    [VERIFIED_CLEAN_CARPET_SMIRNENSKI_20261127_REVIEWS, 'sofia-clean-carpet-smirnenski-marko-bochar1', 'reviewed', '2026-11-27T12:00:00Z'],
    [VERIFIED_VEDA_JUNIOR_20261127_REVIEWS, 'sofia-veda-junior-stefan-karadzha-gintsi11', 'service_reviewed', '2026-11-27T12:00:00Z'],
    [KOTEV_MLADOST1A_20261127_REVIEWS, 'sofia-kotev-dental-mladost1a-564', 'service_reviewed', '2026-11-27T12:00:00Z'],
  ]) {
    assert.deepEqual(reviews.map(row => row.id), [id])
    assert.equal(auditedIds.has(id), false)
    auditedIds.add(id)
    const [review] = reviews
    assert.ok(BOOKING_PRICE_REVIEWS.includes(review))
    const business = SOFIA_CATALOGUE.find(row => row.id === id)
    assert.equal(assessPricingReview(business, review, Date.parse(reviewedAt)).state, state, id)
    assert.equal(assessPricingReview(business, review, now).state, 'pending')
  }
  assert.equal(auditedIds.size, SOFIA_CATALOGUE.length)
  assert.ok(SOFIA_CATALOGUE.every(row => auditedIds.has(row.id)))
  for (const review of NEIGHBORHOOD_20261111_REVIEWS) {
    const record = SOFIA_CATALOGUE.find(row => row.id === review.id)
    const [prior] = pricedGrowthPriorCatalogue([record])
    assert.equal(assessPricingReview(prior, review, now).state, 'reviewed', review.id)
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
