const id = 'sofia-orlyak-sport-banishora-orlyak24a', name = 'Спортна зала Орляк'
const cityCode = '68134', neighborhood = 'Банишора', category = 'fitness'
const address = 'София, ж.к. Банишора, ул. Орляк 24А'
const website = 'https://orlyak.com/', phone = '+359878515130'
const contact = website + '?page_id=43', training = website + '?page_id=64'
const calendar = website + '?page_id=633', alternateCalendar = website + '?page_id=596'
const association = 'https://www.dadao.org/klubove/orlyak/'
const ownerMap = 'https://www.google.com/maps/d/embed?mid=1rDb332vm5-LSabN1h1JWtWPVjZ8TjYc&ehbc=2E312F'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const ORLYAK_BANISHORA_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  coordinates: {
    latitude: 42.7128963, longitude: 23.3091318, method: 'first_party_coordinates',
    source: contact, sourceAddress: address,
  },
  services: [{
    name: 'Да Дао за деца · групова тренировка по бойни изкуства',
    category, appointmentModel: 'group_reservation',
    description: 'За записване на дете в групата се свържи със залата по телефона. Уточни подходящата група и часа преди посещение.',
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact,
    booking: { url: training, excerpt: 'Страницата за детски тренировки посочва телефон за контакт и записване в залата в Банишора.' },
  },
}]

export const ORLYAK_BANISHORA_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, training, calendar, alternateCalendar, association, ownerMap],
  inventoryIdentity: '423f12d1a3cbf8bb784cdd7e81758ca4fb468674cb5d7556f8bf99461696187b',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: training, serviceUrls: [training, calendar, alternateCalendar],
    notes: 'The actual booking channel is the phone invitation on the dated review of the child programme. The owner home, public training and contact pages and both reachable calendar menus were read; no fee or tariff link was published for this programme. The association listing confirms the same enrollment channel and does not publish a fee. No third-party vouchers or historic amounts were used.',
  },
  notes: 'The first-party contacts and training pages specify the exact street number 24А. The exact business marker, titled DADAO Orlyak and identified as feature 5EEAACC0E88960C2 in the map embedded on the contact page, is the source of the pin. The association independently corroborates the venue, neighbourhood and child-group phone enrollment. Schedule sources agree that there is a recurring child group but do not establish a current session duration or an available slot; neither is presented. No other groups, gallery content, calls, bookings, payment or calendar changes.',
}]
