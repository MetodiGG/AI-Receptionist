import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', cityCode = '68134', validUntil = '2026-12-23'
const balletId = 'sofia-terpsihora-lyulin5-504-1'
const ballet = 'https://caterpsihora.com/'
const balletService = `${ballet}klasichesko_napravlenie/`
const balletContact = `${ballet}kontakti/`
const schools = 'https://www.sofia.bg/en/municipality-schools-lulin'

function venue({ id, name, neighborhood, address, website, phone, addressId, latitude, longitude, contact, excerpt, service }) {
  return {
    id, name, cityCode, neighborhood, address, locationKind: 'premises', category: 'fitness', website, phone,
    coordinates: {
      latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood,
      sourceWebsite: website, checkedOn, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    },
    services: [{ ...service, category: 'fitness' }],
    booking: { kind: 'phone', phone },
    verification: { status: 'approved', checkedOn, validUntil, contact, booking: { url: contact, excerpt } },
  }
}

export const NORTH_GROWTH_INTAKE_20261123_RECORDS = [
  venue({
    id: balletId, name: 'КИ „Терпсихора“ · Люлин 5', neighborhood: 'Люлин 5',
    address: 'София, ж.к. Люлин 5, ул. 504 № 1, 97 СУ „Братя Миладинови“',
    website: ballet, phone: '+359876190817', contact: balletContact,
    addressId: '110122', latitude: 42.71338, longitude: 23.241802,
    excerpt: 'Бутонът „Запази час“ води до телефон за записване и въпроси за групите. Графикът посочва група в 97 СУ.',
    service: {
      name: 'Класически балет за деца от 6 до 8 години',
      description: 'Групово занимание, ниво 2, в залата на 97 СУ. Клубът потвърждава място в групата и таксата при записване.',
      appointmentModel: 'group_reservation',
      durationMin: 45, durationSourceUrl: balletService, durationCheckedOn: checkedOn,
    },
  }),
]

export const NORTH_GROWTH_INTAKE_20261123_REVIEWS = [{
  id: balletId, checkedOn, website: ballet, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [balletContact, balletService, ballet, schools, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The owner’s actual booking CTA goes to explicit telephone enrolment; the same owner’s current classical programme names 97 SU and the 45-minute sessions for the 6–8 age group. The Sofia school directory independently confirms venue, street and quarter.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: balletContact, serviceUrls: [balletService, ballet],
    notes: 'No tariff displayed for the named 97 SU group in the current owner schedule or telephone enrolment pages. An older event listing for different schools is not evidence of the present branch tariff. No online enrolment or class availability claimed.',
  },
  inventoryIdentity: '7855baa48bc50609f06332c1dc2acdea9cf441fb549127c5ac4352d68aa7ffc8',
}]
