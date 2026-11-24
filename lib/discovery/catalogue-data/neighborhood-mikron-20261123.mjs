import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-mikron-dotsev-knyazhevo-tsarboris298'
const website = 'https://www.mikrondocev.com/'
const contact = website + 'contact-us'
const serviceMenu = website + 'services-view'
const bookingUrl = 'https://reservation.mikrondocev.com/bg'
const neighborhood = 'Княжево'
const address = 'София, кв. Княжево, бул. Цар Борис III 298'

export const MIKRON_INTAKE_20261123_RECORDS = [{
  id, name: 'Микрон Доцев', cityCode: '68134', neighborhood, address,
  locationKind: 'premises', category: 'auto_repair', website, phone: '+359878473031',
  coordinates: {
    latitude: 42.658608, longitude: 23.239234, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '5509',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Оглед и диагностика на шибидах или панорамна система', category: 'auto_repair',
    description: 'Огледът отнема около 30 минути на място. Частите и ремонтът се оферират отделно. Таксата за огледа се приспада, ако ремонтът бъде извършен.',
    price: { amount: 40, currency: 'EUR', kind: 'fixed', sourceUrl: bookingUrl, checkedOn, validUntil },
    appointmentModel: 'appointment',
  }],
  openingHours: {
    days: [...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '07:30', close: '17:00' }] })),
      { weekday: 6, periods: [] }, { weekday: 7, periods: [] }],
    sourceUrl: contact, checkedOn,
  },
  booking: { kind: 'form', url: bookingUrl },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: bookingUrl, excerpt: 'Собственият сайт води до форма с избор „Оглед/диагностика шибидах“, дата и час и изпращане на заявка.' },
  },
}]

export const MIKRON_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: bookingUrl, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, bookingUrl, contact, serviceMenu, website + 'politika-za-poveritelnost', OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Followed the workshop home booking button first to the current public form on its own reservation subdomain. The visible appointment option is specifically sunroof inspection and diagnosis, with another separate repair option not admitted here. The booking page and contact repeat the current fixed EUR40 notice effective 5 January 2026 for a standard sunroof or panoramic sunroof inspection. The booking page expressly credits the inspection fee if the repair is performed; parts and repair are quoted separately. The approximately 30 minutes are not a fixed appointment-length field. Owner contact explicitly identifies the Knyazhevo workshop at Tsar Boris III 298 with separate reception hours. Only exact official municipal Sofia row 5509 is used as a postal point. No current slot, booking confirmation, form submission, source media, customer data or paid lookup was used.',
  inventoryIdentity: 'eeb6780531db254b4fbf288a7c098a0dd2619d3d7661e99a3ed6c8a4ba718b31',
}]
