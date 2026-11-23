import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import batch from '../docs/catalogue-coverage/levski-address-priority-20261123.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = input => createHash('sha256').update(input).digest('hex')
const frozenSources = new Map()
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['88d542fad698c9a5388b2a0eda3692fde30685c84c6cee157a5f17f99e583c54', '8896181187a109397a9ffde2ffe69c228797412ccbfdaf8fb5ed915d15750ab9'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['43021f36ecebe92b9b8636940429f8dbac8b0c1660aa10b063c278533a2d3d69', '7172bfe1ba20513be36b6d0e5db64cb8881f44560ff7c387edde57d8ac00da61'],
  'lib/catalogue-service-photo-keys.mjs': ['7095d0526b2b072fbbe9e2d6206508428618c8316769fbc9a05fd0b35cdc85f6', 'c20b4c067b484bc257518509faec1abdb62938bd96a4ceec986eb44bcf305646'],
  'lib/locale/service-english.json': ['3dc595410ab611ce5c096a514a49cb5b79f77e0c8e3118e24dcec06c2d038759', '0a0448743f31ad8f90adba54def99effece13d45de6a31b99009d7fa17c9bd55'],
}
const added = {
  'docs/catalogue-coverage/alkom-postal-recovery-20261123.json': '6e48ffa8d555048fbb23c36d9e550cc312d278738249f4729e69e17517d22331',
  'docs/catalogue-coverage/dca-levski-intake-20261123.json': '5aac2b1e7dd8041d31de820db3e68d3ad9e666878cbcea9f8bbc9a3d5475e466',
  'docs/catalogue-coverage/levski-address-priority-20261123.json': '995ecfdcc2d3fce34038056a657baec05f96de38236cabb08c88d787f3e86fb6',
  'lib/discovery/catalogue-data/north-west-entrance-recovery-20261123.mjs': 'e0ca69dc840512250200e149c05a8c490d1c15c833b367b623733bcfc414b012',
  'docs/catalogue-coverage/north-west-entrance-recovery-20261123.json': 'eae5f52efb4a50730638a2a584accbcb2ed05ab67d5e23dfeb7bd0f2d45da96a',
  'docs/catalogue-coverage/named-road-alias-recovery-20261123.json': 'c4e196ac6a0beff8d5487127d89a6761c8885e710a366acf96d537f3132e72b5',
  'docs/catalogue-coverage/secondary-east-intake-20261123.json': '137fa4a46b9c9f12544c96e6d383224e4a014739321179ea6bf98f4d7ee0a76e',
  'lib/discovery/catalogue-data/alkom-postal-recovery-20261123.mjs': '8cc3e8e26c9c7de4cbf0915bf465cbd53823caed95129b5b280e84a6bf366d27',
  'lib/discovery/catalogue-data/named-road-alias-recovery-20261123.mjs': '966eb0253686cff2f9e66c4dc0f2c0cd9ef4346e3e6ffa5ad49c05f89af5372d',
  'lib/discovery/catalogue-data/neighborhood-dca-levski-20261123.mjs': '20856e78c36e5292ebf06d9883b6796785a27c2174cc107cae8f2eb3962435fc',
  'lib/discovery/catalogue-data/north-west-entrance-recovery-20261123.mjs': 'e0ca69dc840512250200e149c05a8c490d1c15c833b367b623733bcfc414b012',
  'scripts/catalogue-address-priority.mjs': 'edd7e38343a2b1e8929a5178f117fef55d97ec4c5702a9e14a97afc046379112',
}
const additions = new Map(batch.newRows.map(row => [row.id, row.normalizedRecordSha256]))
const recoveries = new Map(batch.existingChanges.map(row => [row.id, row]))
const evidence = /DCA_LEVSKI_INTAKE_20261123_|sofia-dca-garage-levski-v-letostruy27|Фолиране на задни автомобилни стъкла · хеви джип/u

const fileMatches = (path, digest) => !!digest && sha(readFileSync(new URL('../' + path, import.meta.url))) === digest
export const levskiAddressPriorityAllowsFileChange = path => Object.hasOwn(changed, path) && fileMatches(path, changed[path][1])
export const levskiAddressPriorityAllowsNewFile = path => Object.hasOwn(added, path) && fileMatches(path, added[path])

export function levskiAddressPriorityPriorSource(path, source) {
  if (!Object.hasOwn(changed, path) || !evidence.test(source)) return source
  const [before, after] = changed[path]
  if (sha(source) !== after) throw Error('Unreviewed 23 Nov Levski address priority source delta: ' + path)
  if (!frozenSources.has(path)) {
    const prior = execFileSync('git', ['show', batch.baseline + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
    if (sha(prior) !== before) throw Error('Levski address priority could not restore source: ' + path)
    frozenSources.set(path, prior)
  }
  return frozenSources.get(path)
}

export function levskiAddressPriorityPriorCatalogue(rows) {
  const seen = new Set()
  return rows.flatMap(row => {
    const recovery = recoveries.get(row.id), addition = additions.get(row.id)
    if (!recovery && !addition) return [row]
    if (seen.has(row.id)) throw Error('Duplicate Levski address priority row: ' + row.id)
    seen.add(row.id)
    const actual = sha(JSON.stringify(row))
    if (recovery && actual === recovery.normalizedRecordBeforeSha256) return [row]
    if (actual !== (recovery?.normalizedRecordAfterSha256 ?? addition)) throw Error('Unreviewed Levski address priority row: ' + row.id)
    if (!recovery) return []
    const prior = { ...row, coordinates: null }
    if (sha(JSON.stringify(prior)) !== recovery.normalizedRecordBeforeSha256) throw Error('Non-coordinate change in Levski address priority: ' + row.id)
    return [prior]
  })
}
