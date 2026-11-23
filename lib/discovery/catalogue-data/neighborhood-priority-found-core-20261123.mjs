import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-sparklab-mladost3-block304-3'
const website = 'https://sparklab.bg/'
const contact = `${website}contacts/`
const enrolment = `${website}zapisvane/`
const tariffUpdate = `${website}zapazvame-cenite-2026-2027/`
const phone = '+359876452447'
const neighborhood = 'Младост 3'
const address = 'София, ж.к. Младост 3, бл. 304, вх. 3, магазин 9'
const packageDescription = amount => `Еднократната цена е за 10 групови урока по 90 минути с включени материали. При разсрочване се плащат 2 вноски по ${amount} € преди първия и шестия урок. Подходящата група и началната дата се уточняват при записване.`
const programmes = [
  ['Курс по роботика · LEGO WeDo 2.0', 'lego-wedo-level-1/', 219, 115],
  ['Курс по роботика · LEGO Spike Essential', 'spike-essentials-level-2/', 219, 115],
  ['Курс по роботика · LEGO Spike Prime', 'lego-spike-prime-level-3/', 239, 129],
]

export const PRIORITY_FOUND_CORE_20261123_RECORDS = [{
  id, name: 'SparkLab · Младост 3', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  category: 'education', website, phone,
  coordinates: {
    latitude: 42.645418, longitude: 23.380369, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood,
    sourceWebsite: website, checkedOn, addressId: '95686', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: programmes.map(([name, path, amount, instalment]) => ({
    name, category: 'education', appointmentModel: 'appointment', description: packageDescription(instalment),
    price: { amount, currency: 'EUR', kind: 'fixed', unit: 'за ниво от 10 урока', sourceUrl: website + path, checkedOn },
  })),
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: enrolment, excerpt: 'Школата приема записване по телефона и потвърждава конкретната група, график и начало.' },
  },
}]

export const PRIORITY_FOUND_CORE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, enrolment, tariffUpdate, ...programmes.map(([, path]) => website + path), `${website}terms/`],
  notes: 'Followed the owner’s enrolment CTA, which explicitly names its local classrooms and published telephone alternative. The same number is identified as course enrolment on the owner contacts and school-year tariff announcement. No call, form submission, time selection, account, provider data or customer photos were used. The paid course pages and 2026/2027 owner announcement were reviewed on live public pages. WeDo and Spike Essential publish EUR 219 prepaid or two EUR 115 instalments; Spike Prime publishes EUR 239 prepaid or two EUR 129 instalments. Each headline tariff buys one 10-lesson level, not one lesson or all three levels. Materials are included; instalments are due before lessons one and six. No time or opening hours inferred: course age ranges, service schedules and office hours appear with inconsistent labels or represent named cohorts. No guest venues of that same provider are used as distinct new businesses.',
  inventoryIdentity: 'c7d27922a8c601c962811c57d30b9c39cfdc8902148a832d29e43ef0934d6850',
}]
