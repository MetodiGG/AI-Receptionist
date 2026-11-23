import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const website = 'https://dpool.bg/'
const reviewed = {
  id: 'sofia-dpool-private-swimming-lyulin', cityCode: '68134', neighborhood: 'Люлин 2',
  address: 'София, Люлин 2, ул. Стефана Клинчарова, басейн на 90 СУ',
  locationKind: 'premises', category: 'fitness', coordinates: null, website, phone: '+359899161218',
}
const address = 'София, Люлин 2, ул. Стефана Клинчарова 3, басейн на 90 СУ'

// The operator identifies this pool; the named host and city premises
// record confirm No. 3. Attach the unique postal point, not a pool entrance.
export function applyReviewedDpoolLyulin2Location20261123(records) {
  return records.map(row => {
    if (row.id !== reviewed.id || !Object.entries(reviewed).every(([key, value]) => row[key] === value) ||
        row.verification?.contact !== website || row.verification?.booking?.url !== website ||
        row.booking?.kind !== 'phone' || row.booking.phone !== reviewed.phone) return row
    return { ...row, address, coordinates: {
      latitude: 42.725397, longitude: 23.252730,
      source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: address, sourceCityCode: reviewed.cityCode, sourceNeighborhood: reviewed.neighborhood,
      sourceWebsite: website, checkedOn: '2026-11-23', addressId: '91464',
      licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } }
  })
}
