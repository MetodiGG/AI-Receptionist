import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { northernEastAllowsFileChange, northernEastAllowsNewFile, northernEastPriorSource, northernEastPriorCatalogue } from './catalogue-northern-east-20261123-scope.mjs'

// The historical receipts must still verify every previous byte and row, not
// exempt catalogue files from their tests whenever another batch is admitted.
const root = fileURLToPath(new URL('../', import.meta.url))
const base = 'fe2cd9e223c83a25da921ea561656d046c68dbae'
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['ebc1f872bd450298b79932aa2c9a588885b1f56698c9b96ee279d5b2cd70f387', '6787e1aac4f17df590bbd789bbd61718442d1db3a75877f15ababe96c70abaf6'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['4d07a7c0a6b55efbddb06f5a5de6caa0371102504a22701a0fb498a122440a17', '6eade1b8bd8068e9a81eb322350625210c2511d99ee3f36da4c26d1bd69e364e'],
  'lib/catalogue-service-photo-keys.mjs': ['67117c1988806640868f43fad1152ebd571d89a6e682e4a771041d4045d01ea0', 'dc2c0aee207e2c7e086d2c2be801d9b88ecb3ab97f1789add5a8dda700b6d904'],
  'lib/locale/service-english.json': ['8ef42fad6b2089d15237186663df866fe4b2008b845b06de6c405c8ab239e160', '8adb0620253571f9225e9eaaf4e25652b78330bcc7d74f010da37695d10844e4'],
}
const additions = {
  'docs/catalogue-coverage/additional-premises-20261123.json': '7580888e35f5e367da36be1a230e21859cc7a2e368c6d4efc16e3dfbb6e464a8',
  'docs/catalogue-coverage/education-intake-pavlovo-20261123.json': '810181feaa610b79e148c88a808e51045582e5fb262d3c1ec22eb512f62af969',
  'docs/catalogue-coverage/galileodent-intake-20261123.json': 'c2bf51013140ea9f4d039f472b07c2906cd04fb53681c1fefdb68b469bed009d',
  'docs/catalogue-coverage/tennis-lyulin-6-recovery-20261123.json': '13f948cd3319dc1021f2c712e67d9303fe5ed9b6eab68f0814b6941b3dd29bb2',
  'docs/catalogue-coverage/vm-auto-intake-20261123.json': '6a6ec8d0ef01b9bf8d7798e9ca95f23808cf4db19fa5414a19f674a9800574fe',
  'lib/discovery/catalogue-data/neighborhood-education-intake-20261123.mjs': '34899514121166f99643f3db8477404631ca66e5c0ec177477f9d7f186efb538',
  'lib/discovery/catalogue-data/neighborhood-galileodent-intake-20261123.mjs': '5e976719e2789e0f90feb7ba889e4e99d8fdb29eef3d797373d2ff3407d2ef1e',
  'lib/discovery/catalogue-data/tennis-lyulin-6-recovery-20261123.mjs': '69367cbb02ee16cc298be0c21bdf1563cde092e65bf955a81895d9fa2aed4ddd',
  'lib/discovery/catalogue-data/neighborhood-vm-auto-intake-20261123.mjs': 'ba9aa73de7973d94c770b403873773a638c9b41664a5681bb2475419be7de1f0',
}
const admitted = {
  'sofia-part-time-pavlovo-duychev12v': 'fc2b3968a9d8beb74dd9b191f0a98ac3e0f4f24e024ef2918c52bc86018c3701',
  'sofia-galileodent-nadezhda4-lomsko182': '91de2485687af803ef68028814f497260d5634b7a5af27eb930db3446f05ba64',
  'sofia-vm-auto-service-obelya-2-lomsko248a': '47bdb6353ff83913ac97aedef4311490db7eeb26bee6750572b5e2517d56778b',
}
const relocated = 'sofia-tennis-lyulin-6'
const relocatedBefore = 'bfde6b30dff3ced7dcc1b119d1d144ca03196f8344a7aeb6ed6cf26bf649476a'
const relocatedAfter = '0b8290e2d6daf6e9b4c391a95d3139ed3f298f9f8b5282a9bca71f604975f1c9'
const digest = value => createHash('sha256').update(value).digest('hex')
const fileMatches = (path, sha) => {
  if (!sha) return false
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === sha } catch { return false }
}
const previousSources = new Map()

export const additionalAllowsFileChange = path => northernEastAllowsFileChange(path) || Object.hasOwn(changed, path) && fileMatches(path, changed[path][1])
export const additionalAllowsNewFile = path => northernEastAllowsNewFile(path) || Object.hasOwn(additions, path) && fileMatches(path, additions[path])

export function additionalPriorSource(path, source) {
  source = northernEastPriorSource(path, source)
  if (!Object.hasOwn(changed, path) ||
      !/EDUCATION_INTAKE_20261123|GALILEODENT_INTAKE_20261123|applyReviewedTennisLyulin6Recovery20261123|sofia-part-time-pavlovo-duychev12v/u.test(source)) return source
  const [before, after] = changed[path]
  if (digest(source) !== after) throw Error('Unreviewed 23 Nov additional-premises source delta: ' + path)
  if (!previousSources.has(path)) {
    const prior = execFileSync('git', ['show', base + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
    if (digest(prior) !== before) throw Error('Additional-premises replay did not verify every prior source byte: ' + path)
    previousSources.set(path, prior)
  }
  return previousSources.get(path)
}

export function additionalPriorCatalogue(rows) {
  const seen = new Set()
  return northernEastPriorCatalogue(rows).flatMap(row => {
    const id = row?.id
    if (!Object.hasOwn(admitted, id) && id !== relocated) return [row]
    if (seen.has(id)) throw Error('Duplicate 23 Nov additional premises: ' + id)
    seen.add(id)
    const sha = digest(JSON.stringify(row))
    if (id !== relocated) {
      if (sha !== admitted[id]) throw Error('Unreviewed 23 Nov additional intake record: ' + id)
      return []
    }
    if (sha === relocatedBefore) return [row]
    if (sha !== relocatedAfter) throw Error('Unreviewed 23 Nov tennis location delta: ' + id)
    const { sourceAddress, ...coordinates } = row.coordinates
    const prior = { ...row, neighborhood: 'Люлин', coordinates }
    if (digest(JSON.stringify(prior)) !== relocatedBefore) throw Error('Tennis replay did not restore the exact prior row: ' + id)
    return [prior]
  })
}
