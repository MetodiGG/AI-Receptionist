import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { DISCOVERY_SUBCATEGORIES, subcategoriesForCategory, subcategoryOptionsForBusinesses } from '../lib/discovery/subcategories.mjs'
import { homeCategories } from '../lib/discovery/home.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueDetailsWithServicePhotos } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { APPROVED_SERVICE_PHOTO_IDS } from '../lib/service-photos.mjs'
import { SPECIFIC_SERVICE_PHOTO_IDS } from '../lib/specific-service-photo-ids.mjs'
import { GENERATED_CATALOGUE_SERVICE_PHOTO_IDS } from '../lib/service-photos-catalogue-expansion.mjs'
import { REVIEWED_PARTNER_SERVICE_PHOTOS } from '../lib/partner-service-photos.mjs'

const read = file => readFile(new URL(`../${file}`, import.meta.url))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const receipt = JSON.parse(await read('docs/subcategory-photo-role-separation-20261125.json'))
const expectedIds = ['hair-children', 'education-school', 'education-exam-preparation', 'health-rehabilitation', 'consulting-business']
const dedicatedIds = new Set(expectedIds)

test('all 113 navigation choices have distinct URLs and only the five reviewed slots receive dedicated illustrative photos', () => {
  assert.equal(DISCOVERY_SUBCATEGORIES.length, 113)
  assert.equal(new Set(DISCOVERY_SUBCATEGORIES.map(item => item.photo)).size, 113)
  assert.deepEqual(receipt.assets.map(item => item.id), expectedIds)
  for (const item of DISCOVERY_SUBCATEGORIES) {
    if (dedicatedIds.has(item.id)) {
      assert.equal(item.photo, `/subcategory-photos/${item.id}-v1.webp`)
      assert.equal(item.photoSource, 'illustrative')
    } else {
      assert.match(item.photo, /^\/service-photos\/[a-z0-9-]+-v1\.webp$/)
      assert.equal(item.photoSource, undefined)
    }
  }
  // Restore only the five old photos, remove their added disclosure metadata,
  // and prove all IDs, labels, ordering and remaining photo assignments match
  // the actual production baseline, rather than a hand-maintained short list.
  const previous = new Map(receipt.assets.map(item => [item.id, item.previousPhoto]))
  const baseline = DISCOVERY_SUBCATEGORIES.map(({ photoSource, ...item }) => ({ ...item, photo: previous.get(item.id) || item.photo }))
  assert.equal(hash(JSON.stringify(baseline)), '655afefe7d68646587634d5164eeae69ee319186bc9dd7d1e9f93f3f46096570')
})

test('dedicated photo disclosure survives localized taxonomy metadata and actual positive-evidence options', () => {
  for (const locale of ['bg', 'en']) for (const id of expectedIds) {
    const item = DISCOVERY_SUBCATEGORIES.find(item => item.id === id)
    const localized = subcategoriesForCategory(item.category, locale).find(option => option.id === id)
    assert.equal(localized.photo, item.photo)
    assert.equal(localized.photoSource, 'illustrative')
    const options = subcategoryOptionsForBusinesses([{ category: item.category, services: [{ name: item.bg, category: item.category }] }], item.category, locale)
    const option = options.find(option => option.id === id)
    assert.ok(option, id)
    assert.equal(option.photoSource, 'illustrative')
    assert.equal(option.photo, item.photo)
  }
})

test('the five navigation files have reviewed distinct new source receipts and optimized full-frame image derivatives', async () => {
  assert.equal(receipt.status, 'accepted')
  assert.equal(receipt.role, 'subcategory_navigation_only')
  const sources = new Set(), outputs = new Set(), existingSourceHashes = new Set()
  function collectSourceHashes(value) {
    if (!value || typeof value !== 'object') return
    if (typeof value.sourceSha256 === 'string') existingSourceHashes.add(value.sourceSha256)
    for (const child of Object.values(value)) if (typeof child === 'object') collectSourceHashes(child)
  }
  for (const file of ['docs/service-photo-generation-2026-11-12.json', 'docs/specific-service-photo-generation-2026-11-12.json', 'docs/partner-service-photo-assets-2026-11-13.json', 'docs/category-photo-refinement-20261122.json', 'docs/business-activity-cover-sources-2026-11-15.json']) {
    collectSourceHashes(JSON.parse(await read(file)))
  }
  let totalBytes = 0
  for (const asset of receipt.assets) {
    assert.equal(asset.file, `public/subcategory-photos/${asset.id}-v1.webp`)
    assert.match(asset.sourceFile, /\.png$/)
    assert.match(asset.sourceSha256, /^[a-f0-9]{64}$/)
    assert.equal(asset.review.status, 'accepted')
    assert.ok(!sources.has(asset.sourceSha256), 'a new filename/crop of the same original cannot masquerade as another scene')
    assert.ok(!existingSourceHashes.has(asset.sourceSha256), `${asset.id}: a service, cover or main-category original must not be repackaged as new navigation artwork`)
    sources.add(asset.sourceSha256)
    const bytes = await read(asset.file), meta = await sharp(bytes).metadata()
    assert.equal(hash(bytes), asset.sha256)
    assert.equal(bytes.length, asset.bytes)
    assert.equal(meta.format, 'webp')
    assert.equal(meta.width, asset.width); assert.equal(meta.height, asset.height)
    assert.deepEqual([meta.width, meta.height], [640, 480])
    assert.ok(asset.sourceWidth >= meta.width && asset.sourceHeight >= meta.height, 'never enlarge an original')
    assert.equal(meta.width * asset.sourceHeight, meta.height * asset.sourceWidth, 'retain the complete original aspect ratio')
    assert.ok(meta.width >= 320 && meta.width <= 1200)
    assert.ok(bytes.length < 150000)
    assert.equal(meta.exif, undefined); assert.equal(meta.xmp, undefined)
    assert.ok(!outputs.has(asset.sha256))
    outputs.add(asset.sha256)
    totalBytes += bytes.length
  }
  assert.equal(totalBytes, receipt.totalBytes)
})

test('dedicated navigation paths never enter existing main-category, catalogue or partner service photo resolution', () => {
  const serviceIds = new Set([...APPROVED_SERVICE_PHOTO_IDS, ...SPECIFIC_SERVICE_PHOTO_IDS, ...GENERATED_CATALOGUE_SERVICE_PHOTO_IDS, ...REVIEWED_PARTNER_SERVICE_PHOTOS.map(item => item.photoId)])
  for (const id of expectedIds) assert.ok(!serviceIds.has(id), `${id} is navigation only, not a new service-photo allowlist entry`)
  for (const item of homeCategories()) assert.ok(!item.photo.startsWith('/subcategory-photos/'))
  let inspected = 0
  for (const business of SOFIA_CATALOGUE) for (const service of catalogueDetailsWithServicePhotos(business).services) {
    const photo = serviceThumbnail(service, { business })
    assert.ok(!photo.src.startsWith('/subcategory-photos/'), `${business.id}: navigation imagery leaked into a service thumbnail`)
    inspected++
  }
  assert.ok(inspected >= 10403)
})
