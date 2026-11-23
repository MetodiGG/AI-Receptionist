// One location-specific trial request for the club's public 13+ dance group.
import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-infinity-team-strelbishte-bulgaria43'
const neighborhood = 'Стрелбище'
const address = 'София, ж.к. Стрелбище, бул. България 43, 126 ОУ „Петко Ю. Тодоров“'
const website = 'https://dancesportsofia.com/'
const schedule = `${website}schedule`
const booking = `${website}register`
const services = `${website}services`
const payments = `${website}payments`
const terms = `${website}terms`
const contact = 'https://www.infinityteambg.com/contacts'
const phone = '+359898418277'

export const INFINITY_INTAKE_20261123_RECORDS = [{
  id, name: 'Infinity Team · Стрелбище', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.673677, longitude: 23.296217,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '4111', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'fitness', website, phone,
  services: [{
    name: 'Пробна групова тренировка по спортни танци', category: 'fitness', appointmentModel: 'group_reservation',
    description: 'Пробна тренировка в групата за тийнейджъри и възрастни (13+) в залата на 126 ОУ. След заявката клубът ще се свърже с вас, за да уточни посещението.',
  }],
  booking: { kind: 'form', url: booking },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: booking, excerpt: 'Формулярът приема заявка за пробна тренировка с избор на зала. Клубът се свързва с кандидата за уточнение.' },
  },
}]

export const INFINITY_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: booking, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, schedule, booking, services, payments, terms, contact],
  notes: 'The club home page and schedule list a continuing teens-and-adults group, aged 13 and older, at 43 Bulgaria Blvd. The owner form has a venue choice naming this location; the terms explain the operator callback. No request was submitted. The municipal report, the host school and both owner domains corroborate the premise. The municipal point is for the civic school address, not a surveyed entrance or separate gym. The current local cohort has no record for this operator; another club using a school hall is not this operator. No unrelated location, published member data, third-party media, live appointment, or copied owner text is represented.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: booking, serviceUrls: [services, payments, schedule, terms],
    notes: 'The actual public trial-request form, branch group schedule, services, terms and owner payments page do not publish a tariff for this 13+ group trial. The stated monthly group-card prices and an individual-lesson booking link are different products; nothing implies that the trial is free or that an online fee is confirmed.',
  },
  inventoryIdentity: '380cf108c38c833f495ff4643de16cf344112cc97dd0fb0bf388f5b63e5ab906',
}]
