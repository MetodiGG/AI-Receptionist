// Independent owner-native/phone intake. Parent owns shared imports, identities and photos.
const checkedOn = '2026-11-14'
const validUntil = '2027-02-12'
const taormina = 'https://taorminastudio.com/'
const taorminaPrices = 'https://taorminastudio.com/tseni/'
const taorminaTariff = 'https://taorminastudio.com/wp-content/uploads/2025/11/viber_image_2025-11-12_14-07-52-352.jpg'
const taorminaBooking = 'https://taorminastudio.com/promotsii/'
const taorminaContact = 'https://taorminastudio.com/kontakti/'
const price = (amount, currency, sourceUrl, unit) => ({ amount, currency, kind: 'fixed', unit, sourceUrl, checkedOn, validUntil })
const records = [
  {
    id: 'sofia-taormina-druzhba2-block275', name: 'Taormina Studio', cityCode: '68134', neighborhood: 'Дружба 2',
    address: 'София, ж.к. Дружба 2, Цариградски комплекс, бл. 275, вх. А, партер', locationKind: 'premises', coordinates: null, category: 'beauty', website: taormina, phone: '+359882063204',
    booking: { kind: 'phone', phone: '+359882063204' },
    services: [
      { name: 'Лазерна епилация — подмишници, жени', category: 'beauty', appointmentModel: 'appointment', price: price(15.34, 'EUR', taorminaTariff, 'една процедура за посочената зона'), description: 'Редовна цена за една процедура на посочената зона. Предварително записване по телефона; не е пакет или промоционална цена.' },
      { name: 'Лазерна епилация — горна устна, жени', category: 'beauty', appointmentModel: 'appointment', price: price(7.67, 'EUR', taorminaTariff, 'една процедура за посочената зона'), description: 'Редовна цена за една процедура на посочената зона. Предварително записване по телефона; не е пакет или промоционална цена.' },
    ],
    openingHours: { sourceUrl: taorminaContact, checkedOn, days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '07:00', close: '21:00' }] })) },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: taorminaBooking, excerpt: 'Недатираните блокове за нов клиент и препоръка изрично позволяват запазване с обаждане. Телефон0882063204; студио Дружба2, бл.275, вх.А, партер, София.' }, contact: taorminaContact },
  },
]
const reviews = [
  {
    id: 'sofia-taormina-druzhba2-block275', website: taormina, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [`${taormina}robots.txt`, taormina, `${taormina}politika-za-poveritelnost/`, taorminaBooking, taorminaContact, taorminaPrices, taorminaTariff, 'https://taorminastudio.com/wp-content/uploads/2025/11/viber_image_2025-11-12_14-07-52-679.jpg'],
    notes: 'Actual owner Book links identified first as s24/Studio24; inherited provider STOP respected, no provider/redirect/menu request. Independent undated new-client and referral instructions explicitly offer phone-call booking, distinct from expired2023 offers. Full native owner Privacy read; ordinary personal-data/cookie wording, no explicit automation/extraction/database/commercial-source-use ban identified, not global permission. Current own Prices page links two complete November2025 tariff JPGs, both visually read including all headings/footnotes; filename is version not an inferred expiry. Owner page explicitly states fees per single laser procedure. Imported only regular women underarm30BGN and upperlip15BGN; same printed rows also show15.34EUR/7.67EUR, literalBGN retained without conversion. No durations. Old women-whole-leg promo130BGN/old260BGN differs current regular100BGN, so all whole-leg/promotion rows excluded, not called unpublished or resolved. No medical/clinic/injection, guaranteed results/painless/safety claims or source prose/images imported. Current exact Contact and root independently bind one ordinary beauty studio to Druzhba2Block275entranceAgroundfloor/882063204 and daily07–21. No phone call, service/date/staff/customer/consent entry, booking confirmation, slot availability, coordinates or inventoryIdentity. Full runtime plus ALL2000 intake normalizeddomain/name/phone/premise preflight no accepted duplicate; former beauty-more price-image hold cleared only by independent owner evidence, not by restricted calendar.',
  },
]
export default { records, reviews }
