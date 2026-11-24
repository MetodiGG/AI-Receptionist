import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-salt-hug-druzhba1-block195v'
const neighborhood = 'Дружба 1'
const address = 'София, ж.к. Дружба 1, бл. 195, вх. В'
const website = 'https://salthug.eu/'
const booking = website + 'solna-staya-sofia/'
const contact = website + 'kontakti/'
const faq = website + 'chesto-zadavani-vaprosi-solna-staya/'
const prices = website + 'ceni/'
const phone = '+359893502073'

export const SALT_HUG_INTAKE_20261123_RECORDS = [{
  id, name: 'Salt Hug · Дружба 1', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.663708, longitude: 23.403790,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '102668', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'health', website, phone,
  services: [{
    name: 'Солна стая за възрастен · едно посещение',
    category: 'health', appointmentModel: 'appointment',
    description: 'Самостоятелно посещение за възрастен след записване. Пристигнете 5 минути по-рано. Операторът посочва ограничения при температура над 37 °C, туберкулоза (включително преболедувана) или онкологично заболяване.',
    price: { amount: 10, currency: 'EUR', kind: 'fixed', unit: 'едно посещение', sourceUrl: prices, checkedOn, validUntil },
    durationMin: 40, durationSourceUrl: prices, durationCheckedOn: checkedOn,
  }],
  openingHours: {
    days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: weekday <= 5 ? '14:00' : '10:00', close: '20:00' }] })),
    checkedOn, sourceUrl: contact,
  },
  booking: { kind: 'phone', phone },
  verification: { status: 'approved', checkedOn, validUntil, contact,
    booking: { url: booking, excerpt: 'Страницата за посещението посочва телефон за предварително записване. Часът се уточнява директно с оператора.' } },
}]

export const SALT_HUG_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, booking, contact, prices, faq],
  notes: 'Checked the owner’s actual physical session booking section and public phone first, corroborated by its FAQ search reading and contact page, then the matching adult price lane in the owner tariff. The independently confirmed, fixed EUR 10 is for one adult and one 40-minute booking; the operator describes private sessions and early arrival. Its stated visit restrictions are neutral facts about its premises, not healthcare or benefits claims. A separate online booking provider declined access; its calendar, fees and slots were not used. Other inconsistent dual-currency packages, group/child visits, and medical marketing are not listed. Exact entrance В is the unique municipal match for building 195 in Искър. No contact, forms, bookings, medical advice, paid requests, or partner status.',
  inventoryIdentity: '5f8964050dd78359c2095847a371ad30e701dd720dd426364724d2fb7322dff7',
}]
