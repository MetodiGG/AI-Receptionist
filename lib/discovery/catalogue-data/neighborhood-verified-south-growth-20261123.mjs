import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-karting-ring-academy-simeonovo-214'
const website = 'https://www.sofiakarting.com/'
const contact = `${website}contacts`
const school = `${website}school`
const detailedSchool = `${website}картинг-училище/`
const freeDrivingPrices = `${website}prices`
const neighborhood = 'Симеоново'
const address = 'София, в.з. Симеоново – север, ул. Околовръстен път 214, Sofia Ring Mall'
const phone = '+359889622755'

export const VERIFIED_SOUTH_GROWTH_20261123_RECORDS = [{
  id, name: 'Sofia Karting Ring · Картинг академия', cityCode: '68134', neighborhood, address,
  locationKind: 'premises', category: 'fitness', website, phone,
  coordinates: {
    latitude: 42.624488, longitude: 23.352551, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '109175',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Групов курс по картинг за деца (6–17 г.)', category: 'fitness',
    description: 'Цената е за целия курс: 270 € за делнична група или 300 € за група през уикенда. Курсът включва 9 дни теория и практика с 18 карания. Всеки урок е 80 минути. Уточнете началната дата и групата с академията.',
    price: { amount: 270, maximum: 300, currency: 'EUR', kind: 'range', unit: 'курс', sourceUrl: school, checkedOn },
    appointmentModel: 'group_reservation',
  }, {
    name: 'Групов курс по картинг за възрастни (18+)', category: 'fitness',
    description: 'Цената е за целия курс от 9 дни теория и практика с 18 карания. Всеки урок е 80 минути. Вечерните групи започват в 21:00 ч. Уточнете началната дата и групата с академията.',
    price: { amount: 300, currency: 'EUR', kind: 'fixed', unit: 'курс', sourceUrl: school, checkedOn },
    appointmentModel: 'group_reservation',
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: contact, excerpt: 'Академията приема заявки за записване на специалния си телефон. Обадете се, за да уточните групата и началната дата.' },
  },
}]

export const VERIFIED_SOUTH_GROWTH_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, school, detailedSchool, freeDrivingPrices, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Reviewed the actual dedicated academy telephone entry in the owner contacts and again in the academy enrolment instructions, including the readable first-party programme page and its enquiry form without submitting. Both academy menus agree on nine days of instruction, 18 drives, 80 minutes per lesson, child weekday EUR 270, child weekend EUR 300 and adult evening EUR 300, all per course. No free-driving, venue hours, voucher or birthday facts are treated as academy availability, duration or prices.',
  inventoryIdentity: '2db74083fc00a61dadf7f65dbf2bdb2bf4a41dc1c68926b80a039ee4cd99b94b',
}]
