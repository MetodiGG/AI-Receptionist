import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// A new intake cannot weaken historical catalogue receipts. Project only the
// two exact dated rows and exactly invert their source integrations.
const priorHashes = Object.freeze({
  "lib/discovery/sofia-catalogue.mjs": "67282fdb678066b94c0e6c46b58fe7e42e38fa808186718ce1d40c8d97b0309f",
  "lib/discovery/catalogue-data/pricing-booking-review-v1.mjs": "618f9e0cd0d26660b2f70f00e3a9b3cb065f42b28523de8e1083eaf1ca026a94",
  "lib/catalogue-service-photo-keys.mjs": "823689e98eb7943cd03281fc52f86788d60b282cdd18937cce22c25ca0d7aa93",
  "lib/locale/service-english.json": "543d710c76d95882227c97836643a28d617cff72e7497610026518e589291bd2",
  "lib/specific-service-photo-ids.mjs": "e122de35a366d13f02b8dab20ab36663982433d9a5d31f02568432a61f7bbb15",
  "docs/specific-service-photo-generation-2026-11-12.json": "3734bdbe434f83b2f1c953ed08f0cd60c55b0b1efbd69e2f235511de6bcfe81b"
})
export const INTAKE_HASHES = Object.freeze({
  "lib/discovery/sofia-catalogue.mjs": "85eb30d53cc87524e3f4fa7731aab50a64c971f6743f0aaea8e347489e825bae",
  "lib/discovery/catalogue-data/pricing-booking-review-v1.mjs": "7cd4410213a07534cdbd7589e903c69101611fb1bc5443eae381abe3d80b8cfd",
  "lib/catalogue-service-photo-keys.mjs": "c7bde2cfe04500fbe29c95152a4190aba71a506c1f779d4012b2614fddc806dd",
  "lib/locale/service-english.json": "c7cafdf23b3c5ac16d6695725ba602204abe491c361eef837562b2e16d19e188",
  "lib/specific-service-photo-ids.mjs": "3613fab6a61c67c7a2a0c4ccf64917b1f531f01a2dd30d89511d61651bce994a",
  "docs/specific-service-photo-generation-2026-11-12.json": "dc217d27f84743393acae80d16de204ae9c753f315d6cac0dce1f45f718909fa"
})
export const INTAKE_NEW_HASHES = Object.freeze({
  "lib/discovery/catalogue-data/neighborhood-intake-20261123.mjs": "aa74d1cf476a35b6bd62b0cf00af7a7e67a5d0c5df4ad42a0ac756319bffa48f",
  "lib/catalogue-service-photo-associations-intake-20261123.mjs": "395da5ecce60daad79b9b459292e1d24b4106bd5219460d28182ff7f457e9815",
  "docs/catalogue-coverage/intake-20261123.json": "af3987f7e661a9198411f1df99622dc2d8ff2612aa4a269ba76298532d2eb704",
  "public/service-photos/sx-vr-arena-free-roam-v1.webp": "59240acd9cca245565cbf9b5353d31ada8398d937079e6be3fc881e8527c9580"
})
export const INTAKE_ROW_HASHES = Object.freeze({
  'sofia-vr-sofia-west-mall-lyulin7': 'c6d2f5d96d5923debd524f7103722fe964bd9e29b67695a64d4561641abfb686',
  'sofia-brainland-lyulin3-block319v': '5d158947144741677508c7a88f638900fafd971c6ae9274f33eab0df53190a23',
})
const edits = {
  "lib/discovery/sofia-catalogue.mjs": [
    ["","import { INTAKE_20261123_RECORDS } from './catalogue-data/neighborhood-intake-20261123.mjs'\n"],
    ["","  ...INTAKE_20261123_RECORDS,\n"],
  ],
  "lib/discovery/catalogue-data/pricing-booking-review-v1.mjs": [
    ["","import { INTAKE_20261123_REVIEWS } from './neighborhood-intake-20261123.mjs'\n"],
    ["export const BOOKING_PRICE_REVIEWS = [...historicalBookingPriceReviews, ...NEIGHBORHOOD_20261111_REVIEWS, ...NEIGHBORHOOD_20261113_REVIEWS, ...COVERAGE_20261116_REVIEWS, ...SUHODOL_20261122_REVIEWS]\n","export const BOOKING_PRICE_REVIEWS = [...historicalBookingPriceReviews, ...NEIGHBORHOOD_20261111_REVIEWS, ...NEIGHBORHOOD_20261113_REVIEWS, ...COVERAGE_20261116_REVIEWS, ...SUHODOL_20261122_REVIEWS, ...INTAKE_20261123_REVIEWS]\n"],
  ],
  "lib/catalogue-service-photo-keys.mjs": [
    ["","import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_INTAKE_20261123 } from './catalogue-service-photo-associations-intake-20261123.mjs'\n"],
    ["const associations = new Map([...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261113, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261116, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261122, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_AZIS_20261122, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_SUHODOL_20261122]\n","const associations = new Map([...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261113, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261116, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261122, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_AZIS_20261122, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_SUHODOL_20261122, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_INTAKE_20261123]\n"],
  ],
  "lib/locale/service-english.json": [
    ["","      },\n      {\n        \"checkedOn\": \"2026-11-23\",\n        \"businessId\": \"sofia-vr-sofia-west-mall-lyulin7\",\n        \"inventoryIdentity\": \"efe50eceeeb48cd536fac2a2290664ce15860c294195755295854fec9412de51\",\n        \"reason\": \"Local English text for the exact source-reviewed Lyulin service; no external translation API.\",\n        \"entriesAdded\": {\n          \"names\": 1,\n          \"descriptions\": 1,\n          \"units\": 1\n        },\n        \"certifiedHumanTranslation\": false\n      },\n      {\n        \"checkedOn\": \"2026-11-23\",\n        \"businessId\": \"sofia-brainland-lyulin3-block319v\",\n        \"inventoryIdentity\": \"0c585c2b0a71ca51ec1e2ae7b344d7df7de9c6c0075447030bb2aaea5e350ac2\",\n        \"reason\": \"Local English text for the exact source-reviewed Lyulin service; no external translation API.\",\n        \"entriesAdded\": {\n          \"names\": 1,\n          \"descriptions\": 1,\n          \"units\": 0\n        },\n        \"certifiedHumanTranslation\": false\n"],
    ["","    \"VR игра ARENA за 2–6 играчи\": \"VR ARENA game for 2–6 players\",\n    \"Английски език за възрастни\": \"English for adults\",\n"],
    ["","    \"30 минути в обща VR арена за 2–6 играчи, от петък до неделя. Цената е на човек, не за цялата група. Обектът потвърждава часа по телефона.\": \"30 minutes in a shared VR arena for 2–6 players, Friday to Sunday. The price is per person, not a group total. The venue confirms your time by phone.\",\n    \"Присъствен курс по английски за възрастни в група или индивидуално. Изпращаш запитване; центърът уточнява формата, графика и цената.\": \"An in-person English course for adults, in a group or one-to-one. Send an enquiry; the centre will confirm the format, timetable and price.\",\n"],
    ["","    \"на човек\": \"per person\",\n"],
  ],
  "lib/specific-service-photo-ids.mjs": [
    ["","  \"sx-vr-arena-free-roam\",\n"],
  ],
  "docs/specific-service-photo-generation-2026-11-12.json": [
    ["","    {\n      \"id\": \"sx-vr-arena-free-roam\",\n      \"label\": \"VR игра ARENA за 2–6 играчи\",\n      \"sourceFile\": \"exec-f919c6a9-9f18-4654-807b-83941ebdb31d.png\",\n      \"sourceSha256\": \"8847699a2d5740aa0203cdec94c0483a823d5e64d663f6e1b8e0046e280f9d54\",\n      \"bytes\": 45148,\n      \"sha256\": \"59240acd9cca245565cbf9b5353d31ada8398d937079e6be3fc881e8527c9580\",\n      \"prompt\": \"Use case: photorealistic-natural. Asset type: illustrative service photo for a local booking catalogue, not a depiction of a particular venue. A candid half-body, three-quarter-view photo of two adult visitors playing a shared free-roaming VR game. Each wears a clearly recognizable generic white VR headset and naturally holds two handheld controllers. Simple indoor activity room with softly lit walls, a matte floor and ample clear space around the players. Use realistic hands, natural poses, warm neutral lighting, and a clean editorial composition. Keep both headsets and controllers grouped near the center with generous crop-safe margins for a small square thumbnail. No brands, logos, signage, text, or watermark. No glowing holograms or science-fiction effects.\",\n      \"file\": \"public/service-photos/sx-vr-arena-free-roam-v1.webp\",\n      \"width\": 640,\n      \"height\": 640,\n      \"generatedOn\": \"2026-11-23\",\n      \"review\": {\n        \"status\": \"accepted\",\n        \"finalLayoutApproved\": true,\n        \"sourceSha256\": \"8847699a2d5740aa0203cdec94c0483a823d5e64d663f6e1b8e0046e280f9d54\",\n        \"reviewers\": [\n          \"/root\"\n        ],\n        \"method\": \"Root viewed the complete source and the complete 640px WebP. Two fictional adults with recognizable VR headsets and controllers illustrate shared free-roaming play. No partner imagery, representation of the real venue, marks or labels. Square downscale and format conversion only.\"\n      }\n    },\n"],
  ],
}
const digest = value => createHash('sha256').update(value).digest('hex')
function exactFile(path, hashes) {
  if (!Object.hasOwn(hashes, path)) return false
  try { return digest(readFileSync(new URL('../' + path, import.meta.url))) === hashes[path] } catch { return false }
}
export const intakeAllowsFileChange = path => exactFile(path, INTAKE_HASHES)
export const intakeAllowsNewFile = path => exactFile(path, INTAKE_NEW_HASHES)

export function intakePriorSource(path, source) {
  if (!Object.hasOwn(edits, path) || digest(source) === priorHashes[path]) return source
  // Callers may pass a source from a much older snapshot, which already
  // predates this cohort. Its own receipt still validates all bytes.
  if (!/INTAKE_20261123|sx-vr-arena-free-roam|sofia-vr-sofia-west-mall-lyulin7/u.test(source)) return source
  if (digest(source) !== INTAKE_HASHES[path]) throw Error('Unreviewed 23 Nov intake source delta: ' + path)
  let prior = source
  for (const [before, after] of edits[path]) {
    if (prior.split(after).length !== 2) throw Error('Ambiguous 23 Nov intake source delta: ' + path)
    prior = prior.replace(after, () => before)
  }
  if (digest(prior) !== priorHashes[path]) throw Error('Intake must restore every prior source byte: ' + path)
  return prior
}

export function intakePriorCatalogue(rows) {
  const seen = new Set()
  return rows.filter(row => {
    if (!Object.hasOwn(INTAKE_ROW_HASHES, row?.id)) return true
    if (seen.has(row.id)) throw Error('Duplicate 23 Nov intake record: ' + row.id)
    seen.add(row.id)
    if (digest(JSON.stringify(row)) !== INTAKE_ROW_HASHES[row.id]) throw Error('Unreviewed 23 Nov intake record delta: ' + row.id)
    return false
  })
}
