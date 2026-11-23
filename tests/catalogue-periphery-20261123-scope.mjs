import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/periphery-priority-20261123.json' with { type: 'json' }
import north from '../docs/catalogue-coverage/north-exact-coverage-20261123.json' with { type: 'json' }
import saltart from '../docs/catalogue-coverage/saltart-druzhba-binding-20261123.json' with { type: 'json' }
import { quarterNextAllowsFileChange, quarterNextAllowsNewFile, quarterNextPriorSource, quarterNextPriorCatalogue } from './catalogue-quarter-next-20261123-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const digest = value => createHash('sha256').update(value).digest('hex')
const cache = new Map()
const changes = {
  'lib/discovery/sofia-catalogue.mjs': ['a9315d6088801e507bb5f550700451f0d91378d740bb000081a58c7bebd3c124', 'a4a47ab5de9e8b086297dfb0b13291a629b86fda3bc0261b977155661579ce7d'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['5049ed2b6925e37b6ddd9294384208f7c2aa6541f96c76760a11f7f7dbcf9af2', '3499db105dc5ccec9ace4879ce7899646cca6e6d6d21d73e08aedae479278925'],
  'lib/catalogue-service-photo-keys.mjs': ['265809cd7ee19decb938d8e4de35781f8aea720d9610a0969b424ad1c489316f', 'd89a9d1a69f1d9d5e95f888c4ce983f08acfc461f409d27d21f3bcc73a2c4b5a'],
  'lib/locale/service-english.json': ['b3d1d87f0e3e97bc5b05261113c27cac906d81402db759a7d2568763559b9ae5', '5f2a46ef911923092b9902614cc84078437f23674d37a026f1a8dadb4df593bd'],
}
const additions = {
  'docs/catalogue-coverage/periphery-priority-20261123.json': '318caae4c5919118b95a19679398b68e8328d455eef68efca4d5e5eff731ef15',
  'docs/catalogue-coverage/north-exact-coverage-20261123.json': '9fd9509902113d01e6b7bbe1161827c5b0d0edd459e25c9cbabd054a0e0da6b6',
  'lib/discovery/catalogue-data/north-exact-coverage-20261123.mjs': '13e64caa62202a07bc72a21bd38190ce602315fc105b2d6509d805afe2b28697',
  'docs/catalogue-coverage/saltart-druzhba-binding-20261123.json': '3842076e74fba5c51993570a6a360c6d1654ade27a5d08d06912430c54d7d68b',
  'lib/discovery/catalogue-data/saltart-druzhba-binding-20261123.mjs': '589762dcf171fed1dfdae879c681d85b6a8126758eca5115c52d0db5dcf46f81',
  'docs/catalogue-coverage/sparse-east-intake-20261123.json': '150af297033629519b611a3b6eeddee5ece43893eeb0d0a0526b334d305d8d08',
  'lib/discovery/catalogue-data/neighborhood-sparse-east-intake-20261123.mjs': '85069783c9b19af105485498e7042735b9c7cc5064646588498c2dd63190b83f',
  'docs/catalogue-coverage/sparse-south-intake-20261123.json': '6bb6a20609523618b0b4e5c1a98ba6e0bb44d74794fd0a49c993068b8b5041a0',
  'lib/discovery/catalogue-data/neighborhood-sparse-south-intake-20261123.mjs': 'c116067e4371f78665e20484e70032919a14e1bca3210094e5144f3b35eb68a9',
  'docs/catalogue-coverage/emika-druzhba2-intake-20261123.json': 'c1ae2e7746e137b2b532d09df9fec1c13ce0d9e8250f9dc776555b4ba9acb2ce',
  'lib/discovery/catalogue-data/neighborhood-emika-druzhba2-20261123.mjs': '8ada6e14c86b4df5824ffebe790268190fcd960aed4d4d99c25a0243186c4f8c',
  'docs/catalogue-coverage/silverstar-ring-intake-20261123.json': '7c1bfb53f06941e1d325444cf0aa9a76178dd2cbb8d412710e160b1eb2622e16',
  'lib/discovery/catalogue-data/neighborhood-silverstar-ring-intake-20261123.mjs': '88e4f666e061b0d3beb7b20045b1b70c95d98102e2525a5e7e9c3ec959697536',
}
const existing = new Map([...north.recoveries, saltart].map(row => [row.id, row]))
const introduced = new Map(batch.newRows.map(row => [row.id, row.normalizedRecordSha256]))
function hasHash(path, sha) {
  try { return Boolean(sha) && digest(readFileSync(new URL('../' + path, import.meta.url))) === sha } catch { return false }
}
export const peripheryAllowsFileChange = path => quarterNextAllowsFileChange(path) || Object.hasOwn(changes, path) && hasHash(path, changes[path][1])
export const peripheryAllowsNewFile = path => quarterNextAllowsNewFile(path) || Object.hasOwn(additions, path) && hasHash(path, additions[path])

export function peripheryPriorSource(path, source) {
  source = quarterNextPriorSource(path, source)
  if (!Object.hasOwn(changes, path) || !/applyNorthExactCoverage20261123|SPARSE_EAST_INTAKE_20261123_REVIEWS|sofia-salt-home-druzhba2-block302a|Йога в солна стая · групова практика/u.test(source)) return source
  const [before, after] = changes[path]
  if (digest(source) !== after) throw Error('Unreviewed 23 Nov periphery priority source delta: ' + path)
  if (!cache.has(path)) {
    const previous = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (digest(previous) !== before) throw Error('Periphery priority could not restore exact source: ' + path)
    cache.set(path, previous)
  }
  return cache.get(path)
}

export function peripheryPriorCatalogue(rows) {
  const seen = new Set()
  return quarterNextPriorCatalogue(rows).flatMap(row => {
    const recovery = existing.get(row.id), next = introduced.get(row.id)
    if (!recovery && !next) return [row]
    if (seen.has(row.id)) throw Error('Duplicate periphery row: ' + row.id)
    seen.add(row.id)
    const hash = digest(JSON.stringify(row))
    if (recovery && hash === recovery.previousRowSha256) return [row]
    if (hash !== (recovery?.reviewedRowSha256 ?? next)) throw Error('Unreviewed periphery row: ' + row.id)
    if (!recovery) return []
    const neighborhood = Object.hasOwn(recovery, 'previousNeighborhood') ? recovery.previousNeighborhood : row.neighborhood
    const previous = { ...row, neighborhood, coordinates: null }
    if (digest(JSON.stringify(previous)) !== recovery.previousRowSha256) throw Error('Periphery recovery mutated other facts: ' + row.id)
    return [previous]
  })
}
