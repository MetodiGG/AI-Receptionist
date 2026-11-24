import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-jolly-kids-pavlovo-duychev12v'
const website = 'https://jollykids.bg/'
const programme = `${website}afternoon-classes-4-7`
const contact = `${website}contact`
const terms = `${website}general-terms`
const privacy = `${website}privacy-policy`
const phone = '+359889050604'
const neighborhood = 'Павлово'
const address = 'София, кв. Павлово, ул. Проф. Иван Дуйчев 12В'

export const PRIORITY_FOUND_SOUTH_20261123_RECORDS = [{
  id, name: 'Джоли Кидс · Павлово', cityCode: '68134', neighborhood, address,
  category: 'education', locationKind: 'premises', website, phone,
  coordinates: {
    latitude: 42.660216, longitude: 23.267109,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '103070', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Английски за деца на 4–7 г. · Jolly Phonics',
    category: 'education', appointmentModel: 'group_reservation',
    description: 'Присъствен курс по четене и писане на английски. Запитване по телефона. Записването е при свободни места, с договор и депозит от една месечна такса. Депозитът покрива последната месечна такса или едномесечното предизвестие, ако то е спазено.',
    price: { amount: 165, currency: 'EUR', kind: 'fixed', unit: 'месечна такса', sourceUrl: programme, checkedOn },
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: programme, excerpt: 'Курсът Jolly Phonics води към отделния телефон за седмичните програми в Павлово. Условията описват записване с договор и депозит.' },
  },
}]

export const PRIORITY_FOUND_SOUTH_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, programme, contact, terms, privacy],
  notes: 'Followed the owner’s Jolly Phonics inquiry link to the phone explicitly dedicated to weekday Pavlovo programmes; the operator states that course registration can be initiated by phone. Places require individual agreement and deposit under the general terms; the deposit counts toward the final month or the duly observed one-month notice, not a separate implied surcharge. The fee is monthly, distinct from annual tuition, trial offers and weekend packages. The two educational operators at 12V have distinct legal identities and enrolment contacts. No live vacancy, premises hours or trial promise imported.',
  inventoryIdentity: 'bb857622a50a0367b9b837c3347481b8c8b74be14d1bac5d4bc722d9da18e7b2',
}]
