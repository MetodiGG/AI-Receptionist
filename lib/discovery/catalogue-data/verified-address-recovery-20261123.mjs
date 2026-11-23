import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

// The operator confirms its current premises and booking phone. The municipal
// row identifies the exact building/unit, not a district centroid or entrance.
const checkedOn = '2026-11-23'
const reviewed = new Map([
  ['sofia-lumiere-beauty-club', {
    name: 'Lumière Beauty Club', category: 'nails', neighborhood: 'Надежда 2',
    website: 'https://www.lumierebeautyclub.bg/', phone: '+359899979791',
    address: 'София, Надежда 2, ул. Света Никола Нови 2А',
    correctedAddress: 'София, Надежда 2, ул. Свети Никола Нови 2А',
    addressId: '118408', latitude: 42.730781, longitude: 23.303096,
  }],
  ['sofia-ariel-beauty-lyulin3', {
    name: 'Ariel Beauty Studio', category: 'hair', neighborhood: 'Люлин 3',
    website: 'https://arielbeautystudio.eu/index.php', phone: '+359888808858',
    address: 'София, ж.к. Люлин 3, бул. Добринова скала 370, партер',
    correctedAddress: 'София, ж.к. Люлин 3, бул. Добринова скала, бл. 370, партер',
    addressId: '55596', latitude: 42.722214, longitude: 23.240986,
  }],
])

export function applyVerifiedAddressRecovery20261123(records) {
  return records.map(row => {
    const review = reviewed.get(row.id)
    if (!review || row.cityCode !== '68134' || row.locationKind !== 'premises' || row.coordinates !== null) return row
    const { correctedAddress, addressId, latitude, longitude, ...identity } = review
    if (!Object.entries(identity).every(([key, value]) => row[key] === value) ||
        row.booking?.kind !== 'phone' || row.booking.phone !== row.phone ||
        row.verification?.contact !== row.website || row.verification?.booking?.url !== row.website) return row
    return { ...row, address: correctedAddress, coordinates: {
      latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: correctedAddress, sourceCityCode: row.cityCode, sourceNeighborhood: row.neighborhood,
      sourceWebsite: row.website, checkedOn, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    } }
  })
}
