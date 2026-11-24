import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

// These are existing businesses. The address strings, prices, booking routes
// and listing validity are unchanged. Two previously approved postal points
// keep their full precision and original date when a quarter is corroborated.
const reviewed = new Map([
  ['sofia-azbuki-sport-musagenitsa-swimming', {
    address: 'София, ж.к. Мусагеница, ул. Арх. Виктория Ангелова-Винарова 1',
    website: 'https://azbuki-sport.bg/', category: 'fitness', from: 'Мусагеница', to: 'Мусагеница',
    booking: { kind: 'phone', phone: '+359878019013' }, contact: 'https://azbuki-sport.bg/contact_us',
    point: ['108460', 42.663686, 23.364306, '2026-11-23'], hasPoint: false,
  }],
  ['sofia-carbox-studio', {
    address: 'София, бул. Симеоновско шосе 104',
    website: 'https://carboxbg.com/', category: 'detailing', from: null, to: 'Витоша',
    booking: { kind: 'phone', phone: '+359876355955' }, contact: 'https://carboxbg.com/zapishi-chas/',
    point: ['116434', 42.64307038723681, 23.334093899551668, '2026-11-13'], hasPoint: true,
  }],
  ['sofia-new-vita-grooming', {
    address: 'София, ж.к. Обеля, ул. Кривините 6',
    website: 'https://www.newvita.bg/', category: 'pets', from: 'Обеля', to: 'Обеля 2',
    booking: { kind: 'form', url: 'https://www.newvita.bg/kontakti' }, contact: 'https://www.newvita.bg/kontakti',
    point: ['114663', 42.744552031499396, 23.276655474548427, '2026-11-13'], hasPoint: true,
  }],
  ['sofia-lucky-garage', {
    address: 'София, ул. Подлозище 89',
    website: 'https://luckygarage.bg/', category: 'auto_repair', from: null, to: 'Горна баня',
    booking: { kind: 'phone', phone: '+359890200023' }, contact: 'https://luckygarage.bg/kontakti/',
    ownerPosition: { latitude: 42.6885066, longitude: 23.2310177, source: 'https://luckydrive.bg/contacts/' },
    hasPoint: false,
  }],
])

function boundPoint(review, neighborhood) {
  if (review.ownerPosition) {
    return { ...review.ownerPosition, method: 'first_party_coordinates', sourceAddress: review.address }
  }
  const [addressId, latitude, longitude, checkedOn] = review.point
  return { latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: review.address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: review.website,
    checkedOn, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION }
}

function sameFields(record, expected) {
  const entries = Object.entries(expected)
  return Boolean(record && Object.keys(record).length === entries.length && entries.every(([key, value]) => record[key] === value))
}

export function applyReviewedCoordinateScopeRecovery20261123(records) {
  return records.map(row => {
    const review = reviewed.get(row.id)
    if (!review || row.locationKind !== 'premises' || row.cityCode !== '68134' ||
        row.address !== review.address || row.website !== review.website || row.category !== review.category ||
        row.neighborhood !== review.from || row.verification?.contact !== review.contact ||
        !sameFields(row.booking, review.booking)) return row
    if (review.hasPoint ? !sameFields(row.coordinates, boundPoint(review, review.from)) : row.coordinates !== null) return row
    return { ...row, neighborhood: review.to, coordinates: boundPoint(review, review.to) }
  })
}
