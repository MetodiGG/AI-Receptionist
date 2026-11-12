import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { mkdtemp, mkdir, readFile, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { auditServicePhotoCoverage, auditServicePhotoAssets, createLocalServicePhotoVerifier } from '../scripts/audit-service-photo-coverage.mjs'

const now = Date.parse('2026-11-11T00:00:00Z')
const price = (amount, patch = {}) => ({ amount, currency: 'EUR', kind: 'fixed', sourceUrl: 'https://example.com/prices', checkedOn: '2026-11-10', ...patch })
const service = (name, category, publishedPrice) => ({ name, category, appointmentModel: 'appointment', ...(publishedPrice && { price: publishedPrice }) })
function listing(id, services, verification = {}) {
  const row = structuredClone(SOFIA_CATALOGUE.find(item => item.category === 'nails'))
  return { ...row, id: `sofia-coverage-${id}`, services,
    verification: { ...row.verification, status: 'approved', checkedOn: '2026-11-10', validUntil: '2027-02-01', ...verification } }
}

test('audits only approved catalogue services and counts source-bearing photo results, not fallback art', () => {
  const services = [service('Маникюр с гел лак', 'nails', price(22)), service('Педикюр с гел лак', 'nails', price(28)),
    service('Безплатен оглед', 'other', price(0)), service('Оформяне на брада', 'barber', price(15, { checkedOn: '2026-07-01' })),
    service('Модел за прическа', 'hair', price(0, { kind: 'range', maximum: 18 })), service('Дамско подстригване', 'hair')]
  const business = listing('active', services)
  const draft = listing('draft', services, { status: 'draft' })
  const expired = listing('expired', services, { checkedOn: '2026-09-01', validUntil: '2026-11-10' })
  const seen = []
  const result = auditServicePhotoCoverage([business, draft, expired, { ...business, services: [] }], { now, resolveThumbnail(item, options) {
    seen.push([item.name, options.business.id])
    return ({ 'Маникюр с гел лак': { kind: 'photo', src: '/service-photos/manicure.webp' },
      'Безплатен оглед': { kind: 'business', src: '/businesses/fixture/inspection.webp' },
      'Модел за прическа': { kind: 'haircut', type: 'photo', src: '/businesses/fixture/hair.webp' },
      'Оформяне на брада': { kind: 'photo', src: null },
      'Дамско подстригване': { type: 'illustration', src: '/category-art/hair-v1.webp' },
    })[item.name] || { type: 'icon' }
  } })
  assert.deepEqual(seen, services.map(item => [item.name, business.id]))
  assert.equal(result.approvedBusinesses, 1)
  assert.deepEqual(result.totals, { services: { total: 6, photo: 3, missing: 3 }, priceBearing: { total: 4, photo: 3, missing: 1 }, paid: { total: 3, photo: 2, missing: 1 } })
  assert.equal(result.complete, false)
  assert.equal(result.categories[0].category, 'nails')
  assert.deepEqual(result.categories[0].missing.map(item => item.name), ['Педикюр с гел лак'])
  assert.equal(result.categories.find(group => group.category === 'barber').priceBearing.total, 0)
})

test('priorities group the exact service wording by service category and rank paid gaps first', () => {
  const paid = service('Педикюр с гел лак', 'nails', price(25))
  const unpriced = service('Педикюр с гел лак', 'nails')
  const free = service('Друг вид педикюр', 'nails', price(0))
  const paidListing = listing('z-paid', [paid])
  const unpricedListing = listing('a-unpriced', [free, unpriced])
  const options = { now, resolveThumbnail: () => ({ kind: 'icon' }) }
  const first = auditServicePhotoCoverage([unpricedListing, paidListing], options)
  assert.deepEqual(first, auditServicePhotoCoverage([paidListing, unpricedListing], options))
  assert.deepEqual(first.categories.map(group => group.category), ['nails'])
  assert.deepEqual(first.categories[0].missing.map(item => item.name), [paid.name, free.name])
  assert.deepEqual(first.categories[0].missing[0].listings.map(row => row.businessId), [paidListing.id, unpricedListing.id])
  const covered = auditServicePhotoCoverage([paidListing], { now, resolveThumbnail: () => ({ kind: 'photo', src: '/service-photos/pedicure.webp' }) })
  assert.equal(covered.complete, true)
  assert.deepEqual(covered.categories[0].missing, [])
})

test('logical reports distinguish exact photos from shared activity and neutral images without changing totals', () => {
  const rows = listing('matches', ['Legacy', 'Specific', 'Activity', 'Neutral'].map(name => service(name, 'nails', price(20))))
  const result = auditServicePhotoCoverage([rows], { now, resolveThumbnail(item) {
    return { type: 'photo', src: `/service-photos/${item.name}.webp`, ...({ Specific: { photoMatch: 'exact' }, Activity: { photoMatch: 'activity' }, Neutral: { photoMatch: 'neutral' } })[item.name] }
  } })
  assert.deepEqual(result.totals.services, { total: 4, photo: 4, missing: 0 })
  assert.deepEqual(result.photoMatches, { exact: 2, activity: 1, neutral: 1, missing: 0 })
  assert.deepEqual(result.categories[0].photoMatches, result.photoMatches)
  assert.equal(result.complete, true); assert.equal(result.exactComplete, false)
})

test('physical audit verifies shared sources once, reports broken/API sources and counts only usable photo fallbacks', async () => {
  const rows = listing('physical', ['Shared one', 'Shared two', 'Broken', 'API'].map(name => service(name, 'nails', price(20))))
  const original = structuredClone(rows), calls = []
  const resolveThumbnail = (item, { unavailableSources = [] }) => {
    const src = item.name.startsWith('Shared') ? '/service-photos/shared.webp' : item.name === 'Broken' ? '/service-photos/broken.webp' : '/api/business-media/private-fixture'
    return unavailableSources.includes(src) ? item.name === 'Broken' ? { type: 'illustration', src: '/category-art/nails.webp' } : { type: 'icon', src: null } : { type: 'photo', src }
  }
  const result = await auditServicePhotoAssets([rows], { now, resolveThumbnail, verifyAsset: async src => {
    calls.push(src)
    return src.endsWith('shared.webp') || src.startsWith('/category-art/') ? { valid: true, width: 64, height: 64, bytes: 100, format: 'webp' } : { valid: false, reason: src.startsWith('/api/') ? 'not-static-public-asset' : 'missing-file' }
  } })
  assert.deepEqual(rows, original, 'auditing never edits catalogue/service facts')
  assert.equal(calls.length, 4); assert.equal(new Set(calls).size, 4)
  assert.deepEqual(result.logicalTotals.services, { total: 4, photo: 4, missing: 0 })
  assert.deepEqual(result.totals.services, { total: 4, photo: 2, missing: 2 })
  assert.deepEqual(result.photoMatches, { exact: 2, activity: 0, neutral: 0, missing: 2 })
  assert.equal(result.assets.uniqueUsed, 4); assert.equal(result.assets.invalid, 2)
  assert.equal(result.assets.items.find(item => item.src.endsWith('shared.webp')).references, 2)
  assert.equal(result.assets.items.find(item => item.src.endsWith('shared.webp')).selectedReferences, 2)
  assert.equal(result.assets.totalBytes, 200)
  assert.deepEqual(result.fallbackSources.map(item => [item.type, item.src, item.services]).sort(), [['icon', null, 1], ['illustration', '/category-art/nails.webp', 1]].sort())
  assert.equal(result.complete, false); assert.equal(result.exactComplete, false)
  assert.equal(result.assets.scope, 'approved-local-catalogue-services-only')
})

test('a broken primary path cannot falsely pass integrity even if another verified photo is selected', async () => {
  const result = await auditServicePhotoAssets([listing('fallback', [service('Маникюр', 'nails', price(20))])], { now,
    resolveThumbnail: (_, { unavailableSources = [] }) => ({ type: 'photo', photoMatch: unavailableSources.length ? 'neutral' : 'exact', src: unavailableSources.length ? '/service-photos/neutral.webp' : '/service-photos/broken.webp' }),
    verifyAsset: async src => ({ valid: !src.endsWith('broken.webp'), reason: src.endsWith('broken.webp') ? 'missing-file' : null }),
  })
  assert.deepEqual(result.totals.services, { total: 1, photo: 1, missing: 0 })
  assert.deepEqual(result.photoMatches, { exact: 0, activity: 0, neutral: 1, missing: 0 })
  assert.equal(result.assets.invalid, 1); assert.equal(result.complete, false); assert.equal(result.exactComplete, false)
  assert.deepEqual(result.fallbackSources[0], { type: 'photo', src: '/service-photos/neutral.webp', unavailableSources: ['/service-photos/broken.webp'], services: 1 })
})

test('failed verifiers and a resolver ignoring unavailableSources fail closed without an infinite retry', async () => {
  let calls = 0
  const result = await auditServicePhotoAssets([listing('failed', [service('Маникюр', 'nails')])], { now,
    resolveThumbnail: () => ({ type: 'photo', src: '/service-photos/repeated.webp' }),
    verifyAsset: async () => { calls++; throw Error('offline fixture failure') },
  })
  assert.equal(calls, 1); assert.equal(result.assets.items[0].reason, 'verification-failed')
  assert.equal(result.totals.services.photo, 0); assert.equal(result.totals.services.missing, 1)
  assert.equal(result.complete, false)
})

test('offline verifier fully decodes square compressed WebP files and rejects invalid, excessive, unsafe or remote sources', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gorez-photo-audit-'))
  const publicDirectory = join(directory, 'public')
  await mkdir(publicDirectory)
  try {
    const good = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#ead4bb' } }).webp().toBuffer()
    await writeFile(join(publicDirectory, 'good.webp'), good)
    await writeFile(join(publicDirectory, 'broken.webp'), 'not a WebP image')
    await writeFile(join(publicDirectory, 'truncated.webp'), good.subarray(0, good.length - 8))
    await writeFile(join(publicDirectory, 'rectangle.webp'), await sharp({ create: { width: 16, height: 8, channels: 3, background: '#ead4bb' } }).webp().toBuffer())
    await writeFile(join(publicDirectory, 'wrong.jpg'), await sharp({ create: { width: 16, height: 16, channels: 3, background: '#ead4bb' } }).jpeg().toBuffer())
    await writeFile(join(directory, 'outside.webp'), good)
    await symlink(join(directory, 'outside.webp'), join(publicDirectory, 'escape.webp'))
    const verify = createLocalServicePhotoVerifier({ publicDirectory })
    assert.deepEqual(await verify('/good.webp'), { valid: true, reason: null, width: 16, height: 16, format: 'webp', bytes: good.length })
    assert.equal((await verify('/missing.webp')).reason, 'missing-file')
    assert.equal((await verify('/broken.webp')).reason, 'invalid-image')
    assert.equal((await verify('/truncated.webp')).reason, 'invalid-image')
    assert.equal((await verify('/rectangle.webp')).reason, 'not-square')
    assert.equal((await verify('/wrong.jpg')).reason, 'not-webp')
    assert.equal((await verify('/escape.webp')).reason, 'unsafe-path')
    for (const path of ['/../outside.webp', '/%2e%2e/outside.webp', '/bad%ZZ.webp']) assert.equal((await verify(path)).reason, 'unsafe-path')
    for (const path of ['https://example.invalid/photo.webp', '//example.invalid/photo.webp', '/api/business-media/id', '/%61pi/business-media/id', '/good.webp?token=never-read', 'data:image/png;base64,abcd']) assert.equal((await verify(path)).reason, 'not-static-public-asset')
    assert.equal((await createLocalServicePhotoVerifier({ publicDirectory, maxBytes: 1 })('/good.webp')).reason, 'file-too-large')
    assert.equal((await createLocalServicePhotoVerifier({ publicDirectory, maxDimension: 8 })('/good.webp')).reason, 'dimensions-exceeded')
    assert.throws(() => createLocalServicePhotoVerifier({ maxDimension: 1201 }), /Invalid offline image limits/)
    assert.throws(() => createLocalServicePhotoVerifier({ maxBytes: Infinity }), /Invalid offline image limits/)
    const inline = `data:image/webp;base64,${good.toString('base64')}`
    assert.equal((await verify(inline)).valid, true)
    assert.equal((await verify('data:image/webp;base64,AB==')).reason, 'invalid-inline-image')
    assert.equal((await verify('data:image/webp;base64,??==')).reason, 'invalid-inline-image')
    assert.equal((await verify('data:image/webp;base64,YWJj')).reason, 'invalid-image')
    assert.equal((await createLocalServicePhotoVerifier({ publicDirectory, maxBytes: 1 })(inline)).reason, 'file-too-large')
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('CLI writes JSON and fails coverage only when explicitly required', () => {
  const script = fileURLToPath(new URL('../scripts/audit-service-photo-coverage.mjs', import.meta.url))
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  const inventory = run('--as-of=2026-11-11')
  assert.equal(inventory.status, 0, inventory.stderr)
  const report = JSON.parse(inventory.stdout)
  assert.ok(report.totals.services.total > 0)
  assert.ok(report.totals.priceBearing.total >= report.totals.paid.total)
  const gate = run('--as-of=2026-11-11', '--require-complete')
  assert.equal(gate.status, report.complete ? 0 : 1, gate.stderr)
  assert.deepEqual(JSON.parse(gate.stdout), report)

  const empty = run('--as-of=2000-01-01')
  assert.equal(empty.status, 0, empty.stderr)
  assert.equal(JSON.parse(empty.stdout).complete, false)
  const emptyGate = run('--as-of=2000-01-01', '--require-complete')
  assert.equal(emptyGate.status, 1, emptyGate.stderr)
  assert.equal(JSON.parse(emptyGate.stdout).approvedBusinesses, 0)
})

test('CLI opt-in physical report can be saved without overwriting an existing report', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'gorez-photo-report-'))
  try {
    const script = fileURLToPath(new URL('../scripts/audit-service-photo-coverage.mjs', import.meta.url)), path = join(directory, 'report.json')
    const run = (...args) => spawnSync(process.execPath, [script, '--as-of=2000-01-01', ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
    const result = run('--verify-assets', `--report=${path}`)
    assert.equal(result.status, 0, result.stderr)
    const report = JSON.parse(result.stdout)
    assert.equal(report.assets.verified, true); assert.equal(report.assets.uniqueUsed, 0)
    assert.equal(report.complete, false); assert.equal(report.exactComplete, false)
    assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), report)
    assert.notEqual(run('--verify-assets', `--report=${path}`).status, 0, 'existing reports are never silently replaced')
    assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), report)
    assert.notEqual(run('--max-asset-bytes=999').status, 0, 'asset flags require explicit physical verification')
    assert.notEqual(run('--verify-assets', '--max-asset-bytes=-1').status, 0)
    assert.equal(run('--verify-assets', '--require-complete').status, 1)
  } finally { await rm(directory, { recursive: true, force: true }) }
})
