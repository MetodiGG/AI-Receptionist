// Three existing null-point premises, independently source-reviewed 2026-11-22.
// Municipal pairs identify exact postal addresses, not surveyed entrances.
// DIVA's owner marker names the actual BG Shkolo hall, not its head office.
// No CSV, geocoder, provider request or price-review refresh runs in the product.
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../official-sofia-address-source.mjs'

const shining = Object.freeze({
  id: 'sofia-shining-polishing-auto', name: 'Shining Polishing AUTO',
  cityCode: '68134', neighborhood: 'НПЗ Искър', locationKind: 'premises',
  address: 'София, НПЗ Искър, ул. Мюнхен 14',
  website: 'https://polishingauto.bg/', phone: '+359893941418', coordinates: null,
})
const vasVal = Object.freeze({
  id: 'sofia-vas-val-auto-malashevtsi-lavandula53', name: 'Вас Вал Авто · Малашевци',
  cityCode: '68134', neighborhood: 'Малашевци', locationKind: 'premises',
  address: 'София, кв. Малашевци, ул. Лавандула 53',
  website: 'https://vasvalauto.com/', phone: '+359887471956', coordinates: null,
})
const diva = Object.freeze({
  id: 'sofia-diva-zone-mladost2-bg-shkolo', name: 'DIVA ZONE · Младост 2',
  cityCode: '68134', neighborhood: 'Младост 2', locationKind: 'premises',
  address: 'София, ж.к. Младост 2, ул. Генерал-майор Васил Делов 10, БГ Школо',
  website: 'https://www.divazone.bg/', phone: '+359886996868', coordinates: null,
})

function officialPoint(expected, latitude, longitude, addressId) {
  return Object.freeze({
    latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: expected.address, sourceCityCode: expected.cityCode,
    sourceNeighborhood: expected.neighborhood, sourceWebsite: expected.website,
    checkedOn: '2026-11-22', addressId, licence: 'CC-BY-4.0',
    attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  })
}

// Precompute identity fields and immutable point objects once, outside the row loop.
const recoveries = new Map([
  [shining, officialPoint(shining, 42.659126, 23.412371, '96395')],
  [vasVal, officialPoint(vasVal, 42.718868, 23.353062, '30118')],
  [diva, Object.freeze({
    latitude: 42.6360833, longitude: 23.3650101,
    source: 'https://www.divazone.bg/zali/', method: 'first_party_coordinates',
    sourceAddress: diva.address,
  })],
].map(([expected, coordinates]) => [expected.id, { fields: Object.entries(expected), coordinates }]))

export function applyReviewedNearbyAddressPoints20261122(records) {
  return records.map(row => {
    const recovery = recoveries.get(row.id)
    return recovery && recovery.fields.every(([field, value]) => row[field] === value)
      ? { ...row, coordinates: recovery.coordinates }
      : row
  })
}
