import assert from 'node:assert/strict'
import test from 'node:test'
import { access, readFile } from 'node:fs/promises'
import coverOwners from '../lib/discovery-photo-cover-owners.json' with { type: 'json' }
import approvedOwnership from '../lib/discovery-photo-ownership.json' with { type: 'json' }
import { businessCoverPhotoSources, matchesBusinessCoverPhoto, publicBusinessCoverPhoto } from '../lib/public-business-cover-photo.mjs'
import { publicServiceThumbnail } from '../lib/discovery-photo-presentation.mjs'

test('the homepage cover entry point only imports the exact reviewed cover manifest', async () => {
  assert.deepEqual(coverOwners, approvedOwnership.coverOwners)
  for (const src of Object.keys(coverOwners)) await access(new URL('../public' + src, import.meta.url))
  const [component, coverEntry] = await Promise.all(['../components/business-cover-photo.js', '../lib/public-business-cover-photo.mjs']
    .map(p => readFile(new URL(p, import.meta.url), 'utf8')))
  assert.match(component, /from '\.\.\/lib\/public-business-cover-photo\.mjs'/u)
  assert.match(coverEntry, /from '\.\/discovery-photo-cover-owners\.json'/u)
  for (const source of [component, coverEntry]) assert.doesNotMatch(source, /discovery-photo-(?:ownership\.json|presentation\.mjs)/u)
})

test('cover-only resolution keeps exact ownership and same-activity error fallback', () => {
  const owner = {
    id: 'sofia-photo-studio-margo-svoboda',
    category: 'other',
    illustrativeCoverPhotoKey: 'sx-outdoor-family-photoshoot',
  }
  const large = '/business-cover-photos/activity-sx-outdoor-family-photoshoot-v1.webp'
  const small = '/service-photos/sx-outdoor-family-photoshoot-v1.webp'
  const activity = owner.illustrativeCoverPhotoKey
  assert.equal(publicBusinessCoverPhoto(owner).src, large)
  assert.equal(publicBusinessCoverPhoto(owner).activityPhotoKey, activity)
  assert.equal(publicBusinessCoverPhoto(owner, { unavailableSources: [large] }).src, small)
  assert.equal(publicBusinessCoverPhoto(owner, { unavailableSources: [large, small] }).src, null)
  assert.equal(publicBusinessCoverPhoto({ ...owner, id: 'another-branch' }).src, null)
  assert.deepEqual(businessCoverPhotoSources(owner), [large, small])
  assert.equal(matchesBusinessCoverPhoto(small + '?w=160', businessCoverPhotoSources(owner)), true)
  assert.equal(matchesBusinessCoverPhoto('/service-photos/makeup-v1.webp', businessCoverPhotoSources(owner)), false)
})

test('the distinct branch cover and service resolver share the original identity rules', () => {
  const row = { id: 'sofia-latin-force-centre', source: 'catalogue', category: 'fitness' }
  const service = { name: 'Индивидуален урок по танци', category: 'fitness' }
  const cover = '/business-cover-photos/go-latin-force-centre-20261125-v1.webp'
  const illustration = '/service-photos/go-latin-force-individual-dance-20261125-v1.webp'
  assert.deepEqual(publicBusinessCoverPhoto(row), { category: 'fitness', src: cover, size: 720, height: 540 })
  assert.equal(publicBusinessCoverPhoto(row, { unavailableSources: [cover] }).src, null)
  assert.equal(publicServiceThumbnail(service, { business: row }).src, illustration)
  assert.notEqual(publicServiceThumbnail(service, { business: { ...row, id: 'unknown-branch' } }).src, illustration)
  assert.notEqual(publicServiceThumbnail({ ...service, name: 'Други танци' }, { business: row }).src, illustration)
})
