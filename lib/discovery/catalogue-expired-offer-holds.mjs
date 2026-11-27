// Offline audit receipts only. A receipt cannot publish anything or bypass the
// current publication rules. A changed listing must receive a new review.
import { createHash } from 'node:crypto'
import { catalogueReviewDay } from './business-details.mjs'
import { approvedCatalogueRecord, catalogueRecordSchema } from './catalogue-policy.mjs'
import { assessPricingReview } from './catalogue-pricing-review.mjs'

const holds = new Map([
  ['sofia-balance-reformer-ovcha-kupel', {
    validThrough: '2026-11-25',
    reason: 'all_published_promotional_tariffs_expired',
    identity: '156c83ccf3e5b5aeed1bdcbae5a9a8145647c1c345bab14d1e51e02206b6eed2',
  }],
  ['sofia-maximum-solunska8', {
    validThrough: '2026-11-25',
    reason: 'dated_c1_intake_and_branch_verification_expired',
    identity: '74a51c8da5f49671356e95d002612949c5ed75fa735668f1fc4ba3add693f234',
  }],
  ['sofia-artizba-cherni-vrah33e', {
    validThrough: '2026-11-26',
    reason: 'single_dated_painting_event_expired',
    identity: '7e91b371bcdd4f2be3a7a063898aa596158c9657ad6a6029218308d3ddde8a32',
  }],
])

const reviewTime = validThrough => Date.parse(`${validThrough}T12:00:00Z`)

export function expiredCatalogueOfferHold(row, now = Date.now()) {
  const hold = holds.get(row?.id)
  if (!hold) return null
  const day = catalogueReviewDay(now)
  if (!day || day <= hold.validThrough) return null
  const parsed = catalogueRecordSchema.safeParse(row)
  if (!parsed.success || createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex') !== hold.identity ||
      approvedCatalogueRecord(row, now) ||
      !approvedCatalogueRecord(row, reviewTime(hold.validThrough))) return null
  return { id: row.id, validThrough: hold.validThrough, reason: hold.reason }
}

export function classifyExpiredCatalogueOffers(report, records, reviews, now = Date.now()) {
  const byId = new Map(records.map(row => [row.id, row]))
  const reviewById = new Map(reviews.map(row => [row.id, row]))
  const holdsById = new Map()
  for (const decision of report.records) {
    if (decision.state !== 'pending' ||
        !['published_sourced_price_required', 'source_review_expired_or_invalid'].includes(decision.reason)) continue
    const row = byId.get(decision.id)
    const hold = expiredCatalogueOfferHold(row, now)
    if (!hold) continue
    // The original review must still attest the exact historical inventory,
    // and all offers (not only the first tariff) must have been reviewed.
    const previous = assessPricingReview(row, reviewById.get(row.id), reviewTime(hold.validThrough))
    if (previous.state === 'reviewed' && previous.reviewedPriceCount === row.services.length) holdsById.set(row.id, hold)
  }
  return {
    ...report,
    records: report.records.map(row => holdsById.has(row.id)
      ? { ...row, state: 'withheld_expired_offer', hold: holdsById.get(row.id) }
      : row),
    summary: { ...report.summary, pending: report.summary.pending - holdsById.size, withheldExpiredOffers: holdsById.size },
    blocking: report.blocking.filter(row => !holdsById.has(row.id)),
    withheldExpiredOffers: [...holdsById.values()],
    notice: `${report.notice} Exact, previously reviewed offers that have expired and are absent from the public catalogue are reported separately as withheld, not as currently verified.`,
  }
}
