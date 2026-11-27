const id = 'sofia-neli-slavova-mladost-3', cityCode = '68134', neighborhood = 'Младост 3'
const address = 'София, ж.к. Младост 3, бул. Александър Малинов 51, Метро Сити ТБЦ, ет. 1'
const website = 'https://nellyslavova.bg/', contact = website + 'contact/', phone = '+359883399200'

export function applyNeliSlavovaBranchPointNov27(rows) {
  return rows.map(row => {
    if (row.id !== id || row.cityCode !== cityCode || row.neighborhood !== neighborhood ||
        row.category !== 'other' || row.locationKind !== 'premises' || row.address !== address ||
        row.coordinates !== null || row.website !== website || row.phone !== phone ||
        row.booking?.kind !== 'phone' || row.booking?.phone !== phone ||
        row.verification?.status !== 'approved' || row.verification?.contact !== contact ||
        row.verification?.booking?.url !== website + 'faq/') return row
    return { ...row, coordinates: {
      latitude: 42.6461116, longitude: 23.3763546, source: contact,
      method: 'first_party_coordinates', sourceAddress: address,
    } }
  })
}
