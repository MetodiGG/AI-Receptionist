import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-mts-massage-pchinya31b', name = 'MTs · Милена Цветкова · масажно студио'
const cityCode = '68134', neighborhood = 'Красна поляна 3', category = 'health'
const address = 'София, ж.к. Красна поляна 3, бл. 31, вх. Б откъм ул. Пчиня'
const website = 'https://milenatsvetkova.bg/', phone = '+359877776703'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'
const contact = website + 'kontakti/', prices = website + 'tseni/', rules = website + 'pravila-poseshtenie/'
const classical = website + 'services/klasicheski-relaksirasht-masazh-tsyalo-tyalo/'
const signature = website + 'services/avtorski-masazh-milena-tsvetkova/'
const partial = website + 'services/chastichen-masazh-milena-tsvetkova/'
const description = 'Записване по телефона поне 3 дни предварително. Плащане преди процедурата. При отлагане с по-малко от 24 часа таксата е дължима.'
const massage = (serviceName, amount, durationMin, sourceUrl) => ({
  name: serviceName, category, description, appointmentModel: 'appointment',
  durationMin, durationSourceUrl: prices, durationCheckedOn: checkedOn,
  price: { amount, currency: 'EUR', kind: 'fixed', unit: 'едно посещение', sourceUrl, checkedOn, validUntil },
})

export const VERIFIED_MTS_KRASNA_POLYANA3_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.694690, longitude: 23.284973, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '43181', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [
    massage('Класически масаж на цяло тяло', 65, 60, classical),
    massage('Авторски масаж на цяло тяло при Милена Цветкова', 70, 60, signature),
    massage('Частичен масаж при Милена Цветкова · гръб или антицелулитен', 50, 30, partial),
  ],
  booking: { kind: 'phone', phone },
  openingHours: {
    days: [
      ...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '20:00' }] })),
      { weekday: 6, periods: [{ open: '09:00', close: '15:00' }] },
      { weekday: 7, periods: [] },
    ],
    sourceUrl: contact, checkedOn,
  },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: classical, excerpt: 'Страниците за трите масажа водят към публикувания телефон за предварително записване в студиото. Часът се уговаря директно с него.' },
  },
}]

export const VERIFIED_MTS_KRASNA_POLYANA3_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, classical, signature, partial, prices, contact, rules],
  inventoryIdentity: 'd743ff794fe6fa96954df695ef0dc3d60180b55056e3a4cf22c8098ac859c418',
  notes: 'Read the exact three public massage pages and their direct tel appointment controls, then the owner contact, price list and visit conditions. The listed EUR rates are for the selected durations, not from-prices, subscriptions, vouchers or two visits. The published 90-minute classical variant is not listed as a separate offer here. Scope is the wellness massage studio, not medical treatment, a diagnostic offer, a course or a claim of outcomes. The owner-specified public entrance matches civic record RN43181, not the registered office or the map viewport. No calls or bookings were made and no owner photographs or site prose were reused.',
}]
