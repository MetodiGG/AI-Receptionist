import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

// Address-only corrections. Match the exact existing premises and phone
// action before altering discovery; keep all tariffs and listing expiry intact.
const reviewed = [
  {
    id: 'sofia-po-manyashkiya-detailing', name: 'По-Маняшкия Детайлинг', category: 'detailing',
    website: 'https://po-manyashkiya-detailing.com/', phone: '+359877006656',
    address: 'София, ул. Царибродска 107', from: null, to: 'Зона Б-19',
    point: ['47458', 42.70063093487165, 23.29953644773413], existingPoint: true,
  },
  {
    id: 'sofia-georgis-garage-sofia', name: 'Georgi’s Garage · София', category: 'detailing',
    website: 'https://www.georgisgarage.com/', phone: '+359884192026',
    address: 'София, Студентски град, ул. Рашо Рашев 4', from: 'Студентски град', to: 'Студентски град',
    correctedAddress: 'София, Студентски град, ул. Проф. Рашо Рашев 4',
    point: ['98477', 42.649666, 23.342937],
  },
  {
    id: 'sofia-pulse-car-wash-mladost', name: 'Pulse Car Wash · Mladost', category: 'car_wash',
    website: 'https://pulsefit.bg/klubove/pulse-mladost/', phone: '+359878423515',
    address: 'София, ж.к. Младост, Околовръстен път 251А', from: 'Младост', to: 'Младост 4',
    correctedAddress: 'София, ж.к. Младост 4, Околовръстен път 251А',
    bookingEvidence: 'https://pulsefit.bg/pulse-car-wash/',
    point: ['104368', 42.624312, 23.3728],
  },
  {
    id: 'sofia-lux-mbal-sveta-sofia-carwash', name: 'Автомивка LUX · МБАЛ Света София', category: 'car_wash',
    website: 'https://www.mbal-sofia.com/', phone: '+359894405887',
    address: 'София, бул. България 104, Корпус 2, ниво -1', from: null, to: 'Манастирски ливади',
    contact: 'https://www.mbal-sofia.com/contacts/', bookingEvidence: 'https://www.mbal-sofia.com/services/',
    retainedGeocode: Object.freeze({ latitude: 42.6595902, longitude: 23.2843285,
      source: 'https://www.openstreetmap.org/way/1551254006', method: 'verified_address_geocode',
      sourceAddress: 'София, бул. България 104, Корпус 2, ниво -1', checkedOn: '2026-11-06',
      licence: 'ODbL-1.0', attribution: '© OpenStreetMap contributors' }),
  },
]

function boundPoint([addressId, latitude, longitude], address, neighborhood, website, checkedOn) {
  return Object.freeze({ latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION })
}

const byId = new Map(reviewed.map(({ id, name, category, website, address, phone, from, to, point, existingPoint, retainedGeocode,
  correctedAddress = address, bookingEvidence = website, contact = website }) => [id, {
  identity: Object.entries({ name, cityCode: '68134', category, website, address, phone, neighborhood: from, locationKind: 'premises' }),
  contact, bookingEvidence, next: { address: correctedAddress, neighborhood: to,
    ...(retainedGeocode ? {} : { coordinates: boundPoint(point, correctedAddress, to, website, existingPoint ? '2026-11-13' : '2026-11-22') }) },
  previousPoint: retainedGeocode ? Object.entries(retainedGeocode) : existingPoint ? Object.entries(boundPoint(point, address, from, website, '2026-11-13')) : null,
}]))

export function applyReviewedAutoAreaRecovery20261123(records) {
  return records.map(row => {
    const candidate = byId.get(row.id)
    if (!candidate || !candidate.identity.every(([key, value]) => row[key] === value) ||
        row.booking?.kind !== 'phone' || row.booking.phone !== row.phone ||
        row.verification?.booking?.url !== candidate.bookingEvidence || row.verification.contact !== candidate.contact) return row
    const { previousPoint, next } = candidate
    if (previousPoint === null ? row.coordinates !== null : !row.coordinates ||
        Object.keys(row.coordinates).length !== previousPoint.length || !previousPoint.every(([key, value]) => row.coordinates[key] === value)) return row
    return { ...row, ...next }
  })
}
