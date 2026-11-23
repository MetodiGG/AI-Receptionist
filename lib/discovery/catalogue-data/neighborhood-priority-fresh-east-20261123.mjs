const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-anev-barber-mladost1a-ahmatova532'
const website = 'https://anevbarbershop.bg/'
const phone = '+359894419185'
const neighborhood = 'Младост 1А'
const address = 'София, ж.к. Младост 1А, ул. Ана Ахматова, бл. 532'
const rateConditions = 'Измиването е включено в цената.'

export const PRIORITY_FRESH_EAST_20261123_RECORDS = [{
  id, name: 'Anev Barber Shop', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.6512079, longitude: 23.3843131, source: website,
    method: 'first_party_coordinates', sourceAddress: address,
  },
  category: 'barber', website, phone,
  services: [
    ['Мъжко подстригване', 15],
    ['Оформяне на брада', 10],
    ['Подстригване и оформяне на брада', 20],
    ['Кралско бръснене', 15],
    ['Бръснене на глава', 15],
    ['Бръснене на глава и оформяне на брада', 20],
    ['Подстригване с машинка · един номер', 10],
    ['Оформяне на вежди', 2, false],
  ].map(([name, amount, includeWashNote = true]) => ({
    name, category: 'barber', ...(includeWashNote ? { description: rateConditions } : {}), appointmentModel: 'appointment',
    price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl: website, checkedOn, validUntil },
  })),
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: website, excerpt: 'Салонът приема записвания само по телефон и публикува същия номер при ценоразписа и в контактите.' },
  },
}]

export const PRIORITY_FRESH_EAST_20261123_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, new URL('robots.txt', website).href, 'https://urbandata.sofia.bg/dataset/address_sofia-zip'],
  notes: 'The live first-party Contact explicitly says appointment by phone only and offers the same direct number in Contact and the menu. First-party price and booking sections are read together on the same page: eight ordinary EUR prices, including single-length clipper work and general brows without a stated method. The published wash inclusion is retained without making a separate claim about eyebrow grooming. No duration, business hours or slot availability was inferred. The owner published the exact business point at the address in its native structured data and Directions control. The municipal file corroborates block 532 but lists distinct entrance postal points; neither entrance number was assigned. No map-provider data were requested, and no calls, bookings, photos or reviews were copied or submitted. The age-specific child rate is omitted pending a suitable illustration: the existing generic child haircut asset depicts an older child.',
  inventoryIdentity: 'a309693e0f8c3a4c56fa0ca41417072852f14f19aa6304fa16bafc47293c992f',
}]
