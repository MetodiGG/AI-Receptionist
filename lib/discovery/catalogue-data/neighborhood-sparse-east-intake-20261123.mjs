import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const cityCode = '68134'
const saltHome = {
  id: 'sofia-salt-home-druzhba2-block302a', name: 'Солна стая Salt Home',
  neighborhood: 'Дружба 2', address: 'София, ж.к. Дружба 2, бл. 302, партер, зад вх. А',
  website: 'https://solnastaya.com/', phone: '+359883227407',
}
const contact = `${saltHome.website}kontakti/`
const yoga = `${saltHome.website}joga/`
const reservations = `${saltHome.website}reservations/`
const saltRoomPrices = `${saltHome.website}ceni/`
const linkedPremises = 'https://easybook.bg/solna-staya-salt-home-sofiya-druzhba-2'

export const SPARSE_EAST_INTAKE_20261123_RECORDS = [
  {
    ...saltHome, cityCode, locationKind: 'premises', category: 'fitness',
    coordinates: {
      latitude: 42.649786, longitude: 23.406227, source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
      sourceAddress: saltHome.address, sourceCityCode: cityCode, sourceNeighborhood: saltHome.neighborhood,
      sourceWebsite: saltHome.website, checkedOn, addressId: '21895', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
    },
    services: [{
      name: 'Йога в солна стая · групова практика', category: 'fitness', appointmentModel: 'group_reservation',
      description: 'Група до 5 души. Събота, 17:00–18:30, с чай след практиката. Мястото се потвърждава от студиото по телефон.',
      durationMin: 90, durationSourceUrl: yoga, durationCheckedOn: checkedOn,
      price: { amount: 17.90, currency: 'EUR', kind: 'fixed', sourceUrl: yoga, checkedOn, validUntil },
    }],
    booking: { kind: 'phone', phone: saltHome.phone },
    verification: {
      status: 'approved', checkedOn, validUntil, contact,
      booking: { url: yoga, excerpt: 'На страницата за йога Salt Home посочва телефон за предварителна резервация за съботната групова практика.' },
    },
  },
]

export const SPARSE_EAST_INTAKE_20261123_REVIEWS = [
  {
    id: saltHome.id, checkedOn, website: saltHome.website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [saltHome.website, contact, yoga, reservations, saltRoomPrices, linkedPremises, OFFICIAL_SOFIA_SOURCE_URL],
    notes: 'The operator publishes the actual telephone for the named Saturday group yoga session and its EUR 17.90 price with a limit of five participants. It does not specify a per-person or whole-group pricing unit, so none is encoded. The municipal point matches entrance А; the rear access is supplied separately by the operator-linked booking profile. The linked booking profile gives different venue hours, so no regular opening hours are imported. The operator’s general salt-room tariff is for other activities and does not replace the yoga tariff. The service description carries no health claims or availability guarantee.',
    inventoryIdentity: '7b914bf06310bb1a5e02c6ef2212618af0e9571bd4a50f6c76b856943a5fb086',
  },
]
