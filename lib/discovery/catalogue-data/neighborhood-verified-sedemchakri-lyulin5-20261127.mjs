import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-sedemchakri-lyulin5-dertliev99'
const name = 'Седем чакри студио'
const cityCode = '68134', neighborhood = 'Люлин 5', category = 'fitness'
const address = 'София, ж.к. Люлин 5, бул. Д-р Петър Дертлиев 99'
const website = 'https://www.sedemchakri.com/', phone = '+359988878665'
const schedule = website + 'schedule', prices = website + 'prices'
const appointment = 'https://calendly.com/sedemchakri/'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'
const description = 'Цената е за едно групово посещение за възрастен. За сутрешни практики се записва до 22:00 ч. предния ден, а за обедни и вечерни — поне 90 минути по-рано. Заниманието се провежда при поне трима записани.'
const practice = name => ({
  name, category, description, appointmentModel: 'group_reservation',
  price: { amount: 10, currency: 'EUR', kind: 'fixed', unit: 'едно посещение', sourceUrl: prices, checkedOn, validUntil },
})

export const VERIFIED_SEDEMCHAKRI_LYULIN5_20261127_RECORDS = [{
  id, name, category, cityCode, neighborhood, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.709580, longitude: 23.244212, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '122659', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [
    practice('Хатха йога · групова практика'),
    practice('Въздушна йога · групова практика'),
    practice('Латино танци · групово занимание'),
  ],
  booking: { kind: 'form', url: schedule },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: schedule, excerpt: 'Избери групова практика в графика на студиото. Линкът за съответното занимание отваря неговата страница за записване.' },
  },
}]

export const VERIFIED_SEDEMCHAKRI_LYULIN5_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: schedule, bookingReview: 'provider_booking_reviewed',
  reviewedUrls: [website, schedule, appointment + 'yoga_desi', appointment + 'aerial-yoga-zora',
    appointment + 'dance-with-yusi', prices, website + 'terms-and-conditions', OFFICIAL_SOFIA_SOURCE_URL],
  inventoryIdentity: '4e001c4896f0d8c9e547157e7f00b09f49e80c62d4e0d0a884c5d2fe855d8977',
  notes: 'Followed the studio booking action to its public owner-published weekly schedule, then the named Hatha, aerial-yoga and Latino appointment links exposed in that schedule before reading the independent owner rate table. Owner rates are EUR 10 per adult yoga visit and EUR 10 per dance visit, not a card instalment or one month total. The same schedule publishes booking cutoffs and a three-participant threshold. No fixed duration or availability asserted; each class may vary by instructor or date. Contact and full civic address match RN122659. No intake form, slot selection, payment, native calendar write, own photograph or external text reused. Provider links are verified consumer handoffs, not a source for automated import.',
}]
