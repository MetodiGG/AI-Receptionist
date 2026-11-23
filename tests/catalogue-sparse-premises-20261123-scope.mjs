import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/sparse-premises-priority-20261123.json' with { type: 'json' }
import salt from '../docs/catalogue-coverage/salt-hug-intake-20261123.json' with { type: 'json' }
import frantsov from '../docs/catalogue-coverage/frantsov-intake-20261123.json' with { type: 'json' }
import solux from '../docs/catalogue-coverage/solux-auto-intake-20261123.json' with { type: 'json' }
import masters from '../docs/catalogue-coverage/masters-dance-intake-20261123.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const digest = value => createHash('sha256').update(value).digest('hex')
const cache = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['ee244887dabfed17c406a0b192b9a8d865d1047295c7f6f548d82d3d5a3f9a6a', '55b02f33ddf0297e8c602a4b17d0c2f01426388df98a5db6c7bc926a1c9a4333'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['bfc57b692bfcb9436eba8bbe0e7be515ec0152ead6fc3f117796da3e252c9546', '87729479c89050b682b8b12aef636b4a0e75f2c70a8ca386a4471857a193254f'],
  'lib/locale/service-english.json': ['379ea24c27f8a40a0f770d411c0cff028ef59fe88ad29eebfc42d240e562111f', '153e148d989aac2a007ef03a4a5fbdd6a22996f01f04bafa9fc1334a5d3daef6'],
  'lib/catalogue-service-photo-keys.mjs': ['c4f2b227501c52a29c7ed25be77072e4df1cfef69b46e273f34ad8a0f18fba85', 'f730c97d97ddb964a3b96c1d9d3aa91e84cf7a2ae5e9f04dd0bb8d43fa3d782a'],
  'lib/specific-service-photo-ids.mjs': ['b9f70334f7ba16a7958607c13c04650e5963b298a5a713c92c00e5d2ba7c8550', 'd5010cbac4a350528ed2c352a11e72a3882d2d5d870d76e190f4bc5f18fd62a7'],
  'docs/specific-service-photo-generation-2026-11-12.json': ['3af2058a4c58ce4810dc0c4ea70c7aacf2a65d78345ddb84a99f1b698c8f6a74', '807b12c3631dec8927f2225b9533dd3d46252bb006b716d6557f780560095edd'],
}
const added = {
  'docs/catalogue-coverage/sparse-premises-priority-20261123.json': '93fd1060f0a8650fcb77e49d8ee6eba6a1bc3c90304dc9bc5243cccf44746065',
  'docs/catalogue-coverage/frantsov-intake-20261123.json': 'df49a86c24aa2af7fb5dffd95edc99ed4c792e21d44da27f84d70a7e9fc47434',
  'docs/catalogue-coverage/solux-auto-intake-20261123.json': '83aae2695694b36f88739fcb6fa77baf64fbfc069981eb2c1c7964b190d2032e',
  'docs/catalogue-coverage/salt-hug-intake-20261123.json': '222f307f8b525aaa7d2003788a7057cb4b2f0d0356c26552db9a41ba34577319',
  'docs/catalogue-coverage/masters-dance-intake-20261123.json': 'c502d48e910f1aee035fa892b4544c346dbd3727a6f1e75a4257b9ead4519ca4',
  'lib/discovery/catalogue-data/neighborhood-frantsov-intake-20261123.mjs': '35ebf6d0127b1c6939d4283ecde8660106d45a01149a46c140c381a071d57f93',
  'lib/discovery/catalogue-data/neighborhood-solux-auto-intake-20261123.mjs': 'a156bce49c42e11aff300c0dbc56fdf117b3e4fd9f3488e09cf0f94c44c2c813',
  'lib/discovery/catalogue-data/neighborhood-salt-hug-intake-20261123.mjs': 'ebbf4ee3bf00ab0279817bf6fabf79f8a7c11081d371e0a274f0db06a2010496',
  'lib/discovery/catalogue-data/neighborhood-masters-dance-intake-20261123.mjs': 'ffc85e2647ec196e154e3488e7ee786c41eced3ea5472e652905485658d908fc',
  'public/service-photos/sx-adult-salt-room-v1.webp': '5f798967ebc7983bbdc6d8806774478927a53f750046013cc176a643b8175210',
}
const approvedAdditions = new Map([
  ...[salt.business, frantsov.newBusiness, solux.business].map(row => [row.id, row.normalizedRecordSha256]),
  [masters.business.id, masters.identities.normalizedRecordSha256],
])
function hasHash(path, sha) {
  try { return Boolean(sha) && digest(readFileSync(new URL('../' + path, import.meta.url))) === sha } catch { return false }
}
export const sparsePremisesAllowsFileChange = path => Object.hasOwn(changed, path) && hasHash(path, changed[path][1])
export const sparsePremisesAllowsNewFile = path => Object.hasOwn(added, path) && hasHash(path, added[path])

export function sparsePremisesPriorSource(path, source) {
  if (!Object.hasOwn(changed, path) || !/SALT_HUG_INTAKE_20261123|sofia-salt-hug-druzhba1-block195v|sx-adult-salt-room/u.test(source)) return source
  const [before, after] = changed[path]
  if (digest(source) !== after) throw Error('Unreviewed 23 Nov sparse-premises priority source delta: ' + path)
  if (!cache.has(path)) {
    const previous = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (digest(previous) !== before) throw Error('Sparse-premises priority could not restore exact prior source: ' + path)
    cache.set(path, previous)
  }
  return cache.get(path)
}

export function sparsePremisesPriorCatalogue(rows) {
  const seen = new Set()
  return rows.filter(row => {
    const hash = approvedAdditions.get(row.id)
    if (!hash) return true
    if (seen.has(row.id)) throw Error('Duplicate sparse-premises intake: ' + row.id)
    seen.add(row.id)
    if (digest(JSON.stringify(row)) !== hash) throw Error('Unreviewed sparse-premises intake: ' + row.id)
    return false
  })
}
