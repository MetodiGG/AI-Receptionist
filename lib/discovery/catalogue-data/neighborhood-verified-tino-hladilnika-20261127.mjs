import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-tino-hair-hladilnika-paradisecenter100'
const cityCode = '68134', neighborhood = 'Хладилника', category = 'hair'
const address = 'София, кв. Хладилника, бул. Черни връх 100, Paradise Center, ет. 1'
const website = 'https://www.tinohair.com/', phone = '+359883383809'
const bookingEntry = 'https://app.tinohair.com/'
const municipalVenue = 'https://www.sofia.bg/en/w/7047838'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const VERIFIED_TINO_HLADILNIKA_20261127_RECORDS = [{
  id, name: 'TINO Hair Salon · Хладилника', cityCode, neighborhood, category, address, website, phone,
  locationKind: 'premises',
  coordinates: {
    latitude: 42.657861, longitude: 23.315751, method: 'verified_official_address',
    source: OFFICIAL_SOFIA_SOURCE_URL, sourceAddress: address, sourceCityCode: cityCode,
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn,
    addressId: '106136', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Мъжко подстригване', category, appointmentModel: 'appointment',
    description: 'Стандартна цена 40 €. В сряда цената в ценоразписа е 30 €. Записването е през сайта на салона и е достъпно и като гост.',
    durationMin: 30, durationSourceUrl: website, durationCheckedOn: checkedOn,
    price: { amount: 40, currency: 'EUR', kind: 'fixed', unit: '30 € в сряда', sourceUrl: website, checkedOn, validUntil },
  }],
  booking: { kind: 'form', url: bookingEntry },
  verification: { status: 'approved', checkedOn, validUntil, contact: website, booking: {
    url: bookingEntry,
    excerpt: 'Официалното приложение на салона допуска записване като гост и в менюто за мъжки услуги показва самостоятелно мъжко подстригване.',
  } },
}]

export const VERIFIED_TINO_HLADILNIKA_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, bookingEntry, municipalVenue, OFFICIAL_SOFIA_SOURCE_URL],
  inventoryIdentity: 'd709eef8507b23a311bc0fcb8150a4ce0bf6c6f0e085144e7c8fb6d2f197f6b2',
  notes: 'The salon’s live website links its own booking app. The public guest men’s service menu and first-party price menu independently agree on a standalone men’s haircut, 30 minutes, EUR 40 standard with a separately stated Wednesday EUR 30 tariff. Record only the standard single-visit amount, with the literal weekday condition in the price unit and public description. The separate 10-visit package, loyalty benefits, products and transient promotions are not imported. The operator identifies the customer salon on floor 1 of Paradise Center; Sofia Municipality identifies that building as in Hladilnika and RN106136 locates the exact civic address, not a specific salon entrance. Only the men’s group was disclosed; no service, slot, account, customer data or booking was selected or submitted. No source photos or expressive prose reused.',
}]
