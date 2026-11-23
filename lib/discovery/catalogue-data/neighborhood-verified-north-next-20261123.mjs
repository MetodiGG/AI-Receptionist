import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', cityCode = '68134'
const trimId = 'sofia-avtotapicera-iliyantsi-balcho7'
const trimWebsite = 'https://avtotapicera.com/'
const trimContact = `${trimWebsite}kontakti/`
const trimCourses = `${trimWebsite}kursove/`
const trimPhone = '+359884462293'
const trimAddress = 'София, кв. Илиянци, ул. Балчо Нейков 7'
const trimNeighborhood = 'Илиянци'

function point(address, neighborhood, website, addressId, latitude, longitude) {
  return {
    latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  }
}

export const NORTH_NEXT_INTAKE_20261123_RECORDS = [{
  id: trimId, name: 'АвтотапицерЪ · Илиянци', cityCode, neighborhood: trimNeighborhood, address: trimAddress,
  locationKind: 'premises', category: 'detailing', website: trimWebsite, phone: trimPhone,
  coordinates: point(trimAddress, trimNeighborhood, trimWebsite, '98126', 42.748355, 23.315198),
  services: [{
    name: 'Претапициране на волан', category: 'detailing',
    description: 'Претапициране на волан с естествена или изкуствена кожа или алкантара. За материал, срок и цена се свържете с ателието.',
    appointmentModel: 'appointment',
  }],
  booking: { kind: 'phone', phone: trimPhone },
  verification: {
    status: 'approved', checkedOn, validUntil: '2026-12-23', contact: trimContact,
    booking: { url: trimContact, excerpt: 'Ателието публикува отделен контакт за заявки за претапициране и адрес на работилницата в кв. Илиянци.' },
  },
}]

export const NORTH_NEXT_INTAKE_20261123_REVIEWS = [{
  id: trimId, checkedOn, website: trimWebsite, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [trimContact, trimWebsite, trimCourses, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The workshop publishes a dedicated telephone intake for reupholstery and an exact Iliantsi address. The first-party service menu explicitly includes steering-wheel reupholstery. A phone enquiry is not an instant booking.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: trimContact, serviceUrls: [trimWebsite, trimCourses],
    notes: 'The workshop lists steering-wheel reupholstery on its homepage and directs enquiries to its dedicated contact. The displayed retail-item and course prices do not apply to that job. No workshop tariff or duration for steering-wheel reupholstery is published in the reviewed intake and service pages.',
  },
  inventoryIdentity: 'd2e4270d40c3985116369709eac3b6e6ba9e54bf3c01725a3b875859986a960e',
}]

const existing = new Map([
  ['sofia-lyudmil-kiskimov-lyulin7', {
    name: 'Д-р Людмил Кискимов · дентален кабинет', category: 'other', neighborhood: 'Люлин 7',
    address: 'София, ж.к. Люлин 7, бл. 731 Б, партер до входната врата',
    website: 'https://kiskimov.bg/', phone: '+359888377507',
    contact: 'https://kiskimov.bg/kontakti',
    booking: { kind: 'phone', phone: '+359888377507' }, bookingEvidence: 'https://kiskimov.bg/kontakti',
    addressId: '52238', latitude: 42.710097, longitude: 23.261567,
  }],
  ['sofia-radial2000-benkovski', {
    name: 'Радиал 2000 · Бенковски', category: 'auto_repair', neighborhood: 'Бенковски',
    address: 'София, Бенковски, ул. Лазар Михайлов 29',
    website: 'https://radial2000.com/', phone: '+359887424034',
    contact: 'https://radial2000.com/contact-us/',
    booking: { kind: 'form', url: 'https://radial2000.com/запази-си-час/' },
    bookingEvidence: 'https://radial2000.com/запази-си-час/',
    addressId: '58016', latitude: 42.734007, longitude: 23.343063,
  }],
])

// Address-only bindings; never update another branch or replace a non-null point.
export function applyNorthNextExistingCoordinates20261123(records) {
  return records.map(row => {
    const reviewed = existing.get(row.id)
    if (!reviewed || row.cityCode !== cityCode || row.locationKind !== 'premises' || row.coordinates !== null) return row
    const { contact, booking, bookingEvidence, addressId, latitude, longitude, ...identity } = reviewed
    if (!Object.entries(identity).every(([key, value]) => row[key] === value) ||
        !Object.entries(booking).every(([key, value]) => row.booking?.[key] === value) ||
        row.verification?.status !== 'approved' || row.verification.contact !== contact ||
        row.verification.booking?.url !== bookingEvidence) return row
    return { ...row, coordinates: point(row.address, row.neighborhood, row.website, addressId, latitude, longitude) }
  })
}
