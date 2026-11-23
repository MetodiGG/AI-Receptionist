import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const website = 'https://sites.google.com/view/pluvanelyulin/'
const reviewed = {
  id: 'sofia-pluven-klub-lyulin-33ou', cityCode: '68134', neighborhood: 'Люлин 3',
  address: 'София, ж.к. Люлин 3, ул. 309 № 8, басейн на 33 ОУ Санкт Петербург',
  locationKind: 'premises', category: 'fitness', coordinates: null, website, phone: '+359885721337',
}
const bookingSource = `${website}${encodeURIComponent('график')}`
const contactSource = `${website}${encodeURIComponent('контакти')}`

// The named host and numbered street were manually confirmed against the
// district register and the unique GIS Sofia CSV row. This is the school
// postal-address point, not a verified pool entrance.
export function applyReviewedSwimmingLyulin3Location20261123(records) {
  return records.map(row => {
    if (row.id !== reviewed.id || !Object.entries(reviewed).every(([key, value]) => row[key] === value) ||
        row.verification?.booking?.url !== bookingSource || row.verification?.contact !== contactSource ||
        row.booking?.kind !== 'phone' || row.booking.phone !== reviewed.phone) return row
    return { ...row, coordinates: {
      latitude: 42.719699, longitude: 23.247158,
      source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: reviewed.address, sourceCityCode: reviewed.cityCode, sourceNeighborhood: reviewed.neighborhood,
      sourceWebsite: website, checkedOn: '2026-11-23', addressId: '110120',
      licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } }
  })
}
