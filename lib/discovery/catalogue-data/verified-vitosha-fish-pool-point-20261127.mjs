const id = 'sofia-malkite-ribki-kiril-buyukliyski30'
const address = 'София, Витоша, ул. Кирил Буюклийски 30'
const website = 'https://malkiteribki.com/'
const contact = `${website}kontakti/`
const booking = `${website}zapisvane-detza/`

// Owner contact links the named customer facility in two places. Use that
// selected entity's coordinates, not the viewport or an apartment entrance.
const coordinates = Object.freeze({
  latitude: 42.6460678,
  longitude: 23.3267542,
  source: contact,
  method: 'first_party_coordinates',
  sourceAddress: address,
})

export function applyVerifiedVitoshaFishPoolPoint20261127(rows) {
  return rows.map(row => (
    row.id === id && row.name === 'Малките рибки · плуване за деца' &&
    row.cityCode === '68134' && row.neighborhood === 'Витоша' && row.category === 'fitness' &&
    row.locationKind === 'premises' && row.coordinates === null && row.address === address &&
    row.website === website && row.phone === '+359889357669' &&
    row.booking?.kind === 'form' && row.booking.url === booking &&
    row.verification?.status === 'approved' && row.verification.contact === contact &&
    row.verification.booking?.url === booking && row.verification.checkedOn === '2026-11-13' &&
    row.verification.validUntil === '2027-02-11'
      ? { ...row, coordinates } : row
  ))
}
