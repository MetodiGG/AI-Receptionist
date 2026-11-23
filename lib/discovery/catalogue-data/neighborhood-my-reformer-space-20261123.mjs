// One reserved group format, at the verified studio on Vladimir Vazov.
import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-my-reformer-space-levski-g-vazov39'
const neighborhood = 'Левски Г'
const address = 'София, ж.к. Левски Г, бул. Владимир Вазов 39, ет. 3'
const website = 'https://myreformerspace.bg/'
const contact = `${website}контакти/`
const prices = `${website}цени/`
const faq = `${website}чзв/`
const service = `${website}пилатес-реформър/`
const terms = `${website}общи-условия/`
const visitorGuide = `${website}условия/`
const calendar = 'https://book.myreformerspace.bg/calendar/public'
const phone = '+359878714300'

export const MY_REFORMER_SPACE_INTAKE_20261123_RECORDS = [{
  id, name: 'My Reformer Space', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.710434, longitude: 23.377636,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '98103', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'fitness', website, phone,
  services: [{
    name: 'Пилатес реформър – еднократна групова тренировка', category: 'fitness', appointmentModel: 'group_reservation',
    description: 'Едно групово занимание от 50 минути с предварителна резервация. Цената включва ДДС. Не се приемат карти MultiSport. Отмяна до 24 часа преди часа; при по-късна отмяна или неявяване публикуваните онлайн условия предвиждат пълна такса.',
    price: { amount: 18, currency: 'EUR', kind: 'fixed', unit: 'едно групово посещение', sourceUrl: prices, checkedOn, validUntil },
    durationMin: 50, durationSourceUrl: prices, durationCheckedOn: checkedOn,
  }],
  openingHours: {
    days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '07:00', close: '21:00' }] })),
    sourceUrl: contact, checkedOn,
  },
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: faq, excerpt: 'Студиото изрично приема резервации по телефон, а ценоразписът посочва номера за този обект.' },
  },
}]

export const MY_REFORMER_SPACE_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, faq, calendar, contact, service, prices, terms, visitorGuide],
  notes: 'The owner-linked public calendar was rendered read-only and visibly names a group session for Studio 1 with a booking action. No date or booking target was clicked; no price or availability was inferred from that schedule. The owner FAQ explicitly authorises direct telephone reservations, and the exact owner tariff and contact page publish the same phone for the studio at no. 39 on floor 3. The regular group Reformer session is EUR 18 including VAT, one prebooked class of 50 minutes, not a subscription or MultiSport admission. Online late-cancellation and no-show fees are described with their proper scope, not inferred from providers. Full terms and visitor guide reviewed; the listing uses independently worded facts and no owner images. Venue hours are commercial opening hours, not class slots. The merchant point is the unique municipal building postal point; floor 3 is source address, not a separately surveyed floor coordinate. No accounts, dates selected, calls, form submissions, booking, payments or client details.',
  inventoryIdentity: '8d92052c42bfb0283a765d94d32eb803a3777dffbee5fbc16a6c1fdd9444163e',
}]
