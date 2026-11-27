import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-kihon-suhata-reka-botevgradsko50'
const name = 'Карате и джу джицу клуб Кихон'
const cityCode = '68134', neighborhood = 'Сухата река', category = 'fitness'
const address = 'София, ж.к. Сухата река, бул. Ботевградско шосе 50, НЧ „Васил Левски 1928“'
const website = 'https://kdkkihon.eu/клуб-кихон/', phone = '+359894311026'
const contact = 'https://kdkkihon.eu/contacts/'
const venueOffer = 'https://vasillevski1928.com/clubs/karate-dju-djitsu/'
const venueContact = 'https://vasillevski1928.com/contact/'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const VERIFIED_KIHON_SUHATA_REKA_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.699759, longitude: 23.371450, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '112386', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Групови тренировки по карате и джу джицу', category, appointmentModel: 'group_reservation',
    description: 'Месечна такса за един участник. За всеки следващ член на семейството таксата е 40 €. Тренировките се провеждат в НЧ „Васил Левски 1928“; групата се уточнява при записване по телефона.',
    price: { amount: 60, currency: 'EUR', kind: 'fixed', unit: 'месечна такса', sourceUrl: venueOffer, checkedOn, validUntil },
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: {
      url: contact,
      excerpt: 'Клубът кани желаещите да позвънят за заниманията. Телефонът на треньора Милен Генчев е +359 89 431 1026. За тази зала точният адрес е бул. „Ботевградско шосе“ 50.',
    },
  },
}]

export const VERIFIED_KIHON_SUHATA_REKA_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, 'https://kdkkihon.eu/grafik/', 'https://kdkkihon.eu/karate/',
    'https://kdkkihon.eu/dzhu-dzhitsu/', venueOffer, venueContact, 'https://vasillevski1928.com/cookies/', OFFICIAL_SOFIA_SOURCE_URL],
  inventoryIdentity: 'd7dc7742617f78f6aa2b6943ec1d131914b55183ea671a93169e716b159681ee',
  notes: 'Followed the actual club invitation to call before reviewing the schedule and current venue-specific offer. The official host names the same club and coach at boulevard Botevgradsko Shose 50; its published animated price uses the digits 6 and 0 for the EUR monthly fee, with EUR 40 for each further family member. Listed once as a combined group programme without inferring the number of classes included, duration, availability, trial pricing or a separately bookable discipline. The other hall at Balsha 18 is not added. Verified the selected venue marker and civic address; no copied text, photos, calls, bookings or submissions.',
}]
