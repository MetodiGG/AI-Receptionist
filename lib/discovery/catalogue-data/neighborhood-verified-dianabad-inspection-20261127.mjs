const id = 'sofia-avtokontrol-plus-dianabad'
const cityCode = '68134', neighborhood = 'Дианабад', category = 'auto_repair'
const address = 'София, ж.к. Дианабад, ул. Крум Кюлявков, срещу бл. 31А'
const website = 'https://gtpdianabad.bg/', phone = '+359876447730'
const bookingEntry = 'https://myve.bg/avtokontrol-plyus-ood-obekt14366.html?tab=schedule'
const sba = 'https://www.sba.bg/snews/view/2370'
const checkedOn = '2026-11-27', validUntil = '2026-12-18'

export const VERIFIED_DIANABAD_INSPECTION_20261127_RECORDS = [{
  id, name: 'Автоконтрол Плюс · Дианабад', cityCode, neighborhood, address, category, website, phone,
  locationKind: 'premises',
  coordinates: {
    latitude: 42.660764, longitude: 23.347556, method: 'first_party_coordinates',
    source: website, sourceAddress: address,
  },
  services: [{
    name: 'Годишен технически преглед · лек автомобил', category,
    description: 'Таксата се уточнява с пункта. Записването е предварително през MyVe.',
    appointmentModel: 'appointment',
  }],
  booking: { kind: 'form', url: bookingEntry },
  verification: { status: 'approved', checkedOn, validUntil, contact: website, booking: {
    url: website,
    excerpt: 'Сайтът на пункта води до графика за годишен технически преглед на този обект в MyVe. Записването се извършва при външния доставчик, не в GoRez.',
  } },
}]

export const VERIFIED_DIANABAD_INSPECTION_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry, bookingReview: 'provider_booking_reviewed',
  reviewedUrls: [website, bookingEntry, sba],
  notes: 'Followed the direct booking link on the inspection station site. Its MyVe target shows this exact branch, a public appointment-date interface, a same-branch reservation form and a passenger-car inspection in the service list. No appointment was submitted and no slot or duration was inferred. The station’s own directions link supplies the numeric destination 42.660764,23.347556; SBA corroborates the bay on Krum Kyulyavkov Street opposite block 31A. The residential address point was not used.',
  inventoryIdentity: 'd81d4c57309d1bff0cc048ed2773c4631726af8bde3e41122924ef0c85a99dbd',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: bookingEntry, serviceUrls: [website, bookingEntry],
    notes: 'The official homepage tariff section (price-anchor) lists vehicle classes without amounts. The passenger-car service and same-branch public booking form expose no fee. An advertised tire, the fine in the FAQ, and historical promotions or member-only terms are not inspection prices.',
  },
}]
