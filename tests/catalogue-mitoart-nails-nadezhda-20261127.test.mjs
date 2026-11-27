import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import sharp from 'sharp'
import { businessDirectionsUrl, businessMapUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { VERIFIED_MITOART_HADZHI_DIMITAR_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-mitoart-hadzhi-dimitar-20261127.mjs'
import { applyVerifiedNadezhda1ArtMastersPoint20261127 } from '../lib/discovery/catalogue-data/verified-nadezhda1-art-masters-point-20261127.mjs'
import { applyVerifiedTinoNails20261127, VERIFIED_TINO_NAILS_20261127_REVIEWS } from '../lib/discovery/catalogue-data/verified-tino-nails-20261127.mjs'
import { applyVerifiedVitoshaFishPoolPoint20261127 } from '../lib/discovery/catalogue-data/verified-vitosha-fish-pool-point-20261127.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL } from '../lib/discovery/official-sofia-address-source.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'
import { priorCatalogue } from './catalogue-mitoart-nails-nadezhda-20261127-scope.mjs'

const now = Date.parse('2026-11-27T12:00:00Z')
const expired = Date.parse('2026-12-28T00:00:00Z')
const mito = 'sofia-mitoart-hadzhi-dimitar-albert-long11-15'
const tino = 'sofia-tino-hair-hladilnika-paradisecenter100'
const art = 'sofia-art-masters-band-nadezhda1-172'
const pool = 'sofia-malkite-ribki-kiril-buyukliyski30'
const byID = (id, rows = SOFIA_CATALOGUE) => rows.find(row => row.id === id)

test('this intake adds MitoArt only, and changes fields on exactly the three reviewed existing records', () => {
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    const prior = priorCatalogue(rows)
    const priorByID = new Map(prior.map(row => [row.id, row]))
    const added = rows.filter(row => !priorByID.has(row.id))
    assert.deepEqual(added.map(row => row.id), [mito])
    assert.deepEqual(prior.map(row => row.id), rows.filter(row => row.id !== mito).map(row => row.id))
    const reconstructed = rows.filter(row => row.id !== mito).map(row => {
      const old = priorByID.get(row.id)
      if (row.id === tino) return { ...row, services: old.services }
      if (row.id === art || row.id === pool) return { ...row, coordinates: old.coordinates }
      return row
    })
    assert.deepEqual(reconstructed, prior)
  }
})

test('Sofia coverage distinguishes one new premises, two point fixes, and two nails services at a single existing branch', () => {
  const reports = [priorCatalogue(SOFIA_CATALOGUE), SOFIA_CATALOGUE]
    .map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const cell = (report, area, categoryId) => [...report.neighborhoods, ...report.additionalNamedAreas]
    .find(row => row.name === area).cells.find(x => x.categoryId === categoryId)
  for (const [area, category, id, expected, hasPoint] of [
    ['Хаджи Димитър', 'education', mito, [[1, 1], [2, 1]], false],
    ['Хладилника', 'nails', tino, [[2, 0], [3, 1]], true],
    ['Хладилника', 'hair', tino, [[2, 1], [2, 1]], true],
    ['Надежда 1', 'education', art, [[1, 0], [1, 1]], true],
    ['Витоша', 'fitness', pool, [[2, 0], [2, 1]], true],
  ]) {
    const [before, after] = reports.map(report => cell(report, area, category))
    assert.deepEqual([before, after].map(row => [row.count, row.locatedCount]), expected, `${area}/${category}`)
    assert.equal(after.businessIds.filter(value => value === id).length, 1)
    assert.equal(after.locatedBusinessIds.filter(value => value === id).length, Number(hasPoint))
  }
  const [before, after] = reports.map(report => report.counts)
  assert.equal(after.approvedBusinesses - before.approvedBusinesses, 1)
  assert.equal(after.premisesWithBoundCoordinates - before.premisesWithBoundCoordinates, 2)
  assert.equal(after.zeroCells, before.zeroCells)
})

test('Art Masters and the pool bind their precise evidence without retaining stale points or changing external booking', () => {
  const fixtures = [
    { id: art, apply: applyVerifiedNadezhda1ArtMastersPoint20261127, coordinates: [42.727160, 23.301023],
      address: 'София, ж.к. Надежда 1, бл. 172, вх. Г', method: 'verified_official_address',
      source: OFFICIAL_SOFIA_SOURCE_URL, addressId: '56744', handoff: { kind: 'phone', href: 'tel:+359888357317' } },
    { id: pool, apply: applyVerifiedVitoshaFishPoolPoint20261127, coordinates: [42.6460678, 23.3267542],
      address: 'София, Витоша, ул. Кирил Буюклийски 30', method: 'first_party_coordinates',
      source: 'https://malkiteribki.com/kontakti/', addressId: undefined,
      handoff: { kind: 'form', href: 'https://malkiteribki.com/zapisvane-detza/' } },
  ]
  for (const fixture of fixtures) {
    const row = byID(fixture.id)
    const [old] = priorCatalogue([row])
    assert.equal(old.coordinates, null)
    assert.equal(row.address, fixture.address)
    const point = catalogueBoundCoordinates(row)
    assert.deepEqual([point.latitude, point.longitude], fixture.coordinates)
    assert.equal(point.method, fixture.method)
    assert.equal(point.source, fixture.source)
    assert.equal(point.sourceAddress, fixture.address)
    assert.equal(point.addressId, fixture.addressId)
    assert.deepEqual(fixture.apply([old]), [row])
    assert.strictEqual(fixture.apply([row])[0], row)
    for (const patch of [
      { address: old.address + 'А' }, { cityCode: '56784' }, { neighborhood: null }, { website: 'https://example.test/' },
      { phone: '+359123456789' }, { locationKind: 'mobile' }, { coordinates: { ...point, latitude: 42.70 } },
      { booking: { kind: 'form', url: 'https://example.test/' } },
      { verification: { ...old.verification, contact: 'https://example.test/' } },
      { verification: { ...old.verification, booking: { url: 'https://example.test/' } } },
    ]) {
      const drifted = { ...old, ...patch }
      assert.strictEqual(fixture.apply([drifted])[0], drifted)
    }
    const oldView = catalogueProfileView(old, { now }), view = catalogueProfileView(row, { now })
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'А' }), null)
    assert.equal(businessDirectionsUrl(oldView), null)
    const directions = new URL(businessDirectionsUrl(view))
    assert.equal(directions.searchParams.get('api'), '1')
    assert.equal(directions.searchParams.get('destination'), fixture.coordinates.join(','))
    assert.equal(directions.searchParams.has('destination_place_id'), false)
    assert.equal(new URL(businessMapUrl(view)).searchParams.get('marker'), fixture.coordinates.join(','))
    assert.deepEqual(railExternalAction(oldView, now), fixture.handoff)
    assert.deepEqual(railExternalAction(view, now), fixture.handoff)
  }
})

test('MitoArt keeps its full display address without routing to an unverified door, and TINO publishes literal Wednesday conditions', () => {
  const mitoRow = byID(mito), tinoRow = byID(tino)
  const [oldTino] = priorCatalogue([tinoRow])
  const gallery = catalogueProfileView(mitoRow, { now })
  const salon = catalogueProfileView(tinoRow, { now })
  assert.equal(gallery.address, 'София, ж.к. Хаджи Димитър, ул. Д-р Алберт Лонг 11–15')
  assert.equal(businessDirectionsUrl(gallery), null)
  assert.equal(businessMapUrl(gallery), null)
  assert.deepEqual(railExternalAction(gallery, now), { kind: 'phone', href: 'tel:+359889593388' })
  assert.deepEqual(railExternalAction(salon, now), { kind: 'form', href: 'https://app.tinohair.com/' })
  assert.deepEqual(applyVerifiedTinoNails20261127([oldTino]), [tinoRow])
  assert.strictEqual(applyVerifiedTinoNails20261127([tinoRow])[0], tinoRow)
  assert.deepEqual(tinoRow.services[0], oldTino.services[0])
  for (const patch of [
    { address: oldTino.address.replace('ет. 1', 'ет. 2') }, { coordinates: { ...oldTino.coordinates, addressId: '106137' } },
    { booking: { kind: 'form', url: 'https://example.test/' } },
    { services: oldTino.services.map(service => ({ ...service, price: { ...service.price, amount: 39 } })) },
  ]) {
    const drifted = { ...oldTino, ...patch }
    assert.strictEqual(applyVerifiedTinoNails20261127([drifted])[0], drifted)
  }

  const [workshop] = gallery.details.services
  const [, manicure, pedicure] = salon.details.services
  assert.equal(gallery.details.services.length, 1)
  assert.equal(salon.details.services.length, 3)
  for (const [service, name, english, price, duration, unit, caveat] of [
    [workshop, 'Групово ателие по рисуване за деца', 'Group drawing workshop for children', 15, 75, 'one visit', /Materials are included/u],
    [manicure, 'Маникюр с гел лак', 'Gel polish manicure', 40, 50, '€30 on Wednesdays', /Wednesday price is €30/u],
    [pedicure, 'Педикюр с гел лак', 'Gel polish pedicure', 50, 60, '€40 on Wednesdays', /Wednesday price is €40/u],
  ]) {
    assert.equal(service.name, name)
    assert.equal(service.price, price)
    assert.equal(service.durationMin, duration)
    assert.equal(service.presentationEn.name, english)
    assert.equal(service.presentationEn.unit, unit)
    assert.match(service.presentationEn.description, caveat)
  }
  assert.deepEqual(mitoRow.services.map(service => [service.price.currency, service.price.unit, service.price.sourceUrl]),
    [['EUR', 'едно посещение', 'https://mitoart.bg/prezhivjavanija/']])
  assert.deepEqual(tinoRow.services.slice(1).map(service => [service.price.currency, service.price.unit, service.price.sourceUrl]),
    [['EUR', '30 € в сряда', 'https://www.tinohair.com/'], ['EUR', '40 € в сряда', 'https://www.tinohair.com/']])
  for (const [row, [review], prices] of [
    [mitoRow, VERIFIED_MITOART_HADZHI_DIMITAR_20261127_REVIEWS, 1], [tinoRow, VERIFIED_TINO_NAILS_20261127_REVIEWS, 3],
  ]) {
    assert.equal(assessPricingReview(row, review, now).reviewedPriceCount, prices)
    assert.equal(assessPricingReview(row, review, expired).state, 'pending')
  }
})

test('MitoArt and TINO serve distinct, compact cover and service illustrations in the correct places', async () => {
  const images = []
  for (const [id, cover, scenes] of [
    [mito, '/business-cover-photos/go-mitoart-hadzhi-dimitar-20261127-v1.webp', [
      '/service-photos/go-mitoart-children-drawing-workshop-20261127-v1.webp',
    ]],
    [tino, '/business-cover-photos/go-tino-hair-hladilnika-20261127-v1.webp', [
      '/service-photos/go-tino-mens-haircut-20261127-v1.webp', '/service-photos/go-tino-gel-manicure-20261127-v1.webp',
      '/service-photos/go-tino-gel-pedicure-20261127-v1.webp',
    ]],
  ]) {
    const view = catalogueProfileView(byID(id), { now })
    assert.deepEqual(businessCoverPhotoSources(view), [cover])
    images.push([cover, 960, 720])
    const thumbnails = view.details.services.map(service => publicDetailServiceThumbnail(service, { business: view }))
    assert.deepEqual(thumbnails.map(photo => photo.src), scenes)
    assert.ok(thumbnails.every(photo => photo.source === 'illustrative'))
    images.push(...scenes.map(scene => [scene, 480, 480]))
  }
  const fingerprints = await Promise.all(images.map(async ([path, width, height]) => {
    const bytes = readFileSync(new URL('../public' + path, import.meta.url))
    const metadata = await sharp(bytes).metadata()
    assert.deepEqual([metadata.format, metadata.width, metadata.height], ['webp', width, height], path)
    assert.ok(bytes.length < 115_000, path)
    return fingerprintDiscoveryPhoto(bytes)
  }))
  for (const [i, left] of fingerprints.entries()) for (const right of fingerprints.slice(i + 1)) {
    assert.equal(compareDiscoveryPhotos(left, right), null)
  }
})
