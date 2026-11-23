import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-logos152-simeonovo-krairechna10'
const website = 'https://www.logos152.com/'
const premises = `${website}about-us`
const english = `${website}english`
const groups = `${website}grypovizanimaniq`
const individual = `${website}angliiski-za-vuzrasthni`
const neighborhood = 'Симеоново'
const address = 'София, кв. Симеоново, ул. Крайречна 10, читалище „Отец Паисий“'
const phone = '+359879276311'

export const SPARSE_SOUTH_INTAKE_20261123_RECORDS = [{
  id, name: 'Логос 152 · Симеоново', cityCode: '68134', neighborhood, address,
  locationKind: 'premises', category: 'education', website, phone,
  coordinates: {
    latitude: 42.61345, longitude: 23.338174, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '91042',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Групов курс по английски език за ученици', category: 'education',
    description: 'Присъствени занятия за ученици от 1. до 5. клас в групи до 15 деца. За записване и такса се свържете с центъра.',
    appointmentModel: 'group_reservation',
  }, {
    name: 'Индивидуален урок по английски език', category: 'education',
    description: 'Присъствено обучение за възрастни и деца. Уточнете програмата, часа и таксата с центъра.',
    appointmentModel: 'appointment',
  }],
  openingHours: {
    days: [1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '18:30' }] })),
    sourceUrl: website, checkedOn,
  },
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: website, excerpt: 'От страниците за групови и индивидуални курсове записването води до контактите на езиковия център. За Симеоново е публикуван телефон.' },
  },
}]

export const SPARSE_SOUTH_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, premises, english, groups, individual, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The two English programme enrolment links lead to the owner contact section with a phone for the Simeonovo branch. The owner identifies the community-centre premises and confirms that group and individual language lessons take place there. The contact hours do not imply that lesson times are available.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: website, serviceUrls: [english, groups, individual, premises],
    notes: 'The owner contact-based enrolment path, English programme index and both individual programme pages were reviewed. No tariff or lesson duration is published for these two services on the accessed pages; no assumption is made about the general documents list that did not render.',
  },
  inventoryIdentity: '04c7d453a43f70fb7f4e61bcbbf325577f7390bcff244a210c7d08dbc6b768f9',
}]
