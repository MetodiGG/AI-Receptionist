const id = 'sofia-dentaart-hladilnika-filipkutev14', name = 'Дентално студио Denta Art'
const cityCode = '68134', neighborhood = 'Хладилника', category = 'other'
const address = 'София, кв. Хладилника, ул. Филип Кутев 14'
const website = 'https://dentaart.com/', phone = '+359878838242'
const contact = website + 'kontakti/', secondContact = website + 'contacts/'
const menu = website + 'uslugi/', crown = menu + 'keramichni-koroni/'
const bridges = menu + 'mostove/', veneers = menu + 'faseti/'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const DENTAART_HLADILNIKA_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  // Exact named DentaArt point verified via the owner's own directions. The
  // civic dataset lists nearby suffixed numbers, none substituted for bare 14.
  coordinates: {
    latitude: 42.6563887, longitude: 23.3230776, method: 'first_party_coordinates',
    source: contact, sourceAddress: address,
  },
  services: [{
    name: 'Консултация за керамична корона',
    category,
    description: 'Час за консултация се записва по телефона. Изработването и поставянето на корона не са включени в заявката за консултация.',
    appointmentModel: 'appointment',
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: crown, excerpt: 'За консултация за керамична корона страницата на кабинета насочва към телефон за записване.' },
  },
}]

export const DENTAART_HLADILNIKA_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, crown, contact, secondContact, menu, bridges, veneers],
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: crown, serviceUrls: [crown, menu, bridges, veneers],
    notes: 'The dedicated ceramic-crown consultation CTA, the public contact pages, dentistry service index and related crown, bridge and veneer pages all returned readable substantive HTTP 200. No numeric tariff, fee or appointment duration is published for the selected consultation. The owner page and service sitemaps expose no price page. The time stated for fabricating the physical crown is not the duration of this consultation. A broken generic contact form does not establish absent prices and is not the booking route; the direct telephone control on the same branch contact page is the route used.',
  },
  inventoryIdentity: 'f95a31f99d61847e80f632bd6c79accef47dd982548db61ee14d94f575c0e248',
  notes: 'The service page explicitly links booking a consultation to the owner branch contact, whose main branch telephone is a live tel link. Its alternate contact also names the same phone and street. The owner-linked named map point confirms the street and the owner-listed secondary number but that secondary line is not used for bookings. IAmN 2209114527 independently matches the active dental-practice identity and location. No site photos, prose, ratings, reviews, unsupported medical claims, patient data or map payload are retained. No call, request, booking or calendar action.',
}]
