import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23', cityCode = '68134'
const smarty = {
  id: 'sofia-smartykids-lyulin9-block954', name: 'SmartyKids · Люлин 9', category: 'education',
  neighborhood: 'Люлин 9', address: 'София, ж.к. Люлин 9, бул. Царица Йоанна, бл. 954',
  website: 'https://smarty-kids.bg/sofia-lyulin/', phone: '+359893589730',
  addressId: '29763', latitude: 42.715097, longitude: 23.264963,
}
const limoncello = {
  id: 'sofia-limoncello-kids-buxton-gortalov1', name: 'Лимончело · детски кът', category: 'other',
  neighborhood: 'Бъкстон', address: 'София, кв. Бъкстон, ул. Майор Горталов 1',
  website: 'https://limoncello.bg/', phone: '+359877679877',
  addressId: '115431', latitude: 42.672723, longitude: 23.27543,
}
const smartyDirectory = 'https://smarty-kids.bg/sofia-center-map/'
const smartyProgram = 'https://smarty-kids.bg/mentalna-aritmetika/'
const smartyTerms = 'https://smarty-kids.bg/smk-gdpr/'
const limoncelloService = new URL('детски-център/', limoncello.website).href
const limoncelloContact = new URL('контакти/', limoncello.website).href

function premise(fields) {
  const { latitude, longitude, addressId, ...publicFields } = fields
  return { ...publicFields, cityCode, locationKind: 'premises', coordinates: {
    latitude, longitude, addressId, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: fields.address, sourceCityCode: cityCode, sourceNeighborhood: fields.neighborhood,
    sourceWebsite: fields.website, checkedOn, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  } }
}

export const PRIORITY_DISTINCT_NORTH_20261123_RECORDS = [{
  ...premise(smarty),
  services: [{
    category: 'education',
    name: 'Пробен урок по ментална аритметика за деца',
    description: 'Безплатен пробен урок в центъра за деца от 4 до 12 г. Формулярът е заявка; центърът потвърждава часа. Услугата не включва редовния курс или неговите такси.',
    price: { amount: 0, currency: 'EUR', kind: 'fixed', sourceUrl: smarty.website, checkedOn, validUntil },
    appointmentModel: 'appointment',
  }],
  booking: { kind: 'form', url: smarty.website },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: smarty.website,
    booking: { url: smarty.website, excerpt: 'Бутонът за демо урок отваря формуляр на страницата на центъра в Люлин 9 с избор на курс. Това е заявка за пробен урок.' },
  },
}, {
  ...premise(limoncello),
  services: [{
    category: 'other',
    name: 'Посещение на закрит детски кът · 1 час',
    description: 'Детски кът с аниматор в ресторанта за възраст 0–13 г. Под 3 г. – с придружител. Прием и предаване само с родител или упълномощен придружител; чисти чорапи или пантофки. Не се допускат деца със симптоми. По телефона уточнете часа и дали е нужна резервация на маса. Цената е с ДДС.',
    price: { amount: 4.09, currency: 'EUR', kind: 'fixed', unit: 'час', sourceUrl: limoncelloService, checkedOn, validUntil },
    appointmentModel: 'appointment',
    durationMin: 60, durationSourceUrl: limoncelloService, durationCheckedOn: checkedOn,
  }],
  booking: { kind: 'phone', phone: limoncello.phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: limoncelloContact,
    booking: { url: limoncelloService, excerpt: 'Страницата на детския кът изрично посочва записване по телефона за посещение и съветва да се резервира предварително през уикенда и празници.' },
  },
}]

export const PRIORITY_DISTINCT_NORTH_20261123_REVIEWS = [{
  id: smarty.id, checkedOn, website: smarty.website, bookingEntry: smarty.website, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [smarty.website, smartyProgram, smartyDirectory, smartyTerms, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Followed the branch demo booking CTA first; the native on-page form asks for a course, but not an appointment time. The same branch page explicitly offers a free introductory lesson and lists mental arithmetic for ages 4–12. The zero charge applies only to the demo, not tuition, discounts or a paid class. No actual availability, regular class price or demo duration was stated or inferred. No form inputs, consents or private material were accessed.',
  inventoryIdentity: 'f0cd6234a453704f6f1f71cf50d50fb4dcb5ce4332557692a4c4dd27fa0cbd00',
}, {
  id: limoncello.id, checkedOn, website: limoncello.website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [limoncello.website, limoncelloService, limoncelloContact, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The native child-centre page explicitly invites telephone pre-booking for the hourly child-zone visit, separately from its generic reserve-a-table link. Followed and excluded that table-only form. The same child-centre page posts EUR 4.09 incl. VAT for one hour for ages 0–13, with guardian and admission conditions. No longer minimum or table purchase terms are stated; visitors are advised to ask the venue if they need a table reservation. No birthday price, childcare guarantee, opening hours for the play area, or live availability is inferred.',
  inventoryIdentity: '339a9ad3c5c74eaae34d849075d3e4c7c369ac2d15d51a3eaeecc21be7e86c41',
}]
