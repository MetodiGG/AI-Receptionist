import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-unigas-romano-voenna-rampa-konstantin3'
const website = 'https://unigas.bg/'
const ownerPath = path => `${website}${encodeURIComponent(path).toLowerCase()}/`
const contact = `${website}contact/`
const serviceMenu = ownerPath('цена-газов-инжекцион')
const tariff = ownerPath('газов-инжекцион-4-цилиндъра')
const ownerWorkshop = ownerPath('оторизирани-сервизи')
const neighborhood = 'Военна рампа'
const address = 'София, кв. Военна рампа, ул. Константин Преславски 3'

export const UNIGAS_INTAKE_20261123_RECORDS = [{
  id, name: 'Унигаз България · Romano', cityCode: '68134', neighborhood, address,
  locationKind: 'premises', category: 'auto_repair', website, phone: '+359892203204',
  coordinates: {
    latitude: 42.725261, longitude: 23.326636, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '98280',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Монтаж на газов инжекцион Romano Antonio ECO — 4 цилиндъра', category: 'auto_repair',
    description: 'Началната цена е с ДДС и включва системата с цилиндрична бутилка до 40 л, монтаж, настройка, сервизна книжка и монтажен протокол. Крайната цена зависи от автомобила, сложността на монтажа и избраните допълнения.',
    price: { amount: 700, currency: 'EUR', kind: 'from', sourceUrl: tariff, checkedOn, validUntil },
    appointmentModel: 'appointment',
  }],
  openingHours: {
    days: [...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '08:30', close: '17:00' }] })),
      { weekday: 6, periods: [] }, { weekday: 7, periods: [] }],
    sourceUrl: contact, checkedOn,
  },
  booking: { kind: 'form', url: contact },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: contact, excerpt: 'Бутонът за записване води до формуляр за час за монтаж на газова система. Сервизът се свързва за потвърждение на заявката.' },
  },
}]

export const UNIGAS_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: contact, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, contact, serviceMenu, tariff, ownerWorkshop, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Followed the owner’s appointment button to the public form that expressly requests an appointment for installation of a vehicle gas system, subject to confirmation by the owner. No instant confirmation or availability is shown. The public service-pricing index and the dedicated base Antonio ECO four-cylinder installation page agree on EUR700 from, VAT included. The detailed tariff includes the base system with a cylindrical tank up to 40 L, workshop fitting, setup, a service booklet and the installation report. Installation complexity, vehicle specifics and optional extras can change the amount; the separate OBD and direct-injection variants, extras and retail prices are not imported. The owner names its staffed Sofia workshop and its own service number separately from the shop line and publishes workshop hours on the confirmed appointment page, not slots. The exact postal point is bound to unique municipality row 98280. Used only ordinary public workshop facts, no copies of source text or media, forms submitted, calls, queries to a paid provider, or durations.',
  inventoryIdentity: '028a448ff160f4c9dc843b2c1e4ec377982270dd37bbbfd9c3cb8a0d250697a8',
}]
