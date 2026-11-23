import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-koba-auto-paris14'
const root = 'https://koba-auto.com/'
const website = `${root}avtoserviz-czentar-sofiya/`
const contact = `${root}kontakti/`
const serviceMenu = `${root}serviz/`
const diagnostics = `${root}avtomobilna-diagnostika/`
const neighborhood = 'Център'
const address = 'София, Център, ул. Париж 14'
const phone = '+359877755407'

export const KOBA_PARIS_INTAKE_20261123_RECORDS = [{
  id, name: 'КОБА АУТО · Париж 14', cityCode: '68134', neighborhood, address,
  locationKind: 'premises', category: 'auto_repair', website, phone,
  coordinates: {
    latitude: 42.699817, longitude: 23.330498, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '26592',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Компютърна диагностика на автомобил', category: 'auto_repair',
    description: 'Компютърната диагностика може да се заяви без ангажимент за ремонт. При записване уточнете симптомите, марката, модела и годината на автомобила.',
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
    booking: { url: contact, excerpt: 'Сервизът на ул. „Париж“ 14 има отделен телефон на приемната за записване. Страницата на обекта потвърждава, че може да се заяви само диагностика.' },
  },
}]

export const KOBA_PARIS_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, serviceMenu, diagnostics, root, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Followed the own Paris 14 workshop appointment CTA to the contact page, which explicitly provides its distinct reception telephone and separate operating hours. The owner workshop menu and FAQ confirm standalone computer diagnostics on site at Paris 14. The same operator runs a separate Bosch workshop at Rodopi 27 with a different booking phone; no terms, tariff, service schedule or brand status were transferred. Only the exact municipal postal address, not an inferred entrance, is bound.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: contact, serviceUrls: [website, diagnostics, serviceMenu],
    notes: 'Read the branch-specific appointment instructions and FAQ, the contact reception section for this physical workshop, the owner’s dedicated diagnostics page and complete services menu. No public diagnostic price or duration is listed for Paris 14. The homepage suspension promotion is not a diagnostic tariff. No other workshop tariff or repair estimate is treated as the price of the visit.',
  },
  inventoryIdentity: 'e0119e48482448760a515a25754f418d7aa07f66b50588512f5335b9cd749a6a',
}]
