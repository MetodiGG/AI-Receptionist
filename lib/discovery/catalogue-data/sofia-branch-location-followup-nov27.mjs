import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const reviewedOn = '2026-11-27'
const branches = new Map([
  ['sofia-pharos-razsadnika-hashove21a', {
    address: 'София, ж.к. Разсадника, ул. Хъшове, бл.21А',
    neighborhood: 'Разсадника', category: 'education', website: 'https://pharos.bg/', phone: '+359878119294',
    bookingKind: 'phone', bookingTarget: '+359878119294',
    contact: 'https://pharos.bg/kontakti-pharos/', bookingEvidence: 'https://pharos.bg/kontakti-pharos/',
    // The branch links the named block marker, corroborated by civic RN47044.
    // These coordinates identify the building, not a surveyed school entrance.
    latitude: 42.7000931, longitude: 23.2887158,
  }],
  ['sofia-busy-school-nadezhda6-634', {
    address: 'София, ж.к. Надежда 6, бл. 634, до вход Д, партер',
    neighborhood: 'Надежда 6', category: 'education', website: 'https://busy-bg.com/', phone: '+359887197591',
    bookingKind: 'form', bookingTarget: 'https://busy-bg.com/?page_id=5931',
    contact: 'https://busy-bg.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/', bookingEvidence: 'https://busy-bg.com/?page_id=5931',
    // The city records the owner's exact landmark as Връбница-2, block 634,
    // entrance Д. Keep the public owner wording and do not infer the door.
    addressId: '18018', latitude: 42.736405, longitude: 23.293690,
  }],
  ['sofia-clean-ride-autoservice', {
    address: 'София, Левски В, ул. Селимица 23', neighborhood: 'Левски В',
    category: 'auto_repair', website: 'https://carsrepair.bg/', phone: '+359888844037',
    bookingKind: 'phone', bookingTarget: '+359888844037',
    contact: 'https://carsrepair.bg/contact/', bookingEvidence: 'https://carsrepair.bg/contact/',
    // Same domain/operator and appointment line; the owner now states this
    // exact street number. Civic RN113648 supplies its address point.
    currentAddress: 'София, ул. Георги Русев 2', currentNeighborhood: 'Малинова долина',
    addressId: '113648', latitude: 42.637371, longitude: 23.335133,
  }],
])

// A review only applies to the exact unlocated predecessor. These corrections
// never overwrite a newer address/point, reopen an expired offer, or edit booking.
export function applySofiaBranchLocationFollowupNov27(rows) {
  return rows.map(row => {
    const entry = branches.get(row.id)
    if (!entry || row.cityCode !== '68134' || row.locationKind !== 'premises' || row.coordinates !== null ||
        row.verification?.status !== 'approved' || row.verification.contact !== entry.contact ||
        row.verification.booking?.url !== entry.bookingEvidence || row.booking?.kind !== entry.bookingKind ||
        (entry.bookingKind === 'phone' ? row.booking.phone : row.booking.url) !== entry.bookingTarget ||
        ['address', 'neighborhood', 'category', 'website', 'phone'].some(key => row[key] !== entry[key])) return row
    const address = entry.currentAddress ?? row.address, neighborhood = entry.currentNeighborhood ?? row.neighborhood
    const { latitude, longitude, addressId } = entry
    const coordinates = addressId ? {
      latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: address, sourceCityCode: row.cityCode, sourceNeighborhood: neighborhood, sourceWebsite: row.website,
      checkedOn: reviewedOn, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } : {
      latitude, longitude, source: entry.contact, method: 'first_party_coordinates', sourceAddress: address,
    }
    return { ...row, address, neighborhood, coordinates }
  })
}
