import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS, BOOKING_REVIEWED_PRICING } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { auditCataloguePricing } from '../lib/discovery/catalogue-pricing-review.mjs'
import { PRICING_EXPANSION_RECORDS, PRICING_EXPANSION_UPDATES } from '../lib/discovery/catalogue-data/pricing-expansion-20261110.mjs'
import { pendingPricingResearch as pendingServices } from '../lib/discovery/catalogue-data/pricing-expansion-services-20261110.mjs'
import { pendingPricingResearch as pendingLocal } from '../lib/discovery/catalogue-data/pricing-expansion-local-20261110.mjs'
import { pendingPricingResearch as pendingServicesExtra } from '../lib/discovery/catalogue-data/pricing-expansion-services-extra-20261110.mjs'
import { pendingPricingResearch as pendingBeauty } from '../lib/discovery/catalogue-data/pricing-expansion-beauty-20261110.mjs'
import { pendingResearch as pendingAppointments } from '../lib/discovery/catalogue-data/pricing-expansion-auto-sport-home-20261110.mjs'

// Reproducible, offline local queue. Discovery attempts, actual source reviews
// and published prices remain separate. Never include raw provider payloads.
const { values } = parseArgs({ options: { audit: { type: 'string' }, output: { type: 'string' } } })
if (!values.audit || !values.output) throw Error('Use --audit public-discovery-report.json --output review-queue.json')
const discovery = JSON.parse(await readFile(values.audit, 'utf8'))
const baseline = JSON.parse(await readFile(new URL('../lib/discovery/catalogue-data/pricing-review-baseline-20261110.json', import.meta.url)))
const checkedOn = '2026-11-10'
const policy = auditCataloguePricing(SOFIA_CATALOGUE, baseline, BOOKING_PRICE_REVIEWS, Date.parse(`${checkedOn}T12:00:00Z`))
const byId = new Map(discovery.businesses.map(row => [row.id, row]))
const states = new Map(policy.records.map(row => [row.id, row]))
const reviews = new Map(BOOKING_PRICE_REVIEWS.map(row => [row.id, row]))
const initialIds = new Set(baseline.map(row => row.id))
const inPriorityQuarter = row => /манастирски ливади/iu.test(row.neighborhood || '')
const publicReference = raw => {
  try { const url = new URL(raw); url.search = ''; url.hash = ''; return url.href } catch { return null }
}
const report = { checkedOn,
  notice: 'A public page attempt or pricing signal is NOT a verified tariff or completed manual booking review. Query parameters and raw page/iframe bodies are omitted. No automatic imports, live database writes, paid provider requests, messages or reservations.',
  summary: { ...policy.summary, recordsSourceInspectedThisPass: BOOKING_PRICE_REVIEWS.length,
    businessesEnrichedThisPass: BOOKING_REVIEWED_PRICING.length,
    // Reviewed input rows may replace or overlap earlier tariffs. They are not
    // all distinct newly added rows in the final merged inventory.
    reviewedPriceFactsThisPass: BOOKING_REVIEWED_PRICING.reduce((sum, row) => sum + row.services.filter(service => service.price).length, 0),
    newBusinessesThisExpansion: PRICING_EXPANSION_RECORDS.length,
    existingBusinessesEnrichedThisExpansion: PRICING_EXPANSION_UPDATES.length,
    newBusinessesInPriorityQuarter: PRICING_EXPANSION_RECORDS.filter(inPriorityQuarter).length,
    priorityQuarterBusinesses: SOFIA_CATALOGUE.filter(inPriorityQuarter).length,
    priorityQuarterBusinessesWithPrices: SOFIA_CATALOGUE.filter(row => inPriorityQuarter(row) && row.services.some(service => service.price)).length,
    totalPricedServices: SOFIA_CATALOGUE.reduce((sum, row) => sum + row.services.filter(service => service.price).length, 0),
    publicDiscovery: discovery.summary, liveDatabaseWrites: 0, reservationsSubmitted: 0 },
  unresolvedResearch: [...pendingBeauty, ...pendingAppointments, ...pendingServices, ...pendingServicesExtra, ...pendingLocal].map(row => ({
    ...(row.id ? { id: row.id } : {}), ...(row.candidate || row.name ? { candidate: row.candidate || row.name } : {}),
    urls: (row.urls || [row.url]).map(publicReference), reason: row.reason,
  })),
  businesses: SOFIA_CATALOGUE.map(row => {
    const attempted = byId.get(row.id), review = reviews.get(row.id)
    return { id: row.id, name: row.name, neighborhood: row.neighborhood, website: row.website,
      addedThisExpansion: !initialIds.has(row.id),
      bookingEntry: row.booking.kind === 'form' ? publicReference(row.booking.url) : 'published_phone',
      ...states.get(row.id), pricedServices: row.services.filter(service => service.price).length,
      ...(review ? { sourceReview: { checkedOn: review.checkedOn, bookingReview: review.bookingReview,
        reviewedUrls: review.reviewedUrls.map(publicReference), notes: review.notes } } : {}),
      automatedAttempts: (attempted?.checkedUrls || []).map(item => ({ url: publicReference(item.url), status: item.status, purpose: item.purpose, ...(item.reviewRequired ? { reviewRequired: item.reviewRequired } : {}) })),
      automatedPricingSignalCount: attempted?.pricingSignals?.length || 0,
      deferredTargets: [...new Map((attempted?.deferred || []).map(item => [publicReference(item.url), { url: publicReference(item.url), reason: item.reason }])).values()],
    }
  }),
}
await writeFile(values.output, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report.summary, null, 2))
