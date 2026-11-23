import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23'
const reviewed = new Map([
  ['sofia-thinkinkneedle', {
    name: 'ThinkINK NEEDle Tattoo Studio', category: 'other', neighborhood: 'Надежда 1',
    address: 'София, ж.к. Надежда 1, бл. 153, вх. В, откъм ул. Сава Филаретов',
    website: 'https://thinkinkneedle.com/', phone: '+359887433809',
    contact: 'https://thinkinkneedle.com/', bookingEvidence: 'https://thinkinkneedle.com/',
    addressId: '57101', latitude: 42.729081, longitude: 23.29718,
  }],
  ['sofia-violina-damyanova-ovcha-kupel418', {
    name: 'Д-р Виолина Дамянова · стоматологичен кабинет', category: 'other', neighborhood: 'Овча купел 1',
    address: 'София, ж.к. Овча купел 1, бл. 418, вх. И, ет. 1',
    website: 'https://viodent.wixsite.com/viodent', phone: '+359886532246',
    contact: 'https://viodent.wixsite.com/viodent/contact', bookingEvidence: 'https://viodent.wixsite.com/viodent/contact',
    addressId: '40253', latitude: 42.688937, longitude: 23.252361,
  }],
])

// Attach the municipal block/entrance markers to the two reviewed premises.
// Neither marker establishes a separate shop door or route distance.
export function applyNorthWestEntranceRecovery20261123(records) {
  return records.map(row => {
    const review = reviewed.get(row.id)
    if (!review || row.cityCode !== '68134' || row.locationKind !== 'premises' || row.coordinates !== null) return row
    const { contact, bookingEvidence, addressId, latitude, longitude, ...identity } = review
    if (!Object.entries(identity).every(([key, value]) => row[key] === value) ||
        row.verification?.status !== 'approved' || row.verification.contact !== contact ||
        row.verification.booking?.url !== bookingEvidence || row.booking?.kind !== 'phone' ||
        row.booking.phone !== row.phone) return row
    return { ...row, coordinates: {
      latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: row.address, sourceCityCode: row.cityCode, sourceNeighborhood: row.neighborhood,
      sourceWebsite: row.website, checkedOn, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } }
  })
}
