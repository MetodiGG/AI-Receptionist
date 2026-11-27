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
import { VERIFIED_DEKRA_FAKULTETA_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-dekra-fakulteta-20261127.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE as currentRaw, SOFIA_CATALOGUE as current } from '../lib/discovery/sofia-catalogue.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'
import { priorCatalogue, priorSource } from './catalogue-dekra-fakulteta-20261127-scope.mjs'
import receipt from './fixtures/catalogue-dekra-fakulteta-20261127.json' with { type: 'json' }
import * as later from './catalogue-sofia-west-appointments-20261127-scope.mjs'

const RAW_SOFIA_CATALOGUE = later.priorCatalogue(currentRaw)
const SOFIA_CATALOGUE = later.priorCatalogue(current)
const now = Date.parse('2026-11-27T12:00:00Z')
const id = 'sofia-dekra-automotive-fakulteta-suhodolska102'
const row = SOFIA_CATALOGUE.find(row => row.id === id)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const digest = value => sha(JSON.stringify(value))

test('one precise new Sofia entry is added without altering existing catalogue records or unrelated runtime files', () => {
  for (const rows of [SOFIA_CATALOGUE, RAW_SOFIA_CATALOGUE]) {
    assert.equal(digest(rows), receipt.catalogue.after)
    assert.equal(digest(priorCatalogue(rows)), receipt.catalogue.before)
    assert.equal(rows.filter(r => r.id === id || r.website === row.website || r.phone === row.phone).length, 1)
  }
  const root = fileURLToPath(new URL('../', import.meta.url))
  const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 })
  const files = bytes => bytes.toString('utf8').split('\0').filter(path => path && path !== 'node_modules' && !path.startsWith('tests/') && !publishedBaselineMatches(path))
  const changed = new Set([...files(git('diff', '--name-only', '-z', receipt.baseline, '--')),
    ...files(git('ls-files', '--others', '--exclude-standard', '-z'))])
  for (const path of changed) if (later.allowsNewFile(path)) changed.delete(path)
  assert.deepEqual([...changed].sort(), [...Object.keys(receipt.changed), ...Object.keys(receipt.added)].sort())
  for (const [path, hashes] of Object.entries(receipt.changed)) {
    const current = later.priorSource(path, readFileSync(new URL('../' + path, import.meta.url)))
    assert.equal(sha(current), hashes.after, path)
    assert.equal(sha(priorSource(path, current)), hashes.before, path)
  }
  for (const [path, hash] of Object.entries(receipt.added)) {
    assert.equal(sha(readFileSync(new URL('../' + path, import.meta.url))), hash, path)
  }
})

test('an empty Fakulteta cell gets a single properly bound auto service location', () => {
  const reports = [priorCatalogue(SOFIA_CATALOGUE), SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const cells = reports.map(report => report.neighborhoods.find(area => area.name === 'Факултета').cells.find(cell => cell.categoryId === 'auto_repair'))
  assert.deepEqual(cells.map(cell => [cell.count, cell.locatedCount, cell.gap]), [[0, 0, 30], [1, 1, 29]])
  assert.equal(reports[1].counts.zeroCells, reports[0].counts.zeroCells - 1)
  assert.deepEqual(cells[1].locatedBusinessIds, [id])
  const point = catalogueBoundCoordinates(row)
  assert.deepEqual([point.addressId, point.latitude, point.longitude], ['106040', 42.695959, 23.232031])
  assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'А' }), null)
  assert.equal(catalogueBoundCoordinates({ ...row, neighborhood: 'Суходол' }), null)
  assert.equal(new URL(businessDirectionsUrl(catalogueProfileView(row, { now }))).searchParams.get('destination'), '42.695959,23.232031')
})

test('the published fixed M1/M1G price, extra charge and outbound booking remain independent of any GoRez reservation', async () => {
  const [review] = VERIFIED_DEKRA_FAKULTETA_20261127_REVIEWS
  assert.equal(assessPricingReview(row, review, now).reviewedPriceCount, 1)
  assert.equal(assessPricingReview({ ...row, services: [{ ...row.services[0], price: { ...row.services[0].price, amount: 55 } }] }, review, now).state, 'pending')
  const view = catalogueProfileView(row, { now })
  assert.deepEqual(railExternalAction(view, now), { kind: 'form', href: 'https://dekra-automotive.bg/?c=reservation' })
  assert.equal(approvedCatalogueRecord(row, Date.parse('2026-12-19T12:00:00Z')), null)
  assert.equal(view.details.services.length, 1)
  const [service] = view.details.services
  assert.deepEqual([service.price, service.priceKind, service.currency, service.durationMin], [50, 'fixed', 'EUR', null])
  assert.match(service.description, /с ДДС.+5 €.+същия ден може да бъде отказана/u)
  assert.equal(service.presentationEn.name, 'Annual roadworthiness test for a passenger car · M1/M1G')
  assert.match(service.presentationEn.description, /VAT is included.+€5 extra.+same-day requests may be declined/u)
  const cover = businessCoverPhotoSources(view)[0]
  const detail = publicDetailServiceThumbnail(service, { business: view })
  assert.equal(detail.source, 'illustrative')
  assert.notEqual(cover, detail.src)
  const files = [[cover, 960, 720], [detail.src, 480, 480]]
  const fingerprints = await Promise.all(files.map(async ([path, width, height]) => {
    const bytes = readFileSync(new URL('../public' + path, import.meta.url))
    const metadata = await sharp(bytes).metadata()
    assert.deepEqual([metadata.format, metadata.width, metadata.height], ['webp', width, height])
    return fingerprintDiscoveryPhoto(bytes)
  }))
  assert.equal(compareDiscoveryPhotos(...fingerprints), null)
})
