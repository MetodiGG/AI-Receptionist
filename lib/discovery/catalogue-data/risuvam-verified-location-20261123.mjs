import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const reviewed = {
  id: 'sofia-risuvam-gorna-banya', cityCode: '68134',
  neighborhood: 'Горна баня', address: 'София, Горна баня, ул. Планиница 17, читалище Пробуда',
  locationKind: 'premises', coordinates: null, category: 'education',
  website: 'https://risuvam.bg/', phone: '+359876444281',
}

// Two CSV points share this postal address; the named cultural venue in the
// SofiaPlan dataset corroborates only row 23774. The attached point is the
// original GIS Sofia address point, not a claim about the venue's entrance.
export function applyReviewedRisuvamLocation20261123(records) {
  return records.map(row => {
    if (row.id !== reviewed.id || !Object.entries(reviewed).every(([key, value]) => row[key] === value) ||
        row.booking?.kind !== 'phone' || row.booking.phone !== reviewed.phone ||
        row.verification?.contact !== reviewed.website || row.verification?.booking?.url !== reviewed.website) return row
    return { ...row, coordinates: {
      latitude: 42.677220, longitude: 23.239203,
      source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: reviewed.address, sourceCityCode: reviewed.cityCode, sourceNeighborhood: reviewed.neighborhood, sourceWebsite: reviewed.website,
      checkedOn: '2026-11-23', addressId: '23774', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } }
  })
}
