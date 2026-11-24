// One independent dental premises with an expressly published phone booking route.
import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-kabident-lyulin9-vlaikov27'
const neighborhood = 'Люлин 9'
const address = 'София, ж.к. Люлин 9, ул. Тодор Г. Влайков 27, вх. В, ет. 1, ап. 1'
const website = 'https://ddent1324.wixsite.com/kabident'
const contact = `${website}/contact`
const menu = `${website}/departments`
const treatment = `${website}/cardiology`
const prosthodontics = `${website}/neurology`
const pediatric = `${website}/orthopaedics`
const officialPractice = 'https://iamn.bg/wp-content/uploads/registers/22_REGISTER_LZ%20dejstvashti.pdf'
const phone = '+359887833222'

export const PRIORITY_DENTAL_INTAKE_20261123_RECORDS = [{
  id, name: 'Кабидент · д-р Биляна Стоянова', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.722308, longitude: 23.266502,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '55487', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'other', website, phone,
  services: [{ name: 'Лечение на кариес', category: 'other', appointmentModel: 'appointment' }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil,
    booking: { url: website, excerpt: 'Кабинетът кани клиентите да се свържат с него за час на публикувания телефон. Страницата с дейности посочва лечение на кариес.' },
    contact,
  },
}]

export const PRIORITY_DENTAL_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, menu, treatment, prosthodontics, pediatric, officialPractice],
  notes: 'The owner’s Book Now link returns to the owner landing page, which expressly invites appointment contact and gives the same phone as the contact page for visits. The treatment menu names caries treatment as offered by this dental practice. IAmN register item 2219112594 identifies the same dental practice and entrance V for street number 27; the owner identifies floor 1, apartment 1 and Lyulin 9. Municipal row 55487 matches the exact entrance, not either of the other entries for no. 27. This is the municipal entrance postal point, not a surveyed office location. A different existing business at no. 27 is not this dental practice. No call or booking was made, no contact form submitted, no patient data, photographs or ratings copied, and no fixed duration or office hours inferred.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: website, serviceUrls: [menu, treatment, prosthodontics, pediatric],
    notes: 'Read the owner’s actual appointment landing page and contacts, the general service menu and all three linked clinical service pages on their ordinary public routes. The treatment page describes caries treatment but publishes no fee; no public price page is linked. The checked pages rendered without an access challenge.',
  },
  inventoryIdentity: '59efcafddf8e5909de4b26d605a6e173ac7f1a3248b78d003649a705ac21d48d',
}]
