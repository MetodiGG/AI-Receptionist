import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { businessPhotoStyle } from '../lib/business-photo-layout.mjs'
import { getBusinessPhotos } from '../lib/business-photos.mjs'

test('only the reviewed G Point logo revision or explicit contain metadata gets a contained white frame', () => {
  const logo = { src: '/api/catalogue-media/eebc21d3-2f13-42cd-9f81-877eb6bc5736' }
  const snapshot = JSON.stringify(logo)
  assert.deepEqual(businessPhotoStyle(logo), { objectFit: 'contain', objectPosition: 'center', backgroundColor: '#fff' })
  assert.equal(JSON.stringify(logo), snapshot)
  assert.deepEqual(businessPhotoStyle({ src: logo.src.replace('eebc', 'aabc') }), { objectFit: 'cover', objectPosition: 'center top' })
  assert.equal(businessPhotoStyle({ src: '/businesses/studio/interior.webp', position: '50% 68%' }).objectPosition, '50% 68%')
  assert.deepEqual(businessPhotoStyle({ fit: 'contain' }), { objectFit: 'contain', objectPosition: 'center', backgroundColor: '#fff' })
  for (const photo of [null, {}, { src: 'G Point' }, { fit: 'stretch' }, { position: {} }]) assert.equal(businessPhotoStyle(photo).objectFit, 'cover')
})

test('ordinary business covers preserve the top edge by default without stretching or adding a logo frame', () => {
  for (const photo of [undefined, null, {}, { src: '/api/business-media/owner-photo' }, { src: '/catalogue-media/reviewed-photo.webp' }]) {
    assert.deepEqual(businessPhotoStyle(photo), { objectFit: 'cover', objectPosition: 'center top' })
  }
})

test('empty, whitespace, oversized and non-string focal positions use the safe cover or contain default', () => {
  for (const position of ['', '   ', '\t\n', '1'.repeat(101), null, undefined, 50, false, {}, ['center']]) {
    assert.deepEqual(businessPhotoStyle({ position }), { objectFit: 'cover', objectPosition: 'center top' })
    assert.deepEqual(businessPhotoStyle({ fit: 'contain', position }), { objectFit: 'contain', objectPosition: 'center', backgroundColor: '#fff' })
  }
})

test('valid supplied focal positions are trimmed without mutation and the two intentional Vesi crops remain intact', () => {
  const photo = { src: '/businesses/studio/interior.webp', position: '  50% 68%  ' }
  const snapshot = JSON.stringify(photo)
  assert.equal(businessPhotoStyle(photo).objectPosition, '50% 68%')
  assert.equal(JSON.stringify(photo), snapshot)
  const photos = getBusinessPhotos({ id: '450c5c2f-db41-476b-a21e-98cf5ee29194' })
  assert.deepEqual(photos.map(item => businessPhotoStyle(item).objectPosition), ['50% 68%', '50% 56%'])
})

test('home card and real-photo carousel share the fit helper while full-size viewing remains uncropped', async () => {
  for (const file of ['components/discovery-business-card.js', 'components/business-photo-gallery.js']) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8')
    assert.match(source, /businessPhotoStyle/)
    assert.match(source, /style=\{businessPhotoStyle\(/)
  }
  const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.match(css, /\.business-photo-viewer img \{ object-fit: contain; \}/)
})

test('illustrative business covers share top anchoring without changing global images or service thumbnails', async () => {
  const css = await readFile(new URL('../app/service-photo-surfaces.css', import.meta.url), 'utf8')
  const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  const topAnchored = rules.filter(([, , body]) => /(?:^|;)\s*object-position:\s*center\s+top\s*(?:;|$)/.test(body))
  assert.deepEqual(topAnchored.map(([, selector]) => selector.trim()), ['.business-category-cover > img'])
  assert.match(topAnchored[0][2], /object-fit:\s*cover\s*;/)
  assert.doesNotMatch(css, /object-position:\s*center\s+47%/)
})
