import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23'
const reviewed = new Map([
  ['sofia-pharos-lyulin4-block446', {
    name: 'Училища Фарос · Люлин', category: 'education', neighborhood: 'Люлин 4',
    website: 'https://pharos.bg/', phone: '+359878278024',
    address: 'София, ж.к. Люлин 4, бл.446, вх.Б',
    contact: 'https://pharos.bg/kontakti-pharos/', bookingEvidence: 'https://pharos.bg/kontakti-pharos/',
    addressId: '101980', latitude: 42.71541, longitude: 23.249382,
  }],
  ['sofia-wave-studio-lyulin7-nails', {
    name: 'Wave Studio · Люлин 7', category: 'nails', neighborhood: 'Люлин 7',
    website: 'https://www.wave-studio.net/', phone: '+359898576903',
    address: 'София, ж.к. Люлин 7, бл. 744',
    contact: 'https://www.wave-studio.net/contact-us/', bookingEvidence: 'https://www.wave-studio.net/reservations/',
    addressId: '52301', latitude: 42.710662, longitude: 23.268238,
  }],
  ['sofia-yoyo-vet', {
    name: 'Ветеринарна клиника Йо Йо Вет', category: 'other', neighborhood: 'Люлин 4',
    website: 'https://yoyovet.com/', phone: '+359878329918',
    address: 'София, ж.к. Люлин 4, бл. 408, вх. А, от задната страна откъм парка',
    contact: 'https://yoyovet.com/', bookingEvidence: 'https://yoyovet.com/',
    addressId: '30115', latitude: 42.718155, longitude: 23.245101,
  }],
  ['sofia-dr-smily', {
    name: 'Дентална клиника Dr. Smily', category: 'other', neighborhood: null,
    verifiedNeighborhood: 'Люлин 6',
    website: 'https://dr-smily.com/', phone: '+359888877674',
    address: 'София, ж.к. Люлин, ул. 601-ва, бл. 608, вх. Б',
    contact: 'https://dr-smily.com/', bookingEvidence: 'https://dr-smily.com/',
    addressId: '29631', latitude: 42.714473, longitude: 23.250566,
  }],
  ['sofia-dentel-lyulin', {
    name: 'ДЕНТЕЛ · Люлин', category: 'other', neighborhood: 'Люлин 10',
    website: 'https://dentel.bg/', phone: '+35929250084',
    address: 'София, ж.к. Люлин 10, бл. 122, вх. Г, ет. 1',
    contact: 'https://dentel.bg/kontakti/', bookingEvidence: 'https://dentel.bg/kontakti/',
    addressId: '53739', latitude: 42.717252, longitude: 23.269784,
  }],
])

// Only bind the explicitly verified premises. Preserve public contact and
// prices; no output coordinate is taken from a provider map.
export function applyNorthExactCoverage20261123(records) {
  return records.map(row => {
    const review = reviewed.get(row.id)
    if (!review || row.cityCode !== '68134' || row.locationKind !== 'premises' || row.coordinates !== null) return row
    const { contact, bookingEvidence, verifiedNeighborhood, addressId, latitude, longitude, ...identity } = review
    if (!Object.entries(identity).every(([key, value]) => row[key] === value) ||
        row.verification?.status !== 'approved' || row.verification.contact !== contact ||
        row.verification.booking?.url !== bookingEvidence || row.booking?.kind !== 'phone' ||
        row.booking.phone !== row.phone) return row
    const neighborhood = verifiedNeighborhood ?? row.neighborhood
    return { ...row, neighborhood, coordinates: {
      latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: row.address, sourceCityCode: row.cityCode, sourceNeighborhood: neighborhood,
      sourceWebsite: row.website, checkedOn, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } }
  })
}
