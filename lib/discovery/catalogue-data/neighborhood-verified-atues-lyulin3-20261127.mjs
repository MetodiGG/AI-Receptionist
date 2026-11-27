const id = 'sofia-a-tu-estilo-lyulin3-block386', name = 'A Tu Estilo'
const website = 'https://www.atuestilo.eu/', phone = '+359885225558'
const cityCode = '68134', neighborhood = 'Люлин 3', category = 'barber'
const address = 'София, ж.к. Люлин 3, бл. 386, ул. Георги Дражев'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'
const needsConfirmation = 'Заяви предпочитан час през сайта. Салонът ще потвърди часа или ще предложи друг според графика си.'
const pairTerms = 'Обща цена за подстригване и оформяне на брада. Заяви предпочитан час през сайта; салонът ще потвърди часа или ще предложи друг.'
const fixed = (amount, unit) => ({ amount, currency: 'EUR', kind: 'fixed', unit, sourceUrl: website, checkedOn, validUntil })

export const ATUES_LYULIN3_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  // The owner's own address search isn't a named destination. A third-party
  // door label is not enough to select one of four civic entrance points.
  coordinates: null,
  services: [
    { name: 'Мъжко подстригване', category, appointmentModel: 'appointment',
      price: fixed(20, 'подстригване'), description: needsConfirmation },
    { name: 'Мъжко подстригване и оформяне на брада', category, appointmentModel: 'appointment',
      price: fixed(30, 'общо за подстригване и брада'), description: pairTerms },
  ],
  booking: { kind: 'form', url: website },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: website, excerpt: 'Избери „Резервация“ на сайта на салона. Формата изпраща заявка за потвърждение от салона, а не потвърден час от GoRez.' },
  },
}]

export const ATUES_LYULIN3_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: website, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, 'https://galinca.com/za-nas/frizyorsko-studio-ekryu/', 'https://galinca.com/kontakti/'],
  inventoryIdentity: '0d28d8b83e8f102646f73eb0743c01ae72a6b6ccf1bd7cbfa6e7f488936ec13f',
  notes: 'The live public owner document and its in-page booking section were inspected before the menu. The operator publishes the same two fixed prices in both sections: EUR 20 for one men’s haircut and EUR 30 total for haircut and beard shaping. Online is a request that the salon confirms or suggests an alternative time for; no native slots or instant confirmation. There is a separate face-cleansing offer and a separate offsite work form; neither was included. The address and exact phone are repeated on the operator’s form. The existing co-located Ecru Studio is run by Galinca and has a distinct booking phone and venue identity. No shared pin, door, copied reviews or photos, contact fields, calls, bookings or submissions.',
}]
