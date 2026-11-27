const id = 'sofia-ivon-service-gorna-banya-eho1', name = 'IVON Service · Горна баня'
const cityCode = '68134', neighborhood = 'Горна баня', category = 'auto_repair'
const address = 'София, кв. Горна баня, ул. Ехо 1'
const site = 'https://ivonservice.com/', website = site + 'ivon-service-gorna-bania/'
const bookingUrl = site + 'booking/', contact = site + 'contacts/', menu = site + 'services/'
const phone = '+359895701048', checkedOn = '2026-11-27', validUntil = '2027-02-25'
const appointment = (serviceName, description) => ({ name: serviceName, category, description, appointmentModel: 'appointment' })

export const IVON_GORNA_BANYA_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  // Exact point of the named venue in the owner's directions URL, not its
  // map viewport and not a municipal point at the neighbouring number 2.
  coordinates: { latitude: 42.6713158, longitude: 23.2412116, method: 'first_party_coordinates', source: website, sourceAddress: address },
  services: [
    appointment('Компютърна диагностика', 'Изпрати заявка за предпочитан ден и час. Сервизът потвърждава часа или предлага друг.'),
    appointment('Смяна на масло', 'При покупка на масло от сервиза трудът за смяната е безплатен. Цената на маслото и таксата за труд в останалите случаи се уточняват със сервиза.'),
    appointment('Ремонт на ходова част', 'Изпрати заявка за предпочитан ден и час. Сервизът потвърждава часа или предлага друг.'),
  ],
  booking: { kind: 'form', url: bookingUrl },
  openingHours: { days: [
    ...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '19:00' }] })),
    { weekday: 6, periods: [] },
    { weekday: 7, periods: [] },
  ], sourceUrl: contact, checkedOn },
  verification: { status: 'approved', checkedOn, validUntil, contact,
    booking: { url: bookingUrl, excerpt: 'Клиентът заявява услуга и предпочитан час в сайта на сервиза. Сервизът потвърждава или предлага друг час.' },
  },
}]

export const IVON_GORNA_BANYA_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: bookingUrl, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, bookingUrl, menu, contact, site + 'prices/'],
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl, serviceUrls: [menu, website],
    notes: 'The dated live booking form has all three selected services and no monetary tariff. The reachable owner menu gives no total or regular tariff for them; it does state that the oil-change labour is free only if oil is purchased from the workshop. This condition is shown as text, not as a zero price for the service. The tyre-storage rate and the unavailable tyre-price page are unrelated and not imported.',
  },
  inventoryIdentity: '6abfdd5db2965835a83efb2edf8c86133700a393eb03f7b072af20118833f7f4',
  notes: 'Read the actual owned booking form first, including diagnosis, oil change and running gear repair, then the full service menu, workshop page and contacts. Only these three verified selections carry over, with no inferred prices, durations, availability or sister-branch schedule. The workshop and contacts agree on weekday hours and a closed weekend; the more generic historical booking-page hours were not used. Public contact, branch page and its own named map marker identify the same premises. No form submission, booking, calendar access or partnership change.',
}]
