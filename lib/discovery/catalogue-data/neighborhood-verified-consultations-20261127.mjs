import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-27', validUntil = '2026-12-18'
const cityCode = '68134', neighborhood = 'Люлин 10', category = 'consulting'
const id = 'sofia-va-consulting-lyulin10-block135'
const website = 'https://vaconsulting.bg/', phone = '+359882745189'
const address = 'София, ж.к. Люлин 10, бл. 135, партер'
const contact = website + 'contacts', tax = website + 'pages-1-danachni-konsultacii'
const terms = website + 'pages-10-obshti-usloviia'
const enquiry = new URL(contact)
enquiry.searchParams.set('subject', 'Данъчни консултации')
const bookingEntry = enquiry.href

export const VERIFIED_CONSULTATIONS_20261127_RECORDS = [{
  id, name: 'VA Consulting · Люлин 10', cityCode, neighborhood, address, category, website, phone,
  locationKind: 'premises',
  coordinates: {
    latitude: 42.714959, longitude: 23.275854, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    checkedOn, addressId: '53075', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
  },
  services: [{
    name: 'Данъчна консултация за фирми и физически лица', category,
    description: 'Консултация по данъчни задължения, включително въпроси за ДДС. Формулярът изпраща запитване, не резервира час. Уговорете среща и уточнете цената с кантората.',
    appointmentModel: 'appointment',
  }],
  booking: { kind: 'form', url: bookingEntry },
  verification: { status: 'approved', checkedOn, validUntil, contact, booking: {
    url: bookingEntry, excerpt: '„Направете запитване“ отваря формуляр с предварително избрана тема „Данъчни консултации“. Кантората описва среща и оферта след първия контакт.',
  } },
}]

export const VERIFIED_CONSULTATIONS_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, tax, bookingEntry, contact, terms, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Followed the first-party service CTA and confirmed the exact prefilled subject and the client-facing ground floor address. The owner explains that a meeting and quote follow first contact. Its legal address in the terms is not the client address. Civic RN53075 is the only point for this block and falls at the exact block named by the official contact map. Nothing submitted.',
  inventoryIdentity: '6f3f918407459b44959a7a4d0021ef60b7727503b87b85d61211f5b72225326a',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: bookingEntry, serviceUrls: [tax, contact],
    notes: 'The reachable first-party tax consultation enquiry, service and contact pages publish no fixed consultation price. The operator prepares a quote after contact; no fee or length is inferred.',
  },
}]
