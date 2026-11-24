// One full-priced children's party package at the operator's verified Sofia address.
import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-candy-house-lyulin10-mayski-den22'
const neighborhood = 'Люлин 10'
const address = 'София, ж.к. Люлин 10, ул. Майски ден 22'
const website = 'https://candyhouse-bg.com/'
const contact = `${website}contact/`
const prices = `${website}prices/`
const phone = '+359895464206'

export const CANDY_HOUSE_INTAKE_20261123_RECORDS = [{
  id, name: 'Детски клуб „Бонбонената къща“', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.719352, longitude: 23.274338,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood, sourceWebsite: website,
    checkedOn, addressId: '30325', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'other', website, phone,
  services: [{
    name: 'Детско тържество · пакет за 10 деца', category: 'other', appointmentModel: 'group_reservation',
    description: 'За деца на 1–12 г. Храна и напитка за 10 деца, поднасяне на тортата. Доп. дете: 20 €. Внесена торта: 20 €; включена торта не е посочена. Невъзстановимо капаро 51,13 €. След уточняване се плащат 50% от стойността; уточнете отчитането на капарото. Заявки и промени най-късно 3 дни преди партито.',
    price: { amount: 300, currency: 'EUR', kind: 'fixed', unit: 'пакет за 10 деца', sourceUrl: prices, checkedOn, validUntil },
    durationMin: 120, durationSourceUrl: prices, durationCheckedOn: checkedOn,
  }],
  booking: { kind: 'form', url: contact },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: {
      url: contact,
      excerpt: 'Бутонът „Поръчай парти“ отваря формуляра за запитване на клуба. Часът и датата се уговарят с клуба; запитването не потвърждава резервация.',
    },
  },
}]

export const CANDY_HOUSE_INTAKE_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: contact, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, contact, prices],
  notes: 'The actual order-a-party CTA was followed to the owner’s public inquiry form before tariff review. It does not expose live availability or offer a native checkout slot. The EUR 300 price appears on the ordinary ten-child celebration package, not a deposit, extra child, longer party or promotion. General owner terms on the price page supply the two-hour duration, age range, charges, non-refundable deposit, advance payment and deadline; they do not resolve how the deposit is applied toward the 50 percent. No entertainer, cake, private hall, indoor-only section or availability is promised from a neighboring package or marketing area. The separately corroborated location uses only the open municipal address point. No source prose beyond the short CTA label, photographs, menus, customer data, contact submissions or payments were used.',
  inventoryIdentity: 'f7c43a612a73c115ebb79ee07ff208c05c849b7277aec9c9570a6e4ab24b3688',
}]
