// Coverage-first expansion: genuine premises in underrepresented Sofia cells.
// Identities are bound only after source, inventory and exact-photo review.
import pets from './neighborhood-coverage-pets-20261116.mjs'
import auto from './neighborhood-coverage-auto-20261116.mjs'
import identities from './neighborhood-coverage-reviewed-identities-20261116.json' with { type: 'json' }

const batches = [pets, auto]
export const COVERAGE_20261116_RECORDS = batches.flatMap(batch => batch.records)
export const COVERAGE_20261116_REVIEWS = batches.flatMap(batch => batch.reviews.map(review => ({
  ...review, inventoryIdentity: identities[review.id],
})))
