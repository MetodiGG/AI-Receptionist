import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-veda-junior-stefan-karadzha-gintsi11'
const name = 'Veda Junior · Стефан Караджа'
const cityCode = '68134', neighborhood = 'Стефан Караджа', category = 'fitness'
const address = 'София, кв. Стефан Караджа, ул. Гинци 11'
const website = 'https://vedajunior.com/', phone = '+359888769027'
const locations = website + 'zali-sofia.html', classes = website + 'detska-shkola.html'
const enrollment = website + 'grupi-i-zapisvane.html'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const VERIFIED_VEDA_JUNIOR_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.708325, longitude: 23.360837, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '51672', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Модерен балет и съвременни танци за деца', category, appointmentModel: 'group_reservation',
    description: 'Групови занимания за деца. При записване по телефона посочи залата в кв. Стефан Караджа. Уточни с екипа подходящата група според възрастта и опита на детето, свободните места, графика и таксата.',
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: enrollment, excerpt: 'Школата приема записвания по телефона. Посочи залата в кв. Стефан Караджа; екипът уточнява подходящата група, графика, местата и условията за включване.' },
  },
}]

export const VERIFIED_VEDA_JUNIOR_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, enrollment, classes, locations, website + 'sitemap.xml', OFFICIAL_SOFIA_SOURCE_URL],
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: enrollment, serviceUrls: [classes, locations, website],
    notes: 'The exact owner enrolment page, kids-school service menu, current venues page and public home/contact all returned ordinary HTTP 200. The owner FAQ about current times and fees directs enquiries to the enrollment phones; it lists no public EUR/BGN amount, duration or membership unit. The public sitemap and navigation offer no distinct tariff link. No price, unit or duration was inferred from historical sources or other venues.',
  },
  inventoryIdentity: 'e91dba45b42b6910b514c36003d2aa654de453ed10e5abe28628e8b2f697f7b8',
  notes: 'One bookable group programme in one named branch, confirmed by the first-party current venue and enrolment pages. The two age/group labels are not separately listed because their availability varies by venue. The published enrollment phones are real contact actions, and the school confirms grouping, schedule and places; no guaranteed place or time. Owner-linked map pin agrees with Sofia civic RN51672; the civic building is not a surveyed individual entrance. No call, form entry, booking, payment, calendar or partnership change. Public owner facts only, no copied photos or prose.',
}]
