import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-salt-art-druzhba'
const website = 'https://saltart.bg/'
const address = 'София, ж.к. Дружба 2, бул. Проф. Цветан Лазаров 602'
const neighborhood = 'Дружба 2'
const booking = website + 'grafik-druzhba/'
const contact = website + 'kontakti-druzhba/'

// The owner calls the building 602 in its branch contact. Its destination
// matches the sole municipal block 602 point; other branches share the brand.
export function applySaltartDruzhbaBinding20261123(rows) {
  return rows.map(row => row.id === id && row.cityCode === '68134' && row.neighborhood === neighborhood &&
    row.address === address && row.coordinates === null && row.locationKind === 'premises' &&
    row.category === 'fitness' && row.website === website && row.phone === '+359888999913' &&
    row.booking?.kind === 'form' && row.booking.url === booking && row.verification?.status === 'approved' &&
    row.verification.contact === contact && row.verification.booking?.url === booking
    ? { ...row, coordinates: {
      latitude: 42.65782, longitude: 23.395274, source: OFFICIAL_SOFIA_SOURCE_URL,
      method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
      sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn: '2026-11-23',
      addressId: '121111', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } } : row)
}
