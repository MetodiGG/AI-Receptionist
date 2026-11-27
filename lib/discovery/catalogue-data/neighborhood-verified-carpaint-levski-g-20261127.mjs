import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-car-paint-service-levski-g-kyumyurdzhiev22'
const name = 'Car Paint Service'
const cityCode = '68134', neighborhood = 'Левски Г', category = 'auto_repair'
const address = 'София, кв. Левски Г, ул. Поручик Георги Кюмюрджиев 22'
const website = 'https://carpaintservice.bg/', phone = '+359884095660'
const bookingEntry = website + 'portfolio/', contact = website + 'contacts/', services = website + 'services/'
const diagnostics = new URL('events-view/диагностика-двг/', website).href
const promotions = new URL('промоции/', website).href
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const VERIFIED_CARPAINT_LEVSKI_G_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.713613, longitude: 23.381120, method: 'verified_official_address',
    source: OFFICIAL_SOFIA_SOURCE_URL, sourceAddress: address, sourceCityCode: cityCode,
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn,
    addressId: '94646', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Компютърна диагностика на двигател (ДВГ)', category, appointmentModel: 'appointment',
    description: 'Във формата избери диагностика на двигателя. Заявката не е потвърден час; уточни деня и цената със сервиза.',
  }],
  booking: { kind: 'form', url: bookingEntry },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: bookingEntry, excerpt: 'Сред видовете ремонт във формата за резервации има диагностика на ДВГ.' },
  },
}]

export const VERIFIED_CARPAINT_LEVSKI_G_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [bookingEntry, website, services, diagnostics, promotions, contact, website + 'privacy-policy/', OFFICIAL_SOFIA_SOURCE_URL],
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: bookingEntry, serviceUrls: [diagnostics, services, promotions],
    notes: 'The owner’s actual Reservations page was rendered in a clean Chromium session. It shows a real public request form including the exact engine-diagnostics choice and no public rate or slot. The directly requested dedicated service page returned ordinary HTTP 200 with the computer diagnosis description, no number or package fee. The owner services inventory and promotions page did not supply a fee for this diagnosis. Do not infer one from any other repair, periodical maintenance, estimate or previous promotion.',
  },
  inventoryIdentity: 'f27cf2d52f400e635efcdbf2ab9d3a04025977d64a1f745fb9f53c823285ad0f',
  notes: 'The named Sofia workshop is corroborated by its actual contact/owner pages and exact municipal record RN94646; the point represents the civic building address, not a surveyed vehicle entrance. Booking is only an external request with the exact chosen repair; no slot, fitment guarantee, duration, quote, urgent response or health/insurance claim. No form controls filled, notice submission, appointment, independent service fee, owner photos/prose or third-party booking data copied.',
}]
