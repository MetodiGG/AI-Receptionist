const id = 'sofia-sf-dent'
const website = 'https://sfdent.eu/'
const address = 'София, ж.к. Изгрев, ул. Елемаг 22'
const phone = '+359876662785'
const bookingUrl = 'https://superdoc.bg/lekar/sandi-festok'
const point = Object.freeze({
  latitude: 42.66876, longitude: 23.34684, method: 'first_party_coordinates',
  source: website + 'facts', sourceAddress: address,
})

// The dental practice publishes this point for its sole facility. The
// same street number is used by other businesses; an address-wide fix
// would improperly assign the dentist's pin to those unrelated listings.
export function applySfDentIzgrevPoint20261127(rows) {
  return rows.map(row => (
    row.id === id && row.name === 'SF Dent · д-р Санди Фесток' &&
    row.cityCode === '68134' && row.neighborhood === 'Изгрев' && row.category === 'other' &&
    row.locationKind === 'premises' && row.coordinates === null &&
    row.address === address && row.website === website && row.phone === phone &&
    row.booking?.kind === 'form' && row.booking.url === bookingUrl &&
    row.verification?.status === 'approved' && row.verification?.contact === website &&
    row.verification?.booking?.url === website
      ? { ...row, coordinates: point } : row
  ))
}
