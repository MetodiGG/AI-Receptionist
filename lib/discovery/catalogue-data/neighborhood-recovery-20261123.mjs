import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../official-sofia-address-source.mjs'

// Matching owner and explicit quarter sources, checked 2026-11-23.
// Rebind the existing postal point to the verified quarter. This does not
// geocode the entrance or refresh the existing listing/service review.
const reviewed = [{
  premises: {
    id: 'sofia-e-dental-clinic', name: 'E Dental Clinic', cityCode: '68134',
    address: 'София, ул. Тодор Йончев 15', website: 'https://e-dentalclinic.com/',
    phone: '+359885431153', locationKind: 'premises', neighborhood: null,
  },
  contact: 'https://e-dentalclinic.com/kontakti/',
  bookingUrl: 'https://superdoc.bg/klinika/e-dental-clinik',
  neighborhood: 'Малинова долина',
  point: { latitude: 42.64032863332257, longitude: 23.344093580266776, addressId: '122446' },
}, {
  premises: {
    id: 'sofia-asd-autoservice-lihachov33', name: 'ASD Autoservice', cityCode: '68134',
    address: 'София, ул. Акад. Дмитрий Лихачов 33', website: 'https://asd-autoservice.com/',
    phone: '+359886881667', locationKind: 'premises', neighborhood: null,
  },
  contact: 'https://asd-autoservice.com/contacts/',
  bookingUrl: 'https://asd-autoservice.com/',
  neighborhood: 'Обеля 2',
  point: { latitude: 42.743112017936646, longitude: 23.276454884025608, addressId: '93209' },
}]

const byId = new Map(reviewed.map(({ premises, contact, bookingUrl, neighborhood, point }) => [premises.id, {
  premises: Object.entries(premises), contact, bookingUrl, neighborhood,
  previousPoint: Object.entries({
    ...point, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: premises.address, sourceCityCode: premises.cityCode,
    sourceNeighborhood: premises.neighborhood, sourceWebsite: premises.website,
    checkedOn: '2026-11-13', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  }),
}]))

export function applyReviewedNeighborhoodRecovery20261123(records) {
  return records.map(row => {
    const review = byId.get(row.id)
    if (!review || !review.premises.every(([key, value]) => row[key] === value) ||
      row.verification?.contact !== review.contact || row.booking?.kind !== 'form' ||
      row.booking.url !== review.bookingUrl) return row
    const point = row.coordinates
    if (!point || Object.keys(point).length !== review.previousPoint.length ||
      !review.previousPoint.every(([key, value]) => point[key] === value)) return row
    return { ...row, neighborhood: review.neighborhood, coordinates: { ...point, sourceNeighborhood: review.neighborhood } }
  })
}
