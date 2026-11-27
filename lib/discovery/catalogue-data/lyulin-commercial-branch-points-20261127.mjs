const reviewedPoints = new Map([
  ['sofia-fixa-evropa29', {
    neighborhood: 'Люлин 10', address: 'София, Люлин 10, бул. Европа 29', category: 'auto_repair',
    website: 'https://fixa.bg/', contact: 'https://fixa.bg/kontakti/', phone: '+359884065605',
    latitude: 42.7198337, longitude: 23.2744038,
  }],
  ['sofia-gr-pilates', {
    neighborhood: 'Люлин 9', address: 'София, ж.к. Люлин 9, ул. Тодор Влайков 27', category: 'fitness',
    website: 'https://gr-pilates.com/', contact: 'https://gr-pilates.com/', phone: '+359889332309',
    latitude: 42.7224129, longitude: 23.2664624,
  }],
])

export function applyLyulinCommercialBranchPoints20261127(rows) {
  return rows.map(row => {
    const review = reviewedPoints.get(row.id)
    if (!review || row.cityCode !== '68134' || row.locationKind !== 'premises' ||
        row.neighborhood !== review.neighborhood || row.address !== review.address ||
        row.coordinates !== null || row.category !== review.category || row.website !== review.website ||
        row.phone !== review.phone || row.booking?.kind !== 'phone' || row.booking.phone !== review.phone ||
        row.verification?.status !== 'approved' || row.verification?.contact !== review.contact ||
        row.verification?.booking?.url !== review.contact) return row
    return { ...row, coordinates: {
      latitude: review.latitude, longitude: review.longitude, source: review.contact,
      method: 'first_party_coordinates', sourceAddress: review.address,
    } }
  })
}
