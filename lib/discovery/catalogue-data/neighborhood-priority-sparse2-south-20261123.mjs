import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-kindyroo-lyulin8-tsaritsa-yoanna68'
const website = 'https://kindyroo.bg/'
const centres = 'https://portal.kindyroo.bg/public/centers'
const schedule = 'https://portal.kindyroo.bg/public/timetable?centerId=31'
const terms = `${website}terms-and-conditions-privacy-policy/`
const phone = '+359889545049'
const neighborhood = 'Люлин 8'
const address = 'София, ж.к. Люлин 8, бул. Царица Йоанна 68, ет. 2'

export const PRIORITY_SPARSE2_SOUTH_20261123_RECORDS = [{
  id, name: 'КиндиРу · Люлин 8', cityCode: '68134', neighborhood, address,
  category: 'education', locationKind: 'premises', website, phone,
  coordinates: {
    latitude: 42.718474, longitude: 23.258111,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '93260', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Групови занимания за деца на 3–4 г. · Опосум',
    category: 'education', appointmentModel: 'group_reservation',
    description: 'Присъствени занимания с игри и упражнения за движение и координация. Цената е за един урок при записване за срок от 11 урока, не за единично посещение. При записване след началото на срока се заплащат оставащите уроци.',
    price: { amount: 19.94, currency: 'EUR', kind: 'fixed', unit: 'на урок при срок от 11 урока', sourceUrl: website, checkedOn },
  }],
  booking: { kind: 'form', url: schedule },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: schedule, excerpt: 'Публичният график за център №31 показва детските групи на КиндиРу София Люлин, включително „Опосум“ за деца от 3 до 4 г.' },
  },
}]

export const PRIORITY_SPARSE2_SOUTH_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: schedule, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, centres, schedule, terms],
  notes: 'Rendered the owner-linked public enrolment selector, the Sofia Lyulin centre card and the centre-specific class schedule before inspecting the live Lyulin tab of Contacts and Prices. Both current owner surfaces explicitly show no. 68, floor 2, and the same contact number. The quoted euro amount is the lesson unit within an eleven-lesson term only; mid-term enrolment pays for remaining lessons. Do not sell a drop-in at that rate, infer a package total, claim available places, or turn the class listing into opening hours. The older mirrored number 70 is a distinct postal point and was not used. No forms submitted, slots held, accounts opened, personal data entered or photos copied.',
  inventoryIdentity: '693d599650afd9f485fa06fa4d48dbd0953678232c759cb2b5fd0c2109f09dd6',
}]
