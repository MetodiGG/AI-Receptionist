import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/priority-found-20261123.json' with { type: 'json' }
import { prioritySparse2AllowsFileChange, prioritySparse2AllowsNewFile, prioritySparse2PriorCatalogue, prioritySparse2PriorSource } from './catalogue-priority-sparse2-20261123-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = input => createHash('sha256').update(input).digest('hex')
const frozenSources = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['8dfc89c0a3bbfac85c5b658daf4396ebbda701d764a59de74cf6bc580a4aae45','50d8675d8ba19b5de17c129e7515f1b7fe2248f73119ab9eecd1cc238d0d399f'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['6de594b52b264dd69eee30d514cde25343db07b15b2ff654ae6db4395ab2fa45','5128a9fc49988cfc84b0aec0e48112b18f0eae415b173174447ba1a9cf3978be'],
  'lib/catalogue-service-photo-keys.mjs': ['886ebb5c5a8a5be18801d1c98ef93333a9bc656038f266301ab7ee79c51a8291','85a1a2c545cc4fea3216ad94734d957eda78bab4e8f6e53d1c1a7f1e7e1326c9'],
  'lib/locale/service-english.json': ['de45370fcf77d0ed774726bcbd5db6cc29822b633edbaa81909354aa7bf021d2','0a9f254a1924e761473d26ca9e24c235592041d7f35a9954ce4e5dffccfb8983'],
}
const added = {
  'docs/catalogue-coverage/priority-found-20261123.json': 'ac5728628516cc0af7ec20f6995b0322380599fe984b4b8994e8fa576d73cf87',
  'docs/catalogue-coverage/priority-found-core-20261123.json': '29113671346a815db3ac32545b33a6e9bbb3e46a74b2cd3739ea34bcd639ccc4',
  'lib/discovery/catalogue-data/neighborhood-priority-found-core-20261123.mjs': '510888afe814ed2cf67697f742135f22a945dc68c2ef381938578ab682341f46',
  'docs/catalogue-coverage/priority-found-east-20261123.json': '897ce04a64d07b3d57e752bca55bba91058cac1bc5bafe771f16fa9321685cf2',
  'lib/discovery/catalogue-data/neighborhood-priority-found-east-20261123.mjs': '0a6dc409c58bec2baaa504816c0ab3e17489104b7d9e133657de44c12ccff63b',
  'docs/catalogue-coverage/priority-found-south-20261123.json': 'f14246e3ab04e1a167af2d7ec1dee86ae3aa4ca2fcb7fe6769d2e753de4eeb56',
  'lib/discovery/catalogue-data/neighborhood-priority-found-south-20261123.mjs': '537b82db7e5d828848d71caa98cffe60049a31b1211478cdfc0b9b6fa7738b45',
}
const additions = new Map(batch.newRows.map(row => [row.id, row.normalizedRecordSha256]))
const evidence = /PRIORITY_FOUND_(?:EAST|NORTH|SOUTH|CORE)_20261123_|sofia-sparklab-mladost3-block304-3|Курс по роботика · LEGO WeDo 2\.0/u

const fileMatches = (path, digest) => !!digest && sha(readFileSync(new URL('../' + path, import.meta.url))) === digest
export const priorityFoundAllowsFileChange = path => prioritySparse2AllowsFileChange(path) || (Object.hasOwn(changed, path) && fileMatches(path, changed[path][1]))
export const priorityFoundAllowsNewFile = path => prioritySparse2AllowsNewFile(path) || (Object.hasOwn(added, path) && fileMatches(path, added[path]))

export function priorityFoundPriorSource(path, source) {
  source = prioritySparse2PriorSource(path, source)
  if (!Object.hasOwn(changed, path) || !evidence.test(source)) return source
  const [before, after] = changed[path]
  if (sha(source) !== after) throw Error('Unreviewed 23 Nov found priority source delta: ' + path)
  if (!frozenSources.has(path)) {
    const prior = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (sha(prior) !== before) throw Error('Found priority could not restore source: ' + path)
    frozenSources.set(path, prior)
  }
  return frozenSources.get(path)
}

export function priorityFoundPriorCatalogue(rows) {
  const seen = new Set()
  return prioritySparse2PriorCatalogue(rows).filter(row => {
    const expected = additions.get(row.id)
    if (!expected) return true
    if (seen.has(row.id)) throw Error('Duplicate found priority row: ' + row.id)
    seen.add(row.id)
    if (sha(JSON.stringify(row)) !== expected) throw Error('Unreviewed found priority row: ' + row.id)
    return false
  })
}
