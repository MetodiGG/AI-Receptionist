// Offline evidence assessment only. This does not change the intake helper,
// approve a source, fetch a URL or authenticate the named human reviewers.
import { createHash } from 'node:crypto'
import { safeBookingUrl } from '../lib/booking-mode.mjs'
import { approvedCatalogueRecord, catalogueRecordSchema } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'

const flag = 'first_party_appointment_evidence_required'
const phone = /^\+359\d{8,9}$/u
const decisions = new Set(['manually_verified_provider_merchant_identity', 'manually_verified_same_owner_websites'])
const host = url => new URL(url).hostname.replace(/^www\./u, '')
const distinctStrings = (values, minimum) => Array.isArray(values) && values.length >= minimum
  && values.every(value => typeof value === 'string' && value.length > 0 && value === value.trim())
  && new Set(values).size === values.length

function normalizedRecord(row) {
  try {
    const parsed = catalogueRecordSchema.safeParse(row)
    return parsed.success ? parsed.data : null
  } catch { return null }
}

// Parse the complete strict source schema first. Zod's declared field order
// gives the same hash for equivalent input property order, while binding the
// ID, address, quarter, contact, coordinates, dates, hours and service facts.
export function manualIntakeIdentity(row) {
  const parsed = normalizedRecord(row)
  return parsed ? createHash('sha256').update(JSON.stringify(parsed)).digest('hex') : null
}

function evidenceIdentity(url) {
  const parsed = new URL(url)
  // Query variants and trailing slashes do not manufacture distinct profiles.
  parsed.hostname = host(url)
  parsed.search = ''
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/u, '')}`
}

export function assessManualIntakeReview(raw, review, now = Date.now()) {
  try {
    const row = normalizedRecord(raw), resolution = review?.manualIntakeResolution
    if (!row || !Number.isFinite(now) || !approvedCatalogueRecord(row, now) || !resolution
      || resolution.flag !== flag || !decisions.has(resolution.decision)) return null
    if (resolution.checkedOn !== review.checkedOn || resolution.checkedOn !== row.verification.checkedOn
      || resolution.recordIdentity !== manualIntakeIdentity(row)) return null
    if (!distinctStrings(resolution.reviewedBy, 2) || !resolution.reviewedBy.includes('/root')) return null
    if (!distinctStrings(resolution.matchingPhones, 1) || !resolution.matchingPhones.every(value => phone.test(value))
      || !resolution.matchingPhones.includes(row.phone)) return null
    if (typeof resolution.note !== 'string' || resolution.note.trim().length < 20) return null
    if (!['reviewed', 'service_reviewed'].includes(assessPricingReview(row, review, now).state)) return null

    const reviewed = url => typeof url === 'string' && Boolean(safeBookingUrl(url)) && review.reviewedUrls.includes(url)
    const recordSources = [row.website, row.verification.booking.url, row.verification.contact,
      ...(row.booking.kind === 'form' ? [row.booking.url] : []),
      ...(row.openingHours ? [row.openingHours.sourceUrl] : []),
      ...(row.coordinates ? [row.coordinates.source] : []),
      ...row.services.flatMap(service => [service.price?.sourceUrl, service.durationSourceUrl].filter(Boolean)),
    ]
    if (!recordSources.every(reviewed)) return null
    const ownerHost = host(row.website), appointmentHost = host(row.verification.booking.url)
    // An exact same-host/subdomain source has no different-host flag for this
    // assessor to resolve. The unchanged ordinary intake path handles it.
    if (appointmentHost === ownerHost || appointmentHost.endsWith(`.${ownerHost}`)) return null

    if (resolution.decision === 'manually_verified_provider_merchant_identity') {
      if (row.booking.kind !== 'form' || resolution.providerPractice !== row.booking.url
        || resolution.providerPractice !== row.verification.booking.url
        || resolution.ownerContact !== row.verification.contact
        || ![resolution.ownerContact, resolution.providerPractice].every(reviewed)
        || host(resolution.ownerContact) !== ownerHost
        || !distinctStrings(resolution.providerProfiles, 2) || resolution.matchingPhones.length < 2) return null
      if (!resolution.providerProfiles.every(url => reviewed(url) && host(url) === appointmentHost)) return null
      const profiles = resolution.providerProfiles.map(evidenceIdentity)
      if (new Set(profiles).size !== profiles.length || profiles.includes(evidenceIdentity(resolution.providerPractice))) return null
    } else {
      if (row.booking.kind !== 'phone' || row.booking.phone !== row.phone
        || resolution.ownerWebsite !== row.website || resolution.currentContact !== row.verification.contact
        || resolution.appointmentEvidence !== row.verification.booking.url) return null
      if (![resolution.ownerWebsite, resolution.currentContact, resolution.currentPremises,
        resolution.appointmentEvidence, resolution.appointmentContact].every(reviewed)) return null
      if (host(resolution.currentContact) !== ownerHost || host(resolution.currentPremises) !== ownerHost
        || host(resolution.appointmentContact) !== appointmentHost) return null
    }
    // A bounded audit fact, not approval, a whitelist, an ID skip or a write.
    return { id: row.id, reason: flag, decision: resolution.decision, checkedOn: resolution.checkedOn }
  } catch { return null }
}
