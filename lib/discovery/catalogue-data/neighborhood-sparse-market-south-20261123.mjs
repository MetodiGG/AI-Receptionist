import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-kanev-carpet-knyazhevo-buket55'
const website = 'https://kanevcarpet.com/'
const contact = `${website}контакти/`
const request = `${website}онлайн-заявка/`
const tariff = `${website}услуги-и-цени/`
const about = `${website}за-нас/`
const address = 'София, кв. Княжево, ул. Букет 55'
const category = 'home_services'
const phone = '+359895422456'

function service(name, description, amount) {
  return { name, category, description, appointmentModel: 'home_visit',
    price: { amount, currency: 'EUR', kind: 'fixed', unit: 'кв.м', sourceUrl: tariff, checkedOn } }
}

export const SPARSE_MARKET_SOUTH_20261123_RECORDS = [{
  id, name: 'Kanev Carpet · Екзотик', cityCode: '68134', neighborhood: 'Княжево', address,
  locationKind: 'premises', category, website, phone,
  coordinates: {
    latitude: 42.671295, longitude: 23.251376, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: 'Княжево', sourceWebsite: website, checkedOn, addressId: '87487',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [
    service('Машинно пране на килими · стандартна поръчка', 'Срок до 10 дни. Тарифата е за пране на килими до 12 м² с включен ДДС. Вземането и връщането от адрес се уговарят и заплащат отделно.', 3),
    service('Машинно пране на килими · бърза поръчка', 'Срок до 4 дни. Тарифата е за пране на килими до 12 м² с включен ДДС. Вземането и връщането от адрес се уговарят и заплащат отделно.', 4),
    service('Машинно пране на килими · експресна поръчка', 'Срок до 24 часа; килимите може да бъдат върнати леко влажни. Тарифата е за пране на килими до 12 м² с включен ДДС. Вземането и връщането от адрес се уговарят и заплащат отделно.', 5),
    service('Машинно пране на килими над 12 м²', 'Само с предварителна заявка. Цената е за пране с включен ДДС. Срокът и отделно платеният транспорт се уточняват с центъра.', 5),
  ],
  booking: { kind: 'form', url: request },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: request, excerpt: 'Изпратете онлайн заявка. Служител на центъра ще се свърже с вас, за да уточните услугата и вземането от адрес.' },
  },
}]

export const SPARSE_MARKET_SOUTH_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: request, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, request, contact, tariff, about, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Followed the first-party booking navigation to the active request form and its callback instructions without selecting or submitting anything. The latest first-party tariff body shows literal current EUR amounts per square metre for the four core washing cases. An older crawl of that tariff was superseded by the newer EUR-only content. Historical website/booking transport terms and inconsistent opening-hour summaries were not republished. Optional transport is charged separately, its exact fee is omitted, and a provider callback, not a GoRez confirmation, is required. Excludes optional deodorizing, transport and late fees as stand-alone services, car wash and other unverified appointments.',
  inventoryIdentity: '8da5180c605b0861316bba9e0c3d9971275d9e4d8f5f1f8b9714c43db453e6db',
}]
