import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from '../docs/catalogue-coverage/quarter-corroboration-20261123.json' with { type: 'json' }
import { postalPrecisionAllowsFileChange, postalPrecisionAllowsNewFile, postalPrecisionPriorCatalogue, postalPrecisionPriorSource } from './catalogue-postal-precision-20261123-scope.mjs'

// Exact inverse for earlier source and coverage receipts, not a runtime path.
const root = fileURLToPath(new URL('../', import.meta.url))
const base = '9fc6686600b9361ae4ae6bd4c088e651d1c43590'
const changed = {
  'lib/catalogue-service-photo-keys.mjs': ['733bf0084f2977d2f9baab68211967a1015dc1bb8a73a46dcb373be401e4d526', 'c57ce2b99bc37a45424af5c96ea09410732c77c8dbb596380c5d89ca0880c1dc'],
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs': ['c5d64aeea2bad66e146c1ec8439d566e4ff9f7f40a39788cb30d1ceb6ac4e6e6', '567693a8674f4b22204ca5f36aa79d52257f94b37b255e1fbb522cad1bc8c34d'],
  'lib/discovery/sofia-catalogue.mjs': ['7d6ada25278952c74c079a7d8fac2643dee188677110dd8219adb483c4e92d75', 'f1941c7492438d23c31c4aea67144a7617618c72cf9b156ab41ca6aec9b6a980'],
  'lib/locale/service-english.json': ['66dc16210db5bbee464821c9a0500d949e89d8bf4da062c4c84dc3a4247273e0', '35e8dd7513b2922f4001a2ff29bb36597accbb4957139643c23c376211bd2d57'],
}
const additions = {
  'docs/catalogue-coverage/dbros-intake-20261123.json': '2679f200a7630c4e15dbe5211dcbab21c41990710499cbe252f5291d27d28666',
  'docs/catalogue-coverage/priority-dental-20261123.json': '043588df13dad057240e7e684d4e7552a8fe603329b881e0f950235644c89208',
  'docs/catalogue-coverage/quarter-corroboration-20261123.json': 'c005d4c41506eb0ac3b80212eb062910a5ad468fad7a4d05ae2637ee60ebbd9e',
  'docs/catalogue-coverage/quarter-priority-premises-20261123.json': '67753860848428a2b2b49a957680703259fa9664e010b2a39e320f4f22ca3a3f',
  'lib/discovery/catalogue-data/neighborhood-dbros-intake-20261123.mjs': 'c7d8ba88411478fb345fb84c6071d4b5b2a7ab02e11f41299abe83b3d23b009a',
  'lib/discovery/catalogue-data/neighborhood-priority-dental-20261123.mjs': '9db0c0d41ec25b4c32c4f4af17b3098f4de1dcb08517ec3c1d2cb3aff2b83abf',
  'lib/discovery/catalogue-data/quarter-corroboration-20261123.mjs': '5c5e58dcf2a81ae3a68a907e715da625761cee282a5ffcfe6ab43b8061b1be97',
}
const admitted = {
  'sofia-dbros-vrazhdebna-botevgradsko431': 'a3936337bd1ef40234d1be686041c4a2a0ce5bd96dd436b57cad5dd6a0e8fba8',
  'sofia-kabident-lyulin9-vlaikov27': '699e422e9d132346a36546857b47d4bdc70d7b31516966857792eee4b6974b40',
}
const relocations = new Map(receipt.existingBusinesses.map(item => [item.id, item]))
const digest = value => createHash('sha256').update(value).digest('hex')
const fileMatches = (path, hash) => {
  if (!hash) return false
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === hash } catch { return false }
}
const earlier = new Map()

export const priorityAllowsFileChange = path => postalPrecisionAllowsFileChange(path) || Object.hasOwn(changed, path) && fileMatches(path, changed[path][1])
export const priorityAllowsNewFile = path => postalPrecisionAllowsNewFile(path) || Object.hasOwn(additions, path) && fileMatches(path, additions[path])
export function priorityPriorSource(path, source) {
  source = postalPrecisionPriorSource(path, source)
  if (!Object.hasOwn(changed, path) || !/applyReviewedQuarterCorroboration20261123|DBROS_INTAKE_20261123|sofia-dbros-vrazhdebna-botevgradsko431/u.test(source)) return source
  const [before, after] = changed[path]
  if (digest(source) !== after) throw Error('Unreviewed 23 Nov quarter-priority source delta: ' + path)
  if (!earlier.has(path)) {
    const prior = execFileSync('git', ['show', base + ':' + path], { cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
    if (digest(prior) !== before) throw Error('Quarter-priority replay did not verify every prior source byte: ' + path)
    earlier.set(path, prior)
  }
  return earlier.get(path)
}

export function priorityPriorCatalogue(rows) {
  const seen = new Set()
  return postalPrecisionPriorCatalogue(rows).flatMap(row => {
    const id = row?.id, relocation = relocations.get(id)
    if (!relocation && !Object.hasOwn(admitted, id)) return [row]
    if (seen.has(id)) throw Error('Duplicate 23 Nov quarter-priority premises: ' + id)
    seen.add(id)
    const sha = digest(JSON.stringify(row))
    if (!relocation) {
      if (sha !== admitted[id]) throw Error('Unreviewed 23 Nov quarter-priority intake: ' + id)
      return []
    }
    if (sha === relocation.beforeRow) return [row]
    if (sha !== relocation.afterRow) throw Error('Unreviewed 23 Nov quarter-priority location: ' + id)
    const [neighborhood] = relocation.neighborhood
    let coordinates
    if (row.coordinates.method === 'verified_official_address') coordinates = { ...row.coordinates, sourceNeighborhood: neighborhood }
    else {
      const { sourceAddress, ...original } = row.coordinates
      coordinates = original
    }
    const prior = { ...row, neighborhood, coordinates }
    if (digest(JSON.stringify(prior)) !== relocation.beforeRow) throw Error('Quarter-priority replay did not restore every prior field: ' + id)
    return [prior]
  })
}
