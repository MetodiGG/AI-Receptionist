import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-solux-auto-pavlina4'
const neighborhood = 'НПЗ Хаджи Димитър'
const address = 'София, НПЗ Хаджи Димитър, ул. Павлина Унуфриева 4'
const website = 'https://solux-auto.com/'
const englishMenu = `${website}en/`
const phone = '+359892373737'

export const SOLUX_AUTO_INTAKE_20261123_RECORDS = [{
  id, name: 'Solux Auto', cityCode: '68134', neighborhood, address,
  locationKind: 'premises', category: 'auto_repair', website, phone,
  coordinates: {
    latitude: 42.706551, longitude: 23.33836, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '28159',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Диагностика на двигател', category: 'auto_repair',
    description: 'При предварително уговорен прием сервизът проверява работата на двигателя, електронните системи, сензорите и механичните компоненти.',
    appointmentModel: 'appointment',
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: website, excerpt: 'Сервизът предлага прием с предварителна уговорка и публикува телефон за обаждане непосредствено към услугите за диагностика.' },
  },
}]

export const SOLUX_AUTO_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, englishMenu, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Followed the public Book an appointment CTA and read the owner contact, diagnostic menu and advance-reception explanation on the same public site. The diagnostics group publishes its own call action and the same telephone is listed in the contact section. This is an appointment by phone only; the adjacent generic enquiry form is not a booking route. The owner service description and exact workshop address are recorded without imported promotion, third-party hours or opening-slot claims.',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: website, serviceUrls: [website, englishMenu],
    notes: 'Read the public appointment and contact sections, advance-reception FAQ, entire Bulgarian service menu and English counterpart, including the selected engine diagnostics service. No current price, duration or separate public tariff is published for this specific service. A price is not inferred from other services, directories or general promotional descriptions.',
  },
  inventoryIdentity: 'e3aabd7212aab1a174fd33ae6964c2dce0cd4461d5b2faaae16aa0fc818900c5',
}]
