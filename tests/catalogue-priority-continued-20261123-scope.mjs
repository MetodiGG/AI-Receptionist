import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/priority-continued-20261123.json' with { type: 'json' }
import { priorityNextAllowsFileChange, priorityNextAllowsNewFile, priorityNextPriorSource, priorityNextPriorCatalogue } from './catalogue-priority-next-20261123-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = input => createHash('sha256').update(input).digest('hex')
const frozenSources = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['f53a34bcab1e3544bf3acfc70ad30690ceff25df00d6cffd714a86d4a51245dd', '2a63ac14e88e1c2a82fb72a4c510bd05b29b8b2d2d08a38dda77e5c9e39e9232'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['d077e51a25d297a533b8efe77c3f2ad11db8c547d91f280465dc6db8a8e841f2', '873da8176e483a68d84101b989d1d33e1a47596fb4dfb0cad2ee976ec7b57067'],
  'lib/catalogue-service-photo-keys.mjs': ['71bbf193304c91fcd2974080b969e2e6d7a18f1762a2cc25f404465c57aeae28', 'b21e881a8f4fc81887187e4aef5483ababffbc94d012257c7bcc791e1969aad6'],
  'lib/locale/service-english.json': ['f145da49ee8a988035f0318b5821c3fd9216806d853e97a5c9a6cf18988efe9c', 'c79b33790af42041c24b4bc16dcc86b97f5267a6cb16842196784462d7ac1d3d'],
}
const added = {
  'docs/catalogue-coverage/priority-continued-20261123.json': '1ec3718f81f38cc87ad918a029a362327da4d8f5dd6bb489abc0a49cacc4e407',
  'docs/catalogue-coverage/priority-continued-east-20261123.json': 'd4d006d414a99af89913411d6fec9c8f3403d1aaac83b32ff5127948c724c17d',
  'docs/catalogue-coverage/priority-continued-north-20261123.json': '5a763034af6a4acf3fb48ae3324c211d43b0eb959f0bbea4bc8b675f382551fe',
  'docs/catalogue-coverage/priority-continued-south-20261123.json': '2732db6b19e04116a1c430ce91b1b3085a921f9b2a5a5b186652789995c08e50',
  'lib/discovery/catalogue-data/neighborhood-priority-continued-east-20261123.mjs': '55b6e7b2360c1018feee635399f398cfe66a9df5648aa03a7c2f4fdab371ce99',
}
const additions = new Map(batch.newRows.map(row => [row.id, row.normalizedRecordSha256]))
const evidence = /PRIORITY_CONTINUED_EAST_20261123_|sofia-yonitrade-suhata-reka-block10a|Шофьорски курс за категория B/u

const fileMatches = (path, digest) => !!digest && sha(readFileSync(new URL('../' + path, import.meta.url))) === digest
export const priorityContinuedAllowsFileChange = path => priorityNextAllowsFileChange(path) || (Object.hasOwn(changed, path) && fileMatches(path, changed[path][1]))
export const priorityContinuedAllowsNewFile = path => priorityNextAllowsNewFile(path) || (Object.hasOwn(added, path) && fileMatches(path, added[path]))

export function priorityContinuedPriorSource(path, source) {
  source = priorityNextPriorSource(path, source)
  if (!Object.hasOwn(changed, path) || !evidence.test(source)) return source
  const [before, after] = changed[path]
  if (sha(source) !== after) throw Error('Unreviewed 23 Nov continued priority source delta: ' + path)
  if (!frozenSources.has(path)) {
    const prior = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (sha(prior) !== before) throw Error('Continued priority could not restore source: ' + path)
    frozenSources.set(path, prior)
  }
  return frozenSources.get(path)
}

export function priorityContinuedPriorCatalogue(rows) {
  const seen = new Set()
  return priorityNextPriorCatalogue(rows).filter(row => {
    const expected = additions.get(row.id)
    if (!expected) return true
    if (seen.has(row.id)) throw Error('Duplicate continued priority row: ' + row.id)
    seen.add(row.id)
    if (sha(JSON.stringify(row)) !== expected) throw Error('Unreviewed continued priority row: ' + row.id)
    return false
  })
}
