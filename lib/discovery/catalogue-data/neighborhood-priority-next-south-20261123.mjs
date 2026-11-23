import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-drive-school-knyazhevo-tsar-boris365'
const website = 'https://drive-school.eu/'
const servicePage = `${website}program/bcategoria/`
const contact = `${website}contact/`
const about = `${website}about/`
const transportRegister = 'https://rta.government.bg/upload/18444/uchebni_centrove.html'
const neighborhood = 'Княжево'
const address = 'София, кв. Княжево, бул. Цар Борис III 365'

export const PRIORITY_NEXT_SOUTH_20261123_RECORDS = [{
  id, name: 'Drive School · Граматикови', cityCode: '68134', neighborhood, address,
  category: 'education', locationKind: 'premises', website, phone: '+359888237935',
  coordinates: {
    latitude: 42.658797, longitude: 23.241196,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '13849', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Стандартен шофьорски курс · категория B',
    category: 'education', appointmentModel: 'appointment',
    description: 'Курсът включва 38 учебни часа теория и 31 учебни часа кормуване. Отделно се заплащат 60 € за теоретичния изпит и 70 € за практическия изпит. Началната дата се уточнява с автошколата.',
    price: {
      amount: 1120, currency: 'EUR', kind: 'fixed', unit: 'за курса, без изпитни такси',
      sourceUrl: website, checkedOn,
    },
  }],
  openingHours: {
    days: [1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '19:00' }] })),
    sourceUrl: contact, checkedOn,
  },
  booking: { kind: 'form', url: servicePage },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: servicePage, excerpt: 'Бутонът за записване на страницата за категория B отваря собствен формуляр на автошколата. Не показва конкретен свободен час.' },
  },
}]

export const PRIORITY_NEXT_SOUTH_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: servicePage, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [servicePage, website, contact, about, transportRegister],
  notes: 'Opened the visible Book CTA of the first-party category B page in a fresh browser before reviewing fees; it opens the operator’s course enrollment modal with applicant inputs, no self-confirmed date. Nothing was typed or submitted. The category B page has no modal deep link, so retain the exact service page with its visible CTA. The native tariff separates the standard B course (1120 EUR) from theory and practical exam fees (60 EUR and 70 EUR); only the course is a service. The contact page confirms the precise venue and separately lists office hours; these are not an instructor timetable. The current public transport register entry 4239 independently matches the street number, public phone and B/B78 under the legal name AVTOKLUB 77. No direct Terms/Privacy anchor appeared on the public owner pages inspected; no public media copied. Existing local driving-lesson illustrations only; no inferred availability or published personal details.',
  inventoryIdentity: 'a03a9f7d566d9d28de649e893705145660406a5d9a456588a893d6209e747f30',
}]
