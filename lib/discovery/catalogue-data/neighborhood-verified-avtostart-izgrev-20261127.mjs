import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-avtostart-izgrev-joliot-curie20', name = 'Учебен център Авто Старт'
const cityCode = '68134', neighborhood = 'Изгрев', category = 'education'
const address = 'София, ж.к. Изгрев, ул. Фредерик Жолио Кюри 20, ет. 14, офис 1405'
const website = 'https://avtostart.bg/', phone = '+359988917771'
const course = website + 'kurs/shofyorski-kurs', contact = website + 'kontakti'
const checkout = website + 'plashtane?course_id=18', terms = website + 'obshti-usloviya'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const VERIFIED_AVTOSTART_IZGREV_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.670998, longitude: 23.350277, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '22859', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Шофьорски курс категория B · ръчна скоростна кутия', category, appointmentModel: 'appointment',
    description: 'Цената с ДДС е за целия курс, с вътрешни изпити, онлайн материали и първия държавен изпит по теория. Държавният изпит по практика, допълнителните часове и повторната теория са отделно. Записване с договор и плащане; договорената цена важи 3 месеца. Таксата за взети часове не се връща.',
    price: { amount: 1270, currency: 'EUR', kind: 'fixed', unit: 'целия курс', sourceUrl: course, checkedOn, validUntil },
  }],
  booking: { kind: 'form', url: course },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: course, excerpt: 'В страницата на курса избери начална дата и премини към записване при автошколата. Мястото се потвърждава след договор и плащане, не от GoRez.' },
  },
}]

export const VERIFIED_AVTOSTART_IZGREV_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: course, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, course, checkout, checkout + '&date_id=93', checkout + '&date_id=98', contact, terms,
    'https://rta.government.bg/upload/18445/uchebni_centrove.html', OFFICIAL_SOFIA_SOURCE_URL],
  inventoryIdentity: '0e252933b529f7a2e8e2fdaabb065e5c57fc860ad4d9a0b2e613ff074ce9d191',
  notes: 'The dedicated first-party manual Category B page has the native GET start-date selector for course 18 and a literal EUR 1270 whole-course rate including VAT. The same page links the live enrolment form for 28 November 2026. Public GET reviews for the exact published options 5 December 2026 and 4 January 2027 independently confirm the same programme, venue and EUR 1270. No cohort date or available slot is persisted in the GoRez record. The fee is not a deposit and does not cover the state practical exam, extra lessons or a repeat theory exam. Office 1405 is the actual classroom (current contact and IAAA permit 4557), not the legal office 1406. The municipal coordinate verifies the building and is not a floor- or entrance-level point. Automatic, other courses and other branches are excluded. No form field, upload, submit, payment, call, third-party account, partnership or calendar was touched. Independently worded facts only, no owner material re-used.',
}]
