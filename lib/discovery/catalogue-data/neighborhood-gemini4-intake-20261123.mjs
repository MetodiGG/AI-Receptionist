import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-gemini4-republika-729-22'
const website = 'https://www.gemini4.com/'
const contact = `${website}контакти/`
const repair = `${website}ремонт-на-автоматична-трансмисия/`
const workshop = `${website}работно-хале-за-сваляне-и-качване-на-ас/`
const terms = `${website}общи-условия-за-ремонт-на-автомобил/`
const promotions = `${website}промоции/`
const neighborhood = 'Република'
const address = 'София, Република, ул. 729 № 22'
const phone = '+359888147313'

export const GEMINI4_INTAKE_20261123_RECORDS = [{
  id, name: 'Автосервиз Джемини 4', cityCode: '68134', neighborhood, address,
  locationKind: 'premises', category: 'auto_repair', website, phone,
  coordinates: {
    latitude: 42.737442, longitude: 23.239042, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '58809',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Ремонт на автоматична скоростна кутия', category: 'auto_repair',
    description: 'Частичен или основен ремонт на автоматична скоростна кутия, включително демонтаж и монтаж при необходимост. Първоначалната оценка е ориентировъчна; точната оферта се уточнява след преглед.',
    appointmentModel: 'appointment',
  }],
  openingHours: {
    days: [1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '18:00' }] })),
    sourceUrl: contact, checkedOn,
  },
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: contact, excerpt: 'За ремонт на автоматична скоростна кутия сервизът на ул. 729 № 22 посочва отделен телефон. Часът и офертата се уточняват със сервиза.' },
  },
}]

export const GEMINI4_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, repair, workshop, terms, promotions, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Followed the owner service contact route to its phone specifically for automatic-transmission repair. The owner names the physical Republika workshop at No. 22 and shows partial and complete repair plus on-site removal and reinstallation. The catalog does not infer a branch for general maintenance or technical inspections, or claim confirmed online availability.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: contact, serviceUrls: [repair, workshop, terms, promotions],
    notes: 'The owner phone instructions, transmission repair page, removal and installation facility page, repair terms and promotions were reviewed. There is no numeric rate or duration for automatic-transmission repair. The initial estimate is indicative and exact terms are agreed after inspection; the unrelated vehicle-storage fee is not a repair rate and no promotion is active.',
  },
  inventoryIdentity: '43e3aabfc831102ea421d6b2a55b2444537f16cd4548207e2f8e50679c8e624d',
}]
