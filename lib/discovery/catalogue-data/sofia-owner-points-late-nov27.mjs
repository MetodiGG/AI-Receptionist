import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const reviewedOn = '2026-11-27'
const ownerPoints = new Map([
  ['sofia-vayasport', {
    identity: {
      address: 'София, бул. Гоце Делчев 98, Бизнес Център АЗИМУТ',
      neighborhood: 'Мотописта', category: 'fitness', website: 'https://vayasport.bg/', phone: '+359888686368',
    },
    bookingUrl: 'https://book.vayasport.bg/calendar/public',
    bookingEvidence: 'https://vayasport.bg/pilates-reformar-ivan-vazov/',
    previousContact: 'https://vayasport.bg/pilates-reformar-ivan-vazov/',
    // GeoCoordinates for the named studio on the proprietor's contact page.
    // The owner confirms the ninth floor, not a separate street entrance.
    source: 'https://vayasport.bg/kontakti/',
    latitude: 42.6713439, longitude: 23.2948807,
  }],
  ['sofia-prestige-motopista-vaccarini7a', {
    identity: {
      address: 'София, кв. Мотописта, ул. Риккардо Ваккарини 7А, вход откъм ул. Славовица',
      neighborhood: 'Мотописта', category: 'education', website: 'https://www.prestige.bg/', phone: '+359896650196',
    },
    bookingUrl: 'https://www.prestige.bg/zapisvane-deca-angliiski',
    bookingEvidence: 'https://www.prestige.bg/zapisvane-deca-angliiski',
    previousContact: 'https://www.prestige.bg/contacts',
    // The branch's address links to these !3d/!4d coordinates; not the map
    // camera or one of the separate municipal entrances of number 7.
    source: 'https://www.prestige.bg/contacts',
    latitude: 42.6659471, longitude: 23.2958447,
  }],
  ['sofia-kuhnia-bg-geshov2e', {
    identity: {
      address: 'София, бул. Акад. Иван Гешов 2Е, Бизнес център Сердика, сграда 3.2, ет. 1, офис 112-А',
      neighborhood: null, category: 'consulting', website: 'https://kuhnia.bg/', phone: '+359886050111',
    },
    bookingPhone: '+359886050111',
    bookingEvidence: 'https://kuhnia.bg/contacts/',
    previousContact: 'https://kuhnia.bg/contacts/',
    // The municipal record identifies the civic complex at 2Е, not the
    // showroom door, individual building, or parking entry at Гюешево 83.
    neighborhood: 'Сердика', addressId: '99208', latitude: 42.691566, longitude: 23.295101,
  }],
])

// Add only confirmed location fields of the independently matched branch.
// If its identity or booking evidence changes, or a point already exists,
// a new review is required. This does not extend any tariff or approvals.
export function applySofiaOwnerPointsLateNov27(rows) {
  return rows.map(row => {
    const entry = ownerPoints.get(row.id)
    if (!entry || row.cityCode !== '68134' || row.locationKind !== 'premises' || row.coordinates !== null ||
        row.verification?.status !== 'approved') return row
    const bookingMatches = entry.bookingPhone ? row.booking?.kind === 'phone' && row.booking.phone === entry.bookingPhone
      : row.booking?.kind === 'form' && row.booking.url === entry.bookingUrl
    if (!Object.entries(entry.identity).every(([key, value]) => row[key] === value) || !bookingMatches ||
        row.verification.booking?.url !== entry.bookingEvidence || row.verification.contact !== entry.previousContact) return row
    const { latitude, longitude, addressId } = entry
    const neighborhood = entry.neighborhood ?? row.neighborhood
    const coordinates = addressId ? {
      latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: row.address, sourceCityCode: row.cityCode, sourceNeighborhood: neighborhood, sourceWebsite: row.website,
      checkedOn: reviewedOn, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } : { latitude, longitude, source: entry.source, method: 'first_party_coordinates', sourceAddress: row.address }
    return { ...row, neighborhood, coordinates }
  })
}
