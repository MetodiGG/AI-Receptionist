import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-yonitrade-suhata-reka-block10a'
const website = 'https://yonitrate.info/'
const contact = new URL('контакти', website).href
const services = new URL('шофьорски-курсове', website).href
const officialRegister = 'https://rta.government.bg/upload/18140/uchebni_centrove_01_10_2026.html'
const neighborhood = 'Сухата река'
const address = 'София, ж.к. Сухата река, бл. 10, вх. А, ет. 1, ап. 2'
const phone = '+359888403319'

export const PRIORITY_CONTINUED_EAST_20261123_RECORDS = [{
  id, name: 'Учебен център Йонитрейд · Сухата река', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.703324, longitude: 23.355127, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '27553', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'education', website, phone,
  services: [{
    name: 'Шофьорски курс за категория B', category: 'education',
    description: 'Курсът включва теоретично и практическо обучение. Записването е по телефон; началната дата, графикът и таксата се уточняват с учебния център.',
    appointmentModel: 'group_reservation',
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: website, excerpt: 'Учебният център приема записвания за курсове по телефон и публикува отделен номер за филиала в Сухата река.' },
  },
}]

export const PRIORITY_CONTINUED_EAST_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, services, officialRegister, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The operator homepage expressly offers telephone course registration and names the exact Suhata reka office and its published numbers. The selected number is the local mobile listed for that location, not the other branch number. The current official register independently ties ordinary Category B to licence 3173 and the same address, block 10 entrance A and room 2. Current November wording establishes operation only, not a future seat or date. A separate older data-collecting form is not the actual GoRez booking path and is not the source of any price, instructions or availability. No call or booking was made; no regulated exam or second branch was imported.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: website, serviceUrls: [services, contact],
    notes: 'The fully readable first-party telephone booking invitation, entire dedicated ordinary driving course page and exact location contact have no numerical Category B course price. The first-party navigation has no Prices/menu link; a seasonal discount announcement does not disclose a standard price and was excluded. A telephone quote is not a fixed fee, and no blocked price page was treated as unpublished.',
  },
  inventoryIdentity: '7f3db9ee844043ce242d1afb746644c04589f141c5d7f6f5f95e4faf2937578a',
}]
