import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-quickfit-otets-paisiy3'
const neighborhood = 'Зона Б-5'
const address = 'София, Зона Б-5, ул. Отец Паисий 3'
const website = 'https://quickfitbg.com/'
const phone = '+359887805935'

// An official school catchment list identifies street no. 3 as Zone B-5-3,
// Vazrazhdane. The same-number municipal row in Kremikovtsi is not this venue.
export function applyReviewedQuickFitLocation20261123(records) {
  return records.map(row => {
    if (row.id !== id || row.coordinates !== null || row.cityCode !== '68134' ||
        row.locationKind !== 'premises' || row.neighborhood !== neighborhood || row.category !== 'fitness' ||
        row.address !== address || row.website !== website || row.phone !== phone ||
        row.verification?.contact !== website || row.verification?.booking?.url !== website ||
        row.booking?.kind !== 'phone' || row.booking.phone !== phone) return row
    return { ...row, coordinates: {
      latitude: 42.696474, longitude: 23.311801,
      source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
      checkedOn: '2026-11-23', addressId: '102014', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } }
  })
}
