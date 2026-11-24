import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const reviewed = {
  id: 'sofia-alkom-todor-kableshkov',
  name: 'Автосервиз АЛКОМ',
  cityCode: '68134',
  neighborhood: null,
  address: 'София, бул. Тодор Каблешков 63',
  locationKind: 'premises',
  coordinates: null,
  category: 'auto_repair',
  website: 'https://alkomess.com/',
  phone: '+359888502730',
}
const contact = `${reviewed.website}контакти`

// Municipal point 93850 is a unique civic-number match. Do not infer a
// search neighborhood from the administrative district or the road name.
export function applyAlkomPostalRecovery20261123(records) {
  return records.map(row => {
    if (row.id !== reviewed.id || !Object.entries(reviewed).every(([key, value]) => row[key] === value) ||
        row.booking?.kind !== 'form' || row.booking.url !== contact ||
        row.verification?.status !== 'approved' || row.verification.contact !== contact || row.verification.booking?.url !== contact) return row

    return { ...row, coordinates: {
      latitude: 42.666177, longitude: 23.284384,
      source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: reviewed.address, sourceCityCode: reviewed.cityCode, sourceNeighborhood: reviewed.neighborhood, sourceWebsite: reviewed.website,
      checkedOn: '2026-11-23', addressId: '93850', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } }
  })
}
