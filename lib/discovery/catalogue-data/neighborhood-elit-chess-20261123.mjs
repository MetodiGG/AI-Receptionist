import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-elit-chess-sveta-troitsa-hisarya3a', cityCode = '68134'
const neighborhood = 'Света Троица', address = 'София, ж.к. Света Троица, ул. Хисаря 3А'
const website = 'https://elit4kids.com/', phone = '+359879551555'
const contact = `${website}kontakti/`
const schedule = `${website}grafik-na-dejnostite/`
const tariff = `${website}classes/shahmat-za-detsa-kam-shahmaten-klub-elit/`

function chess(name, amount, unit, description) {
  return {
    name, category: 'education', appointmentModel: 'group_reservation', description,
    price: { amount, currency: 'EUR', kind: 'fixed', unit, sourceUrl: tariff, checkedOn, validUntil },
  }
}

export const ELIT_CHESS_INTAKE_20261123_RECORDS = [{
  id, name: 'Детски образователен център ЕЛИТ', cityCode, neighborhood, address, locationKind: 'premises',
  category: 'education', website, phone,
  coordinates: {
    latitude: 42.705321, longitude: 23.293615, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: cityCode,
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '104662',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [
    chess('Шахмат за деца · едно посещение', 15, 'посещение',
      'Едно групово занимание по шахмат за деца от 4 години. Центърът потвърждава подходящата група и свободното място.'),
    chess('Шахмат за деца · едно посещение седмично', 50, 'месечна такса',
      'Месечна такса при 1 посещение седмично. За второ дете при същия график таксата е 40 € на месец. Центърът потвърждава групата и свободното място.'),
    chess('Шахмат за деца · две посещения седмично', 70, 'месечна такса',
      'Месечна такса при 2 посещения седмично. За второ дете при същия график таксата е 56 € на месец. Центърът потвърждава групата и свободното място.'),
  ],
  booking: { kind: 'form', url: contact },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: contact, excerpt: 'Посочете „Шахмат за деца“ в собствената форма на центъра. Екипът уточнява група и място; формата не потвърждава записване.' },
  },
}]

export const ELIT_CHESS_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: contact, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, contact, schedule, tariff, `${website}politika-na-poveritelnost/`, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The current school timetable points to the own enrolment/enquiry form, which explicitly offers the preserved children’s chess option. Followed the public registration path before completing the detailed program and tariff review. No input, booking or notification. The owner’s tariff effective 1 October prints three separate EUR rates, distinguishing the one-session price from two monthly packages and explicitly specifying reduced fees for the second child. Age from four is stated for the program. The actual timetable varies by group (45 or 75 minutes); no single duration or slot is inferred. This row is only the bookable chess program, without a second same-operator listing, salt room or temporary events.',
  inventoryIdentity: '22e9256b374d17cf095e43944285121375b5413e7931aa731974f7d48de1b231',
}]
