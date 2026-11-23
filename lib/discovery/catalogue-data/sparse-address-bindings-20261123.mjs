import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23'
const reviewed = new Map([
  ['sofia-prestige-lyulin160', {
    name: 'Езикова школа ПРЕСТИЖ · Люлин 10', category: 'education', neighborhood: 'Люлин 10',
    website: 'https://www.prestige.bg/', phone: '+359896650196',
    address: 'София, ж.к. Люлин 10, бл. 160, ет. 1 над партер',
    contact: 'https://www.prestige.bg/contacts',
    bookingEvidence: 'https://www.prestige.bg/zapisvane-deca-angliiski', bookingKind: 'form',
    addressId: '115872', latitude: 42.713896, longitude: 23.266459,
  }],
  ['sofia-amakids-lyulin', {
    name: 'AMAkids · Люлин', category: 'education', neighborhood: 'Люлин 8',
    website: 'https://www.amakids.bg/', phone: '+359882752835',
    address: 'София, ж.к. Люлин 8, ул. 3004-та 5',
    contact: 'https://www.amakids.bg/nashite-tsentrove/sofia-lyulin',
    bookingEvidence: 'https://www.amakids.bg/nashite-tsentrove/sofia-lyulin', bookingKind: 'phone',
    addressId: '99226', latitude: 42.721143, longitude: 23.257457,
  }],
  ['sofia-premier-padel-private-georgi-belov5', {
    name: 'Premier Padel Club', category: 'fitness', neighborhood: 'Горубляне',
    website: 'https://premierpadelclub.bg/', phone: '+359878242487',
    address: 'София, Горубляне, ул. Георги Белов 5',
    contact: 'https://premierpadelclub.bg/',
    bookingEvidence: 'https://premierpadelclub.bg/classes.html', bookingKind: 'phone',
    addressId: '105905', latitude: 42.637477, longitude: 23.402211,
  }],
  ['sofia-happy-pet-spa-druzhba2-283', {
    name: 'Happy Pet Spa & Grooming · Дружба 2', category: 'pets', neighborhood: 'Дружба 2',
    website: 'https://dogspa.bg/', phone: '+359898629839',
    address: 'София, ж.к. Дружба 2, Цариградско шосе, 7–11 км, Цариградски комплекс, бл. 283, вх. Б',
    contact: 'https://dogspa.bg/',
    bookingEvidence: 'https://dogspa.bg/', bookingKind: 'phone',
    addressId: '94615', latitude: 42.646173, longitude: 23.400555,
  }],
])

// Bind only the already-reviewed premises identity. Do not move a different
// operation or a property with an existing point; leave all listing facts as-is.
export function applySparseAddressBindings20261123(records) {
  return records.map(row => {
    const review = reviewed.get(row.id)
    if (!review || row.cityCode !== '68134' || row.locationKind !== 'premises' || row.coordinates !== null) return row
    const { contact, bookingEvidence, bookingKind, addressId, latitude, longitude, ...identity } = review
    if (!Object.entries(identity).every(([key, value]) => row[key] === value) ||
        row.verification?.status !== 'approved' || row.verification.contact !== contact ||
        row.verification.booking?.url !== bookingEvidence || row.booking?.kind !== bookingKind ||
        (bookingKind === 'phone' ? row.booking.phone !== row.phone : row.booking.url !== bookingEvidence)) return row
    return { ...row, coordinates: {
      latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: row.address, sourceCityCode: row.cityCode, sourceNeighborhood: row.neighborhood,
      sourceWebsite: row.website, checkedOn, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } }
  })
}
