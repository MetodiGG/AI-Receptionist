const id = 'sofia-hairless-hipodruma-hanpresiyan15'
const cityCode = '68134', neighborhood = 'Хиподрума', category = 'beauty'
const address = 'София, кв. Хиподрума, ул. Хан Пресиян 15'
const website = 'https://hairless.bg/', phone = '+359894843831'
const contact = `${website}контакти/`, menu = `${website}процедури-за-лице/`
const prices = `${website}цени-и-пакети/`
const branchGuide = `${website}2026/06/03/lazerna-epilacia-sofia-hairless-h/`
const checkedOn = '2026-11-27', validUntil = '2026-12-18'

export const VERIFIED_HIPODRUMA_HAIRLESS_20261127_RECORDS = [{
  id, name: 'Hairless Laser Aesthetics · Хиподрума', cityCode, neighborhood, address, category, website, phone,
  locationKind: 'premises',
  coordinates: {
    latitude: 42.6798792, longitude: 23.3010377, method: 'first_party_coordinates',
    source: contact, sourceAddress: address,
  },
  services: [{
    name: 'Козметична грижа за лице · Express Skin Reset', category,
    description: 'Почистване на лице, лека ексфолиация, хидратиращ серум и слънцезащита. Цената се уточнява при записване.',
    durationMin: 40, durationSourceUrl: menu, durationCheckedOn: checkedOn,
    appointmentModel: 'appointment',
  }],
  booking: { kind: 'phone', phone },
  verification: { status: 'approved', checkedOn, validUntil, contact, booking: {
    url: menu, excerpt: 'Страницата на услугата Express Skin Reset публикува телефон за записване, който съвпада с контакта на салона в Хиподрума.',
  } },
}]

export const VERIFIED_HIPODRUMA_HAIRLESS_20261127_REVIEWS = [{
  id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, menu, prices, branchGuide],
  notes: 'The exact first-party cosmetic service page invites telephone appointments and lists a 40-minute cleansing, exfoliation, hydrating-serum and SPF facial. The current site footer, current contact page and June 2026 Sofia branch page agree on Han Presiyan 15 in Hipodruma, superseding Pliska Street on an older contact page. The current contact page’s issued map link points to the Han Presiyan 15 address marker, not the map viewport; no residential entrance suffix was inferred. No laser procedure or rate, clinical claim, hours, stock image or dormant online booking is included. Nothing was submitted.',
  inventoryIdentity: '4c3c7bf2dadd25aaec286fa76c672cd05de39c0909666268e5b4c3799499e15d',
  pricingDecision: 'not_publicly_listed',
  priceSearch: {
    outcome: 'not_published', bookingUrl: menu, serviceUrls: [menu, contact, prices],
    notes: 'The first-party cosmetic facial menu, which includes the telephone booking instruction, and the branch contact page do not publish a fee for Express Skin Reset. The separate tariff is specifically for laser hair removal and is not a price for this cosmetic facial.',
  },
}]
