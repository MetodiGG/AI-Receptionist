// Offline manually reviewed additions. Keeping sources separate permits
// independent branch/category review without changing owner-managed profiles.
import beauty from './pricing-expansion-beauty-20261110.mjs'
import appointments from './pricing-expansion-auto-sport-home-20261110.mjs'
import services from './pricing-expansion-services-20261110.mjs'
import servicesExtra from './pricing-expansion-services-extra-20261110.mjs'
import chains from './pricing-expansion-chains-20261110.mjs'
import local from './pricing-expansion-local-20261110.mjs'

const batches = [beauty, appointments, services, servicesExtra, chains, local]
export const PRICING_EXPANSION_RECORDS = batches.flatMap(batch => batch.records)
export const PRICING_EXPANSION_UPDATES = batches.flatMap(batch => batch.updates)
// Reviews of new records carry their exact priced inventory too, just like
// existing-record reviews. Fingerprints are stored separately after QA.
export const PRICING_EXPANSION_REVIEWS = batches.flatMap(batch => batch.reviews.map(review => ({
  ...review,
  services: [...batch.records, ...batch.updates].find(row => row.id === review.id)?.services,
})))
