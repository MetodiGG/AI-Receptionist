const id = 'sofia-kotev-dental-mladost1a-564', name = 'Стоматологичен кабинет д-р Ивайло Котев'
const cityCode = '68134', neighborhood = 'Младост 1А', category = 'other'
const address = 'София, ж.к. Младост 1А, бл. 564, до вх. Б, партер'
const website = 'https://doktorkotev.com/', phone = '+359894458760'
const contact = website + 'contact/', phoneInstructions = website + 'moga-li-da-doida-bez-zapisan-chas/'
const menu = website + 'services/', therapeutic = website + '247-emergency-service/'
const surgery = website + 'hirurgichna-stomatologia/', endodontics = website + 'endodontia/'
const prosthetics = website + 'protetichna-stomatologia/'
const terms = website + 'terms-and-conditions/', privacy = website + 'privacy-policy/'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const KOTEV_MLADOST1A_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  // The owner's named place matches the practice, building and phone. The
  // pin is not the map viewport or an assumed match to a numbered civic entrance.
  coordinates: {
    latitude: 42.6476201, longitude: 23.3822048, method: 'first_party_coordinates',
    source: contact, sourceAddress: address,
  },
  services: [
    { name: 'Стоматологичен преглед', category, description: 'Записване за преглед по телефона.', appointmentModel: 'appointment' },
    { name: 'Лечение на зъбен кариес', category, description: 'За час и цена за лечение се свържи с кабинета по телефона.', appointmentModel: 'appointment' },
  ],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: phoneInstructions, excerpt: 'За преглед или лечение час се записва по телефона на кабинета.' },
  },
}]

export const KOTEV_MLADOST1A_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, phoneInstructions, contact, menu, therapeutic, surgery, endodontics, prosthetics, terms, privacy],
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: phoneInstructions, serviceUrls: [menu, therapeutic, surgery, endodontics, prosthetics],
    notes: 'The live owner telephone-appointment instructions, home, complete visible dental services menu, therapeutic service details and three remaining treatment pages were read with HTTP 200. No monetary tariff, fee, package total or duration appears for the selected examination or caries treatment. The site sitemap lists no tariff page; insurance FAQ is not a branch tariff. The malfunctioning optional web form is not an inspected price source and does not establish absence; the independently published phone route is the supported booking channel.',
  },
  inventoryIdentity: '4bf5db62bcd111d9d4c0fd1493c5c824038b34a01bcc69c73e07fdf7f49b72c6',
  notes: 'The contact page and exact same owner appointment instructions explicitly direct customers to one published phone. The official therapeutic menu separately lists an examination and treatment of tooth decay. No diagnosis or guaranteed treatment, slot, price, insurance terms, or duration is claimed. The owner contact embeds the exact named marker, whose place identity, public address block and business phone match; there is no numeric-entrance inference. The site restricts copying its pictures; no source photographs, medical advice, copyrighted prose, map payload, reviews or patient information were imported. No telephone call, form, booking, account or calendar action.',
}]
