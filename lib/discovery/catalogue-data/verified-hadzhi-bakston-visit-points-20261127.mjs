import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const uniWebsite = 'https://www.unichamps.bg/'
const uniPhone = '+359893291761'
const uniOldAddress = 'София, ж.к. „Хаджи Димитър“ 135А'
const uniAddress = 'София, ж.к. Хаджи Димитър, бл. 135, вх. А'
const uniNeighborhood = 'Хаджи Димитър'
const uniPoint = Object.freeze({
  latitude: 42.706035,
  longitude: 23.355380,
  method: 'verified_official_address',
  source: OFFICIAL_SOFIA_SOURCE_URL,
  sourceAddress: uniAddress,
  sourceCityCode: '68134',
  sourceNeighborhood: uniNeighborhood,
  sourceWebsite: uniWebsite,
  addressId: '50533',
  checkedOn: '2026-11-27',
  licence: 'CC-BY-4.0',
  attribution: OFFICIAL_SOFIA_ATTRIBUTION,
})

const tobbyWebsite = 'https://tobby.bg/'
const tobbyPhone = '+359894467070'
const tobbyAddress = 'София, ул. Белмекен 8'
const tobbyNeighborhood = 'Бъкстон'
const tobbyPreviousPoint = Object.freeze({
  latitude: 42.669243432355024,
  longitude: 23.269613362633972,
  source: OFFICIAL_SOFIA_SOURCE_URL,
  method: 'verified_official_address',
  sourceAddress: tobbyAddress,
  sourceCityCode: '68134',
  sourceNeighborhood: null,
  sourceWebsite: tobbyWebsite,
  checkedOn: '2026-11-13',
  addressId: '101197',
  licence: 'CC-BY-4.0',
  attribution: OFFICIAL_SOFIA_ATTRIBUTION,
})

export function applyVerifiedHadzhiBakstonVisitPoints20261127(rows) {
  return rows.map(row => {
    if (row.cityCode !== '68134' || row.locationKind !== 'premises' ||
        row.neighborhood !== null || row.verification?.status !== 'approved') return row

    // The operator's office and phone agree across the two brand sites.
    // Its terms disambiguate 135А as block 135, entrance А.
    if (row.id === 'sofia-university-champions-hadzhi-dimitar135a' &&
        row.name === 'University Champions · Данбъл София' &&
        row.category === 'consulting' && row.coordinates === null &&
        row.address === uniOldAddress && row.website === uniWebsite && row.phone === uniPhone &&
        row.booking?.kind === 'phone' && row.booking.phone === uniPhone &&
        row.verification.contact === uniWebsite + 'kontakti/' &&
        row.verification.booking?.url === uniWebsite + 'konsultacia-za-universitet-v-chujbina/') {
      return { ...row, neighborhood: uniNeighborhood, address: uniAddress, coordinates: uniPoint }
    }

    // Rebind only the unchanged full-precision civic point. A newer point
    // or a changed address/provider may not inherit this neighborhood receipt.
    if (row.id === 'sofia-tobbys-grooming' && row.name === 'Tobby’s Grooming House' &&
        row.category === 'pets' && row.address === tobbyAddress &&
        row.website === tobbyWebsite && row.phone === tobbyPhone &&
        row.booking?.kind === 'phone' && row.booking.phone === tobbyPhone &&
        row.verification.contact === tobbyWebsite &&
        row.verification.booking?.url === tobbyWebsite &&
        Object.entries(tobbyPreviousPoint).every(([key, value]) => row.coordinates?.[key] === value)) {
      return { ...row, neighborhood: tobbyNeighborhood, coordinates: {
        ...row.coordinates, sourceNeighborhood: tobbyNeighborhood, checkedOn: '2026-11-27',
      } }
    }
    return row
  })
}
