import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-one-service-vrabnitsa1-276-13'
const website = 'https://motero.bg/servizi/one-service'
const terms = 'https://motero.bg/obshti-uslovia'
const merchantTerms = 'https://motero.bg/uslovia-za-servizi'
const independentBusiness = 'https://www.oink.bg/biz/one_service'
const neighborhood = 'Връбница 1'
const address = 'София, ж.к. Връбница 1, ул. „276-та“ 13'

export const PRIORITY_FRESH_NORTH_20261123_RECORDS = [{
  id, name: 'ONE SERVICE', cityCode: '68134', neighborhood, address,
  category: 'auto_repair', locationKind: 'premises', website, phone: null,
  coordinates: {
    latitude: 42.729239, longitude: 23.283515,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '14921', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Компютърна диагностика на автомобил',
    category: 'auto_repair',
    description: 'Публикуваната сума е ориентировъчна начална цена. Сервизът потвърждава окончателната цена след преглед на автомобила. Записването е през външна платформа; плащането е на място в сервиза.',
    price: { amount: 50, currency: 'EUR', kind: 'from', sourceUrl: website, checkedOn, validUntil },
    appointmentModel: 'appointment',
  }],
  booking: { kind: 'form', url: website },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: website, excerpt: 'Бутонът за резервация в публичния профил отваря форма на сервиза с отделен избор за компютърна диагностика и ориентировъчна начална цена.' },
  },
}]

export const PRIORITY_FRESH_NORTH_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: website, bookingReview: 'provider_booking_reviewed',
  reviewedUrls: [website, terms, merchantTerms, independentBusiness, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Opened the actual merchant Book button in a clean browser and inspected the rendered service-selection stage before using the same profile’s Services section. Both show computer diagnostics at an indicative minimum of EUR 50; the workshop confirms final price following vehicle inspection, and payment is in person. The booking display uses the same 60-minute block across different kinds of work; no actual repair duration or open time was inferred. Generic visit charge does not imply parts, repair or inclusion of diagnostically overlapping menu rows. The public operator-managed profile and independent directory agree on this workshop and address. Motero’s public/merchant terms describe its roles and protect the platform’s content; only independently paraphrased facts are retained, no prose, reviews, images, accounts or protected database aggregates. No service or time selected, no login, data entry, payment, request or reservation.',
  inventoryIdentity: '920607c9ff8b37a0133f3810ca2c18ab42d16544af9b61401a7c2d86546ad946',
}]
