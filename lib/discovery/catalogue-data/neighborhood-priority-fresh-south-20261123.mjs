import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-magazinche-za-znanie-lyulin2'
const website = 'https://rannorazvitie.com/'
const phone = '+359877666626'
const neighborhood = 'Люлин 2'
const address = 'София, ж.к. Люлин 2, ул. Стефана Клинчарова 3, 90. СУ'

export const PRIORITY_FRESH_SOUTH_20261123_RECORDS = [{
  id, name: 'Магазинче за знание', cityCode: '68134', neighborhood, address,
  category: 'education', locationKind: 'premises', website, phone,
  coordinates: {
    latitude: 42.725397, longitude: 23.252730,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '91464', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Групов урок по английски за деца',
    category: 'education', appointmentModel: 'appointment',
    description: 'Групово занимание с игри и песни. Групата се определя според възрастта и нивото на детето. Необходимо е предварително записване по телефона.',
    price: { amount: 15, currency: 'EUR', kind: 'fixed', unit: 'на занимание', sourceUrl: website, checkedOn },
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: website, excerpt: 'Обявата за записване за детски английски посочва отделен телефон и зала в 90. СУ. Страницата за курса изисква предварително записване.' },
  },
}]

export const PRIORITY_FRESH_SOUTH_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website],
  notes: 'Read the live owner-hosted English enrolment poster in its normal webpage before checking the tariff. The poster visibly supplies the English-specific registration phone and street/school location; the different general/swimming number was not substituted. The English programme lists a single session fee and a pre-registration requirement; the dated 2026/27 timetable corroborates grouped English instruction, not live availability or office hours. The identical postal point on the existing DPool listing is shared school premises, not shared ownership, phone or service. No calls, submissions or images copied. No public terms or privacy anchor surfaced on the displayed owner pages; verification is limited to the listed factual offer.',
  inventoryIdentity: '19310d0527ecdd76c77a757a5ddced0e1d66b0a49adfdccf7ff9b8711a991462',
}]
