import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import scopes from '../lib/provider-role-illustrations.json' with { type: 'json' }
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { findPublicCatalogueEntry } from '../lib/discovery/public-catalogue.mjs'
import { publicBusinessCoverPhoto, businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { providerRoleIllustration } from '../lib/provider-role-illustrations.mjs'
import { publicDetailPhotoPayload } from '../lib/public-detail-photo-payload.mjs'
import { businessDetailServices } from '../lib/discovery/business-details.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'

const now = Date.parse('2026-11-27T12:00:00Z')
const catalogue = id => catalogueProfileView(findPublicCatalogueEntry(id), { now })
const oldLawCover = '/business-cover-photos/other-v1.webp'
const oldLawDetail = '/service-photos/go-detail-law-office-in-person-20261126-v2.webp'
const newLawCover = '/business-cover-photos/role-matched-lawyer-man-cover-20261127-v1.webp'
const newLawDetail = '/service-photos/role-matched-lawyer-woman-detail-20261127-v1.webp'
const photo = path => readFileSync(new URL('../public' + path, import.meta.url))

test('the reported lawyer gets a male lawyer illustration, not the clinic or a photograph of the person', () => {
  const nikolay = catalogue('sofia-nikolay-vivianov-vasilev-lavele16')
  const illustrated = publicBusinessCoverPhoto(nikolay)
  assert.equal(illustrated.src, newLawCover)
  assert.equal(illustrated.activityPhotoKey, 'legal-consultation')
  assert.equal(publicDetailPhotoPayload(nikolay)[0][0].src, oldLawDetail)

  // Failed browser images cannot uncover the previous, opposite-role source.
  for (const unavailableSources of [[newLawCover], [newLawCover, oldLawCover]]) {
    const retry = publicBusinessCoverPhoto(nikolay, { unavailableSources })
    assert.notEqual(retry.src, oldLawCover)
    assert.notEqual(retry.src, '/service-photos/legal-consultation-v1.webp')
  }
  assert.ok(businessCoverPhotoSources(nikolay).includes('/service-photos/legal-consultation-v1.webp'))

  const ownerPhoto = '/api/catalogue-media/af27af27-9e91-4ec7-8686-344779c3b2fb'
  assert.deepEqual(businessCoverPhotoSources({ ...nikolay, photo: { src: ownerPhoto } }), [ownerPhoto])
  assert.equal(providerRoleIllustration({ ...nikolay, source: 'gorez' }, oldLawCover, 'cover'), null)
})

test('the corresponding woman lawyer changes only her previously mismatched service photo', async () => {
  const ilona = catalogue('sofia-ilona-petrova-pozitano')
  assert.equal(publicBusinessCoverPhoto(ilona).src, oldLawCover)
  const [service] = businessDetailServices(ilona)
  const [choices] = publicDetailPhotoPayload(ilona)
  assert.equal(choices[0].src, newLawDetail)
  assert.equal(choices[0].illustration, true)
  assert.match(choices[0].alt.bg, /жена специалист/u)
  assert.match(choices[0].alt.en, /woman practitioner/u)
  assert.ok(choices.every(item => item.src !== oldLawDetail && item.src !== oldLawCover))
  assert.equal(providerRoleIllustration(ilona, oldLawDetail, 'service', { ...service, name: 'Друга услуга' }), null)
  assert.equal(providerRoleIllustration({ ...ilona, id: 'sofia-unknown-provider' }, oldLawDetail, 'service', service), null)
  const [cover, detail] = await Promise.all([oldLawCover, newLawDetail].map(path => fingerprintDiscoveryPhoto(photo(path))))
  assert.notEqual(cover.decoded, detail.decoded)
  assert.equal(compareDiscoveryPhotos(cover, detail), null)
})

test('every correction is pinned to an existing published branch or exact offer, with a valid WebP', async () => {
  const lookup = new Map()
  const get = id => {
    if (!lookup.has(id)) lookup.set(id, catalogue(id))
    const branch = lookup.get(id)
    assert.ok(branch, id)
    return branch
  }
  const paths = new Set()
  for (const [surface, rows] of Object.entries(scopes)) {
    for (const row of rows) {
      assert.ok(!paths.has(row.src), row.src)
      paths.add(row.src)
      assert.match(row.src, /^\/(business-cover-photos|service-photos)\/role-matched-[a-z-]+-20261127-v1\.webp$/u)
      const bytes = photo(row.src)
      const { format, width, height } = await sharp(bytes).metadata()
      assert.equal(format, 'webp')
      assert.ok(bytes.length < 100_000, row.src)
      assert.deepEqual([width, height], surface === 'cover' ? [720, 540] : [480, 480])
      for (const path of row.replaces) assert.ok(photo(path).length, path)
      if (surface === 'cover') {
        for (const id of row.providers) assert.equal(publicBusinessCoverPhoto(get(id)).src, row.src, id)
      } else {
        for (const [id, titles] of Object.entries(row.offers)) {
          const branch = get(id)
          const services = businessDetailServices(branch)
          const payload = publicDetailPhotoPayload(branch, services)
          for (const title of titles) {
            const i = services.findIndex(service => service.name === title)
            assert.ok(i >= 0, `${id}: ${title}`)
            assert.ok(payload[i].some(item => item.src === row.src), `${id}: ${title} => ${row.src}`)
            assert.ok(payload[i].every(item => !row.replaces.includes(item.src)), `${id}: ${title}`)
          }
        }
      }
    }
  }
})
