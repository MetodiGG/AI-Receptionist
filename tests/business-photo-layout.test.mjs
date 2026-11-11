import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { businessPhotoStyle } from '../lib/business-photo-layout.mjs'

test('only the reviewed G Point logo revision or explicit contain metadata gets a contained white frame', () => {
  const logo = { src: '/api/catalogue-media/eebc21d3-2f13-42cd-9f81-877eb6bc5736' }
  const snapshot = JSON.stringify(logo)
  assert.deepEqual(businessPhotoStyle(logo), { objectFit: 'contain', objectPosition: 'center', backgroundColor: '#fff' })
  assert.equal(JSON.stringify(logo), snapshot)
  assert.equal(businessPhotoStyle({ src: logo.src.replace('eebc', 'aabc') }).objectFit, 'cover')
  assert.equal(businessPhotoStyle({ src: '/businesses/studio/interior.webp', position: '50% 68%' }).objectPosition, '50% 68%')
  assert.equal(businessPhotoStyle({ fit: 'contain' }).objectFit, 'contain')
  for (const photo of [null, {}, { src: 'G Point' }, { fit: 'stretch' }, { position: {} }]) assert.equal(businessPhotoStyle(photo).objectFit, 'cover')
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
