import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-art-masters-band-nadezhda1-172'
const address = 'София, ж.к. Надежда 1, бл. 172, вх. Г'
const neighborhood = 'Надежда 1'
const website = 'https://amb2016.wixsite.com/music-school'
const phone = '+359888357317'
const contact = website + '/blank-citr'
const appointmentEvidence = 'https://artmastersband12.wixsite.com/amb12/----c15bq'

const coordinates = Object.freeze({
  latitude: 42.727160,
  longitude: 23.301023,
  method: 'verified_official_address',
  source: OFFICIAL_SOFIA_SOURCE_URL,
  sourceAddress: address,
  sourceCityCode: '68134',
  sourceNeighborhood: neighborhood,
  sourceWebsite: website,
  addressId: '56744',
  checkedOn: '2026-11-27',
  licence: 'CC-BY-4.0',
  attribution: OFFICIAL_SOFIA_ATTRIBUTION,
})

// The school publishes entrance Г for its Надежда 1 lesson location.
// Do not copy this point to a different entrance, school branch, or newer record.
export function applyVerifiedNadezhda1ArtMastersPoint20261127(rows) {
  return rows.map(row => (
    row.id === id && row.name === 'Музикална школа Арт Мастърс Бенд · Надежда 1' &&
    row.cityCode === '68134' && row.neighborhood === neighborhood && row.category === 'education' &&
    row.locationKind === 'premises' && row.coordinates === null &&
    row.address === address && row.website === website && row.phone === phone &&
    row.booking?.kind === 'phone' && row.booking.phone === phone &&
    row.verification?.status === 'approved' && row.verification.contact === contact &&
    row.verification.booking?.url === appointmentEvidence
      ? { ...row, coordinates } : row
  ))
}
