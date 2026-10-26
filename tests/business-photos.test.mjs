import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { getBusinessPhotos, nextPhotoIndex, photoSwipeDirection } from '../lib/business-photos.mjs'

const business = { id: '450c5c2f-db41-476b-a21e-98cf5ee29194', slug: 'vesi-studio' }
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('Vesi Studio uses only its two supplied photos, with the interior as its cover', () => {
  const photos = getBusinessPhotos(business)
  assert.equal(photos.length, 2)
  assert.match(photos[0].src, /interior/)
  assert.match(photos[1].src, /entrance/)
  for (const photo of photos) {
    assert.match(photo.src, /^\/businesses\/vesi-studio\/[a-z0-9-]+\.webp$/)
    assert.equal(photo.width, 1200); assert.equal(photo.height, 1600)
    for (const locale of ['bg', 'en']) {
      assert.ok(photo.alt[locale].length > 10)
      assert.ok(photo.caption[locale].length > 2)
    }
  }
})

test('photos follow a stable business ID, never another tenant with a matching name or slug', () => {
  for (const value of [undefined, null, {}, { id: '__proto__' }, { id: 'constructor' }, { id: 'toString' }, { slug: 'vesi-studio' }, { id: 'other', slug: 'vesi-studio', name: 'ВЕСИ СТУДИО' }]) assert.deepEqual(getBusinessPhotos(value), [])
  assert.equal(getBusinessPhotos({ ...business, slug: 'renamed-profile' }).length, 2)
  const photos = getBusinessPhotos(business)
  photos[0].alt.en = 'Changed'; photos[0].src = '/wrong.webp'; photos[1].caption.bg = 'Changed'
  assert.notEqual(getBusinessPhotos(business)[0].alt.en, 'Changed')
  assert.match(getBusinessPhotos(business)[0].src, /interior/)
  assert.notEqual(getBusinessPhotos(business)[1].caption.bg, 'Changed')
})

test('published photos are optimized WebP files with correct dimensions and no embedded EXIF/location metadata', async () => {
  const nextRequire = createRequire(import.meta.resolve('next/package.json'))
  const sharp = nextRequire('sharp')
  for (const photo of getBusinessPhotos(business)) {
    const file = new URL(`../public${photo.src}`, import.meta.url)
    const bytes = await readFile(file)
    const metadata = await sharp(bytes).metadata()
    assert.equal(metadata.format, 'webp')
    assert.equal(metadata.width, photo.width); assert.equal(metadata.height, photo.height)
    assert.equal(metadata.exif, undefined); assert.equal(metadata.xmp, undefined); assert.equal(metadata.iptc, undefined)
    assert.ok((await stat(file)).size < 350000, 'photo should not slow down a mobile page')
  }
})

test('gallery arrows wrap in either direction, including a single-photo gallery', () => {
  assert.equal(nextPhotoIndex(0, 1, 2), 1); assert.equal(nextPhotoIndex(1, 1, 2), 0)
  assert.equal(nextPhotoIndex(0, -1, 2), 1); assert.equal(nextPhotoIndex(1, -1, 2), 0)
  assert.equal(nextPhotoIndex(0, 1, 1), 0); assert.equal(nextPhotoIndex(0, -1, 1), 0)
  assert.equal(nextPhotoIndex(0, 1, 0), 0)
})

test('only an intentional horizontal swipe changes photos, not a tap or a vertical scroll', () => {
  const start = { x: 150, y: 200 }
  assert.equal(photoSwipeDirection(start, { x: 80, y: 210 }), 1)
  assert.equal(photoSwipeDirection(start, { x: 220, y: 190 }), -1)
  for (const end of [{ x: 140, y: 210 }, { x: 80, y: 310 }, { x: 150, y: 400 }, null]) assert.equal(photoSwipeDirection(start, end), 0)
  assert.equal(photoSwipeDirection(null, start), 0)
})

test('public profile and directory expose the same curated list without extra database requests', async () => {
  const profile = await read('lib/public-booking.js'), directory = await read('app/api/public/businesses/route.js')
  for (const source of [profile, directory]) assert.match(source, /photos: getBusinessPhotos\(business\)/)
  const page = await read('components/public-booking-page.js'), cards = await read('components/business-directory.js')
  assert.match(page, /<BusinessPhotoGallery photos=\{business\.photos\}/)
  assert.match(page, /hasPhotos \? business\.name/)
  assert.match(cards, /row\.photos\?\.length > 0/)
  assert.match(cards, /BusinessPhotoGallery photos=\{row\.photos\}.*variant="directory"/)
})

test('gallery keeps native dialog focus/escape, labelled touch and keyboard controls, and uncropped full-size images', async () => {
  const source = await read('components/business-photo-gallery.js'), css = await read('app/globals.css')
  assert.match(source, /<dialog ref=\{dialogRef\}.*aria-labelledby=\{titleId\}/)
  assert.match(source, /\.showModal\(\)/); assert.match(source, /\.close\(\)/)
  assert.match(source, /ArrowRight/); assert.match(source, /ArrowLeft/)
  assert.match(source, /onTouchEnd=\{swipeEnd\}/)
  assert.match(source, /'Close photos' : 'Затвори снимките'/)
  assert.match(source, /'Previous photo' : 'Предишна снимка'/)
  assert.match(source, /'Next photo' : 'Следваща снимка'/)
  assert.match(css, /\.business-photo-viewer img \{ object-fit: contain; \}/)
  assert.match(source, /createPhotoAutoplay/)
  assert.match(source, /!paused && !media\.matches && !document\.hidden/)
  assert.match(source, /observer\?\.disconnect\(\)/)
  assert.match(source, /media\.removeEventListener/)
  assert.doesNotMatch(source, /text\(.*caption\)|fetch\(|<form/)
})
