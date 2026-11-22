import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Test-only exact inverse for this one new Suhodol office. Older receipts stay frozen.
export const SUHODOL_INTAKE_BASE = '69a9f91780d47874bcdb614c957c78e3c4ce94be'
export const SUHODOL_INTAKE_HASHES = Object.freeze({
  "lib/discovery/sofia-catalogue.mjs": "b5400424942bc1e65b69cb2ba0847aeb522c847d2f951bb0eaba0b52c9768d8e",
  "lib/discovery/catalogue-data/pricing-booking-review-v1.mjs": "618f9e0cd0d26660b2f70f00e3a9b3cb065f42b28523de8e1083eaf1ca026a94",
  "lib/catalogue-service-photo-keys.mjs": "823689e98eb7943cd03281fc52f86788d60b282cdd18937cce22c25ca0d7aa93",
  "lib/locale/service-english.json": "543d710c76d95882227c97836643a28d617cff72e7497610026518e589291bd2"
})
export const SUHODOL_INTAKE_NEW_HASHES = Object.freeze({
  "lib/discovery/catalogue-data/neighborhood-suhodol-20261122.mjs": "52fe14957612f3f305630b00bcf3ee259dfa6fe2b65b18a7ee7b90aa0b5204e0",
  "lib/catalogue-service-photo-associations-suhodol-20261122.mjs": "3d7620d19c61a855db5e684e3a6832703b744358b20bbe63ad8df0050d630117",
  "docs/catalogue-coverage/suhodol-intake-20261122.json": "5218c4dd54c55e79e1a000b925a9ec39c1210d3fe4d18a3d67e4b03728ff4fef",
  "docs/catalogue-coverage/research-priority30-003-20261122.json": "e44d1d464c8f2218cfb16c798c04102bfd76a3415f64c96a6a0a822b617ca73f",
  "docs/catalogue-coverage/suhodol-intake-20261122.md": "86661a7c6d545b26f96c4f75864b46997a83c059c84c06e1a5bbf75c186fe809"
})
export const SUHODOL_INTAKE_ROW_HASHES = Object.freeze({
  'sofia-maria-kamenova-suhodol-shtit9': '2d33742ca4f1e2486f04d267d5930056490b87a7df6d785d5518734de47ea0e7',
})
const priorHashes = Object.freeze({
  "lib/discovery/sofia-catalogue.mjs": "b7044e78c59c21350fce78b53b7e01f123093d87e231de916d9e8299da1672b9",
  "lib/discovery/catalogue-data/pricing-booking-review-v1.mjs": "c43b0af5a833ff92e6782b70205af473b1dc5b1c69abde6930cd3de14751dec0",
  "lib/catalogue-service-photo-keys.mjs": "232cd9d55329d062ea608341039437628fd7c4f864a2b00b41053eb9bc41c7aa",
  "lib/locale/service-english.json": "e9876f3a07822e86fdd7e993c278568662e1e5487a8d802369e9fc49f9eb35f2"
})
const sourceEdits = {
  "lib/discovery/sofia-catalogue.mjs": [
    {
      "before": "import { NEIGHBORHOOD_20261111_RECORDS } from './catalogue-data/neighborhood-expansion-20261111.mjs'\nimport { NEIGHBORHOOD_20261113_RECORDS } from './catalogue-data/neighborhood-expansion-20261113.mjs'\nimport { COVERAGE_20261116_RECORDS } from './catalogue-data/neighborhood-coverage-20261116.mjs'\nimport { enrichCatalogueDetails } from './catalogue-data/details-enrichment-v2.mjs'\nimport { enrichCatalogueDetailsV3 } from './catalogue-data/details-enrichment-v3.mjs'\nimport pricing20261110 from './catalogue-data/pricing-20261110.json' with { type: 'json' }\n",
      "after": "import { NEIGHBORHOOD_20261111_RECORDS } from './catalogue-data/neighborhood-expansion-20261111.mjs'\nimport { NEIGHBORHOOD_20261113_RECORDS } from './catalogue-data/neighborhood-expansion-20261113.mjs'\nimport { COVERAGE_20261116_RECORDS } from './catalogue-data/neighborhood-coverage-20261116.mjs'\nimport { SUHODOL_20261122_RECORDS } from './catalogue-data/neighborhood-suhodol-20261122.mjs'\nimport { enrichCatalogueDetails } from './catalogue-data/details-enrichment-v2.mjs'\nimport { enrichCatalogueDetailsV3 } from './catalogue-data/details-enrichment-v3.mjs'\nimport pricing20261110 from './catalogue-data/pricing-20261110.json' with { type: 'json' }\n"
    },
    {
      "before": "  ...NEIGHBORHOOD_20261111_RECORDS,\n  ...NEIGHBORHOOD_20261113_RECORDS,\n  ...COVERAGE_20261116_RECORDS,\n])\n\nconst geocodes = new Map()\n",
      "after": "  ...NEIGHBORHOOD_20261111_RECORDS,\n  ...NEIGHBORHOOD_20261113_RECORDS,\n  ...COVERAGE_20261116_RECORDS,\n  ...SUHODOL_20261122_RECORDS,\n])\n\nconst geocodes = new Map()\n"
    }
  ],
  "lib/discovery/catalogue-data/pricing-booking-review-v1.mjs": [
    {
      "before": "import { NEIGHBORHOOD_20261111_REVIEWS } from './neighborhood-expansion-20261111.mjs'\nimport { NEIGHBORHOOD_20261113_REVIEWS } from './neighborhood-expansion-20261113.mjs'\nimport { COVERAGE_20261116_REVIEWS } from './neighborhood-coverage-20261116.mjs'\nconst checkedOn = '2026-11-10', validUntil = '2027-02-08'\nconst price = (amount, sourceUrl, options = {}) => ({ amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn, validUntil, ...options })\nconst service = (name, amount, sourceUrl, options = {}) => ({\n",
      "after": "import { NEIGHBORHOOD_20261111_REVIEWS } from './neighborhood-expansion-20261111.mjs'\nimport { NEIGHBORHOOD_20261113_REVIEWS } from './neighborhood-expansion-20261113.mjs'\nimport { COVERAGE_20261116_REVIEWS } from './neighborhood-coverage-20261116.mjs'\nimport { SUHODOL_20261122_REVIEWS } from './neighborhood-suhodol-20261122.mjs'\nconst checkedOn = '2026-11-10', validUntil = '2027-02-08'\nconst price = (amount, sourceUrl, options = {}) => ({ amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn, validUntil, ...options })\nconst service = (name, amount, sourceUrl, options = {}) => ({\n"
    },
    {
      "before": "  ...initialBookingPriceReviews.filter(review => !expandedReviewIds.has(review.id)),\n  ...PRICING_EXPANSION_REVIEWS,\n].map(review => ({ ...review, inventoryIdentity: reviewedIdentities[review.id] }))\nexport const BOOKING_PRICE_REVIEWS = [...historicalBookingPriceReviews, ...NEIGHBORHOOD_20261111_REVIEWS, ...NEIGHBORHOOD_20261113_REVIEWS, ...COVERAGE_20261116_REVIEWS]\n\n// New neighborhood records already carry their reviewed complete inventories.\n// Do not feed their deliberately unpriced services into the price-only patcher.\n",
      "after": "  ...initialBookingPriceReviews.filter(review => !expandedReviewIds.has(review.id)),\n  ...PRICING_EXPANSION_REVIEWS,\n].map(review => ({ ...review, inventoryIdentity: reviewedIdentities[review.id] }))\nexport const BOOKING_PRICE_REVIEWS = [...historicalBookingPriceReviews, ...NEIGHBORHOOD_20261111_REVIEWS, ...NEIGHBORHOOD_20261113_REVIEWS, ...COVERAGE_20261116_REVIEWS, ...SUHODOL_20261122_REVIEWS]\n\n// New neighborhood records already carry their reviewed complete inventories.\n// Do not feed their deliberately unpriced services into the price-only patcher.\n"
    }
  ],
  "lib/catalogue-service-photo-keys.mjs": [
    {
      "before": "import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261116 } from './catalogue-service-photo-associations-20261116.mjs'\nimport { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261122 } from './catalogue-service-photo-associations-20261122.mjs'\nimport { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_AZIS_20261122 } from './catalogue-service-photo-associations-azis-20261122.mjs'\nimport { specificServicePhotoKey } from './specific-service-photo-ids.mjs'\nimport { catalogueBusinessDetails } from './discovery/business-details.mjs'\n\n// Only this server adapter imports the exact-name inventory. Browser payloads\n// carry a small allowlisted image ID, not thousands of catalogue names.\nconst key = (businessId, category, name) => JSON.stringify([businessId, category, name.trim()])\nconst associations = new Map([...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261113, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261116, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261122, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_AZIS_20261122]\n  .map(([businessId, category, name, photoId]) => [key(businessId, category, name), photoId]))\n\nexport function catalogueServicePhotoFields(service, business) {\n",
      "after": "import { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261116 } from './catalogue-service-photo-associations-20261116.mjs'\nimport { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261122 } from './catalogue-service-photo-associations-20261122.mjs'\nimport { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_AZIS_20261122 } from './catalogue-service-photo-associations-azis-20261122.mjs'\nimport { CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_SUHODOL_20261122 } from './catalogue-service-photo-associations-suhodol-20261122.mjs'\nimport { specificServicePhotoKey } from './specific-service-photo-ids.mjs'\nimport { catalogueBusinessDetails } from './discovery/business-details.mjs'\n\n// Only this server adapter imports the exact-name inventory. Browser payloads\n// carry a small allowlisted image ID, not thousands of catalogue names.\nconst key = (businessId, category, name) => JSON.stringify([businessId, category, name.trim()])\nconst associations = new Map([...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261113, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261116, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_20261122, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_AZIS_20261122, ...CATALOGUE_SERVICE_PHOTO_ASSOCIATIONS_SUHODOL_20261122]\n  .map(([businessId, category, name, photoId]) => [key(businessId, category, name), photoId]))\n\nexport function catalogueServicePhotoFields(service, business) {\n"
    }
  ],
  "lib/locale/service-english.json": [
    {
      "before": "        },\n        \"businessOwnerConfirmed\": false,\n        \"certifiedHumanTranslation\": false\n      }\n    ],\n    \"sourceInventorySha256\": \"3dc68153b6dbd333d0990cf3c7658bb4e0235f79d7d1e8081cfc226034bab456\",\n",
      "after": "        },\n        \"businessOwnerConfirmed\": false,\n        \"certifiedHumanTranslation\": false\n      },\n      {\n        \"checkedOn\": \"2026-11-22\",\n        \"businessId\": \"sofia-maria-kamenova-suhodol-shtit9\",\n        \"inventoryIdentity\": \"071a732c6c5d784a600e7dea7d82110fca917ca3f5ad32225e248fb6f3261502\",\n        \"reason\": \"Two exact English descriptions for the independently reviewed in-office Suhodol services. Existing name translations are reused. Original cache snapshots and source metadata remain unchanged; no external translation API.\",\n        \"entriesAdded\": { \"names\": 0, \"descriptions\": 2, \"units\": 0 },\n        \"entriesReused\": { \"names\": 2 },\n        \"certifiedHumanTranslation\": false\n      }\n    ],\n    \"sourceInventorySha256\": \"3dc68153b6dbd333d0990cf3c7658bb4e0235f79d7d1e8081cfc226034bab456\",\n"
    },
    {
      "before": "    \"смяна на предпазен клапан на бойлер\": \"change of boiler safety valve\"\n  },\n  \"descriptions\": {\n    \"Часът се уговаря по телефона. Цена от публикуваната EUR тарифа на фризьор Елена.\": \"Appointments are arranged by telephone. The price is taken from hairdresser Elena's published EUR price list.\",\n    \"Предварително записване по телефона и определяне на нивото. Подходящият курс, графикът и таксата се уточняват с учебния център; не е резервация за единичен урок.\": \"Advance enrolment by telephone and a level assessment. The appropriate course, timetable and fee are agreed with the learning centre; this is not a booking for a single lesson.\",\n    \"1 час общо: до 40 минути снимане и 20 минути избор; една визия и една ретуширана снимка. Допълнителна снимка: 15 EUR. Необработени кадри не се предават; плащане в деня на сесията. Условията предвиждат възможност за публикуване на портрети; уточнете поверителността преди записване.\": \"1 hour total: up to 40 minutes of photography and 20 minutes for selection; one look and one retouched photograph. Additional photograph: 15 EUR. Unedited photographs are not supplied; payment on the day of the session. The conditions allow portraits to be published; agree privacy requirements before booking.\",\n",
      "after": "    \"смяна на предпазен клапан на бойлер\": \"change of boiler safety valve\"\n  },\n  \"descriptions\": {\n    \"Присъствена психологична консултация в кабинет с предварително записване. Часът се запазва през външния календар на специалиста.\": \"In-person psychological consultation at the practice by prior appointment. Book through the practitioner's external calendar.\",\n    \"Присъствена семейна терапия в кабинет с предварително записване. Часът се запазва през външния календар на специалиста.\": \"In-person family therapy at the practice by prior appointment. Book through the practitioner's external calendar.\",\n    \"Часът се уговаря по телефона. Цена от публикуваната EUR тарифа на фризьор Елена.\": \"Appointments are arranged by telephone. The price is taken from hairdresser Elena's published EUR price list.\",\n    \"Предварително записване по телефона и определяне на нивото. Подходящият курс, графикът и таксата се уточняват с учебния център; не е резервация за единичен урок.\": \"Advance enrolment by telephone and a level assessment. The appropriate course, timetable and fee are agreed with the learning centre; this is not a booking for a single lesson.\",\n    \"1 час общо: до 40 минути снимане и 20 минути избор; една визия и една ретуширана снимка. Допълнителна снимка: 15 EUR. Необработени кадри не се предават; плащане в деня на сесията. Условията предвиждат възможност за публикуване на портрети; уточнете поверителността преди записване.\": \"1 hour total: up to 40 minutes of photography and 20 minutes for selection; one look and one retouched photograph. Additional photograph: 15 EUR. Unedited photographs are not supplied; payment on the day of the session. The conditions allow portraits to be published; agree privacy requirements before booking.\",\n"
    }
  ]
}
const sha256 = value => createHash('sha256').update(value).digest('hex')
const exactFile = (path, hashes) => {
  if (!Object.hasOwn(hashes, path)) return false
  try { return sha256(readFileSync(new URL('../' + path, import.meta.url))) === hashes[path] } catch { return false }
}
export const suhodolIntakeAllowsFileChange = path => exactFile(path, SUHODOL_INTAKE_HASHES)
export const suhodolIntakeAllowsNewFile = path => exactFile(path, SUHODOL_INTAKE_NEW_HASHES)

// Compose this inverse before nearbyPoints, locationRecovery and every older dated cohort.
export function suhodolIntakePriorSource(path, source) {
  if (!Object.hasOwn(priorHashes, path)) return source
  if (sha256(source) === priorHashes[path]) return source
  if (sha256(source) !== SUHODOL_INTAKE_HASHES[path]) throw Error('Unreviewed Suhodol intake source delta: ' + path)
  let previous = source
  for (const { before, after } of sourceEdits[path]) {
    if (!after || previous.split(after).length !== 2) throw Error('Ambiguous Suhodol intake source delta: ' + path)
    previous = previous.replace(after, () => before)
  }
  if (sha256(previous) !== priorHashes[path]) throw Error('Suhodol intake must restore every prior source byte: ' + path)
  return previous
}

export function suhodolIntakePriorCatalogue(rows) {
  let removed = 0
  return rows.filter(row => {
    if (!Object.hasOwn(SUHODOL_INTAKE_ROW_HASHES, row?.id)) return true
    if (sha256(JSON.stringify(row)) !== SUHODOL_INTAKE_ROW_HASHES[row.id]) throw Error('Unreviewed Suhodol intake record delta: ' + row.id)
    if (++removed > 1) throw Error('Duplicate Suhodol intake record: ' + row.id)
    return false
  })
}
