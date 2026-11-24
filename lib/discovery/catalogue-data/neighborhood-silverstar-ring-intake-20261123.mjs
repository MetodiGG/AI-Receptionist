import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-silver-star-ring-mall-okolovrasten214'
const website = 'https://www.silverstar.bg/'
const contact = `${website}contacts/`
const bookingPage = `${website}zapazi-svoya-chas-za-obsluzhvane-v-sofia-ring-mall/`
const service = `${website}nova-usluga-za-sobstvenici-na-mercedes-benz/`
const offers = `${website}special-offers/`
const dropoffHours = 'https://stock.silverstar.bg/contact'
const neighborhood = 'Симеоново'
const address = 'София, в.з. Симеоново – север, ул. Околовръстен път 214, Sofia Ring Mall, паркинг ниво 0'
const phone = '+35970070063'

export const SILVERSTAR_RING_INTAKE_20261123_RECORDS = [{
  id, name: 'Силвър Стар · Ринг Мол', cityCode: '68134', neighborhood, address,
  locationKind: 'premises', category: 'auto_repair', website, phone,
  coordinates: {
    latitude: 42.624488, longitude: 23.352551, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '109175',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Смяна на спирачни дискове', category: 'auto_repair',
    description: 'За автомобили Mercedes-Benz. Приемът е с предварително записване на паркинг ниво 0. Уточнете цената за своя модел по телефона.',
    appointmentModel: 'appointment',
  }],
  openingHours: {
    days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '19:00' }] })),
    sourceUrl: dropoffHours, checkedOn,
  },
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: bookingPage, excerpt: 'Сервизната локация в Sofia Ring Mall приема автомобили само с предварително записан час по телефон. Приемът е на паркинг ниво 0.' },
  },
}]

export const SILVERSTAR_RING_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, bookingPage, service, offers, dropoffHours, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The operator explicitly offers vehicle-service appointments by phone at its Ring Mall drop-off, separate from the Chelopechko Shose premises. The service and branch phone were checked on the operator appointment page; the dedicated operator contact identifies the intake schedule separately from the longer retail hours.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: bookingPage, serviceUrls: [service, offers, contact],
    notes: 'No stand-alone Ring Mall brake disc replacement amount or duration is published on the appointment, service, contact and special-offer pages. The listed discounted packages for selected older models concern oil/filter technical maintenance and inspections; they are not brake-disc replacement prices.',
  },
  inventoryIdentity: '321ac94363b290d9e05dcb4a20661e635b6127eb4df40c98fac0cf3983bcb69d',
}]
