import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-sihia-nadezhda2-velezhki49g', name = 'Йога студио Сихиа'
const cityCode = '68134', neighborhood = 'Надежда 2', category = 'fitness'
const address = 'София, ж.к. Надежда 2, ул. Митрополит Авксентий Велешки 49, вх. Г'
const website = 'https://yogasihir.com/', phone = '+359897467119'
const contact = website + 'contacts/', prices = website + 'prices/'
const bookingUrl = website + 'schedule-reformer/', rules = website + 'rules/'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const SIHIA_NADEZHDA2_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.729507, longitude: 23.302035, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '99282', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Реформър пилатес · групова тренировка', category, appointmentModel: 'group_reservation',
    description: 'Цената е за 1 групово посещение без МултиСпорт. Записването е предварително. Отмени най-късно 4 часа преди тренировката. При късен отказ или неявяване се дължат 21 €; при неявяване ново записване е възможно след плащане на таксата.',
    price: { amount: 21, currency: 'EUR', kind: 'fixed', unit: 'едно посещение', sourceUrl: prices, checkedOn, validUntil },
  }],
  booking: { kind: 'form', url: bookingUrl },
  verification: { status: 'approved', checkedOn, validUntil, contact,
    booking: { url: bookingUrl, excerpt: 'Графикът на Сихиа води до системата за записване на студиото. За тази цена избери единично групово посещение без МултиСпорт.' },
  },
}]

export const SIHIA_NADEZHDA2_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: bookingUrl, bookingReview: 'provider_booking_reviewed',
  reviewedUrls: [website, contact, bookingUrl, prices, rules, OFFICIAL_SOFIA_SOURCE_URL,
    'https://reservation.studio/bg/location/ioga-studio-sixia'],
  inventoryIdentity: 'd077ded74ea88e9e4e91b5f81b916f38b508e2afb02e89cd141a4767e33fc43d',
  notes: 'Followed the studio-owned reformer schedule and confirmed its explicit handoff to the matching branch scheduler. The studio-owned price list publishes 21 EUR for one group visit, distinct from a private lesson or a pass. The currently served first-party rules specify a four-hour cancellation window and a 21 EUR Reformer no-show charge; the old cached 6 EUR text was not used. The civic coordinates are exact for entrance Г/RN99282, not the general location from the embedded map. Prices and operational terms are sourced from the studio; no automated scraping, platform content reuse, duration inference, login, slot selection, request, booking or notifications.',
}]
