import { catalogueRevalidationAllowsFileChange } from './catalogue-revalidation-20261122-scope.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { SERVICE_PRICE_CARDS_BASE, SERVICE_PRICE_CARDS_HASHES, SERVICE_PRICE_CARDS_NEW_HASHES, servicePriceCardsAllowsFileChange, servicePriceCardsAllowsNewFile } from './services-price-cards-scope.mjs'
const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const before = path => git('show', SERVICE_PRICE_CARDS_BASE + ':' + path)
const productionPath = path => path !== 'node_modules' && !/^(?:tests|docs)\//.test(path) && !/\.(?:md|txt)$/i.test(path)
const tree = git('ls-tree', '-r', '-z', SERVICE_PRICE_CARDS_BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob' && productionPath(record.path))

test('service-price presentation has exactly five existing reviewed paths and three new local files; all historical maps remain byte-identical', async () => {
  assert.deepEqual(Object.keys(SERVICE_PRICE_CARDS_HASHES), ['app/businesses/catalogue/[id]/page.js', 'app/premium-discovery-cards.css', 'components/discovery-business-card.js', 'components/discovery-business-details.js', 'lib/discovery/copy.mjs'])
  assert.deepEqual(Object.keys(SERVICE_PRICE_CARDS_NEW_HASHES), ['components/public-service-menu.js', 'components/public-service-menu.module.css', 'lib/discovery/service-description-disclosure.mjs'])
  for (const [path, hash] of Object.entries({ ...SERVICE_PRICE_CARDS_HASHES, ...SERVICE_PRICE_CARDS_NEW_HASHES })) {
    assert.equal(createHash('sha256').update(await read(path)).digest('hex'), hash, path + ': later edits need their own explicit review')
  }
  for (const path of ['tests/discovery-refinement-20261122-scope.mjs', 'tests/next-security-upgrade-scope.mjs', 'tests/stationary-discovery-scope.mjs', 'tests/public-action-scope.mjs', 'tests/public-english-scope.mjs']) assert.equal(await read(path), before(path), path + ': never widen old authorizations')
  for (const path of ['lib/discovery/sofia-catalogue.mjs', 'lib/discovery/business-details.mjs', 'lib/discovery/rail.mjs', 'lib/locale/service-english.json', 'lib/service-thumbnail.mjs', 'components/service-thumbnail.js', 'components/public-action.js', 'components/public-action.module.css', 'components/business-profile.js', 'components/discovery-search.js', 'package.json', 'pnpm-lock.yaml', 'next.config.mjs']) {
    assert.equal(servicePriceCardsAllowsFileChange(path), false, path)
    assert.equal(servicePriceCardsAllowsNewFile(path), false, path)
  }
})

test('all other production bytes and paths stay frozen, including real photos, prices, taxonomy, search/filtering, English cache, booking and analytics', async () => {
  const frozen = tree.filter(record => !servicePriceCardsAllowsFileChange(record.path) && !catalogueRevalidationAllowsFileChange(record.path))
  for (let offset = 0; offset < frozen.length; offset += 32) await Promise.all(frozen.slice(offset, offset + 32).map(async record => {
    const path = new URL('../' + record.path, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), record.oid, record.path + ' stays unchanged from ' + SERVICE_PRICE_CARDS_BASE)
  }))
  const actual = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(path => path && productionPath(path))
  assert.deepEqual([...new Set(actual)].sort(), [...tree.map(record => record.path), ...Object.keys(SERVICE_PRICE_CARDS_NEW_HASHES)].sort(), 'no unreviewed source/data/image/API path is added')
})

function between(source, start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first)
  assert.ok(first >= 0 && last > first, start)
  return source.slice(first, last)
}
test('the modal preserves both fresh fetch/stale-response protection and dialog focus/keyboard lifecycle byte-for-byte', async () => {
  const path = 'components/discovery-business-details.js', source = await read(path), original = before(path)
  assert.equal(between(source, '  useEffect(() => {', '  const photoFallback'), between(original, '  useEffect(() => {', '  const photoFallback'))
  assert.equal(between(source, '  const needsFetch', '  const services'), between(original, '  const needsFetch', '  const services'))
  assert.equal(between(source, '      <section className="business-details-hours-section"', '  </dialog>'), between(original, '      <section className="business-details-hours-section"', '  </dialog>'))
  assert.match(source, /PublicServiceMenu services=\{services\}/u)
  assert.doesNotMatch(source, /splitDetailServiceMenu|business-details-overview/u)
})

test('catalogue metadata, native redirects, external/phone/directions actions and existing service fragments retain their real destinations', async () => {
  const path = 'app/businesses/catalogue/[id]/page.js', source = await read(path), original = before(path)
  assert.equal(between(source, 'export async function generateMetadata', '// Server-rendered authentic'), between(original, 'export async function generateMetadata', '// Server-rendered authentic'))
  assert.equal(between(source, '  const serviceAnchors = new Map()', '  const action ='), between(original, '  const serviceAnchors = new Map()', '  const action ='))
  assert.equal(between(source, '      <PublicActionPair className="catalogue-profile-actions">', '      <section className="profile-services business-profile-section"'), between(original, '      <PublicActionPair className="catalogue-profile-actions">', '      <section className="profile-services business-profile-section"'))
  const copy = await read('lib/discovery/copy.mjs')
  assert.equal(copy.replace(", readMore: 'Виж повече', readLess: 'Виж по-малко', hasConditions: 'Има условия'", '').replace(", readMore: 'Read more', readLess: 'Read less', hasConditions: 'Conditions apply'", ''), before('lib/discovery/copy.mjs'))
  for (const path of Object.keys(SERVICE_PRICE_CARDS_NEW_HASHES).filter(path => path.endsWith('.js') || path.endsWith('.mjs'))) assert.doesNotMatch(await read(path), /\bfetch\s*\(|supabase|trackProductEvent|trackSearchEvent|createPublicBooking|sendNotification|sendEmail|\.from\s*\(/u)
})
