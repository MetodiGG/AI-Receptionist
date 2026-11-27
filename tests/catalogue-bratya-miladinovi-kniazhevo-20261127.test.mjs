import test from 'node:test'
import { publishedBaselineMatches } from './catalogue-only-release-scope.mjs'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { businessDirectionsUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { VERIFIED_BRATYA_MILADINOVI_KNIAZHEVO_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-bratya-miladinovi-kniazhevo-20261127.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE as currentRaw, SOFIA_CATALOGUE as current } from '../lib/discovery/sofia-catalogue.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'
import { allowsFileChange, allowsNewFile, priorCatalogue, priorSource } from './catalogue-bratya-miladinovi-kniazhevo-20261127-scope.mjs'
import receipt from './fixtures/catalogue-bratya-miladinovi-kniazhevo-20261127.json' with { type: 'json' }
import * as later from './catalogue-dekra-fakulteta-20261127-scope.mjs'

const RAW_SOFIA_CATALOGUE = later.priorCatalogue(currentRaw)
const SOFIA_CATALOGUE = later.priorCatalogue(current)
const now = Date.parse('2026-11-27T12:00:00Z')
const id = 'sofia-bratya-miladinovi-kniazhevo-tsar-boris375'
const row = SOFIA_CATALOGUE.find(row => row.id === id)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const digest = value => sha(JSON.stringify(value))

test('adds exactly one verified Knyazhevo service provider and no other runtime changes', () => {
  for (const rows of [SOFIA_CATALOGUE, RAW_SOFIA_CATALOGUE]) {
    assert.equal(digest(rows), receipt.catalogue.after)
    assert.equal(digest(priorCatalogue(rows)), receipt.catalogue.before)
  }
  const root = fileURLToPath(new URL('../', import.meta.url))
  const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 })
  const files = b => b.toString('utf8').split('\0').filter(path => path && path !== 'node_modules' && !path.startsWith('tests/') && !publishedBaselineMatches(path))
  const changed = new Set([...files(git('diff', '--name-only', '-z', receipt.baseline, '--')),
    ...files(git('ls-files', '--others', '--exclude-standard', '-z'))])
  for (const path of changed) if (later.allowsNewFile(path)) changed.delete(path)
  assert.deepEqual([...changed].sort(), [...Object.keys(receipt.changed), ...Object.keys(receipt.added)].sort())
  for (const [path, hashes] of Object.entries(receipt.changed)) {
    const current = later.priorSource(path, readFileSync(new URL('../' + path, import.meta.url)))
    assert.equal(allowsFileChange(path), true, path)
    assert.equal(sha(current), hashes.after, path)
    assert.equal(sha(priorSource(path, current)), hashes.before, path)
  }
  for (const path of Object.keys(receipt.added)) assert.equal(allowsNewFile(path), true, path)
})

test('Knyazhevo lessons gain one provider with a verified address, not a second profile for its classes', () => {
  const reports = [priorCatalogue(SOFIA_CATALOGUE), SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, {now,target:30}))
  const cells = reports.map(report => report.neighborhoods.find(area => area.name === 'Княжево').cells.find(cell => cell.categoryId === 'education'))
  assert.deepEqual(cells.map(cell => cell.count), [2, 3])
  assert.equal(cells[1].locatedCount, cells[0].locatedCount + 1)
  assert.equal(cells[1].locatedBusinessIds.filter(value => value === id).length, 1)
  assert.equal(reports[1].counts.approvedBusinesses - reports[0].counts.approvedBusinesses, 1)
  const point = catalogueBoundCoordinates(row)
  assert.deepEqual([point.addressId, point.latitude, point.longitude], ['12841',42.658410,23.239883])
  assert.equal(catalogueBoundCoordinates({...row,address:row.address + 'А'}), null)
})

test('an actual phone-enrolment lesson has no invented price, timetable or included promotion', async () => {
  const view = catalogueProfileView(row, {now})
  const [review] = VERIFIED_BRATYA_MILADINOVI_KNIAZHEVO_20261127_REVIEWS
  assert.equal(assessPricingReview(row, review, now).pricingState, 'not_publicly_listed')
  assert.equal(assessPricingReview(row, review, now).reviewedPriceCount, 0)
  assert.equal(assessPricingReview(row, {...review, priceSearch: {...review.priceSearch, outcome:'blocked'}}, now).state, 'pending')
  assert.equal(approvedCatalogueRecord(row, Date.parse('2026-12-19T12:00:00Z')), null)
  assert.deepEqual(railExternalAction(view, now), {kind:'phone',href:'tel:+359898731618'})
  assert.equal(new URL(businessDirectionsUrl(view)).searchParams.get('destination'), '42.65841,23.239883')
  assert.equal(view.details.services.length, 1)
  const [service] = view.details.services
  assert.equal(service.price, null)
  assert.equal(service.presentationEn.name, 'One-to-one visual arts lesson')
  assert.doesNotMatch(service.description, /безплат|евро/u)
  assert.equal(row.services[0].durationMin, undefined)
  const cover = businessCoverPhotoSources(view)[0]
  const thumb = publicDetailServiceThumbnail(service, {business:view})
  assert.equal(thumb.source, 'illustrative')
  const files = [[cover, 960, 720], [thumb.src, 480, 480]]
  const fingerprints = await Promise.all(files.map(async ([path,width,height]) => {
    const data = readFileSync(new URL('../public' + path, import.meta.url))
    const metadata = await sharp(data).metadata()
    assert.deepEqual([metadata.format,metadata.width,metadata.height], ['webp',width,height])
    return fingerprintDiscoveryPhoto(data)
  }))
  assert.equal(compareDiscoveryPhotos(...fingerprints), null)
})
