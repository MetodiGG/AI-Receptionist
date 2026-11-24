// One dental service with a public tariff at the operator's verified premises.
import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-nikolay-frantsov-druzhba1-block18v'
const neighborhood = 'Дружба 1'
const address = 'София, ж.к. Дружба 1, бл. 18, вх. В'
const website = 'https://nikolayfrantsov.bg/?page_id=9085'
const booking = 'https://superdoc.bg/lekar/nikolay-frantsov'
const providerTerms = 'https://superdoc.bg/uslovia-za-polzvane'
const phone = '+359888827736'

export const FRANTSOV_INTAKE_20261123_RECORDS = [{
  id, name: 'Д-р Николай Францов · дентален кабинет', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.667523, longitude: 23.394763,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '34860', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'other', website, phone,
  services: [{
    name: 'Първичен дентален преглед', category: 'other', appointmentModel: 'appointment',
    description: 'Първо посещение с преглед и създаване на досие. Цената е публикувана в Superdoc. За процедури по НЗОК кабинетът моли да носите здравноосигурителната си книжка.',
    price: { amount: 25, currency: 'EUR', kind: 'fixed', sourceUrl: booking, checkedOn, validUntil },
  }],
  openingHours: {
    days: [
      ...[1, 2, 3, 4].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '19:00' }] })),
      { weekday: 5, periods: [{ open: '09:00', close: '17:00' }] },
    ],
    sourceUrl: website, checkedOn,
  },
  booking: { kind: 'form', url: booking },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: website, excerpt: 'Кабинетът предлага записване за първичен преглед и води към собствения си публичен профил в Superdoc за същия адрес и телефон.' },
  },
}]

export const FRANTSOV_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: booking, bookingReview: 'provider_booking_reviewed',
  reviewedUrls: [website, booking, providerTerms],
  notes: 'The dentist’s first-visit page explicitly offers an initial in-office examination and links this public Superdoc booking profile. The profile names the same sole office, block, entrance and phone, describes the ordinary examination as eligible for online booking, and lists its EUR 25 price. The listing uses that exact external channel and does not assume the telephone price or include a treatment, the separate scaling offer or an insurance entitlement. Published office hours are not live availability. Only one premises is imported, without the apartment number, copied prose, photographs, reviews or customer information. No date was selected, and no data, call, payment or appointment was submitted.',
  inventoryIdentity: '03167dd5db5316d8f0d00dce6701e7fa329b6719859b057fc7d20ac424a8ca48',
}]
