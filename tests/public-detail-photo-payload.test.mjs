import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { findPublicCatalogueEntry } from '../lib/discovery/public-catalogue.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { businessDetailServices } from '../lib/discovery/business-details.mjs'
import { businessCoverPhotoSources, matchesBusinessCoverPhoto } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { publicDetailPhotoPayload } from '../lib/public-detail-photo-payload.mjs'

const now = Date.parse('2026-11-27T01:00:00+02:00')
const request = (id, photos = false, headers) => new Request('https://www.gorez.co/api/public/discovery/business/' + id + (photos ? '?photos=1' : ''), { headers })
const detail = createPublicBusinessDetailsHandler({
  config: { enabled: true, environment: 'production' }, now: () => now, allowAttempt: async () => true,
  findCatalogue: findPublicCatalogueEntry, readCataloguePhotos: async () => [],
})

test('only the opt-in detail response adds photos, keeping the exact authorized menu, price sources, links and no-store policy', async () => {
  const ids = ['sofia-beauty-studio-99', 'sofia-nosia-todor-alexandrov17', 'sofia-alyoga-benkovski', 'sofia-autocomplex-rs']
  for (const id of ids) {
    const original = await detail(request(id), id), next = await detail(request(id, true), id)
    assert.equal(original.status, 200, id)
    assert.equal(next.status, 200, id)
    assert.match(next.headers.get('Cache-Control'), /no-store/u)
    const { business: baseline } = await original.json()
    const { business: { detailServicePhotos, ...business } } = await next.json()
    assert.deepEqual(business, baseline, id)
    const services = businessDetailServices(business), covers = businessCoverPhotoSources(business)
    assert.equal(detailServicePhotos.length, services.length, id)
    assert.ok(detailServicePhotos.some(candidates => candidates.length > 0), id)
    for (const [index, candidates] of detailServicePhotos.entries()) {
      assert.ok(candidates.length <= 3)
      assert.equal(new Set(candidates.map(candidate => candidate.src)).size, candidates.length)
      const expected = publicDetailServiceThumbnail(services[index], { business, coverSources: covers })
      assert.equal(candidates[0]?.src ?? null, expected.src ?? null, services[index].name)
      for (const candidate of candidates) {
        assert.equal(matchesBusinessCoverPhoto(candidate.src, covers), false)
        assert.match(candidate.src, /^\/service-photos\/[a-z0-9-]+\.webp$/u)
        assert.ok(existsSync(new URL('../public' + candidate.src, import.meta.url)), candidate.src)
        assert.ok(candidate.alt.bg && candidate.alt.en)
      }
    }
  }
  assert.equal((await detail(request(ids[0], true, { 'Sec-Fetch-Site': 'cross-site' }), ids[0])).status, 403)
})

test('only the reviewed partner can receive its own authentic service photo, and not if it is one of its gallery images', () => {
  const { businesses } = JSON.parse(readFileSync(new URL('./fixtures/native-partner-services-20261113.json', import.meta.url)))
  const original = businesses.find(row => row.services.some(service => service.id === 'ddb089f1-4fb3-422f-8fae-5b1689c1a0da'))
  const service = original.services.find(item => item.id === 'ddb089f1-4fb3-422f-8fae-5b1689c1a0da')
  const branch = { ...original, source: 'gorez', services: [service] }
  const [[image]] = publicDetailPhotoPayload(branch)
  assert.match(image.src, /partner-megan-supplied-v1\.webp$/u)
  assert.equal(image.illustration, false)
  assert.deepEqual(publicDetailPhotoPayload({ ...branch, id: '00000000-0000-4000-8000-000000000000' }), [[]])
  assert.ok(publicDetailPhotoPayload({ ...branch, photos: [{ src: image.src }] })[0].every(photo => photo.src !== image.src))
})

test('the browser-facing service menu no longer imports the catalogue-wide image resolver', () => {
  const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
  const menu = read('components/public-service-menu.js'), renderer = read('components/prepared-service-thumbnail.js')
  assert.match(menu, /\.\/prepared-service-thumbnail/u)
  for (const source of [menu, renderer]) assert.doesNotMatch(source, /service-detail-photo-presentation|from ['"]\.\/service-thumbnail['"]|from ['"].*public-detail-photo-payload/u)
})
