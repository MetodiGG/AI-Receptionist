const locations = new Map([
  ['sofia-via-dental-obelya', {
    neighborhood: 'Обеля 2', address: 'София, ж.к. Обеля 2, ул. Кривините, ДКЦ 30, кабинети 317 и 318',
    website: 'https://viadentalstudio.com/', contact: 'https://viadentalstudio.com/kontakti/', phone: '+359888557577',
    bookingKind: 'form', latitude: 42.7438417, longitude: 23.2764125, source: 'https://viadentalstudio.com/',
  }],
  ['sofia-stanimir-batovski-zona-b19', {
    neighborhood: 'Зона Б19', address: 'София, Зона Б19, бл. 15–16, вх. А',
    website: 'https://drbatovski.com/', contact: 'https://drbatovski.com/contact/', phone: '+359879962124',
    bookingKind: 'phone', latitude: 42.6969906, longitude: 23.2989607, source: 'https://drbatovski.com/contact/',
  }],
  ['sofia-dentica-levski-v', {
    neighborhood: 'Левски В', address: 'София, ж.к. Левски В, ул. Княгиня Тамара 56, срещу ДГ 92 Мечта – филиал',
    website: 'https://www.dentica-clinic.com/', contact: 'https://www.dentica-clinic.com/index.php/contact-us/', phone: '+359893440054',
    bookingKind: 'form', bookingUrl: 'https://superdoc.bg/klinika/dentica-dental-clinic',
    latitude: 42.7073649, longitude: 23.3852583, source: 'https://www.dentica-clinic.com/index.php/contact-us/',
  }],
])

export function applyDentalBranchPointsNov27(rows) {
  return rows.map(row => {
    const reviewed = locations.get(row.id)
    if (!reviewed || row.cityCode !== '68134' || row.neighborhood !== reviewed.neighborhood ||
        row.category !== 'other' || row.locationKind !== 'premises' || row.address !== reviewed.address ||
        row.coordinates !== null || row.website !== reviewed.website || row.phone !== reviewed.phone ||
        row.booking?.kind !== reviewed.bookingKind ||
        (reviewed.bookingKind === 'form' ? row.booking.url !== (reviewed.bookingUrl ?? reviewed.website) : row.booking.phone !== reviewed.phone) ||
        row.verification?.status !== 'approved' || row.verification?.contact !== reviewed.contact) return row
    return { ...row, coordinates: {
      latitude: reviewed.latitude, longitude: reviewed.longitude, source: reviewed.source,
      method: 'first_party_coordinates', sourceAddress: reviewed.address,
    } }
  })
}
