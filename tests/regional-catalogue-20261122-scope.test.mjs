import { sofiaIntegrityPriorSource, sofiaIntegrityAllowsFileChange, sofiaIntegrityAllowsNewFile } from "./sofia-location-image-integrity-20261124-scope.mjs"
import { suhodolIntakeAllowsFileChange, suhodolIntakeAllowsNewFile, suhodolIntakePriorSource, suhodolIntakePriorCatalogue } from './suhodol-intake-20261122-scope.mjs'
import { nearbyPointsAllowsFileChange, nearbyPointsAllowsNewFile, nearbyPointsPriorSource, nearbyPointsPriorCatalogue } from './nearby-points-20261122-scope.mjs'
import { locationRecoveryAllowsFileChange, locationRecoveryAllowsNewFile, locationRecoveryPriorSource } from './location-recovery-20261122-scope.mjs'
import { priority30ReportAllowsFileChange, priority30ReportAllowsNewFile, priority30ReportPriorSource } from './priority30-catalogue-report-scope.mjs'
import { azisCatalogueAllowsFileChange, azisCatalogueAllowsNewFile, azisCataloguePriorSource } from './azis-style-catalogue-20261122-scope.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { REGIONAL_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import {
  REGIONAL_CATALOGUE_BASE, REGIONAL_CATALOGUE_HASHES, REGIONAL_CATALOGUE_NEW_HASHES,
  regionalCatalogueAllowsFileChange, regionalCatalogueAllowsNewFile, regionalCataloguePriorSource,
} from './regional-catalogue-20261122-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8').then(source => azisCataloguePriorSource(path, priority30ReportPriorSource(path, locationRecoveryPriorSource(path, nearbyPointsPriorSource(path, suhodolIntakePriorSource(path, sofiaIntegrityPriorSource(path, source)))))))
const before = path => git('show', REGIONAL_CATALOGUE_BASE + ':' + path)
const sha256 = source => createHash('sha256').update(source).digest('hex')
const productionPath = path => path !== 'node_modules' && !/^tests\//u.test(path)
const tree = git('ls-tree', '-r', '-z', REGIONAL_CATALOGUE_BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob' && productionPath(record.path))
const oldScopes = ['discovery-refinement-20261122', 'next-security-upgrade', 'stationary-discovery', 'public-action', 'public-english', 'services-price-cards', 'catalogue-revalidation-20261122', 'sports-mobile-photo-fit'].map(name => `tests/${name}-scope.mjs`)

test('the regional stage seals only twenty exact existing adapter/gate paths, five new runtime files and three dated research receipts', async () => {
  assert.deepEqual(Object.keys(REGIONAL_CATALOGUE_HASHES).sort(), [
    'app/api/public/catalogue-onboarding/route.js', 'app/api/public/discovery/business/[id]/route.js', 'app/api/public/discovery/suggestions/route.js',
    'app/dev/sofia-catalogue/business/[id]/route.js', 'app/sitemap.js',
    'lib/catalogue-onboarding.mjs', 'lib/catalogue-photo-view.mjs', 'lib/catalogue-profile-server.js', 'lib/catalogue-service-photo-keys.mjs',
    'lib/discovery/catalogue-policy.mjs', 'lib/discovery/catalogue-search.mjs', 'lib/discovery/public-details.mjs', 'lib/discovery/search.mjs', 'lib/discovery/suggestions-ui.mjs',
    'lib/locale/service-english.json', 'lib/specific-service-photo-ids.mjs',
    'scripts/check-catalogue-pricing.mjs', 'scripts/check-public-english.mjs', 'scripts/check-specific-service-photos.mjs', 'scripts/inventory-public-english.mjs',
  ].sort())
  assert.deepEqual(Object.keys(REGIONAL_CATALOGUE_NEW_HASHES).sort(), [
    'lib/discovery/catalogue-cities.mjs', 'lib/discovery/public-catalogue.mjs',
    'lib/discovery/catalogue-data/lom-brusartsi-20261122.mjs', 'lib/discovery/catalogue-data/lom-gpoint-20261122.mjs',
    'lib/catalogue-service-photo-associations-20261122.mjs',
    'docs/catalogue-regions/research-brusartsi-20261122.json', 'docs/catalogue-regions/research-lom-20261122.json', 'docs/catalogue-regions/research-gpoint-lom-20261122.json',
  ].sort())
  for (const [path, hash] of Object.entries({ ...REGIONAL_CATALOGUE_HASHES, ...REGIONAL_CATALOGUE_NEW_HASHES })) {
    assert.equal(sha256(await read(path)), hash, path + ': any later change needs a separate focused review')
    assert.equal(sofiaIntegrityAllowsFileChange(path) || suhodolIntakeAllowsFileChange(path) || regionalCatalogueAllowsFileChange(path) || regionalCatalogueAllowsNewFile(path) || azisCatalogueAllowsFileChange(path), true, path)
  }
  for (const path of ['lib/discovery/sofia-catalogue.mjs', 'lib/discovery/catalogue-data/pricing-review-baseline-20261110.json', 'lib/discovery/catalogue-data/pricing-booking-review-identities-20261110.json', 'lib/discovery/subcategories.mjs', 'components/discovery-search.js', 'components/discovery-business-card.js', 'lib/service-thumbnail.mjs', 'lib/booking-engine.mjs', 'app/inline-discovery.css', 'package.json', 'pnpm-lock.yaml', 'next.config.mjs']) {
    assert.equal(regionalCatalogueAllowsFileChange(path), false, path)
    assert.equal(regionalCatalogueAllowsNewFile(path), false, path)
  }
})

test('every other production, original asset, Sofia source/receipt/baseline, UI, booking and configuration byte remains frozen to the published release', async () => {
  const frozen = tree.filter(record => !sofiaIntegrityAllowsFileChange(record.path) && !regionalCatalogueAllowsFileChange(record.path) && !azisCatalogueAllowsFileChange(record.path) && !priority30ReportAllowsFileChange(record.path) && !suhodolIntakeAllowsFileChange(record.path) && !nearbyPointsAllowsFileChange(record.path) && !locationRecoveryAllowsFileChange(record.path))
  for (let offset = 0; offset < frozen.length; offset += 32) await Promise.all(frozen.slice(offset, offset + 32).map(async record => {
    const path = new URL('../' + record.path, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), record.oid, record.path + ' stays byte-identical to ' + REGIONAL_CATALOGUE_BASE)
  }))
  const baselinePaths = new Set(tree.map(record => record.path))
  const actual = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(path => (!sofiaIntegrityAllowsNewFile(path) || baselinePaths.has(path)) && path && !suhodolIntakeAllowsNewFile(path) && !nearbyPointsAllowsNewFile(path) && !locationRecoveryAllowsNewFile(path) && !priority30ReportAllowsNewFile(path) && !azisCatalogueAllowsNewFile(path) && productionPath(path))
  assert.deepEqual([...new Set(actual)].sort(), [...tree.map(record => record.path), ...Object.keys(REGIONAL_CATALOGUE_NEW_HASHES)].sort(), 'only the exact five regional runtime files and three research receipts may enter the inventory')
  for (const path of oldScopes) assert.equal(await read(path), before(path), path + ': historical authorizations cannot be widened or rebaselined')
})

test('literal forward-delta reversals retain historical source/hash proofs without hiding unrelated edits', async () => {
  for (const path of Object.keys(REGIONAL_CATALOGUE_HASHES)) {
    const source = await read(path), previous = before(path)
    assert.equal(regionalCataloguePriorSource(path, azisCataloguePriorSource(path, source)), previous, path + ': every previous source byte is reconstructed')
    assert.equal(regionalCataloguePriorSource(path, previous), previous)
    assert.throws(() => regionalCataloguePriorSource(path, source + '\n'), /Unreviewed regional source delta/u, path + ': an extra byte cannot disappear in canonicalization')
  }
  assert.equal(regionalCataloguePriorSource('components/discovery-search.js', await read('components/discovery-search.js')), before('components/discovery-search.js'))
})

test('the shared city identity stays client-light and the standard pricing, photograph and English gates cover the combined inventory without release bypasses', async () => {
  const city = await read('lib/discovery/catalogue-cities.mjs')
  assert.doesNotMatch(city, /^\s*import\b|fetch\s*\(|supabase|service-english|sofia-catalogue|public-catalogue/mu)
  const priceGate = await read('scripts/check-catalogue-pricing.mjs')
  assert.match(priceGate, /auditCataloguePricing\(PUBLIC_CATALOGUE, baseline, \[\.\.\.BOOKING_PRICE_REVIEWS, \.\.\.PUBLIC_CATALOGUE_PRICE_REVIEWS\]\)/u)
  assert.match(priceGate, /if \(report\.blocking\.length\) process\.exitCode = 1/u)
  assert.match(await read('scripts/check-specific-service-photos.mjs'), /auditServicePhotoAssets\(PUBLIC_CATALOGUE\)/u)
  for (const path of ['scripts/check-public-english.mjs', 'scripts/inventory-public-english.mjs']) {
    assert.match(await read(path), /catalogue: PUBLIC_CATALOGUE/u)
    assert.equal(regionalCataloguePriorSource(path, await read(path)), before(path), 'only the reviewed catalogue source/identifier substitution changes the existing offline command')
  }
  assert.equal(await read('package.json'), before('package.json'), 'normal mandatory release scripts are not replaced or bypassed')
  for (const path of Object.keys(REGIONAL_CATALOGUE_NEW_HASHES).filter(path => path.startsWith('lib/'))) assert.doesNotMatch(await read(path), /\bfetch\s*\(|createPublicBooking|sendEmail|sendNotification|\.from\([^)]*\)\.(?:insert|upsert|update|delete)\(/u)
})

test('the local details preview shares the same regional lookup while retaining its dev-only, no-database and no-provider contract', async () => {
  const path = 'app/dev/sofia-catalogue/business/[id]/route.js', source = await read(path)
  assert.match(source, /if \(!discoveryConfig\(process\.env\)\.devMock\) return new Response\(null, \{ status: 404 \}\)/u)
  assert.match(source, /findCatalogue: findPublicCatalogueEntry, readCataloguePhotos: async \(\) => \[\], readPartner: async \(\) => null/u)
  assert.doesNotMatch(source, /getSupabase|\.from\(|fetch\(|createPublicBooking|sendEmail|sendNotification/u)
  assert.equal(regionalCataloguePriorSource(path, azisCataloguePriorSource(path, source)), before(path))
})

test('offline English adds only the three admitted course names and two descriptions, preserving every old translation and original review fingerprint', async () => {
  const path = 'lib/locale/service-english.json', original = JSON.parse(before(path)), current = JSON.parse(await read(path))
  const added = {}
  for (const field of Object.keys(original).filter(key => key !== 'metadata')) {
    assert.ok(current[field], field)
    for (const [key, value] of Object.entries(original[field])) assert.deepEqual(current[field][key], value, field + ':' + key + ': original translation cannot change')
    added[field] = Object.keys(current[field]).filter(key => !Object.hasOwn(original[field], key))
  }
  assert.equal(added.names.length, 3); assert.equal(added.descriptions.length, 2); assert.equal(added.units.length, 0)
  const services = REGIONAL_CATALOGUE.flatMap(row => row.services)
  assert.ok(added.names.every(name => services.some(service => service.name === name)))
  assert.ok(added.descriptions.every(description => services.some(service => service.description === description)))
  for (const [key, value] of Object.entries(original.metadata)) if (!['counts', 'manualRevalidations'].includes(key)) assert.deepEqual(current.metadata[key], value, key + ': original snapshot/review fingerprint is never refreshed')
  for (const [key, value] of Object.entries(original.metadata.counts)) assert.equal(current.metadata.counts[key], value + (added[key]?.length || 0), key)
  assert.deepEqual(current.metadata.manualRevalidations.slice(0, original.metadata.manualRevalidations.length), original.metadata.manualRevalidations)
  const supplement = current.metadata.manualRevalidations.slice(original.metadata.manualRevalidations.length)
  assert.deepEqual(supplement.map(item => item.businessId), ['lom-studio-krasota-elena-dunavska18', 'lom-europe-schools-slavyanska7'])
  for (const item of supplement) {
    assert.equal(item.checkedOn, '2026-11-22'); assert.equal(item.certifiedHumanTranslation, false)
    assert.equal(item.recordIdentity, pricingIdentity(REGIONAL_CATALOGUE.find(row => row.id === item.businessId)))
  }
})
