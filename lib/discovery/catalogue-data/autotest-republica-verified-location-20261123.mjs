import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const before = Object.freeze({
  id: 'sofia-autotest-gtp-metro-lyulin',
  name: 'ГТП Аутотест Груп · Метро Люлин',
  cityCode: '68134',
  neighborhood: null,
  address: 'София, бул. Европа 182, МЕТРО Люлин',
  locationKind: 'premises',
  category: 'auto_repair',
  website: 'https://gtp.bg/location/punkt-sofia-metro-liulin/',
  phone: '+35970018752',
})
const phoneBookingTerms = new URL('/общи-условия-на-аутотест-груп-еоод/', before.website).href
const postalPoint = Object.freeze({
  latitude: 42.746792510015275, longitude: 23.23194185241712,
  source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
  sourceAddress: before.address, sourceCityCode: before.cityCode,
  sourceNeighborhood: null, sourceWebsite: before.website, checkedOn: '2026-11-13',
  addressId: '88654', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
})
const neighborhood = 'Република'

// The branch and its host name the same operating premises; the Red Cross
// identifies the exact host address as Република. Keep the existing municipal
// point and all non-location fields. Do not assume a specific workshop door.
export function applyAutotestRepublicaVerifiedLocation20261123(records) {
  return records.map(row => {
    if (!Object.entries(before).every(([key, value]) => row[key] === value) ||
        !Object.entries(postalPoint).every(([key, value]) => row.coordinates?.[key] === value) ||
        row.booking?.kind !== 'phone' || row.booking.phone !== before.phone ||
        row.verification?.contact !== before.website || row.verification.booking?.url !== phoneBookingTerms) return row
    return { ...row, neighborhood, coordinates: { ...row.coordinates, sourceNeighborhood: neighborhood } }
  })
}
