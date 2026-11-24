import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-dbros-vrazhdebna-botevgradsko431'
const website = 'https://dbros-garage.com/'
const contact = website + 'contacts'
const servicesPage = website + 'services'
const diagnostics = website + 'service/diagnostika-na-dvigatel-i-periferia'
const suspension = website + 'service/proverka-na-okachvane-i-korilno-upravlenie'
const neighborhood = 'Враждебна'
const address = 'София, кв. Враждебна, бул. Ботевградско шосе 431, м. Япаджа'

export const DBROS_INTAKE_20261123_RECORDS = [{
  id, name: 'D-Bros Automotive', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.710144, longitude: 23.425623,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '94059', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'auto_repair', website, phone: null,
  services: [{
    name: 'Компютърна диагностика на двигател и електроника', category: 'auto_repair', appointmentModel: 'appointment',
    description: 'Компютърна проверка на двигател и електронни блокове за автомобили от групата Volkswagen. Часът и цената се уточняват със сервиза.',
  }, {
    name: 'Проверка на окачване и кормилно управление', category: 'auto_repair', appointmentModel: 'appointment',
    description: 'Проверка на окачването и кормилната система за автомобили от групата Volkswagen. Часът и цената се уточняват със сервиза.',
  }],
  openingHours: {
    days: [1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '18:00' }] })),
    sourceUrl: contact, checkedOn,
  },
  booking: { kind: 'form', url: contact },
  verification: {
    status: 'approved', checkedOn, validUntil,
    booking: { url: contact, excerpt: 'И двете сервизни страници водят към заявка на сайта на сервиза. Часът не се потвърждава автоматично.' },
    contact,
  },
}]

export const DBROS_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: contact, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, contact, servicesPage, diagnostics, suspension, website + 'about/obshchi-usloviya-serviz',
    'https://www.d-bros-automotive.eu/'],
  notes: 'Followed the actual Book buttons on the overview and the two dedicated service pages to the owner enquiry form. It accepts a subject and a written enquiry, not a selected slot. Both owner sites agree on Sofia, 431 Botevgradsko shose, Yapadzha and weekday opening hours. The repair terms expressly identify the physical workshop as Vrazhdebna, separately from the legal seat; the only exact municipal street/number row is 94059 and serves as a postal point, not the entrance. The two owner pages show different public contact numbers; preserve the independently confirmed owner form without importing a phone. No tuning, tyre bundle, shop goods, durations, booked slots or third-party prices published.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: contact, serviceUrls: [servicesPage, diagnostics, suspension],
    notes: 'The actual direct enquiry route and each dedicated service page were publicly readable. The owner price sections for these two services display no amount and the enquiry has no tariff menu. The repair terms describe a workshop-specific quote. No information or pricing from separate restricted marketplace inventory is incorporated and no claim is made about prices via other channels.',
  },
  inventoryIdentity: 'ae5aec6ec72c3e056713214d5931a6ac73e08ec40d0747495f8c2baf912f60df',
}]
