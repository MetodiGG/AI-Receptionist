import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-nn-architecture-hladilnika-banat34'
const cityCode = '68134', neighborhood = 'Хладилника', category = 'consulting'
const address = 'София, кв. Хладилника, ул. Банат 34, партер'
const website = 'https://nn-interiordesign.com/', phone = '+359894996277'
const serviceMenu = 'https://nn-interiordesign.com/uslugi-test/'
const bookingEntry = 'https://easybook.bg/nn-architecture-or-interior-design-sofiya-hladilnika'
const scheduler = bookingEntry + '/employee-neli-nikolova713100'
const localityEvidence = 'https://www.pancharevo.org/gradska-i-okolna-sreda/planovi-remonti/15-19-03-2021'
const checkedOn = '2026-11-27', validUntil = '2026-12-18'

const price = amount => ({ amount, currency: 'EUR', kind: 'fixed', sourceUrl: bookingEntry, checkedOn, validUntil })
const consultation = (name, amount) => ({
  name, category,
  description: 'Интериорна консултация с арх. Нели Николова. Избери присъствена среща в студиото или онлайн консултация при записване.',
  price: price(amount), appointmentModel: 'appointment',
})

export const VERIFIED_HLADILNIKA_NN_20261127_RECORDS = [{
  id, name: 'NN Architecture · Хладилника', cityCode, neighborhood, address, category, website, phone,
  locationKind: 'premises',
  coordinates: {
    latitude: 42.659292, longitude: 23.314247, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '727', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [
    consultation('Интериорна консултация · пакет „Бърз съвет“ при Нели Николова', 35.79),
    consultation('Цялостна интериорна консултация при Нели Николова', 61.36),
  ],
  booking: { kind: 'form', url: bookingEntry },
  verification: { status: 'approved', checkedOn, validUntil, contact: website, booking: {
    url: website,
    excerpt: 'Сайтът на студиото води към профила му в Easybook. За този офис са обявени присъствени и онлайн консултации с арх. Нели Николова.',
  } },
}]

export const VERIFIED_HLADILNIKA_NN_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry, bookingReview: 'provider_booking_reviewed',
  reviewedUrls: [website, serviceMenu, bookingEntry, scheduler, localityEvidence, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The studio directly links its branch on Easybook. The public booking page offers scheduled interior-design consultations at its Banat 34 ground-floor office or online by client choice. The visible euro quotes for Neli Nikolova are EUR 35.79 for the quick-advice package and EUR 61.36 for the full consultation; the same public service entries expose base values of BGN 70 and BGN 120, respectively, and have scheduling enabled. There is one advertised quote per service rather than a separate in-person tariff. No slot, duration, booking or payment was assumed or submitted. Official Sofia civic address row 727 supplies the building point, not a studio-door pin. The address is independently corroborated under Hladilnika in municipality-published utility notices.',
  inventoryIdentity: '1bff0d49f12d5dcfc8e99df9ed9a5c1aed33e48bc48cfb2980c3c245922391db',
}]
