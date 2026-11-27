import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-soma-masazhi-zapaden-park-block5b', name = 'SOMA Studio · Масажи с Иван'
const cityCode = '68134', neighborhood = 'Западен парк', category = 'health'
const address = 'София, ж.к. Западен парк, бл. 5, вх. Б'
const website = 'https://massages-bg.com/', phone = '+359878444025'
const locationEvidence = 'https://www.oink.bg/biz/masazhi_s_ivan'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const VERIFIED_SOMA_ZAPADEN_PARK_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.701427, longitude: 23.281222, method: 'verified_official_address',
    source: OFFICIAL_SOFIA_SOURCE_URL, sourceAddress: address, sourceCityCode: cityCode,
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '47965',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Възстановителен масаж · 60 минути', category, appointmentModel: 'appointment',
    description: 'Масаж за отпускане и общ тонус. Техниката се уточнява при посещението; тарифата е за продължителността на сесията.',
    durationMin: 60, durationSourceUrl: website, durationCheckedOn: checkedOn,
    price: { amount: 60, currency: 'EUR', kind: 'fixed', sourceUrl: website, checkedOn, validUntil },
  }],
  openingHours: {
    days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({
      weekday, periods: [{ open: weekday < 6 ? '10:00' : '12:00', close: '20:00' }],
    })), sourceUrl: website, checkedOn,
  },
  booking: { kind: 'phone', phone },
  verification: { status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: website, excerpt: 'Студиото приема само с уговорен час и публикува телефон за записване.' } },
}]

export const VERIFIED_SOMA_ZAPADEN_PARK_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, locationEvidence, OFFICIAL_SOFIA_SOURCE_URL],
  inventoryIdentity: '965321f6f2d7ea7651a3c673bfc764ac993cfa5cdb18dcf3838ff950b6fa6b42',
  notes: 'The practitioner specifies visits by appointment only and publishes the business telephone with the exact block, hours and duration-based rates. The service menu describes a wellness massage for relaxation; the literal public 60-minute rate is EUR 60. No other techniques, clinical claims, age-specific work or treatment outcomes listed. The owner links the named customer venue; separate venue evidence links the same website, block and entrance B and points within 2 metres of civic RN47965. No calls, appointments, forms, calendars or CMS changes.',
}]
