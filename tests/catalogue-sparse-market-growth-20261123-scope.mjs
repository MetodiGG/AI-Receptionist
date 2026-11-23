import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/sparse-market-growth-20261123.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = data => createHash('sha256').update(data).digest('hex')
const prior = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ["8a9ade63ef47225001507b7c50acb54068b67e7cf9fc7f0621ac6be8ce365897","88d542fad698c9a5388b2a0eda3692fde30685c84c6cee157a5f17f99e583c54"],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ["b522041477c18760e3dd96d0c5f363cb4697bef32f32158a7e7b62dd203f0530","43021f36ecebe92b9b8636940429f8dbac8b0c1660aa10b063c278533a2d3d69"],
  'lib/catalogue-service-photo-keys.mjs': ["1467f67ad5c2d61e39bf6ef187e6f9ed30930d39170d43fb59b57b74d54d9d6a","7095d0526b2b072fbbe9e2d6206508428618c8316769fbc9a05fd0b35cdc85f6"],
  'lib/locale/service-english.json': ["6341ba1d2bdc3865cdbea2f45540e85f747e5b0377c41692ad2b31f83e87a54c","3dc595410ab611ce5c096a514a49cb5b79f77e0c8e3118e24dcec06c2d038759"],
}
const added = {
  'docs/catalogue-coverage/sparse-market-east-intake-20261123.json': '035cee4c998fffb68ee8726006024be3566a6911ebe30599dfa6cac1afeaa50a',
  'docs/catalogue-coverage/sparse-market-north-intake-20261123.json': '346e8fbdac329a929a5fc49cc32d7a4c393983c901287be478c9d0ae4a646824',
  'lib/discovery/catalogue-data/neighborhood-sparse-market-south-20261123.mjs': '05dca2d8e8a9a4ac996a75adeadc67d331cc674974b9f0099b638657b230ba9e',
  'docs/catalogue-coverage/sparse-market-south-intake-20261123.json': 'b06a410c87832e867fa177ed4bc4ee7b0d8a4c68d9a0918a28ed32176a60316e',
  'docs/catalogue-coverage/sparse-market-growth-20261123.json': 'd0f78052b27df12efe61f6f1b2a2b727ff13ff803137f206cef4a0ef100af57f',
}
const introduced = new Map(batch.newRows.map(row => [row.id, row.normalizedRecordSha256]))
const addedEvidence = /SPARSE_MARKET_SOUTH_20261123_|sofia-kanev-carpet-knyazhevo-buket55|Машинно пране на килими · стандартна поръчка/u

function hasFileHash(path, expected) {
  return !!expected && sha(readFileSync(new URL('../' + path, import.meta.url))) === expected
}
export const sparseMarketGrowthAllowsFileChange = path => Object.hasOwn(changed, path) && hasFileHash(path, changed[path][1])
export const sparseMarketGrowthAllowsNewFile = path => Object.hasOwn(added, path) && hasFileHash(path, added[path])

export function sparseMarketGrowthPriorSource(path, source) {
  if (!Object.hasOwn(changed, path) || !addedEvidence.test(source)) return source
  const [before, after] = changed[path]
  if (sha(source) !== after) throw Error('Unreviewed 23 Nov sparse-market growth source delta: ' + path)
  if (!prior.has(path)) {
    const previous = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (sha(previous) !== before) throw Error('Sparse-market growth could not restore exact source: ' + path)
    prior.set(path, previous)
  }
  return prior.get(path)
}

export function sparseMarketGrowthPriorCatalogue(rows) {
  const seen = new Set()
  return rows.filter(row => {
    const expected = introduced.get(row.id)
    if (!expected) return true
    if (seen.has(row.id)) throw Error('Duplicate sparse-market growth row: ' + row.id)
    seen.add(row.id)
    if (sha(JSON.stringify(row)) !== expected) throw Error('Unreviewed sparse-market growth row: ' + row.id)
    return false
  })
}
