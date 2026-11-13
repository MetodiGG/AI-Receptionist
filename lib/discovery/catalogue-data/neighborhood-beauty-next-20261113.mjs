// New research intake only. No shared aggregation, identities or photos changed.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const base = { cityCode: '68134', locationKind: 'premises', coordinates: null }
const desi = 'https://desistyle.univer.se/'
const mabelle = 'https://mabellesalon.wixsite.com/website'
const celine = 'https://celinehairclub.com/'
const celinePrices = `${celine}ceni/`
const aadhira = 'https://aadhira.bg/'
const aadhiraPrices = `${aadhira}tseni/`
const aadhiraBook = 'https://book.aadhira.bg/reservations/create'
const krasi = 'https://krasiart.eu/'
const krasiPrices = `${krasi}%D1%86%D0%B5%D0%BD%D0%BE%D0%B2%D0%B0-%D0%BB%D0%B8%D1%81%D1%82%D0%B0/`
const krasiContact = `${krasi}%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82/`
const krasiAbout = `${krasi}%D0%B7%D0%B0-%D0%BD%D0%B0%D1%81/`
const krasiBook = 'https://studio24.bg/m/krasi-art-beauty-and-spa-s13760?m%3Fm&m'
const eur = (name, category, amount, sourceUrl, description, durationMin) => ({ name, category, appointmentModel: 'appointment', price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn, validUntil }, ...(durationMin ? { durationMin, durationSourceUrl: sourceUrl, durationCheckedOn: checkedOn } : {}), ...(description ? { description } : {}) })
const priced = (name, category, amount, durationMin, sourceUrl) => ({ name, category, appointmentModel: 'appointment',
  price: { amount, currency: 'BGN', kind: 'fixed', sourceUrl, checkedOn, validUntil }, durationMin, durationSourceUrl: sourceUrl, durationCheckedOn: checkedOn,
  description: 'Публикуваната тарифа е в BGN.' })
const records = [
  {
    ...base, id: 'sofia-desistyle-lyublyana', name: 'DesiStyle Beauty Salon', neighborhood: 'Овча купел',
    address: 'София, ж.к. Овча купел, ул. Любляна 8', category: 'hair', website: desi, phone: '+359876110782',
    booking: { kind: 'phone', phone: '+359876110782' },
    services: [priced('Дамско подстригване', 'hair', 18, 45, desi), priced('Мъжко подстригване', 'barber', 15, 30, desi), priced('Мъжки Fade', 'barber', 20, 40, desi)],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: desi, excerpt: 'Запази час · собствен бутон към телефон +359876110782; гр. София, ж.к. Овча Купел, ул. Любляна 8.' }, contact: desi },
  },
  {
    ...base, id: 'sofia-mabelle-feniks', name: 'MaBelle · Овча купел 2', neighborhood: 'Овча купел 2',
    address: 'София, кв. Овча купел 2, ул. Феникс, бл. 34', category: 'nails', website: mabelle, phone: '+359878603668',
    booking: { kind: 'phone', phone: '+359878603668' },
    services: [{ name: 'Маникюр', category: 'nails', appointmentModel: 'appointment' }, { name: 'Педикюр', category: 'nails', appointmentModel: 'appointment' }, { name: 'Дамско подстригване', category: 'hair', appointmentModel: 'appointment' }],
    openingHours: { sourceUrl: mabelle, checkedOn, days: [...[2, 3, 4, 5, 6].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '19:00' }] })), { weekday: 7, periods: [{ open: '11:00', close: '19:00' }] }] },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: mabelle, excerpt: 'Маникюр или педикюр — запишете час при нас. Телефон 087 860 3668. Овча Купел 2, ул. Феникс, бл. 34, София.' }, contact: mabelle },
  },
  {
    ...base, id: 'sofia-celine-hair-club', name: 'Celine Hair Club', neighborhood: null,
    address: 'София, ул. Вили Казасян 5А', category: 'hair', website: celine, phone: '+359882471564',
    booking: { kind: 'phone', phone: '+359882471564' },
    services: [
      eur('Мъжко подстригване и стайлинг — топ фризьор', 'barber', 28.12, celinePrices, 'Тарифа за топ фризьор; публикувани 55 BGN / 28.12 EUR.', 40),
      eur('Дамско подстригване, стайлинг и сешоар — топ фризьор', 'hair', 46.02, celinePrices, 'Тарифа за топ фризьор; публикувани 90 BGN / 46.02 EUR.', 60),
      eur('Класически маникюр с гел лак', 'nails', 38.35, celinePrices, 'Публикувани 75 BGN / 38.35 EUR; няма посочена продължителност.'),
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: celine, excerpt: 'Запазете час — собствените бутони водят към tel:+359882471564; ул. Вили Казасян 5а, София.' }, contact: `${celine}kontakti/` },
  },
  {
    ...base, id: 'sofia-aadhira-maria-luiza', name: 'Aadhira’s Style', neighborhood: null,
    address: 'София, бул. Мария Луиза 94', category: 'hair', website: aadhira, phone: '+359879882562',
    booking: { kind: 'phone', phone: '+359879882562' },
    services: [
      eur('Дамско подстригване с измиване — черта, лодка или венец с машинка', 'hair', 35, aadhiraPrices, 'Включва измиване; конкретната публикувана група подстригвания, не обща цена за всички прически.'),
      eur('Измиване и сешоар — къса коса', 'hair', 18, aadhiraPrices, 'Тарифа за къса коса.'),
      eur('Измиване и сешоар — средна коса', 'hair', 23, aadhiraPrices, 'Тарифа за средна коса.'),
    ],
    openingHours: { sourceUrl: `${aadhira}kontakti/`, checkedOn, days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '08:00', close: '20:00' }] })) },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: aadhiraBook, excerpt: 'Онлайн резервирането временно е преустановено. За да си резервирате час, моля позвънете или ни пишете. Собствен контакт: +359879882562.' }, contact: `${aadhira}kontakti/` },
  },
  {
    ...base, id: 'sofia-krasi-art-tsar-boris', name: 'KrasiArt Beauty and Spa', neighborhood: null,
    address: 'София, бул. Цар Борис III 199', category: 'nails', website: krasi, phone: '+359897448888',
    booking: { kind: 'form', url: krasiBook },
    services: [
      eur('Маникюр с гел лак', 'nails', 40, krasiBook, 'Публикувана цена за маникюр с гел лак, не за изграждане или френски добавки.', 90),
      eur('Педикюр с гел лак — Мони или Вики', 'nails', 50, krasiBook, 'Тарифа за Мони или Вики. Вариантът при Краси е с различна цена и продължителност.', 150),
      eur('Почистване на лице', 'beauty', 50, krasiBook, 'Обикновена козметична процедура; не включва медицински или иглени терапии.', 60),
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: krasi, excerpt: 'Запазете час в Studio 24 — собствен линк към Krasi Art Beauty and Spa; София, бул. Цар Борис III 199;0897448888.' }, contact: krasiContact },
  },
]
const reviews = [
  {
    id: records[0].id, website: desi, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [desi],
    notes: 'Actual owner Book CTA inspected in the public HTML: direct tel:+359876110782, no separate calendar/menu destination. Full one-page tariff/services/address read after that entry. Three literal BGN haircut variants and exact45/30/40-minute durations retained, not converted to EUR. Variable colour/length ranges and unclear product/currency lines excluded. No hours published in inspected page; none invented. Own map link not opened and no viewport coordinate imported. Domain, phone and exact street checked against1202 existing/staged catalogue IDs; no match. No form input, call or reservation.',
  },
  {
    id: records[1].id, website: mabelle, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [mabelle, `${mabelle}/blog`],
    pricingDecision: 'not_publicly_listed',
    priceSearch: { outcome: 'not_published', bookingUrl: mabelle, serviceUrls: [mabelle], notes: 'The owner one-page nail service explicitly invites phone appointments and repeats its own number. Read complete Services, Hours, Contact and footer sections: named hair/nail offerings but no literal single-visit tariff or separate booking-menu/price link. Blog link could not be read; it is not represented as a reviewed tariff. No blocked price/menu is called unpublished.' },
    notes: 'Actual published phone-booking invitation and full inline services/contact/hours read on the owner website. Two ordinary nail services plus explicitly named women haircut, without guessed fees/durations. Tuesday-Saturday10-19 and Sunday11-19 are literal; Monday is not specified and is omitted, not inferred closed. Exact Sofia Feniks block34 premises/own phone confirmed. No medical, efficacy, review or image content copied. No domain/phone/address duplicate found in1202 existing/staged catalogue IDs. No contact form submitted or call made.',
  },
  {
    id: records[2].id, website: celine, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [celine, celinePrices, `${celine}kontakti/`],
    notes: 'Actual owner Book CTAs inspected first in public HTML: direct tel:+359882471564, not a separate calendar or unread JS menu. Then full owner price table and contact/footer read successfully via ordinary public HTTP; web-reader cache miss is not represented as an unpublished tariff. Three exact ordinary hair/nail variants retained, with explicit top-hairdresser tier on both haircut rows; art-director tiers, retail, zero-price therapy and inconsistent dual-currency nail rows excluded. Exact40/60-minute haircut durations are literal; no manicure duration guessed. Contact form date/time fields observed without input or submission. No public weekly hours found on those pages; omitted. Owner publishes exact Sofia street/house; quarter and coordinates left null. Canonical domain, own phone and exact premises checked against1202 existing/staged catalogue IDs; no match. No call, booking, photo/review copying or provider/map request.',
  },
  {
    id: records[3].id, website: aadhira, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [aadhira, 'https://book.aadhira.bg/', aadhiraBook, aadhiraPrices, `${aadhira}kontakti/`],
    notes: 'Actual owner Book entry followed first; root independently read its rendered public create page after login landing: online reservations temporarily suspended, explicitly phone/write fallback. Phone route retained, not a working-form claim. Full owner price list, ordinary hair services and contact/footer read after booking; three literal35/18/23EUR variants only, with haircut shape and short/medium length scopes preserved. No duration stated for these rows; none guessed. Very-long blowdry and several colour rows have conflicting dual-currency figures and are excluded, not called unpublished. Hair-loss diagnosis, medical-looking claims, laser/clinical procedures, new-customer offers, packages, retail and courses excluded. Exact MariaLuiza94 and own daily08-20 contact hours verified. No catalogue/staged domain/phone/address duplicate found. Quarter/coordinates not inferred; no forms or calls.',
  },
  {
    id: records[4].id, website: krasi, checkedOn, bookingEntry: krasiBook, bookingReview: 'provider_booking_reviewed', reviewedUrls: [krasi, krasiBook, krasiPrices, krasiContact, krasiAbout],
    notes: 'Actual owner-linked Studio24 merchant13760 independently rendered/read by root after ordinary reader cache miss; exact TsarBorisIII199 corroborates owner contact. Current actual menu shows gelmanicure40EUR90min, gelpedicure at Moni/Viki50EUR150min and plain facialcleaning50EUR60min. Own full tariff corroborates40/50/50EUR; staff Krasi pedicure60EUR105min is a distinct excluded tier, not mixed. Classic manicure is from25EUR60-90min in actual menu, so not imported as fixed25/one duration. About/team describes beauty/relax studio and cosmetic professionals; no doctor credentials inferred. Needling, therapeutic nail/foot disorders, clinical claims, packages and promotions excluded. Weekly owner Tue-Sun10-19/Monclosed conflicts with provider Mon12-19/TueFri08:30-20/SatSun10-19; all hours omitted pending owner confirmation. No review/photo copying, service/date/customer entry, call or reservation. Domain/phone/exact premises checked against1202 existing/staged catalogue IDs; no match. No coordinate or neighborhood guessed.',
  },
]
export default { records, reviews }
