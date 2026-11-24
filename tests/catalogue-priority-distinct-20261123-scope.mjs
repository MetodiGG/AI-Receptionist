import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/priority-distinct-20261123.json' with { type: 'json' }
import { priorityContinuedAllowsFileChange, priorityContinuedAllowsNewFile, priorityContinuedPriorSource, priorityContinuedPriorCatalogue } from './catalogue-priority-continued-20261123-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = input => createHash('sha256').update(input).digest('hex')
const frozenSources = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['8896181187a109397a9ffde2ffe69c228797412ccbfdaf8fb5ed915d15750ab9', 'f53a34bcab1e3544bf3acfc70ad30690ceff25df00d6cffd714a86d4a51245dd'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['7172bfe1ba20513be36b6d0e5db64cb8881f44560ff7c387edde57d8ac00da61', 'd077e51a25d297a533b8efe77c3f2ad11db8c547d91f280465dc6db8a8e841f2'],
  'lib/catalogue-service-photo-keys.mjs': ['c20b4c067b484bc257518509faec1abdb62938bd96a4ceec986eb44bcf305646', '71bbf193304c91fcd2974080b969e2e6d7a18f1762a2cc25f404465c57aeae28'],
  'lib/locale/service-english.json': ['0a0448743f31ad8f90adba54def99effece13d45de6a31b99009d7fa17c9bd55', 'f145da49ee8a988035f0318b5821c3fd9216806d853e97a5c9a6cf18988efe9c'],
}
const added = {
  'docs/catalogue-coverage/elit-chess-sveta-troitsa-intake-20261123.json': '04c07cf0b8194ed189d5ad39fd467ca4822ab9eb14b7edfa5f3eda3683b2f9b6',
  'docs/catalogue-coverage/priority-distinct-20261123.json': 'd36e24de0cefb25d3925ac4590b433e266d755bfac232d5f8e37f6677f43c258',
  'docs/catalogue-coverage/priority-distinct-east-20261123.json': 'd645837cfb1e65f2b118dd4562cad7d25812d224ff7bfaf1d1d9d89b6823f312',
  'docs/catalogue-coverage/priority-distinct-north-20261123.json': '60f9b8ea2d6938649623f3e08eca5aee9f905a65048907080351e1f4c526ff82',
  'docs/catalogue-coverage/priority-distinct-south-20261123.json': '22ce5da93d3b79f2cfcfd2b433ca4d9f3639c175961b8cb1fdb259efff185b8f',
  'lib/discovery/catalogue-data/neighborhood-elit-chess-20261123.mjs': '71d862f16102b4d712d560507a5805750f11ecbe145e8012769c8937d9786569',
  'lib/discovery/catalogue-data/neighborhood-priority-distinct-east-20261123.mjs': 'b22ab948b981e4f795da629ee04a75a211fc35dad7aa7ce1984ae714c885531f',
  'lib/discovery/catalogue-data/neighborhood-priority-distinct-north-20261123.mjs': 'ab66efd26cb57c073f16c463cf9e34ed203bc7527292ad432544e12f7b962e2b',
  'lib/discovery/catalogue-data/neighborhood-priority-distinct-south-20261123.mjs': '2e7b3153f416cab4e5571f99adb533cb0ff3a5bfa735ab1049e036de9d759e1c',
}
const additions = new Map(batch.newRows.map(row => [row.id, row.normalizedRecordSha256]))
const evidence = /ELIT_CHESS_INTAKE_20261123_|sofia-elit-chess-sveta-troitsa-hisarya3a|Шахмат за деца · едно посещение/u

const fileMatches = (path, digest) => !!digest && sha(readFileSync(new URL('../' + path, import.meta.url))) === digest
export const priorityDistinctAllowsFileChange = path => priorityContinuedAllowsFileChange(path) || (Object.hasOwn(changed, path) && fileMatches(path, changed[path][1]))
export const priorityDistinctAllowsNewFile = path => priorityContinuedAllowsNewFile(path) || (Object.hasOwn(added, path) && fileMatches(path, added[path]))

export function priorityDistinctPriorSource(path, source) {
  source = priorityContinuedPriorSource(path, source)
  if (!Object.hasOwn(changed, path) || !evidence.test(source)) return source
  const [before, after] = changed[path]
  if (sha(source) !== after) throw Error('Unreviewed 23 Nov distinct priority source delta: ' + path)
  if (!frozenSources.has(path)) {
    const prior = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (sha(prior) !== before) throw Error('Distinct priority could not restore source: ' + path)
    frozenSources.set(path, prior)
  }
  return frozenSources.get(path)
}

export function priorityDistinctPriorCatalogue(rows) {
  const seen = new Set()
  return priorityContinuedPriorCatalogue(rows).filter(row => {
    const expected = additions.get(row.id)
    if (!expected) return true
    if (seen.has(row.id)) throw Error('Duplicate distinct priority row: ' + row.id)
    seen.add(row.id)
    if (sha(JSON.stringify(row)) !== expected) throw Error('Unreviewed distinct priority row: ' + row.id)
    return false
  })
}
