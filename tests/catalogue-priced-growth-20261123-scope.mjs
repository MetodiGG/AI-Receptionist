import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/priced-growth-20261123.json' with { type: 'json' }
import wave from '../docs/catalogue-coverage/wave-lyulin-hair-growth-20261123.json' with { type: 'json' }
import earlierPostal from '../docs/catalogue-coverage/north-exact-coverage-20261123.json' with { type: 'json' }
import { sparseMarketGrowthAllowsFileChange, sparseMarketGrowthAllowsNewFile, sparseMarketGrowthPriorSource, sparseMarketGrowthPriorCatalogue } from './catalogue-sparse-market-growth-20261123-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = value => createHash('sha256').update(value).digest('hex')
const frozenSources = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['509f775a2115876c9a245b02498ebc393f0c2c49f75df67aa74d79157f698791', '8a9ade63ef47225001507b7c50acb54068b67e7cf9fc7f0621ac6be8ce365897'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['6c141c5930a06c760cf6f96c662a944f48cb9490d5ea38a2c0b0097a67c9f097', 'b522041477c18760e3dd96d0c5f363cb4697bef32f32158a7e7b62dd203f0530'],
  'lib/catalogue-service-photo-keys.mjs': ['129ea7a5feea794cd05a6b1c78d3dab7313a614d78af771b6405f4b4e788ecdc', '1467f67ad5c2d61e39bf6ef187e6f9ed30930d39170d43fb59b57b74d54d9d6a'],
  'lib/locale/service-english.json': ['95d82879a85cecfb7a9ac5bfffe721d58bce78bb3bbf42ff90c7eec7f1866e66', '6341ba1d2bdc3865cdbea2f45540e85f747e5b0377c41692ad2b31f83e87a54c'],
  'lib/specific-service-photo-ids.mjs': ['9c84f19f88c9dee84f514e943b342ad095ca3374ef9ded0a8555d902d6f713bb', 'f8d976e3b150a8ce924a3f6642741c0c2b32cb6d5ed45eabe2bbe9adec447a64'],
  'docs/specific-service-photo-generation-2026-11-12.json': ['8f25e733b192492809e7579e5bf224cc76fcbfe86612365648c6165fbbd19411', '180cee972a999e4dd812b8ef324b136c86ec49bb73e1e298bc130d237b79f450'],
}
const added = {
  'docs/catalogue-coverage/priced-growth-20261123.json': '56e76738a06c13fdd857e189d2fb87b5a3a797924373e5c87e6429a1627ff1d1',
  'docs/catalogue-coverage/wave-lyulin-hair-growth-20261123.json': '5df7fe8a1960184bdac197dd8ec5e370b2cc1275941719e0ae711171cdb00133',
  'docs/catalogue-coverage/east-growth-intake-20261123.json': '325f15349df4ffa129d6483cf1ec5dde3e310849b2089fce5ad73f33ec463d9a',
  'docs/catalogue-coverage/south-growth-intake-20261123.json': '90eb7bc2d01b04a70f6b957e67188c00a6d0bc3eecea05d94e101c74ab83f696',
  'docs/catalogue-coverage/north-growth-intake-20261123.json': '3f47ddbfb011205cdc1cb12b7af71e248a452262dce6083983fa5dc615f6e4db',
  'lib/discovery/catalogue-data/wave-lyulin-hair-growth-20261123.mjs': '79d3dc1f56434ce6cbf5f437a5e111d8084d04525b3455f7e98d4b2f7d0bc04d',
  'lib/discovery/catalogue-data/neighborhood-verified-east-growth-20261123.mjs': '8cd488abc2777129a3e5c701ed65749f61d05ecab3bcf3b1da5d4d96b91fb18d',
  'lib/discovery/catalogue-data/neighborhood-verified-south-growth-20261123.mjs': '435870b76ee30a402b344b849ed7c8618fa62cb8882a1615fc0d5f45bfb40e71',
  'lib/discovery/catalogue-data/neighborhood-verified-north-growth-20261123.mjs': '639518e77ff64bea45d1ebe2c0a82c557c66d186a08f552b9171508aed5a313a',
  'public/service-photos/sx-karting-driving-course-v1.webp': '483a979e75ec5222d321db2fb0f8918b09c5f8a1c7c06ba8fc8a2bb7dc77a274',
}
const introduced = new Map(batch.newRows.map(row => [row.id, row.normalizedRecordSha256]))
const unchangedWaveSnapshots = new Set([wave.previousRowSha256,
  earlierPostal.recoveries.find(row => row.id === wave.id).previousRowSha256])
function hasHash(path, expected) {
  try { return Boolean(expected) && sha(readFileSync(new URL('../' + path, import.meta.url))) === expected } catch { return false }
}
export const pricedGrowthAllowsFileChange = path => sparseMarketGrowthAllowsFileChange(path) || Object.hasOwn(changed, path) && hasHash(path, changed[path][1])
export const pricedGrowthAllowsNewFile = path => sparseMarketGrowthAllowsNewFile(path) || Object.hasOwn(added, path) && hasHash(path, added[path])

export function pricedGrowthPriorSource(path, source) {
  source = sparseMarketGrowthPriorSource(path, source)
  if (!Object.hasOwn(changed, path) ||
      !/applyWaveLyulinHair20261123|WAVE_LYULIN_HAIR_20261123_REVIEW|sofia-partydots-druzhba2-block280e|Класическо детско парти|sx-karting-driving-course/u.test(source)) return source
  const [before, after] = changed[path]
  if (sha(source) !== after) throw Error('Unreviewed 23 Nov priced-growth source delta: ' + path)
  if (!frozenSources.has(path)) {
    const previous = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (sha(previous) !== before) throw Error('Priced-growth could not restore exact source: ' + path)
    frozenSources.set(path, previous)
  }
  return frozenSources.get(path)
}

export function pricedGrowthPriorCatalogue(rows) {
  const seen = new Set()
  return sparseMarketGrowthPriorCatalogue(rows).flatMap(row => {
    const isWave = row.id === wave.id, addedHash = introduced.get(row.id)
    if (!isWave && !addedHash) return [row]
    if (seen.has(row.id)) throw Error('Duplicate priced-growth row: ' + row.id)
    seen.add(row.id)
    const hash = sha(JSON.stringify(row))
    if (isWave && unchangedWaveSnapshots.has(hash)) return [row]
    if (hash !== (isWave ? wave.reviewedRowSha256 : addedHash)) throw Error('Unreviewed priced-growth row: ' + row.id)
    if (!isWave) return []
    const prior = { ...row, services: row.services.filter(service => service.category !== 'hair') }
    if (sha(JSON.stringify(prior)) !== wave.previousRowSha256) throw Error('Wave Studio retained inventory changed')
    return [prior]
  })
}
