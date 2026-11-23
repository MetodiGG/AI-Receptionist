import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/priority-fresh-20261123.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = input => createHash('sha256').update(input).digest('hex')
const frozenSources = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['6a9ae2ec543b26fb409ff034c90e1661ce98066c7bea5211a7dddea8f9cf9dfc','8dfc89c0a3bbfac85c5b658daf4396ebbda701d764a59de74cf6bc580a4aae45'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['e2d2fa737f3e7f4ace1c67f11ec7fb6c00483949c271168a6a6e400c4ce45c13','6de594b52b264dd69eee30d514cde25343db07b15b2ff654ae6db4395ab2fa45'],
  'lib/catalogue-service-photo-keys.mjs': ['51d4e83a6a613700642c4a8bd2d5cd883ebef51b9f5ecb2084e3716727ff9dd6','886ebb5c5a8a5be18801d1c98ef93333a9bc656038f266301ab7ee79c51a8291'],
  'lib/locale/service-english.json': ['2ec763c93a6f3877a0543d7dddb9cbb3bb4dbf867c5e74dcd458f61c8384df12','de45370fcf77d0ed774726bcbd5db6cc29822b633edbaa81909354aa7bf021d2'],
  'lib/specific-service-photo-ids.mjs': ['259e8f53157bbe5ee1bffee17291ca81dfe1f71f6435dedde6dd03596926809a','699a1c59c4cce8d77d544f04f5171441e83ab2277becd62ffa6c26a82e6c3911'],
}
const added = {
  'docs/catalogue-coverage/priority-fresh-20261123.json': '0d501ea069d061d61caca07013e0bfad00d679a1dbb674f4c8d7d10ba5634de1',
  'docs/catalogue-coverage/priority-fresh-east-20261123.json': 'a579d15ca9deffc424cd99aea458d89eadf928848a52582ee91063f6050f03d5',
  'lib/discovery/catalogue-data/neighborhood-priority-fresh-east-20261123.mjs': '42605d083f665b3d4729e51a3b87ac0262180f1590f7f801f71bf1fabc48a408',
  'docs/catalogue-coverage/priority-fresh-north-20261123.json': '9160b4bb08b63e0a28c33d67c72fce9b7ea1f17f8bfdfb14046fe4c8b6aa6bef',
  'lib/discovery/catalogue-data/neighborhood-priority-fresh-north-20261123.mjs': '3da0edd35fba43516418215f731168ea3496eef3af07d7d9ad75263ca0a5df9d',
  'docs/catalogue-coverage/priority-fresh-south-20261123.json': '87c164a8d7938a581d3441d2db9be03f2dd9b5cf4b229a98a66b56b7bc935401',
  'lib/discovery/catalogue-data/neighborhood-priority-fresh-south-20261123.mjs': 'c5a1d399c6c5c40438724c3574b3654635a513ba08ebcbc1886e13415517736e',
}
const additions = new Map(batch.newRows.map(row => [row.id, row.normalizedRecordSha256]))
const evidence = /PRIORITY_FRESH_(?:EAST|NORTH|SOUTH|CORE)_20261123_|sofia-anev-barber-mladost1a-ahmatova532|partner-hair-beard-brows-finish|Измиването е включено в цената\./u

const fileMatches = (path, digest) => !!digest && sha(readFileSync(new URL('../' + path, import.meta.url))) === digest
export const priorityFreshAllowsFileChange = path => Object.hasOwn(changed, path) && fileMatches(path, changed[path][1])
export const priorityFreshAllowsNewFile = path => Object.hasOwn(added, path) && fileMatches(path, added[path])

export function priorityFreshPriorSource(path, source) {
  if (!Object.hasOwn(changed, path) || !evidence.test(source)) return source
  const [before, after] = changed[path]
  if (sha(source) !== after) throw Error('Unreviewed 23 Nov fresh priority source delta: ' + path)
  if (!frozenSources.has(path)) {
    const prior = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (sha(prior) !== before) throw Error('Fresh priority could not restore source: ' + path)
    frozenSources.set(path, prior)
  }
  return frozenSources.get(path)
}

export function priorityFreshPriorCatalogue(rows) {
  const seen = new Set()
  return rows.filter(row => {
    const expected = additions.get(row.id)
    if (!expected) return true
    if (seen.has(row.id)) throw Error('Duplicate fresh priority row: ' + row.id)
    seen.add(row.id)
    if (sha(JSON.stringify(row)) !== expected) throw Error('Unreviewed fresh priority row: ' + row.id)
    return false
  })
}
