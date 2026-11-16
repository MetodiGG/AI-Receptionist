// Coverage-first expansion: genuine premises in underrepresented Sofia cells.
// Identities are bound only after source, inventory and exact-photo review.
import pets from './neighborhood-coverage-pets-20261116.mjs'
import auto from './neighborhood-coverage-auto-20261116.mjs'
import photo from './neighborhood-coverage-photo-20261116.mjs'
import dental from './neighborhood-coverage-dental-20261116.mjs'
import madmax from './neighborhood-coverage-madmax-20261116.mjs'
import mim from './neighborhood-coverage-mim-20261116.mjs'
import artmasters from './neighborhood-coverage-artmasters-20261116.mjs'
import miele from './neighborhood-coverage-miele-20261116.mjs'
import arholl from './neighborhood-coverage-arholl-20261116.mjs'
import borbelov from './neighborhood-coverage-borbelov-20261116.mjs'
import yastra from './neighborhood-coverage-yastra-20261116.mjs'
import monika from './neighborhood-coverage-monika-20261116.mjs'
import dogspa from './neighborhood-coverage-dogspa-20261116.mjs'
import identities from './neighborhood-coverage-reviewed-identities-20261116.json' with { type: 'json' }

const batches = [pets, auto, photo, dental, madmax, mim, artmasters, miele, arholl, borbelov, yastra, monika, dogspa]
export const COVERAGE_20261116_RECORDS = batches.flatMap(batch => batch.records)
export const COVERAGE_20261116_REVIEWS = batches.flatMap(batch => batch.reviews.map(review => ({
  ...review, inventoryIdentity: identities[review.id],
})))
