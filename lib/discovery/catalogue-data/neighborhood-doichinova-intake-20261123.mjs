// One separately bookable, officially anchored branch; only the confirmed dentist's fee.
import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-doichinova-lyulin3-block368'
const neighborhood = 'Люлин 3'
const address = 'София, ж.к. Люлин 3, ул. Добринова скала, бл. 368, ет. 1, ап. 1'
const website = 'https://superdoc.bg/klinika/dentalna-klinika-d-r-doychinova-rayon-lyulin'
const bookingUrl = 'https://superdoc.bg/lekar/gergana-zinkova'
const phone = '+359886298994'

export const DOICHINOVA_INTAKE_20261123_RECORDS = [{
  id, name: 'Дентална клиника д-р Дойчинова · Люлин 3', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.722729, longitude: 23.241273,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '55747', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'other', website, phone,
  services: [{
    name: 'Първичен дентален преглед', category: 'other', appointmentModel: 'appointment',
    description: 'Цената е за преглед при д-р Гергана Зинкова в кабинета в Люлин 3. Носете предишната си медицинска документация, ако разполагате с нея.',
    price: { amount: 15.34, currency: 'EUR', kind: 'fixed', sourceUrl: bookingUrl, checkedOn, validUntil },
  }],
  openingHours: {
    days: [
      ...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '08:00', close: '20:00' }] })),
      { weekday: 6, periods: [] },
      { weekday: 7, periods: [] },
    ],
    sourceUrl: website, checkedOn,
  },
  booking: { kind: 'form', url: bookingUrl },
  verification: {
    status: 'approved', checkedOn, validUntil,
    booking: { url: bookingUrl, excerpt: 'Изберете кабинета в Люлин 3 и първичен преглед при д-р Гергана Зинкова; публичният ценоразпис за този кабинет посочва 15,34 €.' },
    contact: website,
  },
}]

export const DOICHINOVA_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: bookingUrl, bookingReview: 'provider_booking_reviewed',
  reviewedUrls: [
    website, bookingUrl, 'https://superdoc.bg/uslovia-za-polzvane', 'https://superdoc.bg/robots.txt',
    'https://reports.nhif.bg/nhif_reports/nhif_partners/?district=&page=dentists&rzok=22',
  ],
  notes: 'Followed the clinic-managed Lyulin branch public doctor Book link. The public reason menu includes an initial examination and the separately named Lyulin 3, block 368 pricing panel gives a fixed EUR15.34 for the same reason with Dr Gergana Zinkova. The note about previous documents is paraphrased. The NHIF register links the same branch, professional phone and dentist to the named dental practice and supplies floor 1, apartment 1. The municipal CSV point rn55747 is the exact Sofia, Lyulin district building block, not a surveyed entrance or apartment point. Published weekday hours refer to the branch, not the dentist or available times. The standalone link returned 502; no independent tariff or hours were taken from it. Do not extend the published tariff or duration to other dentists or the Ovcha Kupel practice, and do not claim NHIF reimbursement or GoRez availability. Public terms and robots were checked; only minimal factual details and the ordinary onward booking link are used. No reservations, submitted forms, patient information, photos or ratings used.',
  inventoryIdentity: '712cf95550b9bf19eee8c20a5bfac1e4c6c28fa2b4d29ff43ecb5fcc501f2d83',
}]
