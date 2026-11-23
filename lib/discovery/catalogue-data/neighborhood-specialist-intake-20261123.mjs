import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-mushmula-poligona-tsarigradsko111v'
const neighborhood = 'Полигона'
const address = 'София, кв. Полигона, бул. Цариградско шосе 111В, зала Momentum'
const website = 'https://mushmula.bg/'
const contact = `${website}kontakti`
const service = `${website}hiit-circuit-s-lili`
const booking = `${website}grafik-momentum-teh-park`
const terms = `${website}obshi-usloviya-za-polzvane`
const host = 'https://momentumclimbing.bg/tsarigradsko-shose/'

export const SPECIALIST_INTAKE_20261123_RECORDS = [{
  id, name: 'Мушмула · София Тех Парк', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.665440, longitude: 23.374522,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '112232', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'fitness', website, phone: '+359899802855',
  services: [{
    name: 'Групова HIIT тренировка', category: 'fitness', appointmentModel: 'group_reservation',
    description: 'Едно присъствено посещение на кръгова интервална тренировка. Изискват се предварително записване и поне двама записани. За сутрешните тренировки записването е до 19:00 ч. предния ден.',
    price: { amount: 8, currency: 'EUR', kind: 'fixed', unit: 'едно групово посещение', sourceUrl: booking, checkedOn, validUntil },
  }],
  booking: { kind: 'form', url: booking },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: booking, excerpt: 'Страницата на HIIT тренировката води до графика за зала Momentum, където груповото занимание присъства в календара за записване.' },
  },
}]

export const SPECIALIST_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: booking, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, service, booking, terms, contact, host],
  notes: 'Followed the actual Sign up now CTA on the owner’s HIIT Circuit service page to the owner’s Momentum/Tech Park branch calendar. Chromium rendered the merchant’s embedded public menu for GymArea 514 read-only showing the named HIIT Circuit group. The branch tariff quotes a single in-person visit at EUR 8, distinct from multipacks, cards and the separately charged Reformer service. Retain advance registration and the branch’s two-participant minimum, with the previous-day 19:00 cutoff for morning classes. No service schedule, duration or availability is claimed. The separate MultiSport access program’s rules are not applied to this paid visit. The branch route and municipal record resolve the actual building; the business contact is not a substitute address. Link only to the owner page; no embedded third-party content, copied text, dates selected, login, submission, booking, consent choice, payment or live customer data.',
  inventoryIdentity: 'b1758d087bc103af576e094313d4c29ef091ff81416c3da4c582ff58e3b58753',
}]
