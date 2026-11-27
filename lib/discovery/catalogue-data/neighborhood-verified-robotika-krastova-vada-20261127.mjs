import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-robotika-krastova-vada-sasho-nikolov7', name = 'Академия Роботика · Кръстова вада'
const cityCode = '68134', neighborhood = 'Кръстова вада', category = 'education'
const address = 'София, кв. Кръстова вада, ул. Сашо Николов-Сладура 7, зад Smile Center'
const website = 'https://robotika.bg/robotika-5-6', phone = '+359879205253'
const bookingEntry = 'https://robotika.bg/register-course?group=0zem7woxl'
const contact = 'https://robotika.bg/kontakti', terms = 'https://robotika.bg/obshti-uslovia-robotika'
const checkedOn = '2026-11-27'
// This is the application for one dated cohort. The catalogue stops
// advertising it before its first class, not at the end of its seven classes.
const validUntil = '2026-12-10'

export const ROBOTIKA_KRASTOVA_VADA_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.653782, longitude: 23.319496, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: cityCode,
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn,
    addressId: '111654', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Роботика за 5-годишни с Kubo · I ниво · група от 11 декември', category,
    appointmentModel: 'group_reservation',
    description: 'Присъствен курс за 5-годишни: 7 занятия по 60 мин. Начало: 11.12.2026 г., 18:30 ч. Цената е за целия курс при еднократно плащане; разсрочено: 2 × 86 €. Академията потвърждава приема и датите. Плащане по банка след записване; пропуснати занятия не се наваксват.',
    price: { amount: 158, currency: 'EUR', kind: 'fixed', unit: 'цял курс · 7 занятия по 60 минути', sourceUrl: bookingEntry, checkedOn, validUntil },
  }],
  booking: { kind: 'form', url: bookingEntry },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: bookingEntry, excerpt: 'София / Кръстова вада / 11.12 от 18:30 / петък. Формата е за записване за конкретната група. Приемът и плащането са при Академия Роботика.' },
  },
}]

export const ROBOTIKA_KRASTOVA_VADA_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [bookingEntry, website, contact, terms],
  inventoryIdentity: 'c7e0413463a33e0c71a7b7fecb664c04dddd4a6acd6ddee01cc82fc9664c00b2',
  notes: 'Reviewed the actual public Book entry in a clean Chrome session, HTTP 200. The readonly selection was Sofia / Krastova Vada / 11.12 at 18:30 / Friday; pay once showed EUR 158 and the alternative is two payments of EUR 86 each. The exact branch row of the current owner programme independently lists level I Kubo for five-year-olds and seven classes of 60 minutes. No timetable for the complete run is published yet; no refunds, alternative dates or admission were inferred. The early expiry excludes the course from the day it starts. The owner contact independently names №7 and the Smile Center access landmark. Other Robotika branches have different street addresses and registration links. No account, appointment, availability claim, submitted fields or copied course material.',
}]
