import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-felix-dogs-lyulin'
const website = 'https://www.felixdogs.com/'
const branch = website + 'gruming-lyulin/'
const neighborhood = 'Люлин 10'
const previousAddress = 'София, ж.к. Люлин 10, бл. 122, партер'
const address = 'София, ж.к. Люлин 10, бл. 122, вх. Б, партер'

// The owner labels the exact branch and publishes its directions. Its
// independently listed shared property entrance matches the official row.
// Bookings, services, the price inventory and the approval dates stay intact.
export function applyFelixDogsLyulinVerifiedLocation20261123(rows) {
  return rows.map(row => row.id === id && row.cityCode === '68134' && row.neighborhood === neighborhood &&
    row.address === previousAddress && row.coordinates === null && row.locationKind === 'premises' &&
    row.category === 'pets' && row.website === website && row.phone === '+359888259572' &&
    row.booking?.kind === 'phone' && row.booking.phone === row.phone &&
    row.verification?.status === 'approved' && row.verification.contact === branch && row.verification.booking?.url === branch
    ? { ...row, address, coordinates: {
      latitude: 42.717651, longitude: 23.270146,
      source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
      checkedOn: '2026-11-23', addressId: '30014', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } } : row)
}
