import { approvedCatalogueRecord, catalogueRecordSchema } from './catalogue-policy.mjs'
import { CATEGORY_IDS } from './categories.mjs'

export const CATALOGUE_TARGET = Object.freeze({ minimum: 1500, preferred: 2000 })
const addressKey = row => (row.address || 'service_area').toLocaleLowerCase('bg').replace(/[^\p{L}\p{N}]/gu, '')
const ownerHost = row => new URL(row.website).hostname.replace(/^www\./, '')
const identityKeys = row => [`owner:${ownerHost(row)}:${addressKey(row)}`, ...(row.phone ? [`phone:${row.phone}:${addressKey(row)}`] : [])]

export function catalogueCoverage(records, now = Date.now()) {
  const rows = records.map(row => approvedCatalogueRecord(row, now)).filter(Boolean)
  return {
    checkedAt: new Date(now).toISOString(), target: CATALOGUE_TARGET,
    approvedRecords: rows.length, targetReached: rows.length >= CATALOGUE_TARGET.minimum,
    remainingToMinimum: Math.max(0, CATALOGUE_TARGET.minimum - rows.length),
    remainingToPreferred: Math.max(0, CATALOGUE_TARGET.preferred - rows.length),
    ownerDomains: new Set(rows.map(ownerHost)).size,
    located: rows.filter(row => row.coordinates).length,
    unlocated: rows.filter(row => !row.coordinates && row.locationKind === 'premises').length,
    serviceAreas: rows.filter(row => row.locationKind === 'service_area').length,
    neighborhoodsUnspecified: rows.filter(row => !row.neighborhood).length,
    categories: CATEGORY_IDS.map(category => ({ category, primaryRecords: rows.filter(row => row.category === category).length,
      offeringService: rows.filter(row => row.services.some(service => service.category === category)).length,
      located: rows.filter(row => row.coordinates && row.services.some(service => service.category === category)).length })),
  }
}

// A local intake gate, NOT an automatic verifier or publisher. It cannot fetch
// sites, call providers, guess facts, approve drafts or edit the live catalogue.
export function auditCatalogueBatch(existing, batch, now = Date.now()) {
  if (!Array.isArray(batch) || batch.length > 5000) throw Error('Expected at most 5000 candidate records')
  const ids = new Set(existing.map(row => row.id)), identities = new Set(existing.flatMap(identityKeys))
  const readyForReview = [], rejected = [], pending = []
  for (const raw of batch) {
    const parsed = catalogueRecordSchema.safeParse(raw)
    const id = typeof raw?.id === 'string' ? raw.id.slice(0, 90) : '(missing id)'
    if (!parsed.success) { rejected.push({ id, reason: 'invalid_schema', fields: [...new Set(parsed.error.issues.map(issue => issue.path.join('.')))] }); continue }
    const row = parsed.data, keys = identityKeys(row)
    if (ids.has(row.id) || keys.some(key => identities.has(key))) { rejected.push({ id, reason: 'duplicate_identity' }); continue }
    if (!approvedCatalogueRecord(row, now)) { pending.push({ id, reason: 'review_required_or_expired' }); continue }
    const sourceHost = new URL(row.verification.booking.url).hostname.replace(/^www\./, ''), host = ownerHost(row)
    if (sourceHost !== host && !sourceHost.endsWith(`.${host}`)) { pending.push({ id, reason: 'first_party_appointment_evidence_required' }); continue }
    ids.add(row.id); keys.forEach(key => identities.add(key)); readyForReview.push(row.id)
  }
  return { readyForReview, pending, rejected,
    notice: 'Schema and duplicate audit only. A reviewer must verify current first-party service, appointment, contact and address facts before explicitly importing any batch. Nothing is published automatically.' }
}
