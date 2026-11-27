import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-dekra-automotive-fakulteta-suhodolska102'
const cityCode = '68134', neighborhood = 'Факултета', category = 'auto_repair'
const address = 'София, кв. Факултета, ул. Суходолска 102'
const website = 'https://dekra-automotive.bg/'
const booking = 'https://dekra-automotive.bg/?c=reservation'
const section = slug => website + encodeURIComponent(slug)
const contact = section('контакти'), tariff = section('годишни-технически-прегледи')
const municipalArea = 'https://rayon-oborishte.bg/wp-content/uploads/2021/04/25.4.2021-Grafik24_water_20210425150102.pdf'
const branchReferral = 'https://www.sba.bg/snews/view/2337'
const checkedOn = '2026-11-27', validUntil = '2026-12-18'

export const VERIFIED_DEKRA_FAKULTETA_20261127_RECORDS = [{
  id, name: 'ДЕКРА Аутомотив', cityCode, neighborhood, address, website,
  phone: '+35928263447', category, locationKind: 'premises',
  coordinates: {
    latitude: 42.695959, longitude: 23.232031, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    sourceAddress: address, sourceCityCode: cityCode, sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '106040', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Годишен технически преглед на лек автомобил · М1/M1G',
    category, appointmentModel: 'appointment',
    description: 'Цената е с ДДС. За допълнително монтирана газова или метанова уредба се доплащат 5 €. Онлайн записването е за следващия работен ден; заявка за същия ден може да бъде отказана.',
    price: { amount: 50, currency: 'EUR', kind: 'fixed', sourceUrl: tariff, checkedOn },
  }],
  booking: { kind: 'form', url: booking },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: booking, excerpt: 'Пунктът в София приема онлайн записване за ГТП през формата на ДЕКРА, към която води ценоразписът за услугата.' },
  },
}]

export const VERIFIED_DEKRA_FAKULTETA_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: booking, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, booking, contact, tariff, branchReferral, municipalArea, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The current owner price list effective 1 October 2026 and the public reservation form show the same ordinary 50 EUR VAT-inclusive category M1/M1G rate. Keep the separately stated 5 EUR installed LPG/CNG surcharge and next-working-day/same-day conditions, not a discount or a free default value. The form does not ask for a branch: the operator’s partner SBA explicitly sends users of the Sofia Suhodolska/Fakulteta station to this same tariff and booking route; the operator confirms 102 Suhodolska and the municipality and published utility works table establish the precise point and quarter. Do not infer a slot, apply the rate to other vehicle categories, or list Plovdiv. No booking or data submitted.',
  inventoryIdentity: 'a8e7a0b378a76cea87aa1c1d1fa8acfe38cab36fb0037f0710bc22870fb5e91b',
}]
