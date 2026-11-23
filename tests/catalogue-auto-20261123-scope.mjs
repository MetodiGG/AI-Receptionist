import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { verifiedAllowsFileChange, verifiedAllowsNewFile, verifiedPriorSource, verifiedPriorCatalogue } from './catalogue-verified-20261123-scope.mjs'
import { navigationPhotosAllowsFileChange, navigationPhotosAllowsNewFile, navigationPhotosPriorSource } from './public-navigation-photo-20261123-scope.mjs'

// Only project the exact new automotive cohort when replaying earlier receipts.
// Neither unrelated catalogue data nor other production files are exempt.
export const AUTO_AREA_BASE = 'e4c4ca1f060f795ef0a962503a140fad09b7b054'
const priorHashes = Object.freeze({
  "lib/discovery/sofia-catalogue.mjs": "85eb30d53cc87524e3f4fa7731aab50a64c971f6743f0aaea8e347489e825bae",
  "lib/discovery/catalogue-data/pricing-booking-review-v1.mjs": "7cd4410213a07534cdbd7589e903c69101611fb1bc5443eae381abe3d80b8cfd",
  "lib/catalogue-service-photo-keys.mjs": "c7bde2cfe04500fbe29c95152a4190aba71a506c1f779d4012b2614fddc806dd",
  "lib/locale/service-english.json": "c7cafdf23b3c5ac16d6695725ba602204abe491c361eef837562b2e16d19e188"
})
const afterHashes = Object.freeze({
  "lib/discovery/sofia-catalogue.mjs": "f8521f382b26e8653876d80df9d4d9daa8e931e6145572128e2e2e99b8108547",
  "lib/discovery/catalogue-data/pricing-booking-review-v1.mjs": "b652f056105b0082295567c147e4ff829eaf9ecf15d6d5ad75702fe65ed09374",
  "lib/catalogue-service-photo-keys.mjs": "6d61ac42ec41b50879c34c7bd3588813a5563fff3237f3aee414b2909e46fb25",
  "lib/locale/service-english.json": "034428d6eee9eb267b06f8c9066da9c1d7ff7dc0832b9b63e5ce0de83cfddaa1"
})
const approvedNew = Object.freeze({
  "lib/discovery/catalogue-data/neighborhood-auto-intake-20261123.mjs": "607f6758ac8c233e4cc588616a3a562017aa6da78866b80984e93d617d36d632",
  "lib/discovery/catalogue-data/auto-area-recovery-20261123.mjs": "f683ac4f76d6d10ced59275ce376705a50a732c9dbce25474ed3b3a26f15d977",
  "docs/catalogue-coverage/auto-intake-20261123.json": "c1fd8ce5f54fe2aae0b1a48c9e76724d4cec9dd68f289ecf2eb5c67cd25719f3",
  "docs/catalogue-coverage/auto-area-recovery-20261123.json": "16ac8b5c7a5f22adb57c0577e843d899a46beced4a73eb14a575f975e1c18024"
})
const edits = {
  "lib/discovery/sofia-catalogue.mjs": [
    ["","import { AUTO_INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-auto-intake-20261123.mjs'\n"],
    ["","import { applyReviewedAutoAreaRecovery20261123 } from './catalogue-data/auto-area-recovery-20261123.mjs'\n"],
    ["","  ...AUTO_INTAKE_20261123_RECORDS,\n"],
    ["export const RAW_SOFIA_CATALOGUE = validateCatalogue(applyReviewedNeighborhoodRecovery20261123(applyReviewedNearbyAddressPoints20261122(applyReviewedAddressPoints20261122(applyReviewedNeighborhoodRecovery20261122(applyOfficialCatalogueLocations(enrichCataloguePricing(enrichCataloguePricing(\n","export const RAW_SOFIA_CATALOGUE = validateCatalogue(applyReviewedAutoAreaRecovery20261123(applyReviewedNeighborhoodRecovery20261123(applyReviewedNearbyAddressPoints20261122(applyReviewedAddressPoints20261122(applyReviewedNeighborhoodRecovery20261122(applyOfficialCatalogueLocations(enrichCataloguePricing(enrichCataloguePricing(\n"],
    ["), BOOKING_REVIEWED_PRICING, { includeReviewedDescriptions: true })))))))\n","), BOOKING_REVIEWED_PRICING, { includeReviewedDescriptions: true }))))))))\n"],
  ],
  "lib/discovery/catalogue-data/pricing-booking-review-v1.mjs": [
    ["","import { AUTO_INTAKE_20261123_REVIEWS } from './neighborhood-auto-intake-20261123.mjs'\n"],
    ["export const BOOKING_PRICE_REVIEWS = [...historicalBookingPriceReviews, ...NEIGHBORHOOD_20261111_REVIEWS, ...NEIGHBORHOOD_20261113_REVIEWS, ...COVERAGE_20261116_REVIEWS, ...SUHODOL_20261122_REVIEWS, ...INTAKE_20261123_REVIEWS]\n","export const BOOKING_PRICE_REVIEWS = [...historicalBookingPriceReviews, ...NEIGHBORHOOD_20261111_REVIEWS, ...NEIGHBORHOOD_20261113_REVIEWS, ...COVERAGE_20261116_REVIEWS, ...SUHODOL_20261122_REVIEWS, ...INTAKE_20261123_REVIEWS, ...AUTO_INTAKE_20261123_REVIEWS]\n"],
  ],
  "lib/catalogue-service-photo-keys.mjs": [
    ["","associations.set(key('sofia-mline-auto-detailing-gorublyane-pionerska2', 'detailing', 'Интериорен детайлинг'), 'sx-detail-complete-interior')\n"],
  ],
  "lib/locale/service-english.json": [
    ["","      },\n      {\n        \"checkedOn\": \"2026-11-23\",\n        \"businessId\": \"sofia-mline-auto-detailing-gorublyane-pionerska2\",\n        \"inventoryIdentity\": \"22a1889abea6bb183c29954ed66837a6058dcfe05cff3d91403fce0efcf3a364\",\n        \"reason\": \"One exact English description preserves the source-reviewed interior service and price qualifications. Existing title reused; no external translation API.\",\n        \"entriesAdded\": { \"names\": 0, \"descriptions\": 1, \"units\": 0 },\n        \"entriesReused\": { \"names\": 1 },\n        \"certifiedHumanTranslation\": false\n"],
    ["","    \"Цялостно почистване на автомобилния интериор с пране на текстила. Крайната цена зависи от размера на автомобила и степента на замърсяване; озонирането се заплаща отделно.\": \"Complete car interior cleaning, including textile upholstery washing. The final price depends on vehicle size and soiling; ozone treatment costs extra.\",\n"],
  ],
}
export const AUTO_INTAKE_ID = 'sofia-mline-auto-detailing-gorublyane-pionerska2'
const admitted = 'e025360473bb394d5d5ab6b1156084870c8d03a92cb8b45650df452a8bece391'
const corrections = Object.freeze({
  'sofia-po-manyashkiya-detailing': ['6092dfb3b4b102a4383d6eec2239507d202aa0e792f41f38d0a39725b72ee497', 'c886d2b97f97ae3c0f951b885281251448d93672e6d6bb59597d068827fa1b22'],
  'sofia-georgis-garage-sofia': ['f791d149777cc134654bb2a4cc11b538d72bca926a0c39bccedbd6374ea6d4ea', 'b1381ee86afe901b298291bbed182d5021e98cf7287898f524b9e415a1235bfe'],
  'sofia-pulse-car-wash-mladost': ['068d5cde43cb51ddacb0ab1c8641836fabe370070cbd86fdd0d3befe503257db', '3287c25e9e5892ec6cdf2c05fb712c51998f4f4b01b37d93e84a9621012041b6'],
  'sofia-lux-mbal-sveta-sofia-carwash': ['42bc9a0bcf883ed25f73817efdd533294220777d573ca724d800ecce946d73f0', 'a54144ab4be33677c5d6a560195e8a39f68664665a203a3916753e324c37439f'],
})
const digest = value => createHash('sha256').update(value).digest('hex')
const exactFile = (path, hashes) => {
  if (!Object.hasOwn(hashes, path)) return false
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === hashes[path] } catch { return false }
}
export const autoAreaAllowsFileChange = path => navigationPhotosAllowsFileChange(path) || verifiedAllowsFileChange(path) || exactFile(path, afterHashes)
export const autoAreaAllowsNewFile = path => navigationPhotosAllowsNewFile(path) || verifiedAllowsNewFile(path) || exactFile(path, approvedNew)

export function autoAreaPriorSource(path, current) {
  current = verifiedPriorSource(path, navigationPhotosPriorSource(path, current))
  if (!Object.hasOwn(edits, path) || digest(current) === priorHashes[path]) return current
  if (!/AUTO_INTAKE_20261123|applyReviewedAutoAreaRecovery20261123|sofia-mline-auto-detailing-gorublyane-pionerska2/u.test(current)) return current
  if (digest(current) !== afterHashes[path]) throw Error('Unreviewed 23 Nov auto-area source delta: ' + path)
  let source = current
  for (const [old, next] of edits[path]) {
    if (source.split(next).length !== 2) throw Error('Ambiguous 23 Nov auto-area source delta: ' + path)
    source = source.replace(next, () => old)
  }
  if (digest(source) !== priorHashes[path]) throw Error('Auto-area replay must restore every prior byte: ' + path)
  return source
}

export function autoAreaPriorCatalogue(rows) {
  const seen = new Set(), result = []
  for (const row of verifiedPriorCatalogue(rows)) {
    if (row?.id !== AUTO_INTAKE_ID && !Object.hasOwn(corrections, row?.id)) { result.push(row); continue }
    if (seen.has(row.id)) throw Error('Duplicate 23 Nov auto-area record: ' + row.id)
    seen.add(row.id)
    const currentHash = digest(JSON.stringify(row))
    if (row.id === AUTO_INTAKE_ID) {
      if (currentHash !== admitted) throw Error('Unreviewed 23 Nov auto intake record: ' + row.id)
      continue
    }
    const [priorHash, reviewedHash] = corrections[row.id]
    if (currentHash === priorHash) { result.push(row); continue }
    if (currentHash !== reviewedHash) throw Error('Unreviewed 23 Nov auto-area record delta: ' + row.id)
    const prior = row.id === 'sofia-po-manyashkiya-detailing'
      ? { ...row, neighborhood: null, coordinates: { ...row.coordinates, sourceNeighborhood: null } }
      : row.id === 'sofia-georgis-garage-sofia'
        ? { ...row, address: 'София, Студентски град, ул. Рашо Рашев 4', coordinates: null }
        : row.id === 'sofia-pulse-car-wash-mladost'
          ? { ...row, neighborhood: 'Младост', address: 'София, ж.к. Младост, Околовръстен път 251А', coordinates: null }
          : { ...row, neighborhood: null }
    if (digest(JSON.stringify(prior)) !== priorHash) throw Error('Auto-area replay must restore every historical record field: ' + row.id)
    result.push(prior)
  }
  return result
}
