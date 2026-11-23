const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-sokol-tennis-benkovski-stadium'
const website = new URL('https://clicktoplay.io/club/тк-сокол-бенковски').href
const phone = '+359899141122'
const neighborhood = 'Бенковски'
const address = 'София, кв. Бенковски, бул. Лазар Михайлов, стадион „Георги Бенковски“'
const terms = 'https://clicktoplay.io/terms.php'
const council = 'https://council.sofia.bg/documents/d/guest/r-314-2025'
const municipality = 'https://www.sofia.bg/bg/web/guest/w/7180307'

export const PRIORITY_NEXT_NORTH_20261123_RECORDS = [{
  id, name: 'ТК Сокол Бенковски', cityCode: '68134', neighborhood, address,
  category: 'fitness', locationKind: 'premises', website, phone,
  coordinates: {
    latitude: 42.741671187418945, longitude: 23.347205542328865,
    source: website, method: 'first_party_coordinates', sourceAddress: address,
  },
  services: [{
    name: 'Наем на открит тенис корт', category: 'fitness', appointmentModel: 'group_reservation',
    description: 'Открит корт с изкуствена трева. Посочената онлайн цена е за 60 минути на един корт, без треньор. Проверете цената за избрания час в графика; плащане на място.',
    price: { amount: 10, currency: 'EUR', kind: 'fixed', unit: 'корт · час', sourceUrl: website, checkedOn, validUntil },
    durationMin: 60, durationSourceUrl: website, durationCheckedOn: checkedOn,
  }],
  booking: { kind: 'form', url: website },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: website, excerpt: 'Публичният профил на клуба има отделен график за резервация на открит тенис корт; цената и условията се показват за избрания час.' },
  },
}]

export const PRIORITY_NEXT_NORTH_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: website, bookingReview: 'provider_booking_reviewed',
  reviewedUrls: [website, terms, municipality, council],
  notes: 'Followed the live merchant listing to its actual outdoor tennis-court calendar before reading the club contact and venue fields. The current checked menu quotes EUR 10 for sixty minutes of one standard outdoor artificial-grass court, with payment on site; this is not a coaching fee, group tariff, all-times guarantee or integrated GoRez booking. The facility pin is an explicit coordinate in that merchant profile’s own map, which names Benkovski Stadium on Lazar Mihaylov Blvd.; the municipality independently documents the same named stadium and the city council identifies the sports grounds. The registered-office street number in the council decision was not used as the court address. Current terms were read for intended manual public access and factual review, not reuse of platform content or booking automation. No appointment time, form, record or photograph was copied or submitted.',
  inventoryIdentity: '771a7767f99e8d72db0c78b09f1200d43022d6f023ba7ecf484c1c9befb5da87',
}]
