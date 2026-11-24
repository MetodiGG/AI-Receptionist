import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-alva-dental-hadzhi-dimitar107v'
const website = 'https://alvadent.net/'
const contact = `${website}contact`
const services = `${website}services`
const team = `${website}practitioners`
const neighborhood = 'Хаджи Димитър'
const address = 'София, ж.к. Хаджи Димитър, бл. 107, вх. В'
const phone = '+359885416040'

export const ALVA_DENTAL_INTAKE_20261123_RECORDS = [{
  id, name: 'Alva Dental Clinic', cityCode: '68134', neighborhood, address,
  locationKind: 'premises', category: 'other', website, phone,
  coordinates: {
    latitude: 42.705780, longitude: 23.345240, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '50393',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [
    { name: 'Профилактичен стоматологичен преглед', category: 'other', appointmentModel: 'appointment' },
    { name: 'Професионално почистване на зъбен камък и полиране', category: 'other', appointmentModel: 'appointment' },
  ],
  openingHours: {
    days: [...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '08:30', close: '18:30' }] })),
      { weekday: 6, periods: [] }, { weekday: 7, periods: [] }],
    sourceUrl: website, checkedOn,
  },
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: website, excerpt: 'Практиката кани пациентите да запазят час на публикувания телефон. В профилактичните услуги са посочени преглед и почистване на зъбен камък с полиране.' },
  },
}]

export const ALVA_DENTAL_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, services, team, `${website}robots.txt`, `${website}sitemap.xml`],
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: website, serviceUrls: [website, services],
    notes: 'The owner homepage and rendered Contact explicitly invite appointments by the same telephone. The public rendered Services menu has no numeric tariff or duration for either preventive service; the team page offers no practitioner tariff. The public sitemap lists only these views. The Services and Contact views were read after ordinary client-side navigation from the homepage; direct deep links return an empty HTTP 404. No failed response was used as evidence of an unpublished price. The structured price tier is not a service price.',
  },
  notes: 'One dental practice, not one entry per dentist. The owner supplies the exact quarter, block and entrance; the unique municipal CSV point matches it about 3.6 m from the secondary first-party coordinates. Only the municipal postal point is retained. The published telephone and low-friction working homepage are used; no direct deep links are exposed for booking or contact. Read the entire reachable contact, services, team and linked navigation, robots and sitemap. No separate terms or privacy page linked; ordinary copyright notice only. Only independently worded factual booking details and existing project illustrations are used. No visit availability, insurance, clinical outcomes, duration or fee asserted. No calls, external map queries, patient details or form submissions.',
  inventoryIdentity: 'a95da15828e341cb17c53ebb77067135efb0778b0f9c7cf76cddbb6bbbfd11ff',
}]
