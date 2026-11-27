import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/priority-sparse2-20261123.json' with { type: 'json' }
import { mopartIntakeAllowsFileChange, mopartIntakeAllowsNewFile, mopartIntakePriorCatalogue, mopartIntakePriorSource } from './catalogue-mopart-20261127-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = input => createHash('sha256').update(input).digest('hex')
const frozenSources = new Map()
const changed = {
  'docs/business-activity-cover-sources-2026-11-15.json': ['b6d04b2b19798365b5bf010db0eace883230c1c0fbc483853aead9573dd12dd7','7d36ac8a2caddca88af264b9ec2166788c761f3a11c2c3ce36665fe6e95e328f'],
  'lib/discovery/sofia-catalogue.mjs': ['50d8675d8ba19b5de17c129e7515f1b7fe2248f73119ab9eecd1cc238d0d399f','a03319986981aa6723600b5805249b290f16c10231b5a246e1519580fdb5936c'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['5128a9fc49988cfc84b0aec0e48112b18f0eae415b173174447ba1a9cf3978be','75088e3c77d272e7066568e29eb96bdbb9e73ccaa2d5ee55eec4066344d42bbb'],
  'lib/catalogue-service-photo-keys.mjs': ['85a1a2c545cc4fea3216ad94734d957eda78bab4e8f6e53d1c1a7f1e7e1326c9','ee91d89da48ba50021e8193b31a63d4d82290e35f650cd4a7936a8a3cb25554b'],
  'lib/locale/service-english.json': ['0a9f254a1924e761473d26ca9e24c235592041d7f35a9954ce4e5dffccfb8983','ad40690ae818849c0de36171926e5fc1b313a34cc70555ed767043345b475be6'],
  'lib/specific-service-photo-ids.mjs': ['699a1c59c4cce8d77d544f04f5171441e83ab2277becd62ffa6c26a82e6c3911','92fb165afa074aaab7ff0fd61b7d2ae3a4c28a2b2cdfec16a169c5f783e059bf'],
  'lib/business-activity-cover-assets.mjs': ['2f528ea18bc0729a8199d9197aafc1cc262e139ff0fbacaf69389eee6b3d9e42','d3990dd582ad5b5ebcb50bb113071117f2982aa5d357cc465131796422a54add'],
  'docs/specific-service-photo-generation-2026-11-12.json': ['95cc67933baf7e8f786d0214a4a450ef09b7200f98e3e5714a858091db110d77','0eff428030fcc54b6b44cbb52cf5eedd4c7d152e16b2ff24b037ad737d456e1c'],
}
const added = {
  'docs/catalogue-coverage/priority-sparse2-20261123.json': 'c5a9e5684166ce232f866d0e58d677334334d7a1803946aacc25ea3896166495',
  'docs/catalogue-coverage/priority-sparse2-north-20261123.json': '5d348ad47abf1d6fe55d5a3434cf5cfe0b28f6bee020f87d10aadd5a38abd500',
  'docs/catalogue-coverage/priority-sparse2-south-20261123.json': '618cf3c31def58460c53204d38cbc8f7fa2302831ab0c9dd2091b92c52db8882',
  'docs/catalogue-coverage/wmaa-mladost4-owner-point-20261123.json': 'dde1c01e2046281a7ddc0bbeb714d2d3370d54a6da2a2d0557dee2af16de429c',
  'lib/discovery/catalogue-data/neighborhood-priority-sparse2-north-20261123.mjs': '0e9873e7ad730b67f61197689a50b771a9d939e1017dbe56467ff3e2bc471228',
  'lib/discovery/catalogue-data/neighborhood-priority-sparse2-south-20261123.mjs': '313b52f9d6d171cfacdf2f405abe8e1bffaea5655cd33f91e51ebaa2daa48f74',
  'lib/discovery/catalogue-data/stephan-lagera-owner-point-20261123.mjs': '8a988523b94cb589d47850f53fe1f0a9f28ffa6e95b00cea29f8126b0a38b88a',
  'lib/discovery/catalogue-data/wmaa-mladost4-owner-point-20261123.mjs': 'e76861d9d1dc9605c1e87c841d1753eb3c56b3fd58b504ec73b7dd36ff6b24bc',
  'public/business-cover-photos/activity-sx-indoor-clay-tennis-court-v1.webp': '55e0bd91caca539df3369322ba3184dec19502db5aaa64f280ab07a47a9b6755',
  'public/service-photos/sx-indoor-clay-tennis-court-v1.webp': 'dc8e3deff7b79e02ff90fc9df0d724830690f31d95afcd74e67bbfc5702ffd38',
}
const additions = new Map(batch.newRows.map(row => [row.id, row.normalizedRecordSha256]))
const recoveries = new Map(batch.recoveredRows.map(row => [row.id, row]))
const evidence = /PRIORITY_SPARSE2_(?:NORTH|SOUTH)_20261123_|applyStephanLageraOwnerPoint20261123|sx-indoor-clay-tennis-court|Групови занимания за деца на 3–4 г\. · Опосум/u

const fileMatches = (path, digest) => !!digest && sha(readFileSync(new URL('../' + path, import.meta.url))) === digest
export const prioritySparse2AllowsFileChange = path => mopartIntakeAllowsFileChange(path) || (Object.hasOwn(changed, path) && fileMatches(path, changed[path][1]))
export const prioritySparse2AllowsNewFile = path => mopartIntakeAllowsNewFile(path) || (Object.hasOwn(added, path) && fileMatches(path, added[path]))

export function prioritySparse2PriorSource(path, source) {
  source = mopartIntakePriorSource(path, source)
  if (!Object.hasOwn(changed, path) || !evidence.test(source)) return source
  const [before, after] = changed[path]
  if (sha(source) !== after) throw Error('Unreviewed 23 Nov sparse2 priority source delta: ' + path)
  if (!frozenSources.has(path)) {
    const prior = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (sha(prior) !== before) throw Error('Sparse2 priority could not restore source: ' + path)
    frozenSources.set(path, prior)
  }
  return frozenSources.get(path)
}

export function prioritySparse2PriorCatalogue(rows) {
  const seen = new Set()
  return mopartIntakePriorCatalogue(rows).flatMap(row => {
    const added = additions.get(row.id), recovered = recoveries.get(row.id)
    if (!added && !recovered) return [row]
    if (seen.has(row.id)) throw Error('Duplicate sparse2 priority row: ' + row.id)
    seen.add(row.id)
    const digest = sha(JSON.stringify(row))
    if (added) {
      if (digest !== added) throw Error('Unreviewed sparse2 priority row: ' + row.id)
      return []
    }
    if (digest === recovered.previousRowSha256) return [row]
    if (digest !== recovered.normalizedRecordSha256) throw Error('Unreviewed sparse2 coordinate delta: ' + row.id)
    const original = { ...row, coordinates: null }
    if (sha(JSON.stringify(original)) !== recovered.previousRowSha256) throw Error('Sparse2 priority could not restore prior coordinates: ' + row.id)
    return [original]
  })
}
