// One exact municipal match and one named owner-published business point,
// independently reviewed 2026-11-22. Neither is an entrance survey.
// The supplied CSV remains unchanged and is never imported by the product.
// A postal-address point is not a surveyed studio entrance or appointment slot.
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../official-sofia-address-source.mjs'

const expected = Object.freeze({
  id: 'sofia-maria-nemska-photo-suhodol', name: 'Мария Немска · Студио София',
  cityCode: '68134', neighborhood: 'Суходол', locationKind: 'premises',
  address: 'София, Суходол, ул. Траян Танев 21',
  website: 'https://marianemska.com/', phone: '+359878464445', coordinates: null,
})
const coordinates = Object.freeze({
  latitude: 42.695082, longitude: 23.22738,
  source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
  sourceAddress: expected.address, sourceCityCode: expected.cityCode,
  sourceNeighborhood: expected.neighborhood, sourceWebsite: expected.website,
  checkedOn: '2026-11-22', addressId: '88442', licence: 'CC-BY-4.0',
  attribution: OFFICIAL_SOFIA_ATTRIBUTION,
})
const ownerExpected = Object.freeze({
  id: 'sofia-dar-auto-service-europa', name: 'DAR Auto Service',
  cityCode: '68134', neighborhood: 'Люлин 1', locationKind: 'premises',
  address: 'София, Люлин 1, бул. Европа 138',
  website: 'https://dar.autos/', phone: '+359887515513', coordinates: null,
})
const ownerCoordinates = Object.freeze({
  latitude: 42.7320882, longitude: 23.2553455,
  source: 'https://dar.autos/avtoservice', method: 'first_party_coordinates',
  sourceAddress: ownerExpected.address,
})
const expectedFields = Object.entries(expected)
const ownerFields = Object.entries(ownerExpected)

export function applyReviewedAddressPoints20261122(records) {
  return records.map(row => {
    if (expectedFields.every(([field, value]) => row[field] === value)) return { ...row, coordinates }
    if (ownerFields.every(([field, value]) => row[field] === value)) return { ...row, coordinates: ownerCoordinates }
    return row
  })
}
