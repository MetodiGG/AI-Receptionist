import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-ac-power-suhodol-badeshte4a'
const website = 'https://acpower.eu/'
const contact = `${website}contacts/`
const service = `${website}${encodeURIComponent('почистване-на-dpf-fap-филтър')}/`
const phone = '+359895784785'
const neighborhood = 'Суходол'
const address = 'София, кв. Суходол, ул. Бъдеще 4А'

export const ACPOWER_INTAKE_20261123_RECORDS = [{
  id, name: 'Ауто Корект Пауър Тийм', cityCode: '68134', neighborhood, address,
  locationKind: 'premises', category: 'auto_repair', website, phone,
  coordinates: {
    latitude: 42.695773, longitude: 23.228608, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134',
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '113958',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [{
    name: 'Машинно почистване на DPF/FAP филтър', category: 'auto_repair',
    description: 'За дизелови автомобили Евро 6. Цената е само за почистване на филтъра. Демонтаж и монтаж на място се уговарят отделно.',
    price: { amount: 154, currency: 'EUR', kind: 'fixed', sourceUrl: service, checkedOn, validUntil },
    appointmentModel: 'appointment',
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: service, excerpt: 'Страницата за почистване на DPF/FAP посочва 0895 784 785 за записване на час. Телефонът съвпада с контакта на сервиза.' },
  },
}]

export const ACPOWER_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, service, `${website}${encodeURIComponent('услуги-2')}/`, `${website}privacy-policy/`, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'The named DPF/FAP service page was checked for its explicit telephone appointment instruction before accepting the tariff on the same page. The same workshop phone is published separately from the store phone. The owner publishes a fixed EUR154 for machine cleaning on the dedicated service page and explicitly separates cleaning an already removed unit from workshop removal/refitting. The published Euro 6 scope is retained; separate catalyst work, removal or refitting charges, emissions defeats, unavailable hours and durations are not imported. The current public document was checked directly and carries September 2026 modification metadata, not an expired voucher. The exact owner postal address is bound to the unique official Sofia address 113958; this is not an entrance or map-derived pin. No calls, forms, bookings, source media or payments were used.',
  inventoryIdentity: '1d427bdb216466ff98929d48fcf6521df2b4c231fbcabb69bfc8490c9effd234',
}]
