import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-essentisimo-banishora-karlovo7'
const website = 'https://beautyhouse.bg/'
const tariff = `${website}ceni/`
const phone = '+359877803694'
const cityCode = '68134', neighborhood = 'Банишора'
const address = 'София, ж.к. Банишора, ул. Карлово 7'
const checkedOn = '2026-11-27', validUntil = '2026-12-18'
const price = amount => ({ amount, currency: 'EUR', kind: 'fixed', sourceUrl: tariff, checkedOn, validUntil })

export const VERIFIED_BANISHA_SALON_20261127_RECORDS = [{
  id, name: 'Къща за красота Essentisimo', cityCode, neighborhood, address, category: 'hair',
  locationKind: 'premises', website, phone,
  coordinates: {
    latitude: 42.707462, longitude: 23.309666, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: cityCode,
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '98744',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Дамско подстригване', category: 'hair',
    description: 'Включва измиване и подсушаване. Подстригване със сешоар е отделна услуга.',
    appointmentModel: 'appointment', price: price(15),
  }, {
    name: 'Маникюр с гел лак', category: 'nails',
    appointmentModel: 'appointment', price: price(20),
  }],
  booking: { kind: 'form', url: website },
  verification: { status: 'approved', checkedOn, validUntil, contact: website, booking: {
    url: website,
    excerpt: 'Официалният сайт на салона на ул. „Карлово“ 7 има секция „Заявка за час“ с форма за контакт. Заявката не е потвърдена резервация.',
  } },
}]

export const VERIFIED_BANISHA_SALON_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: website, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, tariff, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The salon names Banishora, lists its single Karlovo Street 7 premises and publishes haircut and gel manicure services. The reachable owner page renders name, email and message fields under its appointment request heading. It also links to a separate booking widget, which could not be independently read and is not this listing’s booking target. The official EUR tariff lists women’s haircut with wash and drying at €15 and gel manicure at €20; no unverified duration, staff variant, or promotional price is used. Civic register RN98744 is the matching address, not a surveyed storefront entrance. Nothing was submitted.',
  inventoryIdentity: 'd02705c0a181ae0d76c22815b10f1dab58d17296bab812abb353aa319d3506d6',
}]
