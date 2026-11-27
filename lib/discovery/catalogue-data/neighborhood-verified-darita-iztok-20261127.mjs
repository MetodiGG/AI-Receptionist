import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-darita-iztok-lachezar-stanchev5'
const name = 'Творческо студио Дарита'
const cityCode = '68134', neighborhood = 'Изток', category = 'education'
const address = 'София, ж.к. Изток, ул. Лъчезар Станчев 5, Софарма Бизнес Тауърс, ет. 2, офис 105'
const website = 'https://www.darita-bg.com/', phone = '+359887078927'
const enrollment = website + 'blog/2026/09/04/записване-за-нов-сезон-20262027-в-творческо-с/'
const contact = website + 'начало/контакти/'
const courses = website + 'курсове-по-рисуване-и-приложни-изкуства/'
const tariff = website + 'начало/цени/'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const VERIFIED_DARITA_IZTOK_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.665821, longitude: 23.356624, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '34655', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [
    {
      name: 'Групов урок по рисуване за деца',
      category, appointmentModel: 'group_reservation',
      description: 'Цената е за едно посещение в група (2 учебни часа). Денят и мястото в групата се уточняват по телефона.',
      price: { amount: 30, currency: 'EUR', kind: 'fixed', unit: 'едно посещение · 2 учебни часа', sourceUrl: tariff, checkedOn, validUntil },
    },
    {
      name: 'Индивидуален урок по рисуване за деца',
      category, appointmentModel: 'appointment',
      description: 'Цената е за индивидуален урок от 2 учебни часа. Часът се уговаря предварително по телефона.',
      price: { amount: 40, currency: 'EUR', kind: 'fixed', unit: 'един урок · 2 учебни часа', sourceUrl: tariff, checkedOn, validUntil },
    },
  ],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: {
      url: enrollment,
      excerpt: 'За записване за занимания по рисуване през учебната 2026/2027 г. студиото посочва телефон +359 88 707 8927. Денят, групата или индивидуалният час се уточняват със студиото.',
    },
  },
}]

export const VERIFIED_DARITA_IZTOK_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, enrollment, courses, tariff, contact, 'https://businesstowers.bg/за-нас/sopharma-towers/', OFFICIAL_SOFIA_SOURCE_URL],
  inventoryIdentity: '5b362185e50bc3c6c03106cf834075e00ad97d86f57fc2c494019742438f6078',
  notes: 'Reviewed the operator’s actual phone/Viber handoff for the 2026/2027 season, then its drawing course and current season tariff. EUR 30 is the published total for one group visit of 2 school periods; EUR 40 is for one individual lesson of 2 school periods. No assumed minutes, availability, trial offer, package, or monthly price. The owner names the customer-facing art studio, floor 2 / office 105, and the venue operator corroborates the full civic address and Iztok neighbourhood; the pin identifies the site, not an indoor office or individual tower entrance. Public pages were read without submitting or copying source content or imagery. Review conservatively closes on 27 December instead of assuming ongoing enrollment or unchanged rates for the full academic year.',
}]
