import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-ucha-land-dianabad-novachnitsa3'
const neighborhood = 'Дианабад'
const address = 'София, кв. Дианабад, ул. Новачница 3, зала Уча Ленд'
const website = 'https://uchaland.com/'
const booking = `${website}shakh/`

export const COURSES_RECREATION_INTAKE_20261123_RECORDS = [{
  id, name: 'Уча Ленд · Дианабад', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.665446, longitude: 23.349114,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '108404', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'education', website, phone: '+359887433190',
  services: [{
    name: 'Групов курс по шах за деца', category: 'education', appointmentModel: 'group_reservation',
    description: 'Карта за 10 занятия за начинаещи или напреднали в периода ноември 2026 – март 2027 г. Към картата са обявени и пет турнира. За всяко занятие се изисква предварително записване и поне шестима записани. Формулярът е заявка за контакт, а не потвърдено място.',
    price: { amount: 100, currency: 'EUR', kind: 'fixed', unit: 'карта за 10 посещения', sourceUrl: booking, checkedOn, validUntil },
  }],
  booking: { kind: 'form', url: booking },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: booking,
    booking: { url: booking, excerpt: 'На страницата на курса по шах родител може да остави контакт за обратна връзка от школата.' },
  },
}]

export const COURSES_RECREATION_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: booking, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, booking, `${website}zanimaniya-za-vuzrastni/`],
  notes: 'Opened the actual public reserve-a-child-place form on the provider’s chess course page before reviewing the tariff and confirmed the exact course venue, Nov 2026–Mar 2027 term, beginner and advanced groups, EUR 100 per ten-visit pass, and the five associated tournaments. The form is an inquiry with a provider callback, not a live calendar or a confirmed slot. Every class needs advance registration and a group of at least six. The separately promoted adult audience is not covered by this child-oriented form; no adult claim, per-visit amount, other hall, opening hours, class availability, copied content, accounts, form entry, requests, bookings, payments or affiliate claims.',
  inventoryIdentity: 'acc02d09d23e8358facc3000233a1246278bcae86c7301f456cc153f865e9f35',
}]
