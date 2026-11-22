import { SOFIA_CATALOGUE } from './sofia-catalogue.mjs'
import { validateCatalogue } from './catalogue-policy.mjs'
import { CATALOGUE_MAX_RECORDS } from './catalogue-limits.mjs'
import { REGIONAL_RAW_RECORDS, REGIONAL_PRICE_REVIEWS } from './catalogue-data/lom-brusartsi-20261122.mjs'
import { LOM_GPOINT_RAW_RECORDS, LOM_GPOINT_PRICE_REVIEWS } from './catalogue-data/lom-gpoint-20261122.mjs'

// Keep the existing Sofia inventory/objects/order intact. New cities have an
// independently reviewed intake; merely supporting an EKATTE creates no rows.
export const REGIONAL_CATALOGUE = Object.freeze(validateCatalogue([...REGIONAL_RAW_RECORDS, ...LOM_GPOINT_RAW_RECORDS]))
export const PUBLIC_CATALOGUE_PRICE_REVIEWS = Object.freeze([...REGIONAL_PRICE_REVIEWS, ...LOM_GPOINT_PRICE_REVIEWS])
export const PUBLIC_CATALOGUE = Object.freeze([...SOFIA_CATALOGUE, ...REGIONAL_CATALOGUE])
if (PUBLIC_CATALOGUE.length > CATALOGUE_MAX_RECORDS || new Set(PUBLIC_CATALOGUE.map(row => row.id)).size !== PUBLIC_CATALOGUE.length) throw Error('Invalid combined catalogue identity inventory')
const entries = new Map(PUBLIC_CATALOGUE.map(row => [row.id,row]))
export const findPublicCatalogueEntry = id => entries.get(id)
export async function readPublicCatalogue() { return PUBLIC_CATALOGUE }
