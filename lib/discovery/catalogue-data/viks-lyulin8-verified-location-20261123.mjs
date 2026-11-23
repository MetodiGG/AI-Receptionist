import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const identity = Object.freeze({
  id: 'sofia-viks-beauty-studio',
  name: 'VIKS Beauty Studio',
  cityCode: '68134',
  neighborhood: 'Люлин 8',
  address: 'София, ж.к. Люлин 8, ул. 3011 № 7',
  locationKind: 'premises',
  coordinates: null,
  category: 'beauty',
  website: 'https://viks.info/',
  phone: '+359878719448',
})
const bookingUrl = `${identity.website}booking`

// The owner names the quarter, street and civic number. The single qualified
// municipal row is the numbered building's postal point, not a surveyed door.
const coordinates = Object.freeze({
  latitude: 42.721247,
  longitude: 23.256882,
  source: OFFICIAL_SOFIA_SOURCE_URL,
  method: 'verified_official_address',
  sourceAddress: identity.address,
  sourceCityCode: identity.cityCode,
  sourceNeighborhood: identity.neighborhood,
  sourceWebsite: identity.website,
  checkedOn: '2026-11-23',
  addressId: '55173',
  licence: 'CC-BY-4.0',
  attribution: OFFICIAL_SOFIA_ATTRIBUTION,
})

export function applyViksLyulin8VerifiedLocation20261123(records) {
  return records.map(row => {
    if (row.id !== identity.id || !Object.entries(identity).every(([key, value]) => row[key] === value) ||
        row.booking?.kind !== 'form' || row.booking.url !== bookingUrl ||
        row.verification?.contact !== identity.website || row.verification.booking?.url !== identity.website) return row
    return { ...row, coordinates }
  })
}
