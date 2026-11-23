import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const identity = Object.freeze({
  id: 'sofia-agron-service-benkovski-karavelov28',
  name: 'Агрон Сервиз · Бенковски',
  cityCode: '68134',
  neighborhood: 'Бенковски',
  address: 'София, кв. Бенковски, ул. Любен Каравелов 28, промишлена зона',
  locationKind: 'premises',
  coordinates: null,
  category: 'auto_repair',
  website: 'https://agronservice.bg/',
  phone: '+35929367344',
})
const bookingUrl = `${identity.website}zayavka-za-remont/`
const contactUrl = `${identity.website}kontakti/`

// Two addresses share the Sofia street and house number. The owner's
// Benkovski premises, the insurer's same-address entry and the official
// district evidence independently select the single Serdika address row.
// This is the postal point, not a surveyed workshop entrance.
const coordinates = Object.freeze({
  latitude: 42.740164,
  longitude: 23.351434,
  source: OFFICIAL_SOFIA_SOURCE_URL,
  method: 'verified_official_address',
  sourceAddress: identity.address,
  sourceCityCode: identity.cityCode,
  sourceNeighborhood: identity.neighborhood,
  sourceWebsite: identity.website,
  checkedOn: '2026-11-23',
  addressId: '111704',
  licence: 'CC-BY-4.0',
  attribution: OFFICIAL_SOFIA_ATTRIBUTION,
})

export function applyAgronVerifiedLocation20261123(records) {
  return records.map(row => {
    if (row.id !== identity.id || !Object.entries(identity).every(([key, value]) => row[key] === value) ||
        row.booking?.kind !== 'form' || row.booking.url !== bookingUrl ||
        row.verification?.contact !== contactUrl || row.verification.booking?.url !== bookingUrl) return row
    return { ...row, coordinates }
  })
}
