import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-carplay-bulgaria-gorublyane-pionerska2'
const website = 'https://carplay-bg.com/'
const contact = website + 'kontakti'
const multimedia = website + 'uslugi/multimedia-upgrades'
const bookingUrl = website + 'zapazi-chas?service=multimedia-upgrades'
const terms = website + 'obshti-uslovia'
const shop = website + 'magazin/kategoria/carplay-android-auto'
const neighborhood = 'Горубляне'
const address = 'София, кв. Горубляне, ул. Пионерска 2'

export const VERIFIED_EAST_NEXT_20261123_RECORDS = [{
  id, name: 'CarPlay & Android Auto Bulgaria', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.631683, longitude: 23.408130, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '32182', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'auto_repair', website, phone: '+359888841710',
  services: [{
    name: 'Монтаж и настройка на автомобилна мултимедия', category: 'auto_repair',
    description: 'Подбор на съвместими компоненти, монтаж и тестване. Посоченото време за монтаж е 1–2 часа; цената се уточнява според автомобила. Онлайн формата изпраща заявка към сервиза.',
    appointmentModel: 'appointment',
  }],
  booking: { kind: 'form', url: bookingUrl },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: bookingUrl, excerpt: 'Бутонът на сервиза отваря собствена заявка с предварително избран мултимедиен монтаж на ул. Пионерска 2.' },
  },
}]

export const VERIFIED_EAST_NEXT_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: bookingUrl, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, bookingUrl, multimedia, contact, terms, shop, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Both Book buttons on the workshop service page open the operator’s live rendered service-specific request page. It displays the selected service, date and time controls, the exact Gorublyane address, and a request action. No appointment was sent or slot asserted. The service page gives a 1–2 hour estimate, not a fixed appointment duration. The public terms name a distinct company; the existing M-Line detailing listing at the same street number uses a different owner, business contact, activity and site. No platform partnership is implied.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl, serviceUrls: [multimedia],
    notes: 'The actual owned public appointment page and the fully rendered dedicated service page carry no price for this selected workshop visit. The separate store lists individual brand-specific hardware prices, not a general labour tariff for the multimedia upgrade. Those prices and free-install offers on other product/service pages are not applied. No blocked or unavailable menu is classified as unpublished.',
  },
  inventoryIdentity: '70b0210e7153c318b66285e8f01eb0a89c36a414ceca48e704e6bed5a65ab2a2',
}]
