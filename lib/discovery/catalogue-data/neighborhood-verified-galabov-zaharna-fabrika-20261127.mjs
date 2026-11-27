import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-galabov-legal-zaharna-fabrika-block31a', name = 'Galabov Legal · Захарна фабрика'
const cityCode = '68134', neighborhood = 'Захарна фабрика', category = 'consulting'
const address = 'София, ж.к. Захарна фабрика, бл. 31, вх. А, партер, офис 5'
const site = 'https://galabov.legal', website = site + '/bg', phone = '+359886350154'
const contact = website + '/kontakti', services = website + '/uslugi'
const terms = website + '/pravna-informaciya', calculator = website + '/kalkulator-advokatski-vaznagrazhdenia'
const barRegister = 'https://bar-register.bg/attorney/4000244510'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const VERIFIED_GALABOV_ZAHARNA_FABRIKA_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.716264, longitude: 23.287302, method: 'verified_official_address',
    source: OFFICIAL_SOFIA_SOURCE_URL, sourceAddress: address, sourceCityCode: cityCode,
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn,
    addressId: '53464', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Първоначална правна консултация', category,
    description: 'Първата консултация е безплатна. Изпрати запитване до кантората, за да уточниш час и начин на провеждане. Последващи услуги не са включени.',
    appointmentModel: 'appointment',
    price: { amount: 0, currency: 'EUR', kind: 'fixed', unit: 'само първоначална консултация', sourceUrl: website, checkedOn, validUntil },
  }],
  booking: { kind: 'form', url: contact },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: contact, excerpt: 'Бутонът за първа консултация отваря форма за запитване до кантората; часът и начинът на провеждане се уточняват с нея.' },
  },
}]

export const VERIFIED_GALABOV_ZAHARNA_FABRIKA_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: contact, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, contact, services, terms, calculator, barRegister, site + '/robots.txt', OFFICIAL_SOFIA_SOURCE_URL],
  inventoryIdentity: 'dd31b627032505c93274a6df7487a73b15d46be1e463b891e68bb49728ca4be0',
  notes: 'The live rendered owner homepage explicitly names the initial consultation as free and its appointment button leads to the operator contact form. The form provides a way to request an appointment, not to book a confirmed slot. The owner service menu links the same form. The separate calculator estimates fees under general rules and is not a tariff for the initial consultation. Record only the stated initial zero fee; no later fees, duration, office hours, availability or delivery mode are inferred. The legal information page and active Sofia Bar registration identify the same professional office and phone. Sofia civic RN53464 identifies block 31, entrance A. No form, telephone, calendar, account or appointment action. No legal advice, marketing prose or source imagery reused.',
}]
