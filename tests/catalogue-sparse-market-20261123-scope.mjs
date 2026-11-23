import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/sparse-market-priority-20261123.json' with { type: 'json' }
import vitosha from '../docs/catalogue-coverage/vitosha-pair-intake-20261123.json' with { type: 'json' }
import gemini from '../docs/catalogue-coverage/gemini4-intake-20261123.json' with { type: 'json' }
import locations from '../docs/catalogue-coverage/sparse-address-bindings-20261123.json' with { type: 'json' }
import { peripheryAllowsFileChange, peripheryAllowsNewFile, peripheryPriorSource, peripheryPriorCatalogue } from './catalogue-periphery-20261123-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const digest = value => createHash('sha256').update(value).digest('hex')
const cache = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['8fb66c6717122b6da8caa8d9036d696ea8c04c4830f2afd06f109c88ef38c976', 'a9315d6088801e507bb5f550700451f0d91378d740bb000081a58c7bebd3c124'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['86b3af5b414244c6ed48a47c067ad345a2e9305d36d1782eee1ee71f97bf2c9c', '5049ed2b6925e37b6ddd9294384208f7c2aa6541f96c76760a11f7f7dbcf9af2'],
  'lib/catalogue-service-photo-keys.mjs': ['d0cdaf629eb893e0d3a5778f42e1d43ea2b2843735e6332e60b0e6567a1e19d1', '265809cd7ee19decb938d8e4de35781f8aea720d9610a0969b424ad1c489316f'],
  'lib/specific-service-photo-ids.mjs': ['d5010cbac4a350528ed2c352a11e72a3882d2d5d870d76e190f4bc5f18fd62a7', '9c84f19f88c9dee84f514e943b342ad095ca3374ef9ded0a8555d902d6f713bb'],
  'docs/specific-service-photo-generation-2026-11-12.json': ['807b12c3631dec8927f2225b9533dd3d46252bb006b716d6557f780560095edd', '8f25e733b192492809e7579e5bf224cc76fcbfe86612365648c6165fbbd19411'],
  'lib/locale/service-english.json': ['ecb3a9de79420aeb9462fc0f6b55520c00515f2e48f8b4c334793c0a149c5923', 'b3d1d87f0e3e97bc5b05261113c27cac906d81402db759a7d2568763559b9ae5'],
}
const added = {
  'docs/catalogue-coverage/sparse-market-priority-20261123.json': '941020384c2c2ea01cc6539060790e63181f964185cd15d1c3628f198b9bfde5',
  'docs/catalogue-coverage/vitosha-pair-intake-20261123.json': '732edfaef7c0b2febea9e38be997b1442aaa2695a09b16b628122d3fb13d2884',
  'docs/catalogue-coverage/gemini4-intake-20261123.json': 'a930154f1fec8804ac3b77111ed4bd1a0fe346c6fcd225e080113234875758b4',
  'docs/catalogue-coverage/alva-dental-intake-20261123.json': '217ab6b0050ece02b9d9399d491f13b5f1fdb10f373125f4b3cffe177811bf47',
  'docs/catalogue-coverage/sparse-address-bindings-20261123.json': 'd8bf0884e25ebe2b3b67c4e993588ce5856ea8e0855d8e0749aca34b89061c52',
  'lib/discovery/catalogue-data/neighborhood-vitosha-pair-intake-20261123.mjs': 'ec9b4858dc6d710838a0aa15b4fc29fdeff816e966af285e0c058f90f8e13215',
  'lib/discovery/catalogue-data/neighborhood-gemini4-intake-20261123.mjs': 'e4f42351b71962249931de1c88aa9a0f65afbb26a350967ad706dc43752cc0f8',
  'lib/discovery/catalogue-data/neighborhood-alva-dental-intake-20261123.mjs': 'a68a85a3380046b72d11f7fc1b354d7e9c8f582e0c581800fa54534718e116c9',
  'lib/discovery/catalogue-data/sparse-address-bindings-20261123.mjs': '09e92d6d37338f888210e46507374e10fd58837b90872da94b0ce19dd54f3003',
  'public/service-photos/sx-auto-bumper-spray-paint-v1.webp': '8693c08a15f6e07f9d92bd59faf7e2c8c7534f940eb5cd47c6f17bd55ec6861c',
}
const newHashes = new Map([...vitosha.businesses.map(row => [row.id, row.rowSha256]),
  [gemini.business.id, gemini.business.normalizedRecordSha256],
  ['sofia-alva-dental-hadzhi-dimitar107v', '09d7d840256a6bc88d30542822c094e2c6f133e61ab959d1dbb44a95252f9c17']])
const recoveries = new Map(locations.recoveries.map(row => [row.id, row]))
function hasHash(path, sha) {
  try { return Boolean(sha) && digest(readFileSync(new URL('../' + path, import.meta.url))) === sha } catch { return false }
}
export const sparseMarketAllowsFileChange = path => peripheryAllowsFileChange(path) || Object.hasOwn(changed, path) && hasHash(path, changed[path][1])
export const sparseMarketAllowsNewFile = path => peripheryAllowsNewFile(path) || Object.hasOwn(added, path) && hasHash(path, added[path])

export function sparseMarketPriorSource(path, source) {
  source = peripheryPriorSource(path, source)
  if (!Object.hasOwn(changed, path) || !/VITOSHA_PAIR_20261123|sofia-kis-auto-simeonovo-bosilek3|Фитнес и групови тренировки · 7-дневна карта|sx-auto-bumper-spray-paint/u.test(source)) return source
  const [before, after] = changed[path]
  if (digest(source) !== after) throw Error('Unreviewed 23 Nov sparse-market priority source delta: ' + path)
  if (!cache.has(path)) {
    const previous = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (digest(previous) !== before) throw Error('Sparse-market priority could not restore exact prior source: ' + path)
    cache.set(path, previous)
  }
  return cache.get(path)
}

export function sparseMarketPriorCatalogue(rows) {
  const seen = new Set()
  return peripheryPriorCatalogue(rows).flatMap(row => {
    const recovery = recoveries.get(row.id), next = newHashes.get(row.id)
    if (!recovery && !next) return [row]
    if (seen.has(row.id)) throw Error('Duplicate sparse-market intake: ' + row.id)
    seen.add(row.id)
    const current = digest(JSON.stringify(row))
    if (recovery && current === recovery.previousRowSha256) return [row]
    if (current !== (recovery?.reviewedRowSha256 ?? next)) throw Error('Unreviewed sparse-market intake: ' + row.id)
    if (!recovery) return []
    const previous = { ...row, coordinates: null }
    if (digest(JSON.stringify(previous)) !== recovery.previousRowSha256) throw Error('Sparse-market recovery mutated other facts: ' + row.id)
    return [previous]
  })
}
