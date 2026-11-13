// Mechanical compiler for reviewed, exact-name photo association plans. It
// never changes catalogue records, prices, reviews or booking destinations.
import { readFile, writeFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { TEMPORARILY_HELD_CATALOGUE_SERVICES } from '../lib/discovery/catalogue-service-eligibility.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { APPROVED_SERVICE_PHOTO_IDS } from '../lib/service-photos.mjs'
import { GENERATED_CATALOGUE_SERVICE_PHOTO_IDS } from '../lib/service-photos-catalogue-expansion.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const paths = process.argv.slice(2).filter(arg => !arg.startsWith('--'))
if (!paths.length) throw Error('Provide reviewed plan JSON paths')
const partial = process.argv.includes('--partial'), apply = process.argv.includes('--apply')
const plans = await Promise.all(paths.map(path => readFile(resolve(path), 'utf8').then(JSON.parse)))
const known = new Set([...APPROVED_SERVICE_PHOTO_IDS, ...GENERATED_CATALOGUE_SERVICE_PHOTO_IDS])
const families = new Map(), target = new Map(), assignments = new Map()
const identity = (businessId, category, name) => JSON.stringify([businessId, category, name.trim()])
let baselineRows = 0
for (const raw of SOFIA_CATALOGUE) {
  const business = approvedCatalogueRecord(raw, Date.parse('2026-11-12T00:00:00Z'))
  if (!business) continue
  for (const service of business.services) if (serviceThumbnail(service, { business }).photoMatch === 'neutral') {
    baselineRows++
    target.set(identity(business.id, service.category, service.name), { businessId: business.id, category: service.category, name: service.name })
  }
}
for (const plan of plans) for (const family of plan.families || []) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(family.id || '')) throw Error('Invalid family ID')
  if (family.existingId && (family.existingId !== family.id || !known.has(family.id))) throw Error(`Invalid reused asset: ${family.id}`)
  if (!family.existingId && (!family.id.startsWith('sx-') || typeof family.scene !== 'string' || family.scene.length < 25 || typeof family.label !== 'string')) throw Error(`Missing concrete scene: ${family.id}`)
  const previous = families.get(family.id)
  if (previous && JSON.stringify(previous) !== JSON.stringify(family)) throw Error(`Conflicting family definitions: ${family.id}`)
  families.set(family.id, family)
}
for (const plan of plans) for (const assignment of plan.assignments || []) {
  if (typeof assignment.businessId !== 'string' || typeof assignment.category !== 'string' || typeof assignment.name !== 'string') throw Error('Invalid exact assignment')
  const key = identity(assignment.businessId, assignment.category, assignment.name)
  if (!target.has(key)) throw Error(`Assignment is not an unpictured approved service: ${key}`)
  if (!known.has(assignment.photoId) && !families.has(assignment.photoId)) throw Error(`Unregistered photo: ${assignment.photoId}`)
  const previous = assignments.get(key)
  if (previous && previous.photoId !== assignment.photoId) throw Error(`Conflicting exact assignment: ${key}`)
  assignments.set(key, assignment)
}
const missing = [...target].filter(([key]) => !assignments.has(key)).map(([, value]) => value)
const unresolved = [], temporarilyHeld = []
const heldKeys = new Set(TEMPORARILY_HELD_CATALOGUE_SERVICES.map(item => identity(item.businessId, item.category, item.name)))
for (const item of plans.flatMap(plan => plan.unresolved || [])) {
  const key = identity(item.businessId, item.category, item.name)
  if (!target.has(key) && heldKeys.has(key)) { temporarilyHeld.push(item); continue }
  if (!target.has(key)) throw Error(`Unresolved row is not an eligible photo target: ${key}`)
  if (assignments.has(key)) throw Error(`Row cannot be both assigned and unresolved: ${key}`)
  unresolved.push(item)
}
const usedIds = [...new Set([...assignments.values()].map(item => item.photoId))].sort()
const pendingAssets = []
for (const id of usedIds) { try { await access(resolve(root, `public/service-photos/${id}-v1.webp`)) } catch { pendingAssets.push(id) } }
const report = { baselineRows, uniqueTargetKeys: target.size, assignedKeys: assignments.size, usedPhotoIds: usedIds.length,
  proposedNewFamilies: [...families.values()].filter(f => !f.existingId).length, missing, pendingAssets,
  unresolved, temporarilyHeld, complete: missing.length === 0 && pendingAssets.length === 0 && unresolved.length === 0 }
if (apply && !partial && !report.complete) throw Error(`Refusing incomplete release: ${missing.length} unmapped services / ${pendingAssets.length} pending assets`)
if (apply) {
  const rows = [...assignments.values()].sort((a,b) => identity(a.businessId,a.category,a.name).localeCompare(identity(b.businessId,b.category,b.name)))
    .map(({ businessId, category, name, photoId }) => [businessId, category, name, photoId])
  await writeFile(resolve(root, 'lib/catalogue-service-photo-associations.mjs'), `// Generated from reviewed exact-name plans; presentation only. Server-side only.\nexport const CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS = Object.freeze(${JSON.stringify(rows, null, 2)})\n`)
  await writeFile(resolve(root, 'lib/specific-service-photo-ids.mjs'), `// Generated asset IDs only; exact business/service associations stay server-side.\nexport const SPECIFIC_SERVICE_PHOTO_IDS = Object.freeze(${JSON.stringify(usedIds, null, 2)})\nconst specificIds = new Set(SPECIFIC_SERVICE_PHOTO_IDS)\nexport function specificServicePhotoKey(value) { return typeof value === 'string' && specificIds.has(value) ? value : null }\n`)
  await writeFile(resolve(root, 'docs/specific-service-photo-associations-2026-11-12.json'), JSON.stringify({ reviewedOn: '2026-11-12', scope: 'Exact approved catalogue business/category/service names; no source facts or prices changed.', families: [...families.values()], assignments: [...assignments.values()], report }, null, 2) + '\n')
}
console.log(JSON.stringify({ ...report, missing: report.missing.slice(0, 20), unresolved: report.unresolved.slice(0, 20), pendingAssets: report.pendingAssets.slice(0, 20), applied: apply }, null, 2))
if (!partial && !report.complete) process.exitCode = 1
