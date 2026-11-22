import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { AZIS_RAW_RECORDS } from '../lib/discovery/catalogue-data/azis-style-20261122.mjs'
import { REGIONAL_RAW_RECORDS, REGIONAL_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/lom-brusartsi-20261122.mjs'
import { LOM_GPOINT_RAW_RECORDS, LOM_GPOINT_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/lom-gpoint-20261122.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { PUBLIC_CATALOGUE, PUBLIC_CATALOGUE_PRICE_REVIEWS } from '../lib/discovery/public-catalogue.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { AZIS_CATALOGUE_BASE, AZIS_CATALOGUE_HASHES, AZIS_CATALOGUE_NEW_HASHES,
  azisCatalogueAllowsFileChange, azisCatalogueAllowsNewFile, azisCataloguePriorSource } from './azis-style-catalogue-20261122-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const before = path => git('show', AZIS_CATALOGUE_BASE + ':' + path)
const sha256 = source => createHash('sha256').update(source).digest('hex')
const productionPath = path => path !== 'node_modules' && !/^tests\//u.test(path)
const tree = git('ls-tree', '-r', '-z', AZIS_CATALOGUE_BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob' && productionPath(record.path))
const historicalScopes = ['discovery-refinement-20261122', 'next-security-upgrade', 'stationary-discovery', 'public-action', 'public-english', 'services-price-cards', 'catalogue-revalidation-20261122', 'sports-mobile-photo-fit', 'regional-catalogue-20261122'].map(name => `tests/${name}-scope.mjs`)

test('the Azis stage authorizes exactly fifteen existing source/presentation paths and five independent confirmation-intake files', async () => {
  assert.equal(AZIS_CATALOGUE_BASE, '269d19ea237e656c3352a7779cc536c9fc243185')
  assert.deepEqual(Object.keys(AZIS_CATALOGUE_HASHES).sort(), [
    'README.md', 'app/businesses/catalogue/[id]/page.js', 'components/discovery-business-details.js', 'components/discovery-home-browse.js',
    'lib/catalogue-onboarding.mjs', 'lib/catalogue-profile.mjs', 'lib/catalogue-service-photo-keys.mjs',
    'lib/discovery/catalogue-policy.mjs', 'lib/discovery/catalogue-pricing-review.mjs', 'lib/discovery/catalogue-search.mjs',
    'lib/discovery/copy.mjs', 'lib/discovery/public-catalogue.mjs', 'lib/discovery/public-details.mjs',
    'lib/locale/service-english.json', 'lib/specific-service-photo-ids.mjs',
  ].sort())
  assert.deepEqual(Object.keys(AZIS_CATALOGUE_NEW_HASHES).sort(), [
    'docs/catalogue-regions/azis-style-confirmation-20261122.json', 'lib/catalogue-service-photo-associations-azis-20261122.mjs',
    'lib/discovery/catalogue-data/azis-style-20261122.mjs', 'lib/discovery/catalogue-platform-confirmations.mjs', 'lib/discovery/catalogue-provenance.mjs',
  ].sort())
  for (const [path, hash] of Object.entries({ ...AZIS_CATALOGUE_HASHES, ...AZIS_CATALOGUE_NEW_HASHES })) {
    assert.equal(sha256(await read(path)), hash, path + ': later edits need their own focused review')
    assert.equal(azisCatalogueAllowsFileChange(path) || azisCatalogueAllowsNewFile(path), true, path)
    assert.ok(!(await read(path)).endsWith('\n\n'), path + ': no extra EOF blank line')
  }
  for (const path of ['AGENTS.md', 'lib/discovery/sofia-catalogue.mjs', 'lib/discovery/catalogue-audit.mjs', 'lib/discovery/catalogue-data/lom-brusartsi-20261122.mjs', 'lib/discovery/catalogue-data/lom-gpoint-20261122.mjs', 'lib/catalogue-service-photo-associations-20261122.mjs', 'lib/discovery/subcategories.mjs', 'components/discovery-search.js', 'components/discovery-business-card.js', 'lib/service-thumbnail.mjs', 'lib/booking-engine.mjs', 'app/inline-discovery.css', 'package.json', 'pnpm-lock.yaml', 'next.config.mjs']) {
    assert.equal(azisCatalogueAllowsFileChange(path), false, path); assert.equal(azisCatalogueAllowsNewFile(path), false, path)
  }
})

test('all other source, original image, historical receipt/baseline, UI, booking, search and configuration bytes stay frozen to the last committed regional stage', async () => {
  const frozen = tree.filter(record => !azisCatalogueAllowsFileChange(record.path))
  for (let offset = 0; offset < frozen.length; offset += 32) await Promise.all(frozen.slice(offset, offset + 32).map(async record => {
    const path = new URL('../' + record.path, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), record.oid, record.path + ' stays byte-identical to ' + AZIS_CATALOGUE_BASE)
  }))
  const actual = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(path => path && productionPath(path))
  assert.deepEqual([...new Set(actual)].sort(), [...tree.map(record => record.path), ...Object.keys(AZIS_CATALOGUE_NEW_HASHES)].sort(), 'only the five exact reviewed intake files may enter production inventory')
  for (const path of historicalScopes) assert.equal(await read(path), before(path), path + ': no historical authorization is widened or rebaselined')
})

test('the literal newest forward deltas restore every previous byte and reject extra, duplicated or unrelated edits', async () => {
  for (const path of Object.keys(AZIS_CATALOGUE_HASHES)) {
    const source = await read(path), previous = before(path)
    assert.equal(azisCataloguePriorSource(path, source), previous, path)
    assert.equal(azisCataloguePriorSource(path, previous), previous)
    assert.throws(() => azisCataloguePriorSource(path, source + '\n'), /Unreviewed Azis source delta/u, path)
    assert.throws(() => azisCataloguePriorSource(path, source + source), /Unreviewed Azis source delta/u, path)
  }
  const path = 'components/discovery-search.js'
  assert.equal(azisCataloguePriorSource(path, await read(path)), before(path), 'unlisted source remains a normal complete comparison input')
})

test('all 1735 earlier normalized records and original regional receipts remain exact and only the two full-facts-bound premises append', () => {
  const earlier = [...SOFIA_CATALOGUE, ...validateCatalogue([...REGIONAL_RAW_RECORDS, ...LOM_GPOINT_RAW_RECORDS])]
  assert.equal(earlier.length, 1735); assert.deepEqual(PUBLIC_CATALOGUE.slice(0, earlier.length), earlier)
  assert.deepEqual(PUBLIC_CATALOGUE.slice(earlier.length), validateCatalogue(AZIS_RAW_RECORDS))
  assert.deepEqual(PUBLIC_CATALOGUE_PRICE_REVIEWS.slice(0, 3), [...REGIONAL_PRICE_REVIEWS, ...LOM_GPOINT_PRICE_REVIEWS])
  assert.equal(PUBLIC_CATALOGUE_PRICE_REVIEWS.length, 5)
  assert.equal(sha256(JSON.stringify(SOFIA_CATALOGUE)), 'e0af5db43c503050ffcbdfc7061a6e8c8c609aa6eb353babfa2f4c79f544098c')
})

test('the new source authority stays bounded and client-light with no generic price waiver, runtime hash rebinding, providers or booking side effects', async () => {
  const registry = await read('lib/discovery/catalogue-platform-confirmations.mjs')
  assert.doesNotMatch(registry, /^\s*import\b|\bfetch\s*\(|node:crypto|createHash|service-english|sofia-catalogue|public-catalogue|supabase/mu)
  for (const path of Object.keys(AZIS_CATALOGUE_NEW_HASHES).filter(path => path.startsWith('lib/'))) assert.doesNotMatch(await read(path), /\bfetch\s*\(|getSupabase|createPublicBooking|sendEmail|sendNotification|trackProductEvent|trackSearchEvent|\.from\s*\(/u)
  for (const path of ['lib/discovery/catalogue-platform-confirmations.mjs', 'lib/discovery/catalogue-data/azis-style-20261122.mjs']) assert.doesNotMatch(await read(path), /(?:pricingIdentity|platformConfirmationIdentity)\s*\(/u, 'manually reviewed literal identities never approve their own edited values')
  assert.match(await read('lib/discovery/catalogue-policy.mjs'), /isPlatformConfirmedCatalogueId\(row\.id\)/u, 'reserved IDs cannot be downgraded by stripping both source fields')
  assert.match(await read('lib/discovery/catalogue-pricing-review.mjs'), /isPlatformConfirmedCatalogueId\(row\.id\)/u)
  assert.equal(await read('package.json'), before('package.json'), 'ordinary mandatory release gates are not bypassed or replaced')
  for (const path of ['scripts/check-catalogue-pricing.mjs', 'scripts/check-specific-service-photos.mjs', 'scripts/check-public-english.mjs', 'scripts/inventory-public-english.mjs']) assert.equal(await read(path), before(path), path + ': combined regional gates need no further exception')
})

test('English adds only the two missing confirmed hair names and two explicitly non-owner provenance supplements, preserving every old translation and review fingerprint', async () => {
  const path = 'lib/locale/service-english.json', original = JSON.parse(before(path)), current = JSON.parse(await read(path))
  const additions = {}
  for (const field of Object.keys(original).filter(key => key !== 'metadata')) {
    for (const [key, value] of Object.entries(original[field])) assert.deepEqual(current[field][key], value, field + ':' + key)
    additions[field] = Object.keys(current[field]).filter(key => !Object.hasOwn(original[field], key))
  }
  assert.deepEqual(additions.names.sort(), ['Прически', 'Сгъстяване на коса'].sort())
  assert.deepEqual(additions.descriptions, []); assert.deepEqual(additions.units, [])
  for (const [key, value] of Object.entries(original.metadata)) if (!['counts', 'manualRevalidations'].includes(key)) assert.deepEqual(current.metadata[key], value, key + ': historical review claims and source fingerprints remain unchanged')
  for (const [key, value] of Object.entries(original.metadata.counts)) assert.equal(current.metadata.counts[key], value + (additions[key]?.length || 0), key)
  assert.deepEqual(current.metadata.manualRevalidations.slice(0, original.metadata.manualRevalidations.length), original.metadata.manualRevalidations)
  const supplement = current.metadata.manualRevalidations.slice(original.metadata.manualRevalidations.length), rows = validateCatalogue(AZIS_RAW_RECORDS)
  assert.deepEqual(supplement.map(item => item.businessId), rows.map(row => row.id))
  for (const item of supplement) {
    const row = rows.find(row => row.id === item.businessId)
    assert.equal(item.checkedOn, '2026-11-22'); assert.equal(item.certifiedHumanTranslation, false)
    assert.equal(item.sourceKind, 'platform_owner_confirmation'); assert.equal(item.businessOwnerConfirmed, false)
    assert.equal(item.recordIdentity, pricingIdentity(row)); assert.equal(item.confirmationReference, row.verification.confirmationReference)
    assert.deepEqual(item.entriesAdded, { names: item.businessId.startsWith('lom-') ? 2 : 0, descriptions: 0, units: 0 })
    assert.match(item.reason, /not confirmation from the business owner/iu)
  }
})
