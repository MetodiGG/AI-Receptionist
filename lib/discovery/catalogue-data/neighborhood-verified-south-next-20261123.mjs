import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-elizabet-ritmika-dragalevtsi-bela-dona1'
const website = 'https://elizabet-ritmika.com/'
const contact = `${website}kontakti/`
const programmes = `${website}klubat/`
const groups = `${website}sastezatelki/`
const neighborhood = 'Драгалевци'
const address = 'София, кв. Драгалевци, ул. Бела Дона 1, 50. ОУ „Васил Левски“'
const phone = '+359879544666'

export const VERIFIED_SOUTH_NEXT_20261123_RECORDS = [{
  id, name: 'Елизабет – Ритмика · Драгалевци', cityCode: '68134', neighborhood, address,
  locationKind: 'premises', category: 'fitness', website, phone,
  coordinates: {
    latitude: 42.629395, longitude: 23.309479, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '11476',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Групова художествена гимнастика за деца', category: 'fitness',
    description: 'Запишете първа тренировка по телефон. Клубът уточнява подходящата група според възрастта и нивото, както и графика и таксата за залата в Драгалевци.',
    appointmentModel: 'group_reservation',
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: contact, excerpt: 'Клубът приема записвания за първа тренировка по телефон и посочва 50. ОУ като тренировъчната си база в Драгалевци.' },
  },
}]

export const VERIFIED_SOUTH_NEXT_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, programmes, groups, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The operator invites telephone enquiries for enrolment and offers a first training session. Its branch list directly names 50th school in Dragalevtsi as a training venue. The group programme describes age and skill brackets, but does not assign each to a particular location or schedule; the club confirms the correct group and room schedule at enrolment.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: contact, serviceUrls: [programmes, groups],
    notes: 'Reviewed the actual phone enrolment path on the contact page and the owner pages for training and age groups. None advertises a first-session fee, standard group tariff, duration or branch schedule. First session is not assumed free.',
  },
  inventoryIdentity: 'a6a4345a75c64683b3f505082ba357e92c412a74b781d04113d8708ff967a891',
}]
