import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/late-november-gaps-20261123.json' with { type: 'json' }
import mikron from '../docs/catalogue-coverage/mikron-intake-20261123.json' with { type: 'json' }
import reformer from '../docs/catalogue-coverage/my-reformer-space-intake-20261123.json' with { type: 'json' }
import swimming from '../docs/catalogue-coverage/swimming-lyulin3-verified-location-20261123.json' with { type: 'json' }
import { northWestAllowsFileChange, northWestAllowsNewFile, northWestPriorCatalogue, northWestPriorSource } from './catalogue-north-west-priority-20261123-scope.mjs'

// Replay the original source and exact reviewed row inventory for historical scope tests.
// This is intentionally not a runtime address or publication mechanism.
const root = fileURLToPath(new URL('../', import.meta.url))
const digest = value => createHash('sha256').update(value).digest('hex')
const restored = new Map()
const addedRows = new Map([
  [mikron.business.id, mikron.business.normalizedRecordSha256],
  [reformer.newBusiness.id, reformer.newBusiness.normalizedRecordSha256],
])
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['2635c097bd63a9818e14ae502e30eb800f670fbda8e5715f847e73b60875b6d6', '3c35f02e550f5160190565db4feef2b15bfa0d0698dca6c77b7c71d74a34ae37'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['02f7243364fc9bb9acbc077341516509c279b4a3380ffd55a34b2208c04a9c20', '1fd5f8e5f292b804654d0b30a8557c8bc63e3a4c0f3b82502d59d5dac48b8af2'],
  'lib/catalogue-service-photo-keys.mjs': ['d1c76b63365656b63c459a004b3cc90e454c2267fd0e284a47aaa3ce0144be4e', '2199f3247539250e19260165aa1b62ebe0c40afba87339236500b68bfd8c8908'],
  'lib/locale/service-english.json': ['dec71d18ffe82077d88ce29b7be12d79b52958fe6a45d6b6ce19f3c2650037e1', '8d88a6eb5a75d19c4b07bdd5fb04f0b96f1729ddbb0795e7df0d4d018b53427b'],
  'lib/specific-service-photo-ids.mjs': ['ebe029a49701b6d85fb2ae1b2a2eafc46b1a26a6fcd8c67907b67ed54bcd6e2f', '016d1f410ada2091533b9ac2d3ecb47b3926467e2ffa128f61ab7d8cafdc1f10'],
  'docs/specific-service-photo-generation-2026-11-12.json': ['6b4ad83125cc098a50ca48cd331838947835808d9252d89630894024af0961d9', '9e1591eeac5d6a699c5868179eb21d1508df0cc4c10ecccc3fd9ef3f3faa95ff'],
}
const added = {
  'docs/catalogue-coverage/late-november-gaps-20261123.json': 'c8d74a2876b798eededfc00885e6242a7f0424321d4e5e84df0b9f5a4aceb2ad',
  'docs/catalogue-coverage/mikron-intake-20261123.json': '920e14e0f04ec0e5b9d59cf602e44100a3fbc7fa02ac143209822ee62913d096',
  'docs/catalogue-coverage/my-reformer-space-intake-20261123.json': 'a2469857cd17c624bfc80a761e59151c6f634d24a3a5dd4c30b224b326afc173',
  'docs/catalogue-coverage/swimming-lyulin3-verified-location-20261123.json': '60658f3a2a4f92630006e17cfbf1e8938d9da55278e97d39c9edbb518b902670',
  'lib/discovery/catalogue-data/neighborhood-mikron-20261123.mjs': 'c476eeed383b8b368d3957251be3412c883d572536028d2fa61e1c5e2a7e25fd',
  'lib/discovery/catalogue-data/neighborhood-my-reformer-space-20261123.mjs': '00e223fad99f0acd5d827a65ee277849398f6f2a4264a3caada07cd5c8ab9809',
  'lib/discovery/catalogue-data/swimming-lyulin3-verified-location-20261123.mjs': 'd81fc6fbc4d0ef36008eccf5a9f671144b55a2302ba12101634e14f4210fb897',
  'public/service-photos/sx-auto-sunroof-inspection-v1.webp': 'ea092c97203f7f1bb92029ad5db7110b11ad41c9a6fcb0a6ac7cd3231f02da55',
}
function fileMatches(path, sha) {
  if (!sha) return false
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === sha } catch { return false }
}
export const lateNovemberGapAllowsFileChange = path => northWestAllowsFileChange(path) || Object.hasOwn(changed, path) && fileMatches(path, changed[path][1])
export const lateNovemberGapAllowsNewFile = path => northWestAllowsNewFile(path) || Object.hasOwn(added, path) && fileMatches(path, added[path])

export function lateNovemberGapPriorSource(path, source) {
  source = northWestPriorSource(path, source)
  if (!Object.hasOwn(changed, path) || !/MIKRON_INTAKE_20261123|sofia-mikron-dotsev-knyazhevo-tsarboris298|sx-auto-sunroof-inspection/u.test(source)) return source
  const [before, after] = changed[path]
  if (digest(source) !== after) throw Error('Unreviewed 23 Nov Mikron intake source delta: ' + path)
  if (!restored.has(path)) {
    const prior = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (digest(prior) !== before) throw Error('Late 23 Nov gap intake could not restore the exact prior source: ' + path)
    restored.set(path, prior)
  }
  return restored.get(path)
}

export function lateNovemberGapPriorCatalogue(rows) {
  const seen = new Set()
  return northWestPriorCatalogue(rows).flatMap(row => {
    const exact = addedRows.get(row.id)
    if (!exact && row.id !== swimming.business.id) return [row]
    if (seen.has(row.id)) throw Error('Duplicate late 23 Nov gap intake record: ' + row.id)
    seen.add(row.id)
    const hash = digest(JSON.stringify(row))
    if (exact) {
      if (hash !== exact) throw Error('Unreviewed late 23 Nov gap intake record: ' + row.id)
      return []
    }
    const { normalizedPriorRowSha256, normalizedAfterRowSha256 } = swimming.identities
    if (hash === normalizedPriorRowSha256) return [row]
    if (hash !== normalizedAfterRowSha256) throw Error('Unreviewed late 23 Nov address-only delta: ' + row.id)
    const prior = { ...row, coordinates: null }
    if (digest(JSON.stringify(prior)) !== normalizedPriorRowSha256) throw Error('Swimming replay changed more than the postal point')
    return [prior]
  })
}
