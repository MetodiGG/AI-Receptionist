import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Test-only exact inverse for this three-point review. Earlier maps and receipts stay frozen.
export const NEARBY_POINTS_BASE = '6e14249ebb27d0d24e2a436629fb7f2dd8a4a92b'
export const NEARBY_POINTS_HASHES = Object.freeze({
  "lib/discovery/sofia-catalogue.mjs": "b7044e78c59c21350fce78b53b7e01f123093d87e231de916d9e8299da1672b9"
})
export const NEARBY_POINTS_NEW_HASHES = Object.freeze({
  "lib/discovery/catalogue-data/nearby-address-points-20261122.mjs": "bf0e8e498eb8bc6a84762c753a250d9007ef2dab00ddd8023975add72356b8e0",
  "docs/catalogue-coverage/nearby-points-review-20261122.json": "0273fdde20a6dc2327aa07be79de568e92e33d3ab6611135c8b3ac8c28a3c5a7",
  "docs/catalogue-coverage/nearby-points-batch-20261122.md": "501f855359adb5c7f34933a9a9d958de2180850898612079fbc67b69c563c680",
  "docs/catalogue-coverage/research-priority30-002-20261122.json": "d4bd6a698fbe3031e88d73ee6dea612638a124469a4d9c6a62ccc99aaa008336"
})
export const NEARBY_POINTS_ROW_HASHES = Object.freeze({
  "sofia-shining-polishing-auto": {
    "before": "56947f97d1895a6b62564511bcf5d63edaf67bfff3cdef6f270370b8e75604f7",
    "after": "a0e16034520556f5f08ca7fb0901bab371474d6220ffa47e068050c91751c4fc"
  },
  "sofia-vas-val-auto-malashevtsi-lavandula53": {
    "before": "f057568bc34af2565172918c9ed9e4de1104ed56d86022992ade420148881954",
    "after": "dbaa6402d6b8348e6ab64070aa120f1684998073d7b9b167fda6432e2617b327"
  },
  "sofia-diva-zone-mladost2-bg-shkolo": {
    "before": "9c1ed8de43c41000b64c90d65fdc66c7c348852454b53a98181a4ac42e4f04f7",
    "after": "20b96257ef043dbc4c9b4654bc63dec14910bbe3b7fe8825f12fb418f923625d"
  }
})
const priorHashes = Object.freeze({
  "lib/discovery/sofia-catalogue.mjs": "bb415fbc5ee87a6a24e183709a0262cb3f0baae91c58982f9035d258c6a907c2"
})
const sourceEdits = [
  {
    "before": "import { applyReviewedAddressPoints20261122 } from './catalogue-data/address-points-recovery-20261122.mjs'\n",
    "after": "import { applyReviewedAddressPoints20261122 } from './catalogue-data/address-points-recovery-20261122.mjs'\nimport { applyReviewedNearbyAddressPoints20261122 } from './catalogue-data/nearby-address-points-20261122.mjs'\n"
  },
  {
    "before": "export const RAW_SOFIA_CATALOGUE = validateCatalogue(applyReviewedAddressPoints20261122(applyReviewedNeighborhoodRecovery20261122(applyOfficialCatalogueLocations(enrichCataloguePricing(enrichCataloguePricing(\n",
    "after": "export const RAW_SOFIA_CATALOGUE = validateCatalogue(applyReviewedNearbyAddressPoints20261122(applyReviewedAddressPoints20261122(applyReviewedNeighborhoodRecovery20261122(applyOfficialCatalogueLocations(enrichCataloguePricing(enrichCataloguePricing(\n"
  },
  {
    "before": "), BOOKING_REVIEWED_PRICING, { includeReviewedDescriptions: true })))))\n",
    "after": "), BOOKING_REVIEWED_PRICING, { includeReviewedDescriptions: true }))))))\n"
  }
]
const sha256 = value => createHash('sha256').update(value).digest('hex')
const rowHash = value => sha256(JSON.stringify(value))
const exactFile = (path, hashes) => {
  if (!Object.hasOwn(hashes, path)) return false
  try { return sha256(readFileSync(new URL('../' + path, import.meta.url))) === hashes[path] } catch { return false }
}
export const nearbyPointsAllowsFileChange = path => exactFile(path, NEARBY_POINTS_HASHES)
export const nearbyPointsAllowsNewFile = path => exactFile(path, NEARBY_POINTS_NEW_HASHES)

// Compose this newest inverse before locationRecovery and every earlier dated cohort.
export function nearbyPointsPriorSource(path, source) {
  if (!Object.hasOwn(priorHashes, path)) return source
  if (sha256(source) === priorHashes[path]) return source
  if (sha256(source) !== NEARBY_POINTS_HASHES[path]) throw Error('Unreviewed nearby points source delta: ' + path)
  let previous = source
  for (const { before, after } of sourceEdits) {
    if (!after || previous.split(after).length !== 2) throw Error('Ambiguous nearby points source delta: ' + path)
    previous = previous.replace(after, () => before)
  }
  if (sha256(previous) !== priorHashes[path]) throw Error('Nearby points must restore every prior source byte: ' + path)
  return previous
}

export function nearbyPointsPriorRecord(row) {
  const hashes = NEARBY_POINTS_ROW_HASHES[row?.id]
  if (!hashes) return row
  const current = rowHash(row)
  if (current === hashes.before) return row
  if (current !== hashes.after) throw Error('Unreviewed nearby points record delta: ' + row.id)
  const previous = { ...row, coordinates: null }
  if (rowHash(previous) !== hashes.before) throw Error('Nearby points must restore the complete prior record: ' + row.id)
  return previous
}
export const nearbyPointsPriorCatalogue = rows => rows.map(nearbyPointsPriorRecord)
