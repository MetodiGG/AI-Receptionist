import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-abv-academy-reduta-velcho-atanasov53'
const cityCode = '68134', neighborhood = 'Редута', category = 'education'
const address = 'София, кв. Редута, ул. Велчо Атанасов 53, в зала StemY'
const website = 'https://abvacademy.com/', phone = '+359882035343'
const contact = 'https://abvacademy.com/contacts/'
const branchBooking = 'https://abvacademy.com/robo-schedule-geomilev/'
const course = 'https://abvacademy.com/matematika-2/'
const venue = 'https://www.stem-y.com/bg/contacts'
const checkedOn = '2026-11-27', validUntil = '2026-12-18'

export const VERIFIED_REDUTA_ABV_20261127_RECORDS = [{
  id, name: 'АБВ Академия · Редута', cityCode, neighborhood, address, category, website, phone,
  locationKind: 'premises',
  coordinates: {
    latitude: 42.689307, longitude: 23.358176, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '96434', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Състезателна математика · 1.–4. клас', category,
    description: 'Присъствено групово занятие с логически и състезателни задачи. Възможни са включване през учебната година и еднократен урок с предварително записване.',
    appointmentModel: 'group_reservation', durationMin: 90, durationSourceUrl: course, durationCheckedOn: checkedOn,
  }],
  booking: { kind: 'phone', phone },
  verification: { status: 'approved', checkedOn, validUntil, contact, booking: {
    url: branchBooking,
    excerpt: 'Академията посочва телефон за записване за състезателна математика в залата на ул. Велчо Атанасов 53.',
  } },
}]

export const VERIFIED_REDUTA_ABV_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, branchBooking, course, venue, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The current 2026–27 competition maths course page for grades 1–4 links its Velcho Atanasov 53 hall to the exact branch contact and explicitly allows joining during the year, including a separately registered single lesson. The branch publishes +359882035343 for registrations; the contacts page corroborates the location and the course and contacts pages share info@abvacademy.com. The school-wide telephone is a separate number, not the Reduta booking route. Host StemY independently confirms the same premises. Official Sofia address row 96434 supplies the civic building point, not a glass door, classroom or entrance inside the building.',
  inventoryIdentity: '21ef50ecf8aceb78fade73443187fa7672dd4ebcd6598b7dad7a6c33f5fe4627',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: branchBooking, serviceUrls: [course, branchBooking],
    notes: 'The active course and branch enrolment pages do not publish an exact fee for the single lesson or full course. The provider states that payment instructions follow registration. Discounts and fees for unrelated activities are not a tariff for this service.',
  },
}]
