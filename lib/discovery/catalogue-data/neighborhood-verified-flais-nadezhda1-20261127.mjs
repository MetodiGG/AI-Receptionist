const id = 'sofia-flais-nadezhda1-lyuborodie2', name = 'Премиум Фитнес Флайс · Надежда'
const cityCode = '68134', neighborhood = 'Надежда 1', category = 'fitness'
const address = 'София, ж.к. Надежда 1, ул. Любородие 2'
const owner = 'https://www.flaisfitness.bg/', website = owner + 'premium-fitness-nadezhda/'
const club = 'https://nadezhda.flaisfitness.bg/'
const schedule = club + 'calendar', productList = club + 'buy-membership?club=true'
const prices = owner + 'ceni-premium-flais-nadezhda/', terms = owner + 'pravila/'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

const membership = (serviceName, amount, unit, description) => ({
  name: serviceName, category, description, appointmentModel: 'group_reservation',
  price: { amount, currency: 'EUR', kind: 'fixed', unit, sourceUrl: prices, checkedOn, validUntil },
})

export const FLAIS_NADEZHDA1_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone: null, locationKind: 'premises',
  coordinates: {
    latitude: 42.7314339, longitude: 23.2967566, method: 'first_party_coordinates', source: website, sourceAddress: address,
  },
  services: [
    membership('Групови тренировки и фитнес · карта за 7 дни', 25, 'пакет за 7 дни',
      'Цената е за целия период от 7 дни. Включва неограничен достъп до фитнес и до 1 групово занимание на ден. Записването за група е през профила във Флайс според свободните места.'),
    membership('Групови тренировки · карта за 3 месеца', 153, 'пакет за 3 месеца',
      'Цената е за целия период от 3 месеца и включва до 1 групово занимание на ден. Не включва фитнес зоната в този клуб или детските занимания и не се замразява. Записването е през профила във Флайс според свободните места.'),
  ],
  booking: { kind: 'form', url: schedule },
  verification: { status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: schedule, excerpt: 'Актуалният график на обекта в Надежда 1 показва груповите занимания. Клиентът ги резервира в профила си във Флайс според картата и свободните места.' },
  },
}]

export const FLAIS_NADEZHDA1_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: schedule, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [website, schedule, prices, productList, terms, owner + 'gdpr/'],
  inventoryIdentity: 'f542246c3cd68d849ab9c32a2060a3d9aad9c9bfc221ba9a4e53c483492c2d88',
  notes: 'The exact owner-linked branch calendar publicly showed adult group activities in the week of 23–29 November. It uses the club account for reservations, so there is no GoRez confirmation or assertion of current availability. The branch tariff and public product selector independently agree: 25 EUR total for 7 days (product 99997) and 153 EUR total for 3 months (product 96054). Each package has a daily limit of one group class, not a per-visit price. The latter excludes gym access at this branch and children’s activities and cannot be frozen. Source use is limited to short facts. The advertised kids yoga offer conflicts with the current archive date in the provider terms and is excluded, as is kids boxing with conflicting ages. No login, signup, payment, booking, analytics or production write.',
}]
