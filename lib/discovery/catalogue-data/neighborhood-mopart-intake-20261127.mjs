import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-27', validUntil = '2026-12-27'
const id = 'sofia-mopart-lyulin3-okolovrasten803'
const neighborhood = 'Люлин 3'
const address = 'София, ж.к. Люлин 3, ул. Околовръстен път 803'
const website = 'https://mopart.bg/'
const phone = '+359893565812'
const category = 'auto_repair'

export const MOPART_INTAKE_20261127_RECORDS = [{
  id, name: 'Mopart Service', cityCode: '68134', neighborhood, address,
  locationKind: 'premises', category, website, phone,
  coordinates: {
    latitude: 42.722657, longitude: 23.238698, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '112354',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Компютърна диагностика на двигател', category,
    description: 'Проверка на двигателя с диагностична апаратура за автомобили BMW, MINI и Rolls-Royce.',
    appointmentModel: 'appointment',
  }, {
    name: 'Обслужване на спирачки', category,
    description: 'Обслужване на спирачната система, включително накладки и дискове, за автомобили BMW, MINI и Rolls-Royce.',
    appointmentModel: 'appointment',
  }, {
    name: 'Машинна смяна на масло на автоматична скоростна кутия', category,
    description: 'Динамична смяна на трансмисионната течност с машина за автомобили BMW, MINI и Rolls-Royce.',
    appointmentModel: 'appointment',
  }],
  openingHours: {
    days: [
      ...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '18:00' }] })),
      { weekday: 6, periods: [] },
      { weekday: 7, periods: [] },
    ],
    sourceUrl: website, checkedOn,
  },
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: website, excerpt: '„Запази час“ води до секцията „Запазете час“ с телефон +359 89 35 65 812 и адреса на сервиза в Люлин 3.' },
  },
}]

export const MOPART_INTAKE_20261127_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The owner’s public Book control opens its on-page telephone appointment section with the exact workshop in Lyulin 3 and no external calendar. The same page names engine diagnostics, brake-system servicing and machine automatic-transmission fluid exchange. The phone, supported vehicle brands and workshop opening hours are explicit; opening hours are not appointment availability.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: website, serviceUrls: [website],
    notes: 'Reviewed the owner’s Book route and the full same-page service list, including the automatic transmission fluid section. These sections are readable without signing in and contain no tariff for the three selected services or a separate price-list link. Prices and durations are omitted; technical timings are not booked durations.',
  },
  inventoryIdentity: 'b0a5d66384c454f32eeeaf49fc8fdce2767d8e98afa7148f18a35a75cee9e6dd',
}]
