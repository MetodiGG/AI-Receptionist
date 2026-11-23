const address = 'София, бул. Цар Борис III 22'
const source = 'https://www.stephan.bg/saloni/lagera'
const website = 'https://www.stephan.bg/'
const phone = '+359878600076'

export function applyStephanLageraOwnerPoint20261123(records) {
  return records.map(row => {
    if (row.id !== 'sofia-stephan-lagera' || row.name !== 'Stephan · Лагера' ||
        row.cityCode !== '68134' || row.neighborhood !== 'Лагера' || row.address !== address ||
        row.category !== 'hair' || row.locationKind !== 'premises' || row.coordinates !== null ||
        row.website !== website || row.phone !== phone || row.booking?.kind !== 'phone' || row.booking.phone !== phone ||
        row.verification?.status !== 'approved' || row.verification.contact !== source ||
        row.verification.booking?.url !== website) return row
    // The branch's own Directions link labels Salon Stephan Lagera and
    // contains its destination pin; do not take the map's viewport centre.
    return { ...row, coordinates: {
      latitude: 42.6862009, longitude: 23.2980089, source,
      method: 'first_party_coordinates', sourceAddress: address,
    } }
  })
}
