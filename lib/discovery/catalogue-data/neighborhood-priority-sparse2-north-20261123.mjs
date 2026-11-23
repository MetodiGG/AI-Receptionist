const checkedOn = '2026-11-23', validUntil = '2026-12-23'
const id = 'sofia-lokomotiv-tennis-voenna-rampa-rozhen23'
const website = new URL('https://clicktoplay.io/club/локомотив-софия').href
const phone = '+359899845678'
const neighborhood = 'Военна рампа'
const address = 'София, кв. Военна рампа, бул. „Рожен“ 23, спортен комплекс „Локомотив“'
const terms = 'https://clicktoplay.io/terms.php'
const partner = 'https://locations.mymultisport.bg/location/tenis-klub-lokomotiv-sofia'
const facilityDirectory = 'https://sofiatennis.com/kortove/lokomotiv-sofia'
const district = new URL('https://nadezhda.sofia.bg/obrazovanie/спорт').href

export const PRIORITY_SPARSE2_NORTH_20261123_RECORDS = [{
  id, name: 'Тенис клуб Локомотив София', cityCode: '68134', neighborhood, address,
  category: 'fitness', locationKind: 'premises', website, phone,
  coordinates: {
    latitude: 42.73658371, longitude: 23.31459427,
    source: website, method: 'first_party_coordinates', sourceAddress: address,
  },
  services: [{
    name: 'Наем на закрит тенис корт с клей',
    category: 'fitness',
    description: 'Онлайн цената е за 60 минути на един осветен закрит клей корт, без треньор. Проверете цената за избрания час в графика; плащане на място.',
    price: { amount: 20, currency: 'EUR', kind: 'fixed', unit: 'корт · час', sourceUrl: website, checkedOn, validUntil },
    appointmentModel: 'group_reservation',
    durationMin: 60, durationSourceUrl: website, durationCheckedOn: checkedOn,
  }],
  booking: { kind: 'form', url: website },
  verification: {
    status: 'approved', checkedOn, validUntil, contact: website,
    booking: { url: website, excerpt: 'Публичният профил на клуба има график и резервации за осветени закрити клей кортове, с цена за конкретния час.' },
  },
}]

export const PRIORITY_SPARSE2_NORTH_20261123_REVIEWS = [{
  id, checkedOn, website, bookingEntry: website, bookingReview: 'provider_booking_reviewed',
  reviewedUrls: [website, terms, partner, facilityDirectory, district],
  notes: 'Opened the current merchant profile from the provider’s public club directory and reviewed the actual Tennis court-booking menu before the club information. Two lighted indoor clay courts show EUR 20 for sixty minutes in multiple priced rows; the separate outdoor court does not substantiate this tariff. The public platform specifies pay-at-venue; this is a court rental, not coaching, an all-conditions tariff, integrated availability or the outdoor partner-membership benefit. The merchant confirms the stadium address, club phone and a directly stated destination marker; MultiSport and Sofia Tennis independently name Voenna rampa, the same address and the same telephone. The municipal district’s sports directory names the stadium at 23 Rozhen Blvd.; the supplied municipal civic dataset has no numbered point for this address. Public provider terms were read for intended public browsing; no protected prose, images, database aggregates, slots, accounts, calls, forms, payments or reservations were copied or submitted.',
  inventoryIdentity: '826225f93bdb1df20635e5c3b991f8f41d0d07af0c93f0df3c7a079f91504fe5',
}]
