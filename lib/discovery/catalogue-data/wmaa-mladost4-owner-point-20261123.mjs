const website = 'https://wt1.eu/bg/'
const source = 'https://wt1.eu/bg/post/452fb09a/skoli'
const address = 'София, Младост 4, ул. Нов ден 129, бл. 429'
const phone = '+359888588815'

export function applyWmaaMladost4OwnerPoint20261123(rows) {
  return rows.map(row => {
    if (row.id !== 'sofia-wmaa-mladost' || row.name !== 'WMAA Винг Чун · Младост 4' ||
        row.cityCode !== '68134' || row.neighborhood !== 'Младост 4' || row.address !== address ||
        row.locationKind !== 'premises' || row.coordinates !== null || row.category !== 'fitness' ||
        row.website !== website || row.phone !== phone || row.booking?.kind !== 'phone' || row.booking.phone !== phone ||
        row.verification?.status !== 'approved' || row.verification.contact !== website ||
        row.verification.booking?.url !== website) return row

    // The owner's structured location explicitly identifies the Mladost 4 branch.
    // The municipal block has several entrances; do not infer an entrance number.
    return { ...row, coordinates: {
      latitude: 42.6319359, longitude: 23.3780751, source,
      method: 'first_party_coordinates', sourceAddress: address,
    } }
  })
}
