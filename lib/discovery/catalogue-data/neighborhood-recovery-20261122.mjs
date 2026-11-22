// Owner Contact review, 2026-11-22:
// https://www.stephan.bg/saloni/borovo explicitly pairs Pirin22 with
// Manastirski Livadi. "Borovo" remains the branch name, not inferred geography.
// This is not a new business, tariff review, geocode or entrance survey.
const expected = Object.freeze({
  id: 'sofia-stephan-borovo', name: 'Stephan · Борово', cityCode: '68134',
  address: 'София, ул. Пирин 22', website: 'https://www.stephan.bg/',
  phone: '+359888164144', locationKind: 'premises', neighborhood: null,
})
const previousPoint = Object.freeze({
  latitude: 42.66702142457208, longitude: 23.27695821128835,
  source: 'https://urbandata.sofia.bg/dataset/address_sofia-zip',
  method: 'verified_official_address', sourceAddress: expected.address,
  sourceCityCode: '68134', sourceNeighborhood: null, sourceWebsite: expected.website,
  checkedOn: '2026-11-13', addressId: '11557', licence: 'CC-BY-4.0',
  attribution: 'ГИС София / Столична община',
})
const neighborhood = 'Манастирски ливади'
const expectedFields = Object.entries(expected)
const previousPointFields = Object.entries(previousPoint)

export function applyReviewedNeighborhoodRecovery20261122(records) {
  return records.map(row => {
    if (!expectedFields.every(([field, value]) => row[field] === value)) return row
    const point = row.coordinates
    // The exact old reviewed postal point must still be present. A different
    // point/address/context cannot inherit this one-branch manual rebind.
    if (!point || Object.keys(point).length !== previousPointFields.length ||
      !previousPointFields.every(([field, value]) => point[field] === value)) return row
    return { ...row, neighborhood, coordinates: { ...point, sourceNeighborhood: neighborhood } }
  })
}
