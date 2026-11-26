import assert from 'node:assert/strict'
import test from 'node:test'
import { access } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { compactDiscoveryRow } from '../lib/discovery/preview.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railServiceItems } from '../lib/discovery/rail.mjs'
import { matchesSubcategory } from '../lib/discovery/subcategories.mjs'
import { publicBusinessCoverPhoto } from '../lib/public-business-cover-photo.mjs'

const now = DateTime.fromISO('2026-11-26T12:00:00Z', { setZone: true })
const name = 'S&S Deluxe Signature Beauty'
const owner = SOFIA_CATALOGUE.find(row => row.id === 'sofia-ss-deluxe-signature-beauty')
const origin = 'https://www.gorez.co'
const forbid = () => assert.fail('No external provider, availability or booking call')
const search = createDiscoveryHandler({
  config: discoveryConfig({ DISCOVERY_ENABLED: 'true', DISCOVERY_SEARCH_V2_ENABLED: 'true' }), allowAttempt: async () => true, now,
  readCatalogue: async () => [owner], readInternal: async () => [],
  claimBudget: forbid, fetcher: forbid, getBusiness: forbid, getSlots: forbid,
})

async function result(request) {
  const response = await search(new Request(`${origin}/api/public/discovery`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '', browse: true, cityCode: '68134', ...request }),
  }))
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.results.length, 1)
  const [row] = body.results
  assert.equal(row.id, owner.id)
  assert.equal(row.name, name)
  assert.equal(row.detailsRef, owner.id)
  assert.equal(row.details, undefined)
  assert.equal(row.booking.url, owner.booking.url)
  assert.deepEqual(row.availability, { status: 'external', slots: [] })
  assert.ok(row.servicePreview.length <= 2)
  assert.deepEqual(railServiceItems(row).map(service => service.name), row.servicePreview.map(service => service.name))
  if (row.subcategory) assert.deepEqual(row.services.map(service => service.name), row.servicePreview.map(service => service.name))
  return row
}

test('real S&S unfiltered and broad Beauty cards pair the brow cover with one real brow and one lash offer', async () => {
  for (const input of [{}, { category: 'beauty', locale: 'en' }]) {
    const row = await result(input)
    assert.deepEqual(row.servicePreview.map(service => [service.name, service.price, service.currency, service.priceSourceUrl]), [
      ['Ламиниране на вежди', 40, 'EUR', 'https://ss-beauty-sofia.com/brows/'],
      ['Удължаване на мигли – косъм по косъм', 45, 'EUR', 'https://ss-beauty-sofia.com/lashes/'],
    ])
    const cover = publicBusinessCoverPhoto(row)
    assert.match(cover.src, /activity-brow-lamination-v1\.webp$/u)
    await access(new URL('../public' + cover.src, import.meta.url))
    if (input.locale === 'en') assert.ok(row.servicePreview.every(service => !/[а-я]/iu.test(service.presentationEn.name)))
  }
})

test('explicit brow, lash and hair selections keep their original prices and cannot borrow a sibling outside the filter', async () => {
  for (const [category, subcategory, expectedCover] of [
    ['beauty', 'beauty-brows', /brow-lamination/],
    ['beauty', 'beauty-lashes', /lash/],
    ['hair', 'hair-cut', /hair|root-colour-cut/],
  ]) {
    const row = await result({ category, subcategory })
    assert.ok(row.servicePreview.length > 0)
    assert.ok(row.servicePreview.every(service => matchesSubcategory(service, subcategory, row)))
    assert.match(publicBusinessCoverPhoto(row).src, expectedCover)
    for (const service of row.servicePreview) {
      const original = owner.services.find(item => item.name === service.name)
      assert.equal(service.price, original.price?.amount ?? null)
      assert.equal(service.priceSourceUrl, original.price?.sourceUrl ?? null)
    }
  }
})

test('explicit broad Hair or typed haircut keeps matched hair tariffs/art while the actual details endpoint still has every service', async () => {
  const row = await result({ category: 'hair' })
  assert.equal(row.businessCategory, 'beauty', 'do not change the real business classification')
  assert.deepEqual(row.servicePreview.map(service => [service.name, service.price]), [
    ['Боядисване на корен + подстригване', 100], ['Боядисване на корен и стайлинг', 70],
  ])
  assert.match(publicBusinessCoverPhoto(row).src, /hair|root-colour-cut/u)
  const searched = await result({ query: 'Подстригване', browse: false })
  assert.ok(searched.servicePreview.every(service => service.category === 'hair'))
  assert.match(publicBusinessCoverPhoto(searched).src, /hair|root-colour-cut/u)

  const details = createPublicBusinessDetailsHandler({
    config: { enabled: true }, allowAttempt: async () => true, now: () => now.toMillis(),
    findCatalogue: async id => id === owner.id ? owner : null, readCataloguePhotos: async () => [],
  })
  const response = await details(new Request(`${origin}/api/public/discovery/business/${owner.id}`), owner.id)
  assert.equal(response.status, 200)
  const { business } = await response.json()
  assert.equal(business.details.services.length, owner.services.length)
  assert.ok(business.details.services.some(service => service.name === 'Мъжко подстригване' && service.price === 20))
})

test('the compact projection never replaces owner-provided business photo metadata', () => {
  const intent = { browse: true, category: 'hair', categoryFilter: true }
  const [row] = normalizeCatalogueBusinesses([owner], intent, { now: now.toMillis() })
  const photo = { src: '/catalogue-media/verified-fixture.webp', alt: 'Official studio', width: 504, height: 720 }
  const protectedPreview = compactDiscoveryRow({ ...row, photo }, intent)
  assert.equal(protectedPreview.photo, photo)
  const partnerPhoto = { ...photo, src: '/businesses/vesi-studio/interior-20261026.webp' }
  const nativePreview = compactDiscoveryRow({ ...row, source: 'gorez', photos: [partnerPhoto] }, intent)
  assert.deepEqual(nativePreview.photos, [partnerPhoto])
  assert.ok(nativePreview.servicePreview.every(service => service.category === 'hair'))
})
