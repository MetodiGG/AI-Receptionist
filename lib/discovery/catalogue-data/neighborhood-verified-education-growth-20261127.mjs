import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-27', validUntil = '2026-12-18'
const cityCode = '68134', neighborhood = 'Овча купел 2', category = 'education'
const id = 'sofia-reya-kids-ovcha-kupel2-ivan-hadzhiyski3'
const website = 'https://reya-kids.com/', phone = '+359889934166'
const address = 'София, ж.к. Овча купел 2, ул. Иван Хаджийски 3, партер'
const contact = `${website}kontakti/`, enrolment = `${website}zapisvane-na-deca/`
const english = `${website}nashite-uslugi/angliyski-ezik.html`
const studio = {
  id: 'sofia-art-academy-banishora-kozloduy128', name: 'Арт Академи · Банишора', neighborhood: 'Банишора',
  address: 'София, Банишора, ул. Козлодуй 128, партер', website: 'https://azrisuvam.com/', phone: '+359887081468',
}
const groupPainting = `${studio.website}teambuilding/`

export const VERIFIED_EDUCATION_GROWTH_20261127_RECORDS = [{
  id, name: 'Reya Kids · Овча купел 2', cityCode, neighborhood, address, category, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.688667, longitude: 23.244790, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    checkedOn, addressId: '111474', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
  },
  services: [{
    name: 'Неделен курс по английски език за деца', category,
    description: 'Присъствен групов курс за ученици в начален етап, с упражнения по четене, говорене и основна граматика. Групите са до 6 деца. Записването и условията се уточняват по телефона.',
    appointmentModel: 'group_reservation',
  }],
  booking: { kind: 'phone', phone },
  verification: { status: 'approved', checkedOn, validUntil, contact, booking: {
    url: enrolment,
    excerpt: 'Записване на деца по телефона. Страницата за неделния курс изрично посочва същия телефон за записване за курса в Овча купел 2.',
  } },
}, {
  ...studio, cityCode, category, locationKind: 'premises',
  coordinates: {
    latitude: 42.708012, longitude: 23.311259, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    checkedOn, addressId: '28880', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    sourceAddress: studio.address, sourceCityCode: cityCode, sourceNeighborhood: studio.neighborhood, sourceWebsite: studio.website,
  },
  services: [{
    name: 'Частно ателие по рисуване за екипи · 5–10 души', category,
    description: 'Водено ателие само за екип от 5 до 10 души. Професионален художник демонстрира техниката и помага при рисуването; не е нужен предишен опит. Сюжетът, материалът, датата и цената се уточняват предварително с ателието.',
    appointmentModel: 'group_reservation',
  }],
  booking: { kind: 'phone', phone: studio.phone },
  verification: { status: 'approved', checkedOn, validUntil, contact: studio.website, booking: {
    url: groupPainting,
    excerpt: 'Страницата кани екипите да се свържат с ателието в Банишора и да уговорят частно ателие за 5–10 души. Цената е по запитване.',
  } },
}]

export const VERIFIED_EDUCATION_GROWTH_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, enrolment, english, contact, OFFICIAL_SOFIA_SOURCE_URL, 'https://superdoc.bg/lekar/rayna-metodieva'],
  notes: 'The operator’s school-age Sunday group page states the exact street number, quarter and course enrolment telephone. The operator’s enrolment page repeats that telephone. The separate appointment provider linked there confirms the ground-floor location and offers speech-therapy appointments, not this course; its bookings and fees are excluded. The municipal point is for the civic address, not a surveyed entrance. No booking was made.',
  inventoryIdentity: '7076b8945df2b92690c7dfbd134a0120ad94f10b549c5dd4057fb7b49ab802f4',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: enrolment, serviceUrls: [english],
    notes: 'The reachable first-party Sunday-course menu and published telephone enrolment instructions do not list a course fee. Fees listed by the distinct speech-therapy provider are not English-course prices.',
  },
}, {
  id: studio.id, website: studio.website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [studio.website, groupPainting, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Followed the owner’s team-workshop offer to the published Banishora branch contact and beginner package for a private group of five to ten. A professional artist guides the activity. The owner offers a private booking by enquiry, not an open class or a slot GoRez can confirm. Matched the exact street number in the municipal register. No published dated cohort, promotional amount or package for another group size was admitted; no booking was made.',
  inventoryIdentity: '058957b05cdf7e9b82f9fc7331522e215594227fab2fc44f3fdfd52136fc017a',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: groupPainting, serviceUrls: [groupPainting],
    notes: 'The first-party workshop menu and telephone enquiry instructions are on the same page. The private five-to-ten-person workshop is priced on request. Dated public class prices elsewhere on the site do not apply to this package.',
  },
}]
