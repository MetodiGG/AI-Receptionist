// One regular, externally requested adult class at the independently verified Sofia venue.
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-masters-dance-lyulin-centre-nenov29'
const neighborhood = 'Люлин - център'
const address = 'София, Люлин - център, ул. Архитект Георги Ненов 29, Спортен център „Сиконко“, ет. 2'
const website = 'https://www.mastersofthedance.com/'
const branch = `${website}школи/софия-люлин/`
const enrollment = `${website}контакти/`

export const MASTERS_DANCE_INTAKE_20261123_RECORDS = [{
  id, name: 'Майсторите на танца · Люлин', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.717601, longitude: 23.255448,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '94791', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'fitness', website, phone: '+359894637337',
  services: [{
    name: 'Български народни танци за начинаещи възрастни', category: 'fitness', appointmentModel: 'group_reservation',
    description: 'Групови занимания за възрастни без опит. Избери школата в Люлин във формуляра. Записването, графикът и таксата се уточняват с организатора.',
  }],
  booking: { kind: 'form', url: enrollment },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: enrollment,
    booking: { url: enrollment, excerpt: 'Собственият формуляр приема заявки за уроци по танци, включително за възрастни в залата в Люлин. Записването се потвърждава от школата.' },
  },
}]

export const MASTERS_DANCE_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: enrollment, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, enrollment, branch, `${website}школи/`, `${website}privacy-policy/`],
  notes: 'The actual on-site lesson form has adult and child choices and the Sofia Lyulin school. The school branch page at the exact second-floor Sikonkо sports centre independently requires advance enrollment and identifies the adult beginner folk-dance group as regularly rehearsing and open for enrollment. The declared existing nearby climbing business is a different operator/activity, not this dance school. The unique civic address in the official Sofia data is row 94791. Date fragments and weekly patterns are not imported as availability or opening hours. No children’s group, additional branch, show, Latin dance, performance deposit, consent, real booking, message, payment, source imagery or prose retained.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: enrollment, serviceUrls: [branch, `${website}школи/`],
    notes: 'Inspected the actual rendered adult enrollment form, the selected and accessible exact Lyulin branch’s complete classes schedule and navigation, and the service index. No specific beginner adult group fee, price page or blocked tariff menu was linked. Show and event deposits are not dance-lesson fees; tuition and class participation are confirmed by the operator.',
  },
  inventoryIdentity: '03e72ecf1af20cb12b3fb0109f65a1abdacc2eb5d2e40ec3f1ab8c7e93e65d8a',
}]
