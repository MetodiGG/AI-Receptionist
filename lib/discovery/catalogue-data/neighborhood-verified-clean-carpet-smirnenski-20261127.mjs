import { OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-clean-carpet-smirnenski-marko-bochar1', name = 'Clean Carpet'
const cityCode = '68134', neighborhood = 'Христо Смирненски', category = 'home_services'
const address = 'София, ж.к. Христо Смирненски, ул. Марко Бочар 1'
const website = 'https://clean-carpet.net/', phone = '+359883741777'
const contact = website + 'contacts/', tariff = website + 'ceni/', terms = website + 'obshti-usloviya/'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const VERIFIED_CLEAN_CARPET_SMIRNENSKI_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: { latitude: 42.6929345, longitude: 23.3675524, source: website,
    method: 'first_party_coordinates', sourceAddress: address },
  services: [{
    name: 'Машинно пране на килими · вземане от адрес', category, appointmentModel: 'home_visit',
    description: 'Стандартно машинно пране с вземане и връщане от адрес в София по уговорка. Транспортът е включен и няма минимална поръчка. При силно замърсяване се уточнява доплащане от 2 € на кв.м. Крайната цена може да се потвърди след оглед.',
    price: { amount: 3.99, currency: 'EUR', kind: 'fixed', unit: 'кв.м', sourceUrl: tariff, checkedOn },
  }],
  booking: { kind: 'phone', phone },
  verification: { status: 'approved', checkedOn, validUntil, contact,
    booking: { url: tariff, excerpt: 'Бутонът за заявка към услугата за вземане от адрес набира телефона на Clean Carpet. Уговори посещение директно с фирмата.' } },
}]

export const VERIFIED_CLEAN_CARPET_SMIRNENSKI_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, tariff, contact, terms, OFFICIAL_SOFIA_SOURCE_URL],
  inventoryIdentity: 'b19df7588254ad76cd3fcfccbaaba1cb425690e84102ecea4190130019516b06',
  notes: 'Owner homepage links the fixed staffed base (not a rotating CleanPoint) to a public visitor marker at ул. Марко Бочар 1. Sofia civic RN111283 verifies the same street and number; district records corroborate the neighborhood. The generic Надежда footer was not used as a customer address. Only the scheduled home-pickup variant qualifies: owner tariff lists literal EUR 3.99/m² with return transport included, and the terms explicitly establish an agreed pickup time. The corresponding CTA links to tel:+359883741777. No stored slot, call, submission, or customer/provider account was used. The standalone drop-off tariff, conflicting duration claims, rotating mobile points, express orders and any car wash listing are excluded.',
}]
