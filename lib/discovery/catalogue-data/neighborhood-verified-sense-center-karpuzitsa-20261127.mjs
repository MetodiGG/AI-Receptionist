import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-sense-center-karpuzitsa-nikola-petkov95a', name = 'Sense Center · Карпузица'
const cityCode = '68134', neighborhood = 'Карпузица', category = 'other'
const address = 'София, кв. Карпузица, бул. Никола Петков 95А'
const website = 'https://sense-center.bg/', phone = '+359879800013'
const contact = website + 'kontakti/', consultation = website + 'psiholog-za-roditeli/'
const fees = website + 'tseni/', terms = website + 'obshti-uslovia/'
const licenceRegister = 'https://aksu.government.bg/soczialni-uslugi/informirane-i-konsultirane/'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const VERIFIED_SENSE_CENTER_KARPUZITSA_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.669520, longitude: 23.253776, method: 'verified_official_address',
    source: OFFICIAL_SOFIA_SOURCE_URL, sourceAddress: address, sourceCityCode: cityCode,
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn,
    addressId: '110226', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Индивидуална консултация с психолог за родители', category,
    description: 'Присъствена индивидуална среща за родител. Час се уговаря предварително по телефона.',
    appointmentModel: 'appointment',
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: consultation, excerpt: 'Центърът посочва телефон за уговаряне на първа присъствена консултация с психолог за родители.' },
  },
}]

export const VERIFIED_SENSE_CENTER_KARPUZITSA_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, consultation, contact, fees, terms, licenceRegister, OFFICIAL_SOFIA_SOURCE_URL],
  pricingDecision: 'not_publicly_listed', inventoryIdentity: '5733b080893017dceb0f4920fb04feb8cf72d7fdf354ca72f02b7fb21a577226',
  priceSearch: {
    outcome: 'not_published', bookingUrl: consultation, serviceUrls: [consultation, fees],
    notes: 'The exact booking invitation, contact and readable owner tariff were inspected. The tariff lists a one-time parent consultation separately from ongoing programmes, but does not publish the fee or duration. The dedicated appointment page supplies neither. Individual programme pricing does not establish a fee for this visit.',
  },
  notes: 'List only the standalone appointment with a psychologist for parents. The exact appointment page and branch contact agree on the public booking phone. The operator and the active AKSU information and consultation licence corroborate 95A in Karpuzitsa; municipal RN110226 identifies the numbered civic address, not a GPS estimate at 95. No eligibility, outcomes, other modalities, programme prices, hours or appointment availability inferred. Owner terms reserve their content; no source text, assets, map data or testimonials reproduced. No call, form, calendar or appointment action.',
}]
