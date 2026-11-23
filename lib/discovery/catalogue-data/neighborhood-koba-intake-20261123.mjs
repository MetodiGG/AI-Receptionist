import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-koba-auto-bosch-rodopi27'
const neighborhood = 'Център'
const address = 'София, Център, ул. Родопи 27'
const website = 'https://koba-auto.com/'
const phone = '+359884192080'
const contact = `${website}kontakti/`
const workshop = `${website}bosch-car-service-koba-auto/`
const diagnostic = `${website}avtomobilna-diagnostika/`
const serviceMenu = `${website}serviz/`

export const KOBA_INTAKE_20261123_RECORDS = [{
  id, name: 'КОБА АУТО · Bosch Car Service', cityCode: '68134', neighborhood, address,
  locationKind: 'premises', category: 'auto_repair', website, phone,
  coordinates: {
    latitude: 42.706894, longitude: 23.327786, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '28516',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Компютърна диагностика на автомобил', category: 'auto_repair',
    description: 'Диагностиката може да се запише отделно. Сервизът проверява електронните системи на автомобила и обяснява резултатите. Ремонт се извършва само след съгласуване.',
    appointmentModel: 'appointment',
  }],
  openingHours: {
    days: [...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '18:00' }] })),
      { weekday: 6, periods: [] }, { weekday: 7, periods: [] }],
    sourceUrl: contact, checkedOn,
  },
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: contact, excerpt: 'Страницата на сервиза на ул. „Родопи“ 27 публикува телефон на приемната за записване на час. Сервизът потвърждава, че диагностика може да се запише отделно от ремонт.' },
  },
}]

export const KOBA_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, workshop, diagnostic, serviceMenu, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Followed the public owner appointment CTA to the named Bosch branch at Rodopi 27. The branch contact provides a staffed service-desk appointment telephone, weekday opening hours and weekend closure. The official branch FAQ confirms standalone diagnostics, results are explained, and repairs require approval; the dedicated service page identifies a check of the vehicle electronic systems. Only this one workshop and appointment are recorded. Municipal postal row 28516 agrees with the branch address and map-marker position; the Serdika administrative district is not used as a quarter. No booking, offer, alternative branch, source image, duration or availability was copied or sent.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: contact, serviceUrls: [workshop, diagnostic, serviceMenu],
    notes: 'Reviewed the public appointment entry and contact, the branch workshop FAQ, the named diagnostics page and the full public owner services menu. None publishes a current ordinary tariff for standalone vehicle computer diagnostics at this branch. The branch describes a quote after evaluation; third-party promotional bundles do not establish a current unconditional standalone tariff.',
  },
  inventoryIdentity: 'e5016abd29f65291b2b02df7a07edc26049fe9f15f2bfacbc78821da8c8bd9eb',
}]
