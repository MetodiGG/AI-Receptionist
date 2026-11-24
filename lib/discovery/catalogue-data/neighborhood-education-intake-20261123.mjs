import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-part-time-pavlovo-duychev12v'
const website = 'https://part-time.bg/'
const theatre = `${website}drama-class-index`
const contact = `${website}contact-index`
const phone = '+359888250355'
const neighborhood = 'Павлово'
const address = 'София, кв. Павлово, ул. Проф. Иван Дуйчев 12В'

export const EDUCATION_INTAKE_20261123_RECORDS = [{
  id, name: 'Парт Тайм · Павлово', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.660216, longitude: 23.267109,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '103070', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'education', website, phone,
  services: [{
    name: 'Групово актьорско майсторство на английски за деца', category: 'education', appointmentModel: 'group_reservation',
    description: 'Присъствени театрални занимания на английски в групи за 7–9 и 9–12 г. Центърът уточнява групата, графика и цената по телефона. Безплатното пробно посещение е отделно от редовните занимания.',
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil,
    booking: { url: theatre, excerpt: 'Страницата за театралните групи посочва 0888 250 355 за записване; центърът уточнява подходящата група.' },
    contact,
  },
}]

export const EDUCATION_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, theatre, contact, `${website}english-for-kids-index`],
  notes: 'Followed the first-party trial CTA and checked the public telephone enrolment route for two regular drama groups. The free trial and unrelated English-course fees are not theatre tuition. Current owner pages give the same phone, quarter, street and abbreviated no. 12; public owner-authored publication and Sofia Plays corroborate 12В. Municipal row 103070 binds that exact address. No other venue, photo, fixed service duration, opening hours or unconfirmed free slot imported.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: theatre, serviceUrls: [theatre, contact, `${website}english-for-kids-index`],
    notes: 'The public trial entry and phone enrolment instructions, regular programme and owner contact do not publish a tariff for the recurring theatre class. Any general English tuition or free trial is separate.',
  },
  inventoryIdentity: 'b3536caaf7ee5dce3a80be41a43e1b3df6c4cac836ebc89f4943717f96dacca6',
}]
