import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

// Newly corroborated numbered quarters for existing premises with checked
// points. Leave the existing postal text, numeric coordinates, dates,
// booking destination and inventory untouched.
const reviews = new Map([
  ['sofia-nails-asya-druzhba', {
    address: 'София, кв. Дружба, ул. „Тирана“ 17',
    website: 'https://nokti-sofia.eu/', category: 'nails', from: 'Дружба', to: 'Дружба 1', phone: '+359876670155',
    booking: { kind: 'phone', phone: '+359876670155' },
    previous: { latitude: 42.66117, longitude: 23.40076, source: 'https://nokti-sofia.eu/', method: 'first_party_coordinates' },
  }],
  ['sofia-nestor-notov-neru28', {
    address: 'София, ж.к. Люлин, бул. Джавахарлал Неру 28, Силвър център',
    website: 'https://notov.dentist/', category: 'other', from: 'Люлин', to: 'Люлин 7', phone: '+359877569985',
    booking: { kind: 'form', url: 'https://notov.dentist/' },
    previous: {
      latitude: 42.714811, longitude: 23.254114, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: 'София, ж.к. Люлин, бул. Джавахарлал Неру 28, Силвър център',
      sourceCityCode: '68134', sourceNeighborhood: 'Люлин', sourceWebsite: 'https://notov.dentist/',
      checkedOn: '2026-11-13', addressId: '94685', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    },
  }],
])
const fieldsMatch = (value, expected) => Boolean(value && Object.keys(value).length === Object.keys(expected).length &&
  Object.entries(expected).every(([key, field]) => value[key] === field))

export function applyReviewedQuarterCorroboration20261123(records) {
  return records.map(row => {
    const review = reviews.get(row.id)
    if (!review || row.cityCode !== '68134' || row.locationKind !== 'premises' || row.category !== review.category ||
        row.neighborhood !== review.from || row.address !== review.address || row.website !== review.website ||
        row.phone !== review.phone || row.verification?.contact !== review.website ||
        row.verification?.booking?.url !== review.website || !fieldsMatch(row.booking, review.booking) ||
        !fieldsMatch(row.coordinates, review.previous)) return row
    const coordinates = row.coordinates.method === 'verified_official_address'
      ? { ...row.coordinates, sourceNeighborhood: review.to }
      : { ...row.coordinates, sourceAddress: row.address }
    return { ...row, neighborhood: review.to, coordinates }
  })
}
