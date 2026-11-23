import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/lyulin-premises-priority-20261123.json' with { type: 'json' }
import candy from '../docs/catalogue-coverage/candy-house-intake-20261123.json' with { type: 'json' }
import felix from '../docs/catalogue-coverage/felix-dogs-lyulin-verified-location-20261123.json' with { type: 'json' }
import koba from '../docs/catalogue-coverage/koba-paris-intake-20261123.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const digest = value => createHash('sha256').update(value).digest('hex')
const cache = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['55b02f33ddf0297e8c602a4b17d0c2f01426388df98a5db6c7bc926a1c9a4333', '8fb66c6717122b6da8caa8d9036d696ea8c04c4830f2afd06f109c88ef38c976'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['87729479c89050b682b8b12aef636b4a0e75f2c70a8ca386a4471857a193254f', '86b3af5b414244c6ed48a47c067ad345a2e9305d36d1782eee1ee71f97bf2c9c'],
  'lib/catalogue-service-photo-keys.mjs': ['f730c97d97ddb964a3b96c1d9d3aa91e84cf7a2ae5e9f04dd0bb8d43fa3d782a', 'd0cdaf629eb893e0d3a5778f42e1d43ea2b2843735e6332e60b0e6567a1e19d1'],
  'lib/locale/service-english.json': ['153e148d989aac2a007ef03a4a5fbdd6a22996f01f04bafa9fc1334a5d3daef6', 'ecb3a9de79420aeb9462fc0f6b55520c00515f2e48f8b4c334793c0a149c5923'],
}
const added = {
  'docs/catalogue-coverage/lyulin-premises-priority-20261123.json': 'f8d3fa2de583295c2e754aa97ad2c6cc8997e67eb563401a8d8c0997a47afef1',
  'docs/catalogue-coverage/candy-house-intake-20261123.json': '8796ae391fbda687c4dd2c4a64aa03627740cafcd70a17139703ec6bcec9c03e',
  'docs/catalogue-coverage/felix-dogs-lyulin-verified-location-20261123.json': 'ee6ea7ea08857ef2763d3b3cddacea13862e9cab3f516046f7ea7ef8017ff2c3',
  'docs/catalogue-coverage/koba-paris-intake-20261123.json': 'eb14a48f21de3cf17bc7015ca4a024258efb653f2665fbdd493fd588408cacf8',
  'lib/discovery/catalogue-data/neighborhood-candy-house-intake-20261123.mjs': '6e6781b1ee810fdd2217275360a96f28c01b1923a24cab6f2dc7c936038f9b6c',
  'lib/discovery/catalogue-data/felix-dogs-lyulin-verified-location-20261123.mjs': '94f15e6520bf407a7beed0f8434e41031537d21a033336b971efcbfdebffbb1a',
  'lib/discovery/catalogue-data/neighborhood-koba-paris-intake-20261123.mjs': '7eefece648759edfee25096193bec83074a11f1d23335d6b84d7ec9d7198550a',
}
const addRows = new Map([candy.newBusiness, koba.business].map(row => [row.id, row.normalizedRecordSha256]))
function hasHash(path, sha) {
  try { return Boolean(sha) && digest(readFileSync(new URL('../' + path, import.meta.url))) === sha } catch { return false }
}
export const lyulinPremisesAllowsFileChange = path => Object.hasOwn(changed, path) && hasHash(path, changed[path][1])
export const lyulinPremisesAllowsNewFile = path => Object.hasOwn(added, path) && hasHash(path, added[path])

export function lyulinPremisesPriorSource(path, source) {
  if (!Object.hasOwn(changed, path) || !/CANDY_HOUSE_INTAKE_20261123|sofia-candy-house-lyulin10-mayski-den22/u.test(source)) return source
  const [before, after] = changed[path]
  if (digest(source) !== after) throw Error('Unreviewed 23 Nov Lyulin-premises priority source delta: ' + path)
  if (!cache.has(path)) {
    const previous = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (digest(previous) !== before) throw Error('Lyulin-premises priority could not restore exact prior source: ' + path)
    cache.set(path, previous)
  }
  return cache.get(path)
}

export function lyulinPremisesPriorCatalogue(rows) {
  const seen = new Set()
  return rows.flatMap(row => {
    const isFelix = row.id === felix.id
    const reviewed = isFelix ? felix.reviewedRowSha256 : addRows.get(row.id)
    if (!reviewed) return [row]
    if (seen.has(row.id)) throw Error('Duplicate Lyulin-premises intake: ' + row.id)
    seen.add(row.id)
    const actual = digest(JSON.stringify(row))
    if (isFelix && actual === felix.previousRowSha256) return [row]
    if (actual !== reviewed) throw Error('Unreviewed Lyulin-premises intake: ' + row.id)
    if (!isFelix) return []
    const previous = { ...row, address: felix.previousAddress, coordinates: null }
    if (digest(JSON.stringify(previous)) !== felix.previousRowSha256) throw Error('Lyulin-premises restoration mutated other fields: ' + row.id)
    return [previous]
  })
}
