// Two individually reviewed physical locations, pending separate integration.
// Only the selected in-person activities are represented.
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../official-sofia-address-source.mjs'

// Source/publication gates use UTC dates. This review was 23 Nov in Sofia
// but was completed on 22 Nov UTC, so recording 23 Nov would be future-dated.
const checkedOn = '2026-11-22', validUntil = '2026-12-23'
const vrSite = 'https://www.vr-sofia.com/'
const vrBook = `${vrSite}rezervacia/`
const vrFaq = `${vrSite}faq/`
const vrPrices = `${vrSite}ceni/`
const vrPhone = '+359886656559'
const vrId = 'sofia-vr-sofia-west-mall-lyulin7'
const brainlandSite = 'https://www.brainland.bg/index.html'
const brainlandBook = 'https://www.brainland.bg/kontakt.html'
const brainlandService = 'https://www.brainland.bg/vazrastni.html'
const brainlandAddressEvidence = 'https://brainlandbg.wordpress.com/лятно-училище/лятна-занималня-люлин/'
const brainlandId = 'sofia-brainland-lyulin3-block319v'

function officialPoint({ latitude, longitude, addressId, address, neighborhood, website }) {
  return {
    latitude, longitude, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  }
}

const vr = { neighborhood: 'Люлин 7', address: 'София, ж.к. Люлин 7, бул. Царица Йоанна 15, West Mall, ет. 2', website: vrSite }
const brainland = { neighborhood: 'Люлин 3', address: 'София, ж.к. Люлин 3, бл. 319, вх. В, партер', website: brainlandSite }

export const INTAKE_20261123_RECORDS = [{
  id: vrId, name: 'VR Sofia · West Mall', cityCode: '68134', ...vr, locationKind: 'premises',
  coordinates: officialPoint({ ...vr, latitude: 42.710348, longitude: 23.271305, addressId: '98466' }),
  category: 'other', phone: vrPhone,
  services: [{
    name: 'VR игра ARENA за 2–6 играчи', category: 'other', appointmentModel: 'group_reservation',
    description: '30 минути в обща VR арена за 2–6 играчи, от петък до неделя. Цената е на човек, не за цялата група. Обектът потвърждава часа по телефона.',
    durationMin: 30, durationSourceUrl: vrPrices, durationCheckedOn: checkedOn,
    price: { amount: 18.5, currency: 'EUR', kind: 'fixed', unit: 'на човек', sourceUrl: vrPrices, checkedOn, validUntil },
  }],
  booking: { kind: 'phone', phone: vrPhone },
  verification: {
    status: 'approved', checkedOn, validUntil,
    booking: { url: vrFaq, excerpt: 'FAQ посочва, че резервацията се прави и потвърждава по телефона на 0886 65 65 59. Онлайн заявката сама по себе си не запазва час.' },
    contact: `${vrSite}kontakti/`,
  },
}, {
  id: brainlandId, name: 'Brainland', cityCode: '68134', ...brainland, locationKind: 'premises',
  coordinates: officialPoint({ ...brainland, latitude: 42.721203, longitude: 23.243208, addressId: '30434' }),
  category: 'education', phone: '+359886355115',
  services: [{
    name: 'Английски език за възрастни', category: 'education', appointmentModel: 'appointment',
    description: 'Присъствен курс по английски за възрастни в група или индивидуално. Изпращаш запитване; центърът уточнява формата, графика и цената.',
  }],
  booking: { kind: 'form', url: brainlandBook },
  verification: {
    status: 'approved', checkedOn, validUntil,
    booking: { url: brainlandBook, excerpt: 'Бутонът за записване на езикови курсове води към собствения формуляр за запитване. Центърът се свързва за уточняване на ниво, група и график.' },
    contact: brainlandBook,
  },
}]

export const INTAKE_20261123_REVIEWS = [{
  id: vrId, checkedOn, website: vrSite, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [vrSite, vrBook, vrPrices, vrFaq, `${vrSite}kontakti/`, `${vrSite}uslovia/`,
    'https://westmall.bg/bg/magazini/vr-sofia-west-mall'],
  notes: 'The public booking CTA opens the actual owner request entry for groups, parties and other events. It explicitly offers the phone alternative, independently confirmed in the owner FAQ for a booked ARENA slot; no group option or private form was operated. The complete public price page and FAQ establish the selected literal EUR18.50 per person for 30 minutes, 2–6 players, Friday to Sunday. No party/package/deposit amount or weekday individual game is imported. The owner Terms have inconsistent online deposit language; booking-specific FAQ and the same Terms payment section explicitly confirm phone confirmation. No online prepayment or cancellation implication is added. The owner contact, terms and landlord tenant page establish the one West Mall venue, not one entry per game or arena. Exact municipal boulevard number 15 is row 98466; the point is postal, not the mall floor or a verified arena entrance. Weekday hours conflict between mall and owner; no openingHours is assigned. No owner imagery, trademarks in a graphic asset, detailed marketing copy, personal information or reviews reused. No account, form, booking, phone call, map, geocoder, payment or production action.',
  inventoryIdentity: 'efe50eceeeb48cd536fac2a2290664ce15860c294195755295854fec9412de51',
}, {
  id: brainlandId, checkedOn, website: brainlandSite, bookingEntry: brainlandBook, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [brainlandSite, brainlandBook, brainlandService, brainlandAddressEvidence],
  notes: 'The public owner enrolment CTA for the current language courses opens the native request form; it is not a calendar or confirmed booking. The adult programme and its price FAQ offer classroom English in group or individual format, with a quote based on format and length, not any numerical tuition or fixed duration. The free placement test and consultation are not prices for the course. The current contact gives Lyulin 3 and Petar Bonev 319 with the same telephone found in the owner’s original site, which specifies block 319, entrance В, ground floor rather than house number 319. Official dataset uses the generic block-area label ж.к. Люлин and has four entrances for block 319; only the owner-specified Cyrillic В matches 30434 exactly. No nearest entrance or assumed administrative boundary, no second site, pupil contact, timetable, online course clone, forms submitted, owner photos or live availability imported.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: brainlandBook, serviceUrls: [brainlandService],
    notes: 'Read the actual public course-request entry and the adult language programme including the full published price FAQ. The provider explicitly quotes tuition by format and course length; no amount or unread price menu is offered for the selected adult English course.',
  },
  inventoryIdentity: '0c585c2b0a71ca51ec1e2ae7b344d7df7de9c6c0075447030bb2aaea5e350ac2',
}]
