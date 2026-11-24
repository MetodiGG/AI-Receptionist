import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-emika-druzhba2-block204'
const website = 'https://emika.bg/'
const contact = website + encodeURIComponent('контакти') + '/'
const nvo = website + encodeURIComponent('подготовка-за-нво-4-клас') + '/'
const policies = website + encodeURIComponent('общи-условия') + '/'
const neighborhood = 'Дружба 2'
const address = 'София, ж.к. Дружба 2, бл. 204'
const phone = '+359877100607'

export const EMIKA_DRUZHBA2_20261123_RECORDS = [{
  id, name: 'Учебен център ЕМИКА', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.655304, longitude: 23.396919,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '123792', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'education', website, phone,
  services: [{
    name: 'Подготовка за НВО след 4. клас · БЕЛ и математика', category: 'education',
    description: 'Присъствени занятия в малки групи по двата модула или по един избран предмет. Графикът, местата и таксата се уточняват по телефон. Записването изисква писмен документ и плащане.',
    appointmentModel: 'group_reservation',
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: nvo, excerpt: 'ЕМИКА публикува пряк телефон за записване към присъствената подготовка за НВО след 4. клас в блок 204.' },
  },
}]

export const EMIKA_DRUZHBA2_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, nvo, policies, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The current operator page explicitly lists branch-level telephone enrolment for in-person small groups preparing for the grade-four national assessment. There are two subjects and a single-subject choice. The unique municipal row identifies block 204, not a separate entrance. The general terms require an enrolment document and payment, so a phone enquiry itself does not guarantee a place. No hours are imported because the public contact and terms disagree on Saturday opening.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: nvo, serviceUrls: [nvo],
    notes: 'Public direct HTTPS returns the current full named-course page with a heading for modules and fees, but specifically refers clients to Emika for current fees, schedule and availability. No separate tariff or external booking link for this course is present. Cached older amounts no longer appear at the source, and prices on accessible pages for other Emika courses do not apply to this programme. No inaccessible fee menu is classified as unpublished.',
  },
  inventoryIdentity: 'dc372d449e1647f1dae271b208c2e695bd5e0c2f3b37aff00d5bb159f8087c27',
}]
