// Only review the noted current public branch identities. Default to the
// original listing if any of the identity or existing location facts changes.
export const METRO_CITY_AND_LEA_LOCATION_REVIEWS = Object.freeze([
  {
    id: 'sofia-head-hunters-mladost', category: 'barber', phone: '+359884541600',
    address: 'София, бул. Александър Малинов 51, Metro City Business Center',
    website: 'https://head-hunters.net/', contact: 'https://head-hunters.net/kontakti',
    booking: 'https://head-hunters.net/rezervatsia', oldNeighborhood: 'Младост', neighborhood: 'Младост 3',
    existing: { source: 'https://www.openstreetmap.org/way/217922374', latitude: 42.6458737, longitude: 23.3764025 },
  },
  {
    id: 'sofia-music-box-mladost', category: 'education', phone: '+359886661280',
    address: 'София, бул. Александър Малинов 51',
    website: 'https://www.music-box.bg/', contact: 'https://www.music-box.bg/контакти',
    bookingEvidence: 'https://www.music-box.bg/userfiles/files/Fees.pdf', oldNeighborhood: 'Младост', neighborhood: 'Младост 3',
    point: [42.6459484, 23.3761393],
  },
  {
    id: 'sofia-x-academy-mladost', category: 'education', phone: '+359894370203',
    address: 'София, бул. Александър Малинов 51',
    website: 'https://x-academy.bg/', contact: 'https://x-academy.bg/contact-us',
    booking: 'https://x-academy.bg/contact-us', oldNeighborhood: 'Младост', neighborhood: 'Младост 3',
  },
  {
    id: 'sofia-intelia-bel-metro-city', category: 'education', phone: '+359876190993',
    address: 'София, бул. Александър Малинов 51, ТЦ Метро Сити, ет. 1',
    website: 'https://intelia-bg.com/', contact: 'https://intelia-bg.com/',
    oldNeighborhood: 'Младост', neighborhood: 'Младост 3', point: [42.646065, 23.376333],
  },
  {
    id: 'sofia-venera-music-mladost3', category: 'education', phone: '+359883385080',
    address: 'София, кв. Младост 3, бул. Александър Малинов 51, Метро Сити, ет. -1',
    website: 'https://www.veneramusic.bg/', contact: 'https://www.veneramusic.bg/kontakti',
    booking: 'https://www.veneramusic.bg/zapishi-urok-forma',
    oldNeighborhood: 'Младост 3', neighborhood: 'Младост 3', point: [42.6460855, 23.3760209],
  },
  {
    id: 'sofia-lea-dental-lyulin10', category: 'other', phone: '+359876335577',
    address: 'София, ж.к. Люлин 10, бл. 160',
    website: 'https://leadental.bg/', contact: 'https://leadental.bg/contact-us/',
    oldNeighborhood: 'Люлин 10', neighborhood: 'Люлин 10',
    point: [42.7138885, 23.266288], pointSource: 'https://leadental.bg/',
  },
])

const reviews = new Map(METRO_CITY_AND_LEA_LOCATION_REVIEWS.map(review => [review.id, review]))

export function applyMetroCityAndLeaLocations20261127(rows) {
  return rows.map(row => {
    const review = reviews.get(row.id)
    if (!review || row.cityCode !== '68134' || row.locationKind !== 'premises' ||
        row.neighborhood !== review.oldNeighborhood || row.category !== review.category ||
        row.address !== review.address || row.phone !== review.phone || row.website !== review.website ||
        row.verification?.status !== 'approved' || row.verification.contact !== review.contact ||
        row.verification.booking?.url !== (review.bookingEvidence ?? review.booking ?? review.contact)) return row
    if (review.booking ? row.booking?.kind !== 'form' || row.booking.url !== review.booking
      : row.booking?.kind !== 'phone' || row.booking.phone !== review.phone) return row
    if (review.existing ? row.coordinates?.method !== 'verified_address_geocode' ||
      row.coordinates.sourceAddress !== row.address ||
      !Object.entries(review.existing).every(([key,value]) => row.coordinates[key] === value)
      : row.coordinates !== null) return row
    const coordinates = review.point ? {
      latitude: review.point[0], longitude: review.point[1],
      source: review.pointSource ?? review.contact, method: 'first_party_coordinates', sourceAddress: row.address,
    } : row.coordinates
    return { ...row, neighborhood: review.neighborhood, coordinates }
  })
}
