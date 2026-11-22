import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Separate exact-byte authorization for the owner's bounded fresh review of
// 45 existing catalogue records. Historical scopes, media/price baselines,
// checkers and every other production path remain unchanged.
export const CATALOGUE_REVALIDATION_BASE = 'b8dcdf4315ee795904290ebd6463d4383a9fa42c'
export const CATALOGUE_REVALIDATION_HASHES = Object.freeze({
  "lib/catalogue-service-photo-associations-20261113.mjs": "2965d5fb92f588bbb4083efcb3162a6cc58c5ab99f86b3bdedad39e278ed5bcc",
  "lib/discovery/catalogue-data/neighborhood-home-education-2000-006-20261113.mjs": "cb5811b3140254d322587ae51f7fbd0810a702b79d7065b134da3a0649868a57",
  "lib/discovery/catalogue-data/neighborhood-reviewed-identities-20261113.json": "afa28a5eceef1c0c83b46d2ad2f428db92ce509a6bdb5e6a559550c27c1a61ad",
  "lib/discovery/catalogue-data/pricing-booking-review-identities-20261110.json": "68ad8d33452f8ee5f607da3adce22ee55813fcc1987d90a5fc347b631170cfa7",
  "lib/discovery/catalogue-data/pricing-booking-review-v1.mjs": "c43b0af5a833ff92e6782b70205af473b1dc5b1c69abde6930cd3de14751dec0",
  "lib/locale/service-english.json": "f2118f7e81235ba504d34aa2bd420ef1add37d22edc8572435f28bda485bfbd9"
})
export function catalogueRevalidationAllowsFileChange(path) {
  if (!Object.hasOwn(CATALOGUE_REVALIDATION_HASHES,path)) return false
  try { return createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex') === CATALOGUE_REVALIDATION_HASHES[path] }
  catch { return false }
}
