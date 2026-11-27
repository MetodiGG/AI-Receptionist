import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-bratya-miladinovi-kniazhevo-tsar-boris375'
const cityCode = '68134', neighborhood = 'Княжево', category = 'education'
const address = 'София, кв. Княжево, бул. Цар Борис III 375'
const website = 'https://brmiladinovi.org/', phone = '+359898731618'
const contact = 'https://brmiladinovi.org/kontakti/'
const lesson = 'https://brmiladinovi.org/sabitia/rabotilnici-po-izobrazitelno-i-prilozhno-izkustvo/'
const checkedOn = '2026-11-27', validUntil = '2026-12-18'

export const VERIFIED_BRATYA_MILADINOVI_KNIAZHEVO_20261127_RECORDS = [{
  id, name: 'НЧ „Братя Миладинови – 1917“', cityCode, neighborhood, address, category, website, phone,
  locationKind: 'premises',
  coordinates: {
    latitude: 42.658410, longitude: 23.239883, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '12841', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Индивидуален урок по изобразително изкуство', category,
    description: 'Присъствен урок по рисуване и приложно изкуство за деца и възрастни. Занятието е индивидуално; записването е по телефона.',
    appointmentModel: 'appointment',
  }],
  booking: { kind: 'phone', phone },
  verification: { status: 'approved', checkedOn, validUntil, contact, booking: {
    url: lesson,
    excerpt: 'Читалището посочва индивидуални уроци по изобразително изкуство и директен телефон за записване на страницата на занятието.',
  } },
}]

export const VERIFIED_BRATYA_MILADINOVI_KNIAZHEVO_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, lesson, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The organisation’s October 2026 page both offers an individual art lesson and identifies the telephone for enrolment in that programme. The organisation’s contact page confirms its Knyazhevo building; official Sofia record 12841 matches this address. Other courses, rooms, office contacts, free trial promotion, durations, material charges and open slots are not imported.',
  inventoryIdentity: '40d7360afc70fdf8365421933797c46cde5d2583527706c0c759abf96aebafed',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: lesson, serviceUrls: [lesson],
    notes: 'The owner publishes the ordinary individual lesson and direct phone enrolment together on the public programme page. No regular price is shown; the separate free trial does not establish the ordinary fee.',
  },
}]
