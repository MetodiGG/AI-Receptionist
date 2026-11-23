import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-little-smiles-mladost1-nikola-genadiev5g'
const neighborhood = 'Младост 1'
const address = 'София, ж.к. Младост 1, ул. Никола Генадиев 5Г'
const website = 'https://www.littlesmiles.bg/'
const phone = '+359988832856'
const deposit = 'Капаро за резервация: 50 €, възстановимо при отказ поне 7 дни преди събитието. Допълнителните напитки се заплащат отделно.'

const packages = [
  ['Детски рожден ден · до 10 деца', 240, 120,
    'Зала с детски кът, пица и напитки за 10 деца, игри и украса. Има асистент за игрите, но няма професионален аниматор.'],
  ['Детски рожден ден с аниматор · до 10 деца', 380, 120,
    'Зала с детски кът, пица и напитки за 10 деца, игри, украса и професионален аниматор за два часа.'],
  ['Семеен рожден ден · до 10 деца и 10 възрастни', 440, 150,
    'Зала с детски кът, игри, храна за децата и 70 мини брускети за възрастните, плюс аниматор за два часа. Тортата не е включена.'],
  ['Голям семеен рожден ден · до 10 деца и 20 възрастни', 480, 150,
    'Зала с детски кът, игри, храна за децата и 120 мини брускети за възрастните, плюс аниматор за два часа. Включена е торта с фотоснимка.'],
]

export const PRIORITY_FOUND_EAST_20261123_RECORDS = [{
  id, name: 'Little Smiles', cityCode: '68134', neighborhood, address, locationKind: 'premises',
  coordinates: {
    latitude: 42.653988, longitude: 23.377040, source: OFFICIAL_SOFIA_SOURCE_URL,
    method: 'verified_official_address', sourceAddress: address, sourceCityCode: '68134', sourceNeighborhood: neighborhood,
    sourceWebsite: website, checkedOn, addressId: '96261', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  },
  category: 'other', website, phone,
  services: packages.map(([name, amount, durationMin, includes]) => ({
    name, category: 'other', description: `${includes} ${deposit}`, appointmentModel: 'group_reservation',
    price: { amount, currency: 'EUR', kind: 'fixed', unit: 'пакет', sourceUrl: website, checkedOn, validUntil },
    durationMin, durationSourceUrl: website, durationCheckedOn: checkedOn,
  })),
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: website, excerpt: 'Основният бутон за резервации води към телефона за организиране на рождени дни и семейни събития.' },
  },
}]

export const PRIORITY_FOUND_EAST_20261123_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, new URL('robots.txt', website).href, OFFICIAL_SOFIA_SOURCE_URL],
  notes: 'Read the actual rendered owner reservation button and Contact. The owner explicitly uses the selected telephone number for event reservations, repeats it in Contact, and lists separate pricing and booking for ordinary visits and gaming, which are not imported here. The four event prices are whole package totals, not per-child amounts, deposits or promotions; the recorded duration is the hall duration, not the animator duration. The owner specifies guest caps, which packages include an animator, cake terms for the family tiers, extra charges for additional drinks, and a reservation deposit refundable for cancellation at least seven days before the event. No terms from the holiday promotion were imported. The displayed Mladost 1 street and number match one municipal record. No call, form, payment, reservation, business photo or availability was imported, performed or claimed.',
  inventoryIdentity: '25fe04ea4ca72242488431a9c8efffac4e24494715f8064722984a0369d163e9',
}]
