import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/north-west-priority-20261123.json' with { type: 'json' }
import dpool from '../docs/catalogue-coverage/dpool-lyulin2-verified-location-20261123.json' with { type: 'json' }
import viks from '../docs/catalogue-coverage/viks-lyulin8-verified-location-20261123.json' with { type: 'json' }
import unigas from '../docs/catalogue-coverage/unigas-intake-20261123.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const restored = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['3c35f02e550f5160190565db4feef2b15bfa0d0698dca6c77b7c71d74a34ae37', '595dd514f82ca92c7db4f11ee988cee8abd9e1ba43ae6d27546818e2ee7e405f'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['1fd5f8e5f292b804654d0b30a8557c8bc63e3a4c0f3b82502d59d5dac48b8af2', '2f233329e6d20ec0d93a37bc3e76097cdc002b9be0e9154eb21aac240ce9160d'],
  'lib/catalogue-service-photo-keys.mjs': ['2199f3247539250e19260165aa1b62ebe0c40afba87339236500b68bfd8c8908', 'c0a9f3e228063535cf98203bc71969e6903c5ddcf702b83dc63a83776cc04cd4'],
  'lib/locale/service-english.json': ['8d88a6eb5a75d19c4b07bdd5fb04f0b96f1729ddbb0795e7df0d4d018b53427b', '991d1ee386d0472f8c57a0c00b437663ed4827e1643d39e247f2bc03c2d91279'],
  'lib/specific-service-photo-ids.mjs': ['016d1f410ada2091533b9ac2d3ecb47b3926467e2ffa128f61ab7d8cafdc1f10', '931bed3bd8c154cf878c19285013b4301240baeee0456f7efb6a4a7efbaacfbf'],
  'docs/specific-service-photo-generation-2026-11-12.json': ['9e1591eeac5d6a699c5868179eb21d1508df0cc4c10ecccc3fd9ef3f3faa95ff', '5975edb2f1bd4bdd98ad3a2fbd291052cee3433ffc634eef4f4713fc00803242'],
}
const added = {
  'docs/catalogue-coverage/north-west-priority-20261123.json': '40add97ec7fcd80fbaac9bab436f5dd07ba9efb03e73f15114b2e3b4bea6a0b2',
  'docs/catalogue-coverage/unigas-intake-20261123.json': '8c8b554f35acc325827abd8842bd17310640e3c62fc622df90a6619dc4d3f763',
  'docs/catalogue-coverage/dpool-lyulin2-verified-location-20261123.json': 'b17d7b90d7c98b0426fa22a0d5101ea4a553a3fba2e5d0a1ff0fd146854611a3',
  'docs/catalogue-coverage/viks-lyulin8-verified-location-20261123.json': '96785c771dbb03be01a633ff190daacafe133d2d210352a15f384afe5299985c',
  'lib/discovery/catalogue-data/neighborhood-unigas-20261123.mjs': '31bf081b612e36f1c9847456c5e4c8853ea69d4832d7f3f6582ce4754dc8dec4',
  'lib/discovery/catalogue-data/dpool-lyulin2-verified-location-20261123.mjs': '21d833d1bdcb5bd1c26bf63875889d94f422916c2bf9a9b4b28edbaba4cf4647',
  'lib/discovery/catalogue-data/viks-lyulin8-verified-location-20261123.mjs': '583bec43cafced0f939f85bb6054438e87fd52f28a12bf2c9fcb99d980d9e73f',
  'public/service-photos/sx-auto-lpg-injection-installation-v1.webp': 'dcc3cddc32803b98e04a7e22449964d5b65be145fe1f523bd467d56f1c7a5050',
}
const pointRepairs = new Map([
  [dpool.business.id, [dpool.identities.normalizedPriorRowSha256, dpool.identities.normalizedAfterRowSha256, dpool.business.priorAddress]],
  [viks.existingBusiness.id, [...viks.existingBusiness.normalizedRecordSha256, viks.existingBusiness.addressUnchanged]],
])
function matchesFile(path, sha) {
  if (!sha) return false
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === sha } catch { return false }
}
export const northWestAllowsFileChange = path => Object.hasOwn(changed, path) && matchesFile(path, changed[path][1])
export const northWestAllowsNewFile = path => Object.hasOwn(added, path) && matchesFile(path, added[path])

export function northWestPriorSource(path, source) {
  if (!Object.hasOwn(changed, path) || !/UNIGAS_INTAKE_20261123|sofia-unigas-romano-voenna-rampa-konstantin3|sx-auto-lpg-injection-installation/u.test(source)) return source
  const [before, after] = changed[path]
  if (digest(source) !== after) throw Error('Unreviewed 23 Nov north-west priority source delta: ' + path)
  if (!restored.has(path)) {
    const prior = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (digest(prior) !== before) throw Error('North-west intake could not restore the exact prior source: ' + path)
    restored.set(path, prior)
  }
  return restored.get(path)
}

export function northWestPriorCatalogue(rows) {
  const seen = new Set()
  return rows.flatMap(row => {
    const point = pointRepairs.get(row.id), isNew = row.id === unigas.business.id
    if (!isNew && !point) return [row]
    if (seen.has(row.id)) throw Error('Duplicate north-west priority record: ' + row.id)
    seen.add(row.id)
    const hash = digest(JSON.stringify(row))
    if (isNew) {
      if (hash !== unigas.business.normalizedRecordSha256) throw Error('Unreviewed north-west priority intake: ' + row.id)
      return []
    }
    const [before, after, address] = point
    if (hash === before) return [row]
    if (hash !== after) throw Error('Unreviewed north-west priority address delta: ' + row.id)
    const prior = { ...row, address, coordinates: null }
    if (digest(JSON.stringify(prior)) !== before) throw Error('North-west replay must not change the original non-location fields: ' + row.id)
    return [prior]
  })
}
