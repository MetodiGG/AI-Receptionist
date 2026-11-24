import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-studio-s-hadzhi-dimitar-vastanik5'
const website = 'https://studios-edu.com/'
const branch = website + 'hadzhi-dimitar/'
const contact = website + 'contacts/'
const course = website + 'bel-za-6-klas/'
const terms = website + 'about-us/obshti-usloviya/'
const shortForm = 'https://forms.gle/S3uXkx4MAaTr7E2D7'
const form = 'https://docs.google.com/forms/d/e/1FAIpQLSc-PMlVvD-o3N9X3VG9vIrHxR1Xp3cKGlUeJvJPoAL1DPgglw/viewform'
const neighborhood = 'Хаджи Димитър'
const address = 'София, ж.к. Хаджи Димитър, ул. Въстаник 5'
const phone = '+35924082966'
const description = 'Групов курс за учебната година от септември до юни: 120 учебни часа по една дисциплина. Публикуваната сума е една от трите вноски, не цена за занятие. Отсъствията не намаляват таксата. Центърът уточнява групата, договора и плащането след заявка.'

export const PRIORITY_DISTINCT_EAST_20261123_RECORDS = [{
  id, name: 'Студио S · Хаджи Димитър', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.703247, longitude: 23.347842, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '27532', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'education', website, phone,
  services: ['Групов курс по математика за 6. клас', 'Групов курс по български език и литература за 6. клас'].map(name => ({
    name, category: 'education', description,
    price: { amount: 390, currency: 'EUR', kind: 'fixed', unit: 'вноска · 3 за курса', sourceUrl: course, checkedOn, validUntil },
    appointmentModel: 'group_reservation',
  })),
  booking: { kind: 'form', url: form },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: course, excerpt: 'Страницата на курса показва групи в Хаджи Димитър и води към заявка с избор на клас, предмет, филиал и групова форма.' },
  },
}]

export const PRIORITY_DISTINCT_EAST_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: form, bookingReview: 'provider_booking_reviewed',
  reviewedUrls: [website, course, shortForm, form, branch, contact, terms, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The course page links to the school-named enrolment request, which returned 200 and publicly describes its non-binding application and callback. The registration fields include class, discipline, Sofia branch and group format. The owner course page binds both selected sixth-grade courses and their weekend timetable to Hadzhi Dimitar; tariff is three ordinary EUR 390 instalments separately for either subject, 120 academic hours per discipline over the school year, not the fee for one lesson. The first payment is due when enrolling, second at the end of November, and third in February. The separately priced two-subject plan, discounts, and the seventh-grade course with contradictory reported hour counts were not included. No actual vacancy, late admission, individual training or booking guaranteed. No course form input, call or registration. This is one new premise of the existing Studio S operator, not a new operator.',
  inventoryIdentity: '6cc38426b2059bb6f0504dca98329f47f8c518519ad19a0af89eebc8d00a962f',
}]
