const cityCode = '68134', category = 'education', neighborhood = 'Зона Б-19'
const id = 'sofia-aura-music-stamboliyski175', phone = '+359887606886'
const website = 'https://aura-bg.com/'
const bookings = `${website}novina/zapisvane-za-novata-2026-2027-uchebna-godina`
const musicSchool = `${website}detska-muzikalna-shkola`
const contact = `${website}kontakti`
const address = 'София, ж.к. Зона Б-19, бул. Александър Стамболийски 175'
const checkedOn = '2026-11-27', validUntil = '2027-02-25'

export const AURA_B19_20261127_RECORDS = [{
  id, name: 'Детска музикална школа · НЧ „Аура“', cityCode, category, neighborhood, address, website, phone,
  locationKind: 'premises',
  // Named destination in the venue's contact map, not the map centre
  // or an assumed entrance in the Sofia municipal address data.
  coordinates: { latitude: 42.7000719, longitude: 23.2988115, method: 'first_party_coordinates', source: contact, sourceAddress: address },
  services: [{
    name: 'Индивидуални уроци по музика за деца · пиано, цигулка или пеене',
    category, appointmentModel: 'appointment',
    description: 'Месечната такса включва индивидуални занятия по избраната дисциплина и един групов час по солфеж и музикална теория седмично. Индивидуалният урок е 30 минути за по-малките деца и 45 минути за по-големите. Записването е по телефона през учебната година.',
    price: { amount: 90, currency: 'EUR', kind: 'fixed', unit: 'месечна такса', sourceUrl: musicSchool, checkedOn, validUntil },
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: bookings, excerpt: 'Записване в детската музикална школа за 2026/2027 г. по телефона в делнични дни между 9:00 и 20:00 ч.' },
  },
}]

export const AURA_B19_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, bookings, musicSchool, contact],
  inventoryIdentity: '2205d149a09c6608efedaf3c0e40713f78f37bcb68f9337b0c8bd3b0bc7a2f61',
  notes: 'Reviewed the live school-year enrolment notice and the direct branch phone first, then the full music-school tuition page and branch contact. EUR 90 is the published monthly fee, not a price per appointment or three services purchased together. The fee includes the group solfège and theory session; no separate price for private solfège is assumed. The age-dependent range is preserved in prose instead of claiming a fixed appointment duration. No call, form, booking, payment, calendar integration or production write.',
}]

export function applyAuraCohortLocationFollowupNov27(rows) {
  const boContact = 'https://groomingsofia.com/контакт/'
  const boAddress = 'София, кв. Бояна, ул. Маринковица 29'
  const boPhone = '+359888344474'
  return rows.map(row => {
    if (row.id !== 'sofia-bo-bella-grooming' || row.cityCode !== cityCode || row.category !== 'pets' ||
        row.locationKind !== 'premises' || row.neighborhood !== 'Бояна' || row.address !== boAddress ||
        row.coordinates !== null || row.website !== 'https://groomingsofia.com/' || row.phone !== boPhone ||
        row.booking?.kind !== 'phone' || row.booking?.phone !== boPhone || row.verification?.status !== 'approved' ||
        row.verification?.contact !== boContact || row.verification?.booking?.url !== boContact) return row
    return { ...row, coordinates: {
      latitude: 42.6580355, longitude: 23.2688201, method: 'first_party_coordinates',
      source: boContact, sourceAddress: boAddress,
    } }
  })
}
