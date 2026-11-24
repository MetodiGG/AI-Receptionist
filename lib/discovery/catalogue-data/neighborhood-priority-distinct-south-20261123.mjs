import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-sr-cars-ovcha-kupel-boychev4'
const website = 'https://srcars-gumi.bg/'
const ownerPage = label => `${website}${encodeURIComponent(label)}/`
const contact = ownerPage('къде-да-ни-намерите')
const servicesPage = ownerPage('услуги')
const prices = ownerPage('цени')
const privacy = `${website}?page_id=3`
const phone = '+359897259900'
const neighborhood = 'Овча купел'
const address = 'София, кв. Овча купел, ул. Бойчо Бойчев 4'

export const PRIORITY_DISTINCT_SOUTH_20261123_RECORDS = [{
  id, name: 'SR CARS Гуми', cityCode: '68134', neighborhood, address,
  category: 'auto_repair', locationKind: 'premises', website, phone,
  coordinates: {
    latitude: 42.67338, longitude: 23.250802,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '36066', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Баланс на гуми с HUNTER Road Force', category: 'auto_repair', appointmentModel: 'appointment',
    description: 'Баланс на колелата под симулирано натоварване за откриване на вибрации. Часът и цената за самостоятелен баланс се уточняват по телефона.',
  }],
  openingHours: {
    days: [1, 2, 3, 4, 5, 6].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '19:00' }] })),
    sourceUrl: contact, checkedOn,
  },
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: servicesPage, excerpt: 'Страницата с услугите предлага телефонно записване и посочва баланса с HUNTER Road Force като отделна услуга на сервиза.' },
  },
}]

export const PRIORITY_DISTINCT_SOUTH_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, servicesPage, prices, contact, privacy],
  notes: 'The owner’s public Book buttons use the workshop telephone; the owner services menu separately lists Road Force wheel balancing and gives the same telephone. The public interactive prices page was rendered and tested with ordinary vehicle, service and rim size options without following the telephone action. Its only base menu item is a tyre-change-plus-balancing set and displayed amounts are estimates; no stand-alone balancing tariff is offered. The full contact page confirms premises and regular hours, and describes Sunday as seasonal only, not a guaranteed time. The footer policy link rendered a 404 and the accessible public pages showed an ordinary copyright notice; no owner media or promotional content copied.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: servicesPage, serviceUrls: [servicesPage, prices],
    notes: 'The accessible booked service and public calculator were reviewed. The calculator exposes only the tyre-change-plus-balance set as a base option. No published amount covers stand-alone Road Force balancing; bundle estimates, add-ons and the tyre change duration are not substituted.',
  },
  inventoryIdentity: 'cff453a549b4bc8d29089af94f12dd880a02ac4d15f9571f26c272453168dc33',
}]
