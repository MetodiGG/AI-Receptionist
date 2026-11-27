import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-malta-ovcha-kupel426'
const address = 'София, ж.к. Овча купел 1, бл. 426, от страната на паркинга'
const neighborhood = 'Овча купел 1'
const website = 'https://centermalta.com/'
const phone = '+359896654564'

const coordinates = Object.freeze({
  latitude: 42.688460,
  longitude: 23.251085,
  method: 'verified_official_address',
  source: OFFICIAL_SOFIA_SOURCE_URL,
  sourceAddress: address,
  sourceCityCode: '68134',
  sourceNeighborhood: neighborhood,
  sourceWebsite: website,
  addressId: '102076',
  checkedOn: '2026-11-27',
  licence: 'CC-BY-4.0',
  attribution: OFFICIAL_SOFIA_ATTRIBUTION,
})

// The owner's named map target independently agrees with the unique civic
// address. Never copy this point to another tenant or overwrite a newer pin.
// The BRITANICA school was reviewed but not changed; see the address receipt.
export function applyVerifiedWestSchoolSalonPoints20261127(rows) {
  return rows.map(row => (
    row.id === id && row.name === 'Malta Health & Beauty Center' &&
    row.cityCode === '68134' && row.neighborhood === neighborhood && row.category === 'hair' &&
    row.locationKind === 'premises' && row.coordinates === null &&
    row.address === address && row.website === website && row.phone === phone &&
    row.booking?.kind === 'phone' && row.booking.phone === phone &&
    row.verification?.status === 'approved' && row.verification.contact === website &&
    row.verification.booking?.url === website
      ? { ...row, coordinates } : row
  ))
}
