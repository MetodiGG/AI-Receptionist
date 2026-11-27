import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const reviewedOn = '2026-11-27'
const points = new Map([
  ['sofia-hairstyle-maya-nguen-druzhba194g', {
    address: 'София, ж.к. Дружба 1, бл. 194, до вх. Г', neighborhood: 'Дружба 1', category: 'hair',
    website: 'https://hairstyle-by-maya-nguen.com/', bookingPhone: '+359890137794',
    evidence: 'https://hairstyle-by-maya-nguen.com/frizyorski-uslugi-druzhba-sofia/',
    addressId: '102664', latitude: 42.663106, longitude: 23.404003,
  }],
  ['sofia-max-international-lyulin-petar-bonev4', {
    address: 'София, ж.к. Люлин, ул. Петър Бонев 4, вход откъм ул. 309-та', neighborhood: 'Люлин', category: 'education',
    website: 'https://maxinternational.bg/',
    bookingUrl: 'https://maxinternational.bg/ezikovo-obuchenie/individualno-ezikowo-obuchenie/',
    evidence: 'https://maxinternational.bg/ezikovo-obuchenie/individualno-ezikowo-obuchenie/',
    nextAddress: 'София, ж.к. Люлин 3, ул. Петър Бонев 4, вход откъм ул. 309-та', nextNeighborhood: 'Люлин 3',
    addressId: '96339', latitude: 42.720646, longitude: 23.243325,
  }],
  ['sofia-vasilevi-nadezhda3-driving', {
    address: 'София, ж.к. Надежда 3, ул. „Подпоручик Футеков“ 1', neighborhood: 'Надежда 3', category: 'education',
    website: 'https://vasilevi.com/', bookingUrl: 'https://vasilevi.com/forma-za-zapisvane/',
    evidence: 'https://vasilevi.com/forma-za-zapisvane/', ownerSource: 'https://vasilevi.com/forma-za-zapisvane/',
    latitude: 42.7345224, longitude: 23.2931652,
  }],
  ['sofia-beauty-hub35-poligona', {
    address: 'София, кв. Полигона, бл. 35', neighborhood: 'Полигона', category: 'hair',
    website: 'https://beautyhub35.com/', bookingUrl: 'https://studio24.bg/studios/iframe/WTanUNyNCmZsMSDj',
    evidence: 'https://beautyhub35.com/rezervaciya', ownerSource: 'https://beautyhub35.com/',
    latitude: 42.663166, longitude: 23.3821832,
  }],
  ['sofia-new-dental-solutions', {
    address: 'София, ж.к. Надежда 3, ул. Кумановски бой 7, бл. 321, партер', neighborhood: 'Надежда 3', category: 'other',
    website: 'https://www.newdental.bg/', bookingPhone: '+359898493900',
    evidence: 'https://www.newdental.bg/kontakti/', ownerSource: 'https://www.newdental.bg/kontakti/',
    latitude: 42.7325734, longitude: 23.2945112,
  }],
  ['sofia-noxic-beauty', {
    address: 'София, бул. Копенхаген 278', neighborhood: 'Дружба 2', category: 'nails',
    website: 'https://noxicbeauty.com/', bookingPhone: '+359877757858',
    evidence: 'https://noxicbeauty.com/services/manicure/', ownerSource: 'https://noxicbeauty.com/contacts/',
    latitude: 42.6480615, longitude: 23.4029499,
  }],
  ['sofia-miracle-barber-obikolna275', {
    address: 'София, ул. Обиколна 275', neighborhood: 'Дружба 2', category: 'barber',
    website: 'https://miraclebarber.com/', bookingPhone: '+359878113915',
    evidence: 'https://miraclebarber.com/', ownerSource: 'https://miraclebarber.com/',
    latitude: 42.6482314, longitude: 23.40101,
  }],
])

// Only fill an empty pin on the explicitly identified approved branch. A
// changed address, booking destination or existing point needs another review.
// This does not refresh any service, pricing or branch approval dates.
export function applySofiaAddressPointsNov27(rows) {
  return rows.map(row => {
    const entry = points.get(row.id)
    if (!entry || row.cityCode !== '68134' || row.locationKind !== 'premises' || row.coordinates !== null ||
        row.verification?.status !== 'approved') return row
    const { evidence, bookingPhone, bookingUrl, nextAddress, nextNeighborhood, ownerSource, addressId, latitude, longitude, ...identity } = entry
    if (!Object.entries(identity).every(([key, value]) => row[key] === value) || row.verification.booking?.url !== evidence ||
        (bookingPhone ? row.booking?.kind !== 'phone' || row.booking.phone !== bookingPhone || row.phone !== bookingPhone
          : row.booking?.kind !== 'form' || row.booking.url !== bookingUrl)) return row
    const address = nextAddress ?? row.address, neighborhood = nextNeighborhood ?? row.neighborhood
    const coordinates = addressId ? {
      latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: address, sourceCityCode: row.cityCode, sourceNeighborhood: neighborhood, sourceWebsite: row.website,
      checkedOn: reviewedOn, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } : { latitude, longitude, source: ownerSource, method: 'first_party_coordinates', sourceAddress: address }
    return { ...row, address, neighborhood, coordinates }
  })
}
