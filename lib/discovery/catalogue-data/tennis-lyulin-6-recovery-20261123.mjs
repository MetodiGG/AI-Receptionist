// Location-only review: the venue and owner coordinates already existed.
// The municipal locality point was used only to corroborate their position.
const reviewed = {
  id: 'sofia-tennis-lyulin-6', name: 'Тенис клуб Люлин 6',
  cityCode: '68134', neighborhood: 'Люлин', address: 'София, местност Друмо 1', locationKind: 'premises',
  coordinates: {
    latitude: 42.707625017444485, longitude: 23.256896419547754,
    source: 'https://tennislulin.com/contact/', method: 'first_party_coordinates',
  },
  category: 'fitness', website: 'https://tennislulin.com/', phone: '+359876663676',
  services: [{ name: 'Тенис корт с резервация', category: 'fitness', appointmentModel: 'group_reservation' }],
  booking: { kind: 'phone', phone: '+359876663676' },
  verification: {
    status: 'approved', checkedOn: '2026-11-06', validUntil: '2027-02-04',
    booking: { url: 'https://tennislulin.com/contact/', excerpt: 'Резервации' },
    contact: 'https://tennislulin.com/contact/',
  },
}

// Match the exact reviewed input, independent of its property order. Other
// venues and rows changed after this review pass through untouched.
function matchesReviewedRecord(value, expected) {
  if (!expected || typeof expected !== 'object') return Object.is(value, expected)
  if (!value || typeof value !== 'object' || Array.isArray(value) !== Array.isArray(expected)) return false
  if (Array.isArray(expected) && value.length !== expected.length) return false
  const keys = Object.keys(expected)
  return Object.keys(value).length === keys.length &&
    keys.every(key => Object.hasOwn(value, key) && matchesReviewedRecord(value[key], expected[key]))
}

export function applyReviewedTennisLyulin6Recovery20261123(records) {
  return records.map(row => {
    if (row.id !== reviewed.id || !matchesReviewedRecord(row, reviewed)) return row
    return {
      ...row, neighborhood: 'Люлин 6',
      coordinates: { ...row.coordinates, sourceAddress: row.address },
    }
  })
}
