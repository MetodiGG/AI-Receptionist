const id = 'sofia-north-dog-grooming-vrabnitsa637'
const cityCode = '68134'
const neighborhood = 'Връбница 2'
const address = 'София, ж.к. Връбница 2, бл. 637, до паркинга на Северен парк'
const website = 'https://sites.google.com/view/northdoggrooming'
const contact = `${website}/контакти`
const phone = '+359898776598'

// The salon's contact page links to the named block 637 ground-floor marker.
// This is not the embed viewport or an assumed civic block entrance.
export function applySofiaNorthDogBranchPointNov27(rows) {
  return rows.map(row => {
    if (row.id !== id || row.cityCode !== cityCode || row.neighborhood !== neighborhood ||
        row.category !== 'pets' || row.locationKind !== 'premises' || row.address !== address ||
        row.coordinates !== null || row.website !== website || row.phone !== phone ||
        row.booking?.kind !== 'phone' || row.booking?.phone !== phone ||
        row.verification?.status !== 'approved' || row.verification?.contact !== contact ||
        row.verification?.booking?.url !== website) return row
    return { ...row, coordinates: {
      latitude: 42.738087, longitude: 23.297335, source: contact,
      method: 'first_party_coordinates', sourceAddress: address,
    } }
  })
}
