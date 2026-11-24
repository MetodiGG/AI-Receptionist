import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-active-dental-mladost2-block295'
const neighborhood = 'Младост 2'
const address = 'София, ж.к. Младост 2, бл. 295, вх. 2, партер'
const website = 'https://new.activedental.bg/'
const book = new URL('book-appointment/', website).href
const contact = new URL('contact/', website).href
const dentalHealth = new URL('dentalno-zdrave/', website).href
const aesthetics = new URL('estetichna-stomatologia/', website).href
const implants = new URL('implantologia/', website).href
const orthodontics = new URL('ortodontia/', website).href
const officialRegister = 'https://iamn.bg/wp-content/uploads/registers/22_REGISTER_LZ_dejstvashti.pdf'
const phone = '+359876300990'

export const PRIORITY_NEXT_EAST_20261123_RECORDS = [{
  id, name: 'Дентална практика „Active“', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.644243, longitude: 23.366363,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address', sourceAddress: address,
    sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '112843', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'other', website, phone,
  services: [
    { name: 'Почистване на зъбен камък', category: 'other', appointmentModel: 'appointment' },
    { name: 'Лечение на кариес', category: 'other', appointmentModel: 'appointment' },
  ],
  openingHours: {
    days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: weekday <= 5 ? [{ open: '09:00', close: '18:00' }] : [] })),
    sourceUrl: contact, checkedOn,
  },
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: dentalHealth, excerpt: 'Страницата „Дентално здраве“ кани пациентите да се свържат за час и води до контактите на кабинета.' },
  },
}]

export const PRIORITY_NEXT_EAST_20261123_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, book, contact, dentalHealth, aesthetics, implants, orthodontics, officialRegister, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Followed the own Book entry; it provides the publication phone and does not expose a usable online calendar or service quote. The first-party Dental Health page explicitly invites patients to arrange an appointment and links to the business Contact with that same published phone. It names scaling and caries treatment. The IAmN register record 2215112671 corroborates dental practice, quarter, block and entrance, giving office 4; the operator publishes ground-floor instructions and the booking number. The official row locates this entrance, not the interior office. No call, booking, form, patient data, testimonials or images were copied.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: dentalHealth,
    serviceUrls: [book, contact, dentalHealth, aesthetics, implants, orthodontics],
    notes: 'The current first-party Book page, contact and all four linked sections of the service menu respond normally and provide no public numeric tariffs. The dental-health section names both imported services without a fee; no linked prices page or price units are exposed by the public navigation. No numerical amounts, fixed durations, health claims, insurance or availability were inferred.',
  },
  inventoryIdentity: '559ff26348e451a0611ebf613978f6be453d42a4fccd24324a15b3c47b20328d',
}]
