import { access } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord, validateCatalogue, EXCLUDED_GENERAL_CLINIC_IDS } from '../lib/discovery/catalogue-policy.mjs'
import { categoryById } from '../lib/discovery/categories.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { COVERAGE_20261116_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-coverage-20261116.mjs'
import { assessManualIntakeReview } from './catalogue-manual-intake-review.mjs'
import { expiredCatalogueOfferHold } from '../lib/discovery/catalogue-expired-offer-holds.mjs'

export function cataloguePointCounts(records) {
  return {
    firstParty: records.filter(row => row.coordinates?.method === 'first_party_coordinates').length,
    reviewedOsm: records.filter(row => row.coordinates?.method === 'verified_address_geocode').length,
    officialSofia: records.filter(row => row.coordinates?.method === 'verified_official_address').length,
  }
}

// Offline only: no Google, crawling, source uploads, personal contacts or DB.
export function cataloguePublicationState(records, now = Date.now(), { manualReviews = COVERAGE_20261116_REVIEWS } = {}) {
  // Intentionally excluded records still pass the complete source schema.
  // A malformed source must not be hidden by the publication exclusion.
  const rows = validateCatalogue(records)
  const current = rows.map(row => approvedCatalogueRecord(row, now)).filter(Boolean)
  const withheldExpiredOffers = rows.map(row => expiredCatalogueOfferHold(row, now)).filter(Boolean)
  const withheldIds = new Set(withheldExpiredOffers.map(hold => hold.id))
  const excludedIds = new Set(EXCLUDED_GENERAL_CLINIC_IDS)
  const excluded = rows.filter(row => excludedIds.has(row.id))
  const sourceById = new Map(rows.map(row => [row.id, row]))
  const currentById = new Map(current.map(row => [row.id, row]))
  const recheck = rows.filter(row => row.verification.status === 'approved' &&
    !excludedIds.has(row.id) && !withheldIds.has(row.id) && !currentById.has(row.id))
  const sourceReviews = new Map()
  for (const review of manualReviews) if (review.manualIntakeResolution) {
    if (sourceReviews.has(review.id)) throw Error(`Duplicate manual source review: ${review.id}`)
    sourceReviews.set(review.id, review)
  }
  const manualIntakeResolutions = []
  // The offline intake gate remains limited to 5,000 candidates per batch;
  // validate a larger local inventory in bounded chunks, retaining previous
  // chunks as duplicate evidence. Public search pagination is unchanged.
  for (let offset = 0; offset < current.length; offset += 5000) {
    const audit = auditCatalogueBatch(current.slice(0, offset), current.slice(offset, offset + 5000), now)
    const rejected = [...audit.rejected]
    const pending = audit.pending.filter(item => {
      // Keep the ordinary intake warning intact. Only this warning may be
      // resolved by a fresh, independently recorded, whole-record-bound manual
      // source review. Duplicate/schema/expired/other failures never bypass it.
      if (item.reason !== 'first_party_appointment_evidence_required') return true
      const row = currentById.get(item.id)
      // Ordinary intake reserves identity keys only for ready candidates, not
      // pending ones. Before resolving a pending source warning, compare that
      // record with ALL current peers using the unchanged identity-key logic.
      // This catches another pending or later ready alias in the same chunk,
      // and keeps the decision independent of ordering and chunk boundaries.
      const duplicateAudit = auditCatalogueBatch(current.filter(peer => peer.id !== item.id), [row], now)
      if (duplicateAudit.rejected.length) {
        rejected.push(...duplicateAudit.rejected)
        return true
      }
      const resolution = assessManualIntakeReview(sourceById.get(item.id), sourceReviews.get(item.id), now)
      if (!resolution) return true
      manualIntakeResolutions.push(resolution)
      return false
    })
    if (pending.length || rejected.length) throw Error(`Catalogue review failed: ${JSON.stringify({ pending, rejected })}`)
  }
  return { rows, current, excluded, recheck, manualIntakeResolutions, withheldExpiredOffers }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { rows, current, excluded, recheck, manualIntakeResolutions, withheldExpiredOffers } = cataloguePublicationState(SOFIA_CATALOGUE)
  if (manualIntakeResolutions.length) console.log(`Manual source reviews: ${manualIntakeResolutions.length} independently attested cross-host records; ordinary intake flags retained (${manualIntakeResolutions.map(row => row.id).join(', ')}).`)
  for (const row of rows) if (row.photo) {
    await access(fileURLToPath(new URL(`../public${row.photo.src}`, import.meta.url)))
  }
  const points = cataloguePointCounts(current)
  console.log(`Sofia catalogue: ${rows.length} records; ${current.length} currently approved; ${excluded.length} intentionally excluded by owner scope; ${points.firstParty} first-party points; ${points.reviewedOsm} reviewed OSM address points; ${points.officialSofia} reviewed official Sofia address points (CC BY 4.0).`)
  if (withheldExpiredOffers.length) console.log(`Withheld pending fresh confirmation: ${withheldExpiredOffers.map(({ id, validThrough }) => `${id} (expired ${validThrough})`).join(', ')}.`)
  console.log(`${new Set(current.map(row => new URL(row.website).hostname.replace(/^www\./, ''))).size} official website domains; ${current.filter(row => row.booking.kind === 'form').length} booking flows; ${current.filter(row => row.booking.kind === 'phone').length} appointment phone actions; ${current.filter(row => row.locationKind === 'service_area').length} service-area providers.`)
  console.log('Service coverage (a multi-service business can appear in more than one category):')
  const byCategory = new Map()
  for (const row of current) for (const category of new Set(row.services.map(service => service.category))) {
    byCategory.set(category, (byCategory.get(category) || 0) + 1)
  }
  for (const [id, count] of byCategory) console.log(`${categoryById(id).bg}: ${count}`)
  if (recheck.length) {
    console.error(`Review required before publication: ${recheck.map(row => row.id).join(', ')}`)
    process.exitCode = 1
  }
}
