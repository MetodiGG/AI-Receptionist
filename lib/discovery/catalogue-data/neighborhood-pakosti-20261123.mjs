// Owned outdoor venue packages only; neither a photographer nor a self-service calendar.
import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-pakosti-chudati-botunets-levski5'
const neighborhood = 'Ботунец'
const address = 'София, кв. Ботунец, ул. Васил Левски 5'
const website = 'https://pakosti-chudati.com/'
const contact = `${website}контакти/`
const packages = `${website}празненство/`
const about = `${website}за_нас/`
const phone = '+359899388364'
const conditions = 'До 15 деца и 30 възрастни. Включва дигитална покана и базова украса; без храна, аниматор и организирани игри. Внасянето на храна и напитки е без доплащане, а за внесена торта се изисква сертификат. Дървените въглища за барбекю са срещу доплащане.'

export const PAKOSTI_INTAKE_20261123_RECORDS = [{
  id, name: 'Пакости чудати', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.738904, longitude: 23.508634,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '72326', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'other', website, phone,
  services: [{
    name: 'Рожден ден на открито – половин ден', category: 'other', appointmentModel: 'group_reservation',
    description: conditions,
    price: { amount: 200, currency: 'EUR', kind: 'fixed', unit: 'пакет за половин ден', sourceUrl: packages, checkedOn, validUntil },
  }, {
    name: 'Рожден ден на открито – цял ден', category: 'other', appointmentModel: 'group_reservation',
    description: conditions,
    price: { amount: 250, currency: 'EUR', kind: 'fixed', unit: 'пакет за цял ден', sourceUrl: packages, checkedOn, validUntil },
  }],
  openingHours: {
    days: [
      ...[4, 5].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '17:00' }] })),
      ...[6, 7].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '19:00' }] })),
    ],
    sourceUrl: packages, checkedOn,
  },
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: website, excerpt: 'Обектът приема телефонни запитвания за предварително ангажиране на мястото за детски празник.' },
  },
}]

export const PAKOSTI_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, packages, about],
  notes: 'The owner expressly offers advance hire of this outdoor venue for private children’s events and invites calls at the exact same business number printed on the event and visit contact pages. Calls are requests, not confirmed slots. The owner event page lists two regular whole-booking totals, EUR 200 for half-day and EUR 250 for all-day, each for up to 15 children and 30 adults without food, animator or organised games. The descriptions retain the outside cake certificate and optional charcoal qualification. Promotional and supplementary figures, workshops and recommended photographers were not imported. Venue opening hours are limited to the four stated days and are not booking availability. The municipal point is the exact numbered postal address matched in Kremikovtsi, not a building survey. No call, form submission, capacity check, reservation, consent choice, copying assets or live customer data.',
  inventoryIdentity: 'ccf04e51dbe29312086464ec5a7e5d285f10c7309ea5da36a6dc1ac51b9697f2',
}]
