// Individually reviewed stationary detailer in a previously empty coverage cell.
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../official-sofia-address-source.mjs'

// Source gates use UTC; this review was completed on 23 Nov in Sofia (22 Nov UTC).
const checkedOn = '2026-11-22', validUntil = '2026-12-23'
const id = 'sofia-mline-auto-detailing-gorublyane-pionerska2'
const website = 'https://mlineautodetailing.com/'
const contact = `${website}contact/`
const service = `${website}services/interiorno-pochistvane/`
const phone = '+359898515911'
const cityCode = '68134'
const neighborhood = 'Горубляне'
const address = 'София, кв. Горубляне, ул. Пионерска 2'

export const AUTO_INTAKE_20261123_RECORDS = [{
  id, name: 'M-Line Auto Detailing', cityCode, neighborhood, address, website, locationKind: 'premises',
  coordinates: {
    latitude: 42.631683, longitude: 23.40813, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: cityCode,
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '32182',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'detailing', phone,
  services: [{
    name: 'Интериорен детайлинг', category: 'detailing', appointmentModel: 'appointment',
    description: 'Цялостно почистване на автомобилния интериор с пране на текстила. Крайната цена зависи от размера на автомобила и степента на замърсяване; озонирането се заплаща отделно.',
    price: { amount: 190, currency: 'EUR', kind: 'from', sourceUrl: service, checkedOn, validUntil },
  }],
  openingHours: {
    days: [
      ...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '19:00' }] })),
      { weekday: 6, periods: [{ open: '10:00', close: '18:00' }] },
      { weekday: 7, periods: [] },
    ],
    sourceUrl: contact, checkedOn,
  },
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: service, excerpt: 'Страницата за интериорния детайлинг изрично приканва да се запази час по телефона на студиото: +359 898 515 911.' },
  },
}]

export const AUTO_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, `${website}services/`, service, `${website}services/pastirane-i-polirane/`,
    `${website}services/keramichni-pokritiya/`, `${website}privacy-policy/`],
  notes: 'The operator homepage and specifically the booked interior service both invite phone appointments. Owner contact confirms the same direct number and site; in-person assessments are strictly by appointment. The current canonical interior service publishes EUR190 from, with the final figure set by size and soiling. Textile washing is included, and ozonation at a separately listed uplift is excluded. No duration, extras, polish tariff, other services, standalone car wash, online confirmation or live availability are imported. Public business hours come from the owner contact. The exact municipal street/number occurs once in a qualified Sofia settlement for Gorublyane; this is a postal point, not a surveyed entrance. No accounts, calls, booking forms, map providers or private menus were operated.',
  inventoryIdentity: '22a1889abea6bb183c29954ed66837a6058dcfe05cff3d91403fce0efcf3a364',
}]
