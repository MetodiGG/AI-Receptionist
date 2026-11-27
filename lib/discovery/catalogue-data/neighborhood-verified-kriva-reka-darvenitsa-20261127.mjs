import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-27', validUntil = '2026-12-27', cityCode = '68134', category = 'other'
const psychology = 'https://geyamed.eu/', dental = 'https://stamovident.net/'
const doctor = psychology + 'doctors/дивна-стоянова-психолог/'
const fees = psychology + 'ценоразпис-на-мц-гея-мед/'
const contact = psychology + 'контакти-медицински-център-гея-мед/'
const dentalRegistry = 'https://reports.nhif.bg/nhif_reports/nhif_partners/?page=dentists&rzok=22&district='
const medicalRegister = 'https://iamn.bg/wp-content/uploads/registers/22_REGISTER_LZ%20dejstvashti.pdf'

const sources = [
  {
    id: 'sofia-divna-stoyanova-geyamed-kriva-reka-bogdanovets6', name: 'Психолог Дивна Стоянова · МЦ Гея Мед',
    neighborhood: 'Крива река', address: 'София, кв. Крива река, ул. Богдановец 6',
    website: psychology, phone: '+359883727676', point: [42.686903, 23.302523], addressId: '19608',
    service: 'Индивидуална психологическа консултация',
    description: 'Индивидуална среща с Дивна Стоянова в кабинета. При записване по телефона уточни, че търсиш консултация с нея.',
    contact, bookingUrl: doctor,
    excerpt: 'Профилът на Дивна Стоянова посочва телефон за записване на консултация.',
    reviewedUrls: [psychology, doctor, contact, fees, OFFICIAL_SOFIA_SOURCE_URL],
    serviceUrls: [doctor, fees],
    inventoryIdentity: 'e0d4e4f2d26b775fd6e1302c4c1499040cb04451cc0a7386ad955b17f13f8d8d',
    priceNotes: 'The exact practitioner page, branch contacts and the readable published facility tariff were checked. The tariff contains other specialties but does not publish a fee or duration for this individual psychological consultation via this booking number. No other venue or third-party fee transferred.',
    notes: 'This is a named individual psychologist listing at a host venue, not a general clinic listing. The phone is the host reception number explicitly provided in her named appointment profile. The owner-linked branch map and civic RN19608 agree on the exact Sofia street number. The corporate address is not a client destination. No booking, calendar, private details, insurance, training claims or external service photos used.',
  },
  {
    id: 'sofia-stamovident-darvenitsa-plovdivsko11', name: 'Стамови Дент · Дървеница',
    neighborhood: 'Дървеница', address: 'София, ж.к. Дървеница, ул. Пловдивско поле 11, вх. 4',
    website: dental, phone: '+359899474786', point: [42.659005, 23.362732], addressId: '96741',
    service: 'Първична дентална консултация',
    description: 'Консултация при първо посещение с предварително уговорен час по телефона.',
    contact: dental, bookingUrl: dental,
    excerpt: 'Кабинетът описва първото посещение и посочва телефон за уговаряне на час.',
    reviewedUrls: [dental, dentalRegistry, medicalRegister, OFFICIAL_SOFIA_SOURCE_URL],
    serviceUrls: [dental],
    inventoryIdentity: 'fe04de04efa901d9cfbeb4ecaa628182d0e4156b8d372db80ec70cf8e7370b66',
    priceNotes: 'The complete readable owner service and contact page has a specific first-visit consultation and phone route, but does not publish a tariff or duration for it. No insurance price, assumed fee or adjacent dental procedure was substituted.',
    notes: 'The owner lists Darvenitsa, Plovdivsko Pole 11 and a live telephone link reached from the appointment controls. NHIF row 1153 and IAmN permit 2216114506 corroborate the dental group and exact entrance 4. Civic RN96741 identifies entrance 4, not the neighbouring dental business at entrance 5. Not a general medical clinic or an internal GoRez booking.',
  },
]

export const VERIFIED_KRIVA_REKA_DARVENITSA_20261127_RECORDS = sources.map(item => ({
  id: item.id, name: item.name, cityCode, neighborhood: item.neighborhood, category,
  address: item.address, website: item.website, phone: item.phone, locationKind: 'premises',
  coordinates: {
    latitude: item.point[0], longitude: item.point[1], method: 'verified_official_address',
    source: OFFICIAL_SOFIA_SOURCE_URL, sourceAddress: item.address, sourceCityCode: cityCode,
    sourceNeighborhood: item.neighborhood, sourceWebsite: item.website,
    checkedOn, addressId: item.addressId, licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{ name: item.service, category, description: item.description, appointmentModel: 'appointment' }],
  booking: { kind: 'phone', phone: item.phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: item.contact,
    booking: { url: item.bookingUrl, excerpt: item.excerpt },
  },
}))

export const VERIFIED_KRIVA_REKA_DARVENITSA_20261127_REVIEWS = sources.map(item => ({
  id: item.id, website: item.website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: item.reviewedUrls, pricingDecision: 'not_publicly_listed', inventoryIdentity: item.inventoryIdentity,
  priceSearch: { outcome: 'not_published', bookingUrl: item.bookingUrl, serviceUrls: item.serviceUrls, notes: item.priceNotes },
  notes: item.notes,
}))

// The owner's public partner directory links CoolFit. The reciprocal venue
// record confirms Izgrev, Elemag 22 and this phone, not a specific entrance.
// A different address, booking target or existing point must not be overwritten.
export function applySamaIzgrevNeighborhood20261127(rows) {
  return rows.map(row => (
    row.id === 'sofia-sama-pilates' && row.cityCode === cityCode && row.category === 'fitness' &&
    row.neighborhood === null && row.coordinates === null && row.locationKind === 'premises' &&
    row.address === 'София, ул. Елемаг 22' && row.phone === '+359879957507' &&
    row.website === 'https://www.samapilates.bg/' && row.verification?.status === 'approved' &&
    row.verification.contact === 'https://www.samapilates.bg/en' &&
    row.booking?.kind === 'form' && row.booking.url === 'https://www.samapilates.bg/en/login'
      ? { ...row, neighborhood: 'Изгрев' } : row
  ))
}
