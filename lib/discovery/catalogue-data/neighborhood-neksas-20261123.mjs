import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23'
const id = 'sofia-neksas-academy-chelopechene-yane28'
const website = 'https://neksas-bg.com/'
const course = new URL('заварчик/', website).href
const academy = new URL('за-нексас-академия/', website).href
const brochure = website + 'wp-content/uploads/2026/01/Brochure2.pdf'
const courseOutline = website + 'wp-content/uploads/2024/04/WELDER.pdf'
const contacts = website + 'contact-us/'
const phone = '+359884047399'
const neighborhood = 'Челопечене'
const address = 'София, кв. Челопечене, ул. Яне Стоянов 28'
const enrollmentNotice = new URL('2025/02/26/курс-за-квалификация-по-част-от-профес/', 'https://bws-bg.org/').href

export const NEKSAS_INTAKE_20261123_RECORDS = [{
  id, name: 'Нексас Академия', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.735230, longitude: 23.469965,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '103636', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'education', website, phone,
  services: [{
    name: 'Присъствен курс по заваряване', category: 'education', appointmentModel: 'appointment',
    description: 'Теория и практика по предварително съгласуван график. За кандидати, навършили 16 години, със завършен поне 6. клас. Условията за прием, датите и таксата се уточняват с академията.',
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil: '2026-12-23',
    booking: { url: course, excerpt: 'Присъствен курс с предварително съгласуван график. Публикуваният телефон на академията се използва за информация и записване.' },
    contact: contacts,
  },
}]

export const NEKSAS_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, course, academy, brochure, courseOutline, contacts, enrollmentNotice,
    'https://www.damtn.government.bg/wp-content/uploads/2019/03/sofia-1.pdf'],
  notes: 'The specific first-party course lists in-person enrolment conditions and a mutually arranged schedule. The operator publishes the verified phone on the course and contact pages, and its identical phone is expressly given for booking this exact course in its academy announcement carried by the Bulgarian Welding Union. The general online quote form is for engineering products and services; it is not a course booking action. The owner brochure and the state registry corroborate the premises. Only this course, not an inspector course across multiple venues, a qualification guarantee or other industrial services.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: course, serviceUrls: [course, academy, brochure, courseOutline, contacts],
    notes: 'Inspected the rendered precise course and public enrollment route first, then academy information, the current owner brochure, the course outline and official contacts. None lists a course fee or a separate booking tariff. Duration varies; no fixed hours or guaranteed availability inferred.',
  },
  inventoryIdentity: '10d2d458b4ca23a9a387f837df5d9944b96114d72db4ea5bcd03579602b6db30',
}]
