const id = 'sofia-paintkillers-gryunanger43b'
const name = 'PaintKillers'
const neighborhood = 'Овча купел 2'
const address = 'София, ж.к. Овча купел 2, ул. Фридрих Грюнангер 43Б, вход от задната страна на блока'
const website = 'https://paintkillers.eu/'
const phone = '+359879232329'

// Owner AutomotiveBusiness JSON-LD pins its rear-of-block workshop. The
// nearby official entrance B of block 43 corroborates the site but is not
// substituted for the owner's precise shop point. No changes to booking,
// service inventory, verification dates, or the existing address text.
export function applyReviewedPaintKillersLocation20261123(records) {
  return records.map(row => {
    if (row.id !== id || row.name !== name || row.coordinates !== null || row.cityCode !== '68134' ||
        row.locationKind !== 'premises' || row.neighborhood !== neighborhood || row.category !== 'detailing' ||
        row.address !== address || row.website !== website || row.phone !== phone ||
        row.verification?.contact !== website || row.verification?.booking?.url !== website ||
        row.booking?.kind !== 'phone' || row.booking.phone !== phone) return row
    return { ...row, coordinates: {
      latitude: 42.6853601, longitude: 23.2470938, source: website, method: 'first_party_coordinates',
      sourceAddress: address,
    } }
  })
}
