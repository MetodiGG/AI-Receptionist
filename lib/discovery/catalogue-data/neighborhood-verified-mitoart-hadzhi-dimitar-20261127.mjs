const id = 'sofia-mitoart-hadzhi-dimitar-albert-long11-15'
const name = 'MitoArt Gallery'
const cityCode = '68134', neighborhood = 'Хаджи Димитър', category = 'education'
const address = 'София, ж.к. Хаджи Димитър, ул. Д-р Алберт Лонг 11–15'
const website = 'https://mitoart.bg/', phone = '+359889593388'
const workshop = website + 'prezhivjavanija/'
const venue = website + 'za-nas/'
const terms = website + 'terms-and-conditions-of-use/'
const checkedOn = '2026-11-27', validUntil = '2026-12-27'

export const VERIFIED_MITOART_HADZHI_DIMITAR_20261127_RECORDS = [{
  id, name, cityCode, neighborhood, category, address, website, phone, locationKind: 'premises',
  // The studio's public street address spans three civic points. None is an
  // owner-verified gallery entrance, so don't enable distance or directions.
  coordinates: null,
  services: [{
    name: 'Групово ателие по рисуване за деца',
    category, appointmentModel: 'group_reservation',
    description: 'Присъствено групово занимание за деца от 5 до 12 години. Материалите са включени. Мястото се потвърждава по телефона.',
    durationMin: 75, durationSourceUrl: workshop, durationCheckedOn: checkedOn,
    price: { amount: 15, currency: 'EUR', kind: 'fixed', unit: 'едно посещение', sourceUrl: workshop, checkedOn, validUntil },
  }],
  booking: { kind: 'phone', phone },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: venue,
    booking: {
      url: workshop,
      excerpt: 'Галерията приема записвания за детското ателие по рисуване на +359 88 959 3388. Заниманието е по седмичен график; мястото се уточнява с галерията.',
    },
  },
}]

export const VERIFIED_MITOART_HADZHI_DIMITAR_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, workshop, venue, terms],
  inventoryIdentity: 'c0f476b69ae2b2010d2b28b0f6d8130362df476ea814469fea076bdc9723500a',
  notes: 'Reviewed the named workshop invitation to reserve by phone, then verified the published one-visit EUR 15 tariff, included art materials, ages 5–12 and the weekly Thursday 18:30–19:45 schedule for that same supervised children’s class. The gallery publicly identifies the full customer address 11–15 and its matching phone. Multiple civic numbers and a corroborating non-owner point do not establish an entrance, so coordinates remain absent. Only this one recurring workshop is included; no adult event, gallery visit, art therapy, private workshop price or availability claim. The review expires on 27 December as a local freshness cutoff, not a published end date. No source artwork, imagery or wording reused, no website form submitted and no calendar, customer or booking action taken.',
}]
