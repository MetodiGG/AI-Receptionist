import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from '../docs/catalogue-coverage/coordinate-scope-recovery-20261123.json' with { type: 'json' }

// Keep prior whole-source and row audits exact as new checked premises arrive.
// This restores only the precise reviewed deltas; it is never used by runtime.
const root = fileURLToPath(new URL('../', import.meta.url))
const base = '2dd2d5930e9e5df03ed6fa79911c61df31434fc7'
const changed = {
  'lib/discovery/sofia-catalogue.mjs': ['6787e1aac4f17df590bbd789bbd61718442d1db3a75877f15ababe96c70abaf6', '7d6ada25278952c74c079a7d8fac2643dee188677110dd8219adb483c4e92d75'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['6eade1b8bd8068e9a81eb322350625210c2511d99ee3f36da4c26d1bd69e364e', 'c5d64aeea2bad66e146c1ec8439d566e4ff9f7f40a39788cb30d1ceb6ac4e6e6'],
  'lib/catalogue-service-photo-keys.mjs': ['dc2c0aee207e2c7e086d2c2be801d9b88ecb3ab97f1789add5a8dda700b6d904', '733bf0084f2977d2f9baab68211967a1015dc1bb8a73a46dcb373be401e4d526'],
  'lib/locale/service-english.json': ['8adb0620253571f9225e9eaaf4e25652b78330bcc7d74f010da37695d10844e4', '66dc16210db5bbee464821c9a0500d949e89d8bf4da062c4c84dc3a4247273e0'],
}
const additions = {
  'docs/catalogue-coverage/northern-east-premises-20261123.json': '4b725198c60bead14271452b5005db0d75c4eb76b0c00c2e66beb6de6068157e',
  'docs/catalogue-coverage/coordinate-scope-recovery-20261123.json': 'eda1346ab8abf668bb10f96d86fa0010419b39fb72a3a0550cb4b78a466eb2fe',
  'docs/catalogue-coverage/sport-education-gap-20261123.json': '2fa7188e4a9a80b8e1c875a5d58ae26e4b65249c09997e4c100e9a18e342aa32',
  'docs/catalogue-coverage/doichinova-intake-20261123.json': '3a5632db2405b0d6eee773f005aeff6079bdbff96a6b63fb4a9953ac0222d753',
  'lib/discovery/catalogue-data/coordinate-scope-recovery-20261123.mjs': '076192a509324a5e8db191c7aa72322b970fc329c81dfaa10f1ccd057897c8d3',
  'lib/discovery/catalogue-data/neighborhood-sport-education-gap-20261123.mjs': '5739ef636d317b1ddd7d696f131476a36620971509c4a9f7cbe3267f00f48537',
  'lib/discovery/catalogue-data/neighborhood-doichinova-intake-20261123.mjs': '9fceb5685796751749a5d676d55297f9a80a4b4c0d424adae3efd4a66b522c0b',
}
const admitted = {
  'sofia-umni-deca-obelya2-106-3': '86980b99973ac4df81a411247431c2b7f7d87bde0799ee624df827c6b8eb0c97',
  'sofia-doichinova-lyulin3-block368': '06ce934c865e7335284a3f6eb2370ad316263c0527edde6a0ede0cc341ea6a6d',
}
const alternatives = new Map(receipt.recovered.map(item => [item.id, item]))
const digest = value => createHash('sha256').update(value).digest('hex')
const hashMatches = (path, sha) => {
  if (!sha) return false
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === sha } catch { return false }
}
const previousSources = new Map()

export const northernEastAllowsFileChange = path => Object.hasOwn(changed, path) && hashMatches(path, changed[path][1])
export const northernEastAllowsNewFile = path => Object.hasOwn(additions, path) && hashMatches(path, additions[path])

export function northernEastPriorSource(path, source) {
  if (!Object.hasOwn(changed, path) ||
      !/applyReviewedCoordinateScopeRecovery20261123|SPORT_EDUCATION_GAP_20261123|DOICHINOVA_INTAKE_20261123|sofia-umni-deca-obelya2-106-3/u.test(source)) return source
  const [before, after] = changed[path]
  if (digest(source) !== after) throw Error('Unreviewed 23 Nov northern-east source delta: ' + path)
  if (!previousSources.has(path)) {
    const prior = execFileSync('git', ['show', base + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
    if (digest(prior) !== before) throw Error('Northern-east replay did not verify every prior source byte: ' + path)
    previousSources.set(path, prior)
  }
  return previousSources.get(path)
}

export function northernEastPriorCatalogue(rows) {
  const seen = new Set()
  return rows.flatMap(row => {
    const id = row?.id, relocation = alternatives.get(id)
    if (!relocation && !Object.hasOwn(admitted, id)) return [row]
    if (seen.has(id)) throw Error('Duplicate 23 Nov northern-east premises: ' + id)
    seen.add(id)
    const sha = digest(JSON.stringify(row))
    if (!relocation) {
      if (sha !== admitted[id]) throw Error('Unreviewed 23 Nov northern-east intake: ' + id)
      return []
    }
    if (sha === relocation.previousRowSha256) return [row]
    if (sha !== relocation.reviewedRowSha256) throw Error('Unreviewed 23 Nov northern-east location: ' + id)
    const [neighborhood] = relocation.neighborhood
    const coordinates = relocation.previousPointMissing ? null : { ...row.coordinates, sourceNeighborhood: neighborhood }
    const prior = { ...row, neighborhood, coordinates }
    if (digest(JSON.stringify(prior)) !== relocation.previousRowSha256) throw Error('Northern-east replay did not restore every prior field: ' + id)
    return [prior]
  })
}
