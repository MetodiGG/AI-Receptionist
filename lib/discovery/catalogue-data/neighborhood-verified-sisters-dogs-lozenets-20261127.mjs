import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const id = 'sofia-sisters-of-dogs-lozenets-tachev18', name = 'Sisters of Dogs'
const cityCode = '68134', neighborhood = 'Лозенец', category = 'pets'
const address = 'София, кв. Лозенец, ул. Проф. Хараламби Тачев 18'
const website = 'https://sistersofdogs.com/', phone = '+359889901096'
const contact = website + 'kontakti', menu = website + 'uslugi-i-ceni'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'
const price = amount => ({ amount, currency: 'EUR', kind: 'fixed', unit: 'с ДДС', sourceUrl: menu, checkedOn, validUntil })

export const VERIFIED_SISTERS_DOGS_LOZENETS_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.672174, longitude: 23.334015, method: 'verified_official_address',
    source: OFFICIAL_SOFIA_SOURCE_URL, sourceAddress: address, sourceCityCode: cityCode,
    sourceNeighborhood: neighborhood, sourceWebsite: website, checkedOn, addressId: '2678',
    licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  services: [
    { name: 'Цялостен груминг за късокосместо куче до 4 кг', category, appointmentModel: 'appointment',
      description: 'Цялостното разресване се заплаща отделно. При сплъстена козина, ако разресването е възможно, тарифата за него е 25 € на час.',
      price: price(30) },
    { name: 'Подрязване на нокти на куче', category, appointmentModel: 'appointment',
      description: 'За кучета от всички размери.', price: price(7) },
  ],
  booking: { kind: 'phone', phone },
  verification: { status: 'approved', checkedOn, validUntil, contact,
    booking: { url: contact, excerpt: 'За услугите студиото насочва към контакт с грумърите по телефон. Час се уговаря със салона.' } },
}]

export const VERIFIED_SISTERS_DOGS_LOZENETS_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, menu, website + 'za-nas', website + 'robots.txt', OFFICIAL_SOFIA_SOURCE_URL],
  inventoryIdentity: '49c446062c0f5c9c8101e2c33cb20272c7ef02196a01446eb02c274e6df2bdb3',
  notes: 'Followed the operator call/contact action and verified the same branch phone on the tariff. The operator identifies the Lozenets premises and exact number 18; city record RN2678 supplies the street point. Fixed EUR 30 is only the up-to-4-kg short-haired full groom; all-size dog nail trimming is EUR 7. Both include VAT. Complete brushing is separate; permitted detangling for mats is charged by the hour. No other tariffs, medical or dental treatment, duration, hours, staff availability or distinct second business inferred. No form, call, appointment, calendar or provider integration opened.',
}]
