// Owner-requested expansion: primary-source services/booking first, optional
// published prices, deeper hours checks. No requests or automatic approvals.
import dental from './neighborhood-dental-20261113.mjs'
import homeEducation from './neighborhood-home-education-20261113.mjs'
import homeExtra from './neighborhood-home-extra-20261113.mjs'
import autoSport from './neighborhood-auto-sport-20261113.mjs'
import autoSportExtra from './neighborhood-auto-sport-extra-20261113.mjs'
import washDetail from './neighborhood-wash-detail-20261113.mjs'
import beauty from './neighborhood-beauty-20261113.mjs'
import puzzle from './neighborhood-puzzle-20261113.mjs'
import pets from './neighborhood-pets-20261113.mjs'
import psychology from './neighborhood-psychology-20261113.mjs'
import consulting from './neighborhood-consulting-20261113.mjs'
import identities from './neighborhood-reviewed-identities-20261113.json' with { type: 'json' }

const batches = [dental, homeEducation, homeExtra, autoSport, autoSportExtra, washDetail, beauty, puzzle, pets, psychology, consulting]
// Deliberate staging: source/booking holds are documented but not public.
export const NEIGHBORHOOD_20261113_RECORDS = batches.flatMap(batch => batch.records.filter(row => row.verification.status === 'approved'))
export const NEIGHBORHOOD_20261113_REVIEWS = batches.flatMap(batch => batch.reviews.map(review => ({
  ...review, inventoryIdentity: identities[review.id],
})))
