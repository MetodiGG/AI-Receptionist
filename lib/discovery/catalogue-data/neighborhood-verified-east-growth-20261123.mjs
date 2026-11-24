import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-partydots-druzhba2-block280e'
const website = 'https://party-dots.com/'
// The booking form and contact details are on the same canonical public page.
const bookingUrl = website
const contact = website
const district = 'https://call.sofia.bg/signals/768635'
const neighborhood = 'Дружба 2'
const address = 'София, ж.к. Дружба 2, бл. 280, до вх. Е (Цариградски комплекс)'

export const VERIFIED_EAST_GROWTH_20261123_RECORDS = [{
  id, name: 'PartyDots', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.647723, longitude: 23.400698, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '94621', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'other', website, phone: '+359876738608',
  services: [{
    name: 'Класическо детско парти', category: 'other',
    description: 'Пакет за до 12 деца с аниматор и декорация, 2 часа и 30 минути. Цената е за целия пакет, не на дете; точната цена и датата се потвърждават от центъра.',
    price: { amount: 180, currency: 'EUR', kind: 'from', unit: 'пакет', sourceUrl: bookingUrl, checkedOn, validUntil },
    appointmentModel: 'appointment',
    durationMin: 150, durationSourceUrl: bookingUrl, durationCheckedOn: checkedOn,
  }, {
    name: 'Тематично детско парти', category: 'other',
    description: 'Избор на тема, например принцеси, супергерои или еднорози, с тематична украса и костюми. Цената е начална за пакета, не на дете; детайлите и датата се потвърждават от центъра.',
    price: { amount: 245, currency: 'EUR', kind: 'from', unit: 'пакет', sourceUrl: bookingUrl, checkedOn, validUntil },
    appointmentModel: 'appointment',
  }, {
    name: 'Премиум детско парти с кетъринг', category: 'other',
    description: 'Пакет с кетъринг, торта и фотограф. Цената е начална за пакета, не на дете; детайлите и датата се потвърждават от центъра.',
    price: { amount: 385, currency: 'EUR', kind: 'from', unit: 'пакет', sourceUrl: bookingUrl, checkedOn, validUntil },
    appointmentModel: 'appointment',
  }],
  booking: { kind: 'form', url: bookingUrl },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: bookingUrl, excerpt: 'Собствената форма предлага заявка за дата с избор на пакет. Центърът се свързва с клиента за потвърждение.' },
  },
}]

export const VERIFIED_EAST_GROWTH_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: bookingUrl, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, district, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The live owner Book button opens its public chooser on the same page. The Classic choice is an ordinary from-EUR-180 package for up to 12 children, 2.5 hours, entertainer and decoration; Themed is from EUR 245 with theme options, decoration and costumes; Premium is from EUR 385 with catering, cake and photographer. No participant limit or duration is inferred for Themed or Premium. None is an individual-child fee, deposit or discounted price. The venue contacts customers to confirm. The owner address is block 280; the district response identifies the named premises next to entrance E. No visitor report, ratings, map-derived data, images, schedule or available times were imported.',
  inventoryIdentity: 'e1760cd5b60a62886bb6101c18071c823013f1a449a9882cdf75f33912c2e5d6',
}]
