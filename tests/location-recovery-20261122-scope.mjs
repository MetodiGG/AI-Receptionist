import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Three existing, explicitly reviewed venues only. Old source, price, photo,
// point caches, snapshots and all earlier SHA maps are never refreshed.
export const LOCATION_RECOVERY_BASE = "a44faaa77bdda3f129ca48f36385393761b58e31"
export const LOCATION_RECOVERY_HASHES = Object.freeze({
  "lib/discovery/sofia-catalogue.mjs": "bb415fbc5ee87a6a24e183709a0262cb3f0baae91c58982f9035d258c6a907c2"
})
export const LOCATION_RECOVERY_NEW_HASHES = Object.freeze({
  "docs/catalogue-coverage/address-points-review-20261122.json": "d4bdddd6a72d8dfba5f90c68cead4a65fdaf53e10a31ea138fc93c771cf7e149",
  "docs/catalogue-coverage/location-recovery-batch-20261122.json": "65392a3606433803b0a63038871121f0ad4a9c3ce2d0fbec3d625609d28e11b8",
  "docs/catalogue-coverage/location-recovery-batch-20261122.md": "582b03c57f77a62b528852371793ba847c5353229e4ef2f1202e3d48a4c1690d",
  "docs/catalogue-coverage/quarter-recovery-20261122.json": "80f48f561b0db5e8354eac772a6414a6a2629531acbb6b93fd08e3daa7c89211",
  "lib/discovery/catalogue-data/address-points-recovery-20261122.mjs": "b076716addb79eddcacc13c69790822260a1e674452c84493f8b061e3de27f3a",
  "lib/discovery/catalogue-data/neighborhood-recovery-20261122.mjs": "881df68634e3355661886f71ff4dd7aee9576357a6e48046ccd84dc127fbdcb0"
})
export const LOCATION_RECOVERY_ROW_HASHES = Object.freeze({
  "sofia-stephan-borovo": {
    "before": "053ce29de177ac1f113dc55b75e05b8277d16198b55ea369b0155c8264a324da",
    "after": "a25c159ca78869baeee00ceb863d2ba5d393f842202674c65acb4e1cad09776e"
  },
  "sofia-maria-nemska-photo-suhodol": {
    "before": "f8cb0c98fe04fcb88426e6bdeceec8e3a4fa13bbb45d387af7516ebe6994ee13",
    "after": "c2f879493cb254b814bce4b07c8523572e21006dcdde0b774cee549781ed0767"
  },
  "sofia-dar-auto-service-europa": {
    "before": "c837c373b5f64ae70cd684db0134a4db3ab22b977c00bcbc6f7de991b165467b",
    "after": "d784093cbd673638fcf508075e10ef21ec20eabc86d73bf7f1569297fae79bec"
  }
})
const priorHashes = Object.freeze({
  "lib/discovery/sofia-catalogue.mjs": "ae50f03e048b27a38ac82460ba8cf651a2dc11192d37e626c7a44269be6d09a4"
})
const sourceEdits = {
  "lib/discovery/sofia-catalogue.mjs": [
    {
      "before": "import { enrichCataloguePricing } from './catalogue-pricing-enrichment.mjs'\nimport { applyCatalogueCoordinateBindings } from './catalogue-coordinate-binding.mjs'\nimport { applyOfficialCatalogueLocations } from './catalogue-official-locations.mjs'\n\n// First-party public facts manually checked on 2026-11-05. This is a reviewed\n// catalogue, not all Sofia businesses and not a Google/Studio24 data export.\n",
      "after": "import { enrichCataloguePricing } from './catalogue-pricing-enrichment.mjs'\nimport { applyCatalogueCoordinateBindings } from './catalogue-coordinate-binding.mjs'\nimport { applyOfficialCatalogueLocations } from './catalogue-official-locations.mjs'\nimport { applyReviewedNeighborhoodRecovery20261122 } from './catalogue-data/neighborhood-recovery-20261122.mjs'\nimport { applyReviewedAddressPoints20261122 } from './catalogue-data/address-points-recovery-20261122.mjs'\n\n// First-party public facts manually checked on 2026-11-05. This is a reviewed\n// catalogue, not all Sofia businesses and not a Google/Studio24 data export.\n"
    },
    {
      "before": "  if (!entry || entry.coordinates || geocodes.has(update.id) || update.coordinates?.method!=='verified_address_geocode') throw Error(`Invalid catalogue geocode update: ${update.id}`)\n  geocodes.set(update.id,update.coordinates)\n}\nexport const RAW_SOFIA_CATALOGUE = validateCatalogue(applyOfficialCatalogueLocations(enrichCataloguePricing(enrichCataloguePricing(\n  enrichCatalogueDetailsV3(enrichCatalogueDetails(baseCatalogue.map(row=>geocodes.has(row.id)?{...row,coordinates:geocodes.get(row.id)}:row))),\n  pricing20261110,\n), BOOKING_REVIEWED_PRICING, { includeReviewedDescriptions: true })))\n\n// All readers (search, details, directions and partner import) see the same\n// address-bound point, rather than independently retaining a stale pin.\n",
      "after": "  if (!entry || entry.coordinates || geocodes.has(update.id) || update.coordinates?.method!=='verified_address_geocode') throw Error(`Invalid catalogue geocode update: ${update.id}`)\n  geocodes.set(update.id,update.coordinates)\n}\nexport const RAW_SOFIA_CATALOGUE = validateCatalogue(applyReviewedAddressPoints20261122(applyReviewedNeighborhoodRecovery20261122(applyOfficialCatalogueLocations(enrichCataloguePricing(enrichCataloguePricing(\n  enrichCatalogueDetailsV3(enrichCatalogueDetails(baseCatalogue.map(row=>geocodes.has(row.id)?{...row,coordinates:geocodes.get(row.id)}:row))),\n  pricing20261110,\n), BOOKING_REVIEWED_PRICING, { includeReviewedDescriptions: true })))))\n\n// All readers (search, details, directions and partner import) see the same\n// address-bound point, rather than independently retaining a stale pin.\n"
    }
  ]
}
const sha256 = value => createHash('sha256').update(value).digest('hex')
const rowHash = value => sha256(JSON.stringify(value))
const exactFile = (path, hashes) => {
  if (!Object.hasOwn(hashes, path)) return false
  try { return sha256(readFileSync(new URL('../' + path, import.meta.url))) === hashes[path] } catch { return false }
}
export const locationRecoveryAllowsFileChange = path => exactFile(path, LOCATION_RECOVERY_HASHES)
export const locationRecoveryAllowsNewFile = path => exactFile(path, LOCATION_RECOVERY_NEW_HASHES)

// Exact source inverse, composed before priority30, Azis and regional stages.
export function locationRecoveryPriorSource(path, source) {
  if (!Object.hasOwn(priorHashes, path)) return source
  if (sha256(source) === priorHashes[path]) return source
  if (sha256(source) !== LOCATION_RECOVERY_HASHES[path]) throw Error('Unreviewed location recovery source delta: ' + path)
  let previous = source
  for (const { before, after } of sourceEdits[path]) {
    if (!after || previous.split(after).length !== 2) throw Error('Ambiguous location recovery source delta: ' + path)
    previous = previous.replace(after, () => before)
  }
  if (sha256(previous) !== priorHashes[path]) throw Error('Location recovery source must restore every prior byte: ' + path)
  return previous
}

// Historical dated-cohort assertions only, never a production transform.
// Require the complete reviewed before/after normalized row, not just its ID.
// Do not use this inverse in the new feature tests of the actual current rows.
export function locationRecoveryPriorRecord(row) {
  const hashes = LOCATION_RECOVERY_ROW_HASHES[row?.id]
  if (!hashes) return row
  const current = rowHash(row)
  if (current === hashes.before) return row
  if (current !== hashes.after) throw Error('Unreviewed location recovery record delta: ' + row.id)
  const previous = row.id === 'sofia-stephan-borovo'
    ? { ...row, neighborhood: null, coordinates: { ...row.coordinates, sourceNeighborhood: null } }
    : { ...row, coordinates: null }
  if (rowHash(previous) !== hashes.before) throw Error('Location recovery must restore the complete prior record: ' + row.id)
  return previous
}
export const locationRecoveryPriorCatalogue = rows => rows.map(locationRecoveryPriorRecord)
