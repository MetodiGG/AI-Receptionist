// First-party facts reviewed 2026-11-13. Puzzle rows remain draft until each
// branch's actual booking menu has been reviewed; no chain-wide tariff inference.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const price = (amount, sourceUrl, kind = 'fixed') => ({ amount, currency: 'EUR', kind, sourceUrl, checkedOn, validUntil })
const service = (name, category, amount, sourceUrl, kind = 'fixed') => ({ name, category, appointmentModel: 'appointment', ...(amount == null ? {} : { price: price(amount, sourceUrl, kind) }) })
const hours = (sourceUrl, weekdays, open, close) => ({ sourceUrl, checkedOn, days: Array.from({ length: 7 }, (_, index) => ({ weekday: index + 1, periods: weekdays.includes(index + 1) ? [{ open, close }] : [] })) })
const verification = (url, excerpt, contact = url, status = 'approved') => ({ status, checkedOn, validUntil, booking: { url, excerpt }, contact })
const base = { cityCode: '68134', locationKind: 'premises', coordinates: null }
const alicePrices = 'https://alicebeauty.bg/%D1%86%D0%B5%D0%BD%D0%BE%D1%80%D0%B0%D0%B7%D0%BF%D0%B8%D1%81/'
const aliceContact = 'https://alicebeauty.bg/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/'
const veroniqueBook = 'https://book.veronique.bg/bg/location/veronique-aesthetic-practice'

const records = [
  {
    ...base, id: 'sofia-barbs-style-krasno-selo', name: 'Barbs Style · Красно село', neighborhood: 'Красно село',
    address: 'София, кв. Красно село, бл. 183 (срещу бръснарница SHAVI)', category: 'nails', website: 'https://barbs-style.com/', phone: '+359897022336',
    booking: { kind: 'form', url: 'https://barbs-style.com/appointment/' },
    services: [
      service('Маникюр с гел лак', 'nails', 30, 'https://barbs-style.com/uslugi/', 'from'),
      service('Апаратен маникюр', 'nails', 23, 'https://barbs-style.com/uslugi/', 'from'),
      service('Педикюр с гел лак', 'nails', 35, 'https://barbs-style.com/uslugi/', 'from'),
    ],
    verification: verification('https://barbs-style.com/appointment/', 'Запази час за маникюр и педикюр: кв. Красно село, бл. 183'),
  },
  {
    ...base, id: 'sofia-gioia-borovo', name: 'Козметично студио Gioia', neighborhood: 'Борово', address: 'София, ж.к. Борово, ул. Родопски извор 45Б',
    category: 'beauty', website: 'https://gioia-bg.com/', phone: '+359887072583', booking: { kind: 'phone', phone: '+359887072583' },
    services: [
      service('Почистване на лице – класическо (мануално)', 'beauty', 40, 'https://gioia-bg.com/ceni-kozmetika/'),
      service('Комбинирано почистване на лице', 'beauty', 50, 'https://gioia-bg.com/ceni-kozmetika/'),
      { ...service('Карбокси терапия (CO2)', 'beauty', 55, 'https://gioia-bg.com/ceni-kozmetika/'), description: 'Неинвазивна козметична процедура с карбокси-гел и маска-активатор; без инжектиране. Методът е описан на собствената страница Козметика.' },
    ],
    openingHours: hours('https://gioia-bg.com/kontakti/', [2, 3, 4, 5, 6], '10:00', '19:00'),
    verification: verification('https://gioia-bg.com/kontakti/', 'Студиото работи с предварително запазен час. Запазете час. Обадете ни се 0887 07 25 83'),
  },
  {
    ...base, id: 'sofia-angelic-beauty-malinova-dolina', name: 'Angelic Beauty', neighborhood: 'Малинова долина', address: 'София, ж.к. Малинова долина, ул. Професор Боян Боянов 12',
    category: 'beauty', website: 'https://angelicbeauty.bg/', phone: '+359894379791',
    booking: { kind: 'form', url: 'https://book.angelicbeauty.bg/reservations/start?site=1' },
    services: [
      service('Ламиниране на мигли', 'beauty', 50, 'https://angelicbeauty.bg/tseni/'),
      service('Ламиниране на вежди', 'beauty', 50, 'https://angelicbeauty.bg/tseni/'),
      service('Професионално почистване на лицето + терапия и диагностика', 'beauty', 80, 'https://angelicbeauty.bg/tseni/'),
    ],
    openingHours: hours('https://angelicbeauty.bg/kontakti/', [1, 2, 3, 4, 5, 6, 7], '10:00', '20:00'),
    verification: verification('https://angelicbeauty.bg/', 'Да, работим само с предварително записани часове', 'https://angelicbeauty.bg/kontakti/'),
  },
  {
    ...base, id: 'sofia-highlights-iztok', name: 'HighLights', neighborhood: 'Изток', address: 'София, кв. Изток, ул. Антон П. Чехов 40', category: 'hair',
    website: 'https://highlights.bg/', phone: null, booking: { kind: 'form', url: 'https://highlights.bg/bg/location/highlights' },
    services: [
      { ...service('Дамско подстригване със сешоар', 'hair', 33, 'https://highlights.bg/bg/location/highlights'), durationMin: 60, durationSourceUrl: 'https://highlights.bg/bg/location/highlights', durationCheckedOn: checkedOn },
      { ...service('Мъжко подстригване', 'hair', 21, 'https://highlights.bg/bg/location/highlights'), durationMin: 45, durationSourceUrl: 'https://highlights.bg/bg/location/highlights', durationCheckedOn: checkedOn },
      { ...service('Подстригване коса и оформяне на брада', 'barber', 25, 'https://highlights.bg/bg/location/highlights'), durationMin: 60, durationSourceUrl: 'https://highlights.bg/bg/location/highlights', durationCheckedOn: checkedOn },
    ],
    openingHours: { sourceUrl: 'https://highlights.bg/bg/location/highlights', checkedOn, days: Array.from({ length: 7 }, (_, index) => ({ weekday: index + 1, periods: [{ open: '10:00', close: index < 5 ? '20:00' : '18:00' }] })) },
    verification: verification('https://highlights.bg/bg/location/highlights', 'Предлагани услуги · Дамско подстригване със сешоар · 1 ч · 33 € · запази'),
  },
  {
    ...base, id: 'sofia-art-makeup-boutique-strelbishte', name: 'Art & Makeup Boutique', neighborhood: 'Стрелбище', address: 'София, ж.к. Стрелбище, ул. Кестенова гора 26', category: 'beauty',
    website: 'https://artmakeupboutique.com/', phone: '+359892489290', booking: { kind: 'phone', phone: '+359892489290' },
    services: [
      { name: 'Дневен грим', category: 'beauty', appointmentModel: 'appointment', price: { ...price(70, 'https://artmakeupboutique.com/profeisonalen-grim/'), currency: 'BGN' } },
      { name: 'Вечерен грим', category: 'beauty', appointmentModel: 'appointment', price: { ...price(80, 'https://artmakeupboutique.com/profeisonalen-grim/'), currency: 'BGN' } },
    ],
    verification: verification('https://artmakeupboutique.com/zapazi-chas/', 'Запазете своя час сега: 0892 489 290', 'https://artmakeupboutique.com/kontakti/'),
  },
  {
    ...base, id: 'sofia-arte-beauty-bar-dianabad', name: 'Arte Beauty Bar', neighborhood: 'Дианабад', address: 'София, ж.к. Дианабад, ул. Св. Пимен Зографски 36', category: 'nails',
    website: 'https://artebeautybar.com/', phone: '+359879262613', booking: { kind: 'phone', phone: '+359879262613' },
    services: [service('Маникюр', 'nails'), service('Педикюр', 'nails'), service('Ламиниране на вежди', 'beauty')],
    verification: verification('https://artebeautybar.com/contacts/', 'Запишете час · Подарете си професионален маникюр, педикюр, грим и ламиниране на вежди'),
  },
]

records.push(
  {
    ...base, id: 'sofia-alice-beauty-buntovnik', name: 'Alice Beauty Aesthetics', neighborhood: null, address: 'София, ул. Бунтовник 54', category: 'beauty',
    website: 'https://alicebeauty.bg/', phone: '+359888744333', booking: { kind: 'phone', phone: '+359888744333' },
    services: [
      { ...service('Лазерна епилация · Горна устна · жени', 'beauty', 10.2, alicePrices), description: 'Стандартна цена за 1 процедура; не промоционална или пакетна цена.' },
      { ...service('Лазерна епилация · Подмишници · жени', 'beauty', 25.6, alicePrices), description: 'Стандартна цена за 1 процедура; не промоционална или пакетна цена.' },
    ],
    verification: verification(aliceContact, 'Запазете час при наш специалист · Телефон: 0888 744 333'),
  },
  {
    ...base, id: 'sofia-veronique-oborishte', name: 'Veronique Aesthetic Practice', neighborhood: 'Оборище', address: 'София, ул. Оборище 84', category: 'beauty',
    website: 'https://veronique.bg/', phone: '+359886468644', booking: { kind: 'form', url: veroniqueBook },
    services: [
      { ...service('Терапия с шоколад – BERNARD CASSIERE', 'beauty', 55, veroniqueBook), durationMin: 45, durationSourceUrl: veroniqueBook, durationCheckedOn: checkedOn },
      { ...service('Sothys енергизираща терапия за мъже', 'beauty', 55, veroniqueBook), durationMin: 45, durationSourceUrl: veroniqueBook, durationCheckedOn: checkedOn },
    ],
    openingHours: { sourceUrl: veroniqueBook, checkedOn, days: Array.from({ length: 7 }, (_, index) => ({ weekday: index + 1, periods: index === 6 ? [] : [{ open: index === 5 ? '10:00' : '09:00', close: index === 5 ? '15:00' : '20:00' }] })) },
    verification: verification(veroniqueBook, 'Шоколадовата терапия - BERNARD CASSIERE ·45м ·55€ ·запази'),
  },
)

records.push({
  ...base, id: 'sofia-skano-skin-suvorov', name: 'Skano Skin Studio', neighborhood: null, address: 'София, ул. Ген. Ал. Суворов 87', category: 'beauty',
  website: 'https://skanoskin.com/', phone: '+359889449377', booking: { kind: 'form', url: 'https://skanoskin.com/' },
  services: [
    service('Hydrafacial · Signature', 'beauty', 102, 'https://skanoskin.com/assets/prices.06.10.pdf'),
    service('Hydrafacial · Deluxe', 'beauty', 128, 'https://skanoskin.com/assets/prices.06.10.pdf'),
    service('Hydrafacial · Platinum', 'beauty', 143, 'https://skanoskin.com/assets/prices.06.10.pdf'),
  ],
  openingHours: hours('https://skanoskin.com/', [1, 2, 3, 4, 5, 6, 7], '10:00', '20:00'),
  verification: verification('https://skanoskin.com/', 'Попълни кратката форма и наш експерт ще се свърже с теб до края на деня за безплатна консултация и записване на час.'),
})

const reviews = [
  {
    id: 'sofia-barbs-style-krasno-selo', website: 'https://barbs-style.com/', bookingEntry: 'https://barbs-style.com/appointment/', bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: ['https://barbs-style.com/', 'https://barbs-style.com/appointment/', 'https://barbs-style.com/uslugi/', 'https://barbs-style.com/reservation-conditions/'],
    notes: 'Followed actual Book entry first. Own appointment page expressly identifies Krasno selo branch and its manicure/pedicure inventory; embedded schedule text was not exposed, so no availability asserted. Own service page publishes bounded category starting prices: gel manicure from30EUR, apparatus manicure from23EUR, gel pedicure from35EUR; preserved from qualification, not lower obsolete BGN amounts reported by a directory. No specialist or length-specific fixed tariff inferred. Other branch Student city has distinct inventory and is not imported. No opening hours published on reviewed primary pages; online schedule24/7 is not business working hours. No retail, training, add-on-only, medical-pedicure or Google review content imported.',
  },
  {
    id: 'sofia-gioia-borovo', website: 'https://gioia-bg.com/', bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: ['https://gioia-bg.com/', 'https://gioia-bg.com/kontakti/', 'https://gioia-bg.com/kozmetika/', 'https://gioia-bg.com/ceni-kozmetika/'],
    notes: 'Followed actual Book entry to owner contact first: expressly works by prior appointment and invites phone booking. Read named-services page then literal owner price table and footer. Three ordinary single-visit non-invasive facial services retained; no package totals, injections, conversions or treatment-result claims copied. Exact Borovo premises/phone and Tue-Sat10-19 with Sunday/Monday closed from contact footer. Independent recheck followed current2026 homepage navigation to /ceni-kozmetika/ and /kozmetika/: current literal40/50/55EUR confirmed. Old indexed www/Cyrillic tariff with copyright2021 and38/47/46EUR is superseded, not imported. Own CO2 section explicitly says no injection, carboxy-gel plus citric-acid activator mask. Therefore a topical-kit illustration is appropriate, not needles/injection; no efficacy/safety claims copied. Absorption20-25min is not a full-session duration, so no duration invented. No inferred coordinates.',
  },
  {
    id: 'sofia-angelic-beauty-malinova-dolina', website: 'https://angelicbeauty.bg/', bookingEntry: 'https://book.angelicbeauty.bg/reservations/start?site=1', bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: ['https://angelicbeauty.bg/', 'https://book.angelicbeauty.bg/reservations/start?site=1', 'https://angelicbeauty.bg/tseni/', 'https://angelicbeauty.bg/kontakti/'],
    notes: 'Actual Book target followed first but web fetch returned cache miss; no calendar availability, staff or slot claimed. Own homepage explicitly requires prior appointments. Owner prices page independently gives exact50EUR lash/brow lamination and80EUR professional facial clean plus therapy/diagnosis; three-service bounded subset retained, invasive aesthetic and package services excluded. Owner contact confirms exact12 address and daily10-20hours; homepage12Б variant is noted but contact page12 retained, not geocoded. Not a no-public-price receipt: published own tariff reviewed; booking-host access limitation remains disclosed.',
  },
  {
    id: 'sofia-highlights-iztok', website: 'https://highlights.bg/', bookingEntry: 'https://highlights.bg/bg/location/highlights', bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: ['https://highlights.bg/', 'https://highlights.bg/bg/location/highlights', 'https://highlights.bg/location/highlights/service/11934', 'https://highlights.bg/location/highlights/service/11974'],
    notes: 'Owner domain redirects directly to its Reservation.Studio-hosted own-domain booking menu, which exposes actual named service rows, Book buttons, exact premises and weeklyhours. Three fixed core services and exact durations retained; no from-price variants or specialist-price assumptions. Individual detail links returned cache miss; list rows supply unambiguous fixed33EUR/60min female cut/blowdry,21EUR/45min male cut,25EUR/60min cut/beard. No booking submitted. Phone not exposed as text, so null; no directory contact copied. No rating/review/photo fields copied.',
  },
  {
    id: 'sofia-art-makeup-boutique-strelbishte', website: 'https://artmakeupboutique.com/', bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: ['https://artmakeupboutique.com/', 'https://artmakeupboutique.com/zapazi-chas/', 'https://artmakeupboutique.com/kontakti/', 'https://artmakeupboutique.com/profeisonalen-grim/'],
    notes: 'Actual Book entry followed first; own team booking page ends with explicit phone invitation0892489290, no navigable online menu supplied by text. Matched named professional makeup specialist inventory, primary service page gives literal70BGNday and80BGNevening makeup; retained BGN as published, not converted to EUR. Lash10BGN add-on, retail/tutorial/training prices, undetermined child/body-art amounts excluded. Exact Strelbishte premises/phone from own contact. No published hours on reviewed pages; omit rather than infer.',
  },
  {
    id: 'sofia-arte-beauty-bar-dianabad', website: 'https://artebeautybar.com/', bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: ['https://artebeautybar.com/', 'https://artebeautybar.com/contacts/', 'https://artebeautybar.com/manicure-and-pedicure/', 'https://artebeautybar.com/eyebrows/'],
    pricingDecision: 'not_publicly_listed',
    priceSearch: { outcome: 'not_published', bookingUrl: 'https://artebeautybar.com/contacts/', serviceUrls: ['https://artebeautybar.com/manicure-and-pedicure/', 'https://artebeautybar.com/eyebrows/'], notes: 'Actual Book button leads to owner contact/phone invitation, not a hidden schedule. Reviewed both complete primary service pages, homepage and footer: actual manicure, pedicure and brow-lamination galleries/services are named, but no visit tariff or duration is published. No Prices navigation or external booking menu exposed. No hours published; no product/Google fields used.' },
    notes: 'Completed actual Book/contact then both named-service pages and footer review. Owner-directed phone appointment channel and exact Dianabad premises/contact verified; genuinely no public visit amounts on these accessible primary pages, not a blocked-price classification. Three real services retained without price/duration. No stock photos or Google ratings/reviews imported.',
  },
]

reviews.push(
  {
    id: 'sofia-alice-beauty-buntovnik', website: 'https://alicebeauty.bg/', bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: ['https://alicebeauty.bg/', aliceContact, alicePrices, 'https://alicebeauty.bg/%D0%BB%D0%B0%D0%B7%D0%B5%D1%80%D0%BD%D0%B0-%D0%B5%D0%BF%D0%B8%D0%BB%D0%B0%D1%86%D0%B8%D1%8F/'],
    notes: 'Actual Book buttons lead to owner Contacts first; phone invitation plus exact Buntovnik54 premises and0888744333 verified. Primary price table has distinct standard one-procedure, promotion and five-procedure columns. Imported only literal regular single-visit female upperlip10.2EUR and armpits25.6EUR as printed, not discounted7.67/20.47 amounts or package totals; visible service qualification retained. No currency recalculation. Individual laser-description page timed out, but homepage and named tariff rows independently verify actual service. No hours/neighborhood published on reviewed sources, so omitted/null rather than inferred.',
  },
  {
    id: 'sofia-veronique-oborishte', website: 'https://veronique.bg/', bookingEntry: veroniqueBook, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: ['https://veronique.bg/', veroniqueBook, 'https://veronique.bg/prices/', 'https://veronique.bg/procedures/', 'https://veronique.bg/kontakti/', 'https://book.veronique.bg/location/veronique-aesthetic-practice/service/14292', 'https://book.veronique.bg/location/veronique-aesthetic-practice/service/13074'],
    notes: 'Followed actual Reservation entry first to own-domain live booking menu; exact named chocolate and men Sothys cosmetic therapy rows55EUR/45min with Book buttons independently match owner prices and procedures pages. Retained only2non-invasive cosmetics, no medical, invasive, nutrition or clinical treatment inventory. Exact owner-managed booking page supplies Oborishte84 and full weeklyhours; primary procedures footer phone+359886468644. Main contacts anti-bot and detail-link cache misses disclosed; not used to infer missing facts and no booking submitted. Remaining broad tariff not claimed fully reviewed.',
  },
)

reviews.push({
  id: 'sofia-skano-skin-suvorov', website: 'https://skanoskin.com/', bookingEntry: 'https://skanoskin.com/', bookingReview: 'owned_booking_reviewed', checkedOn,
  reviewedUrls: ['https://skanoskin.com/', 'https://skanoskin.com/assets/prices.06.10.pdf'],
  notes: 'Actual Book link leads to own-page appointment request/callback form with name,phone and procedure selector; explicit promise to contact for consultation and appointment, not live availability or confirmed slots. Then full own service descriptions, footer and linked1-page tariff PDF inspected. PDF downloaded, rendered with Poppler and visually checked: three ordinary Hydrafacial variants Signature102EUR,Deluxe128EUR,Platinum143EUR are fixed single-visit entries; add-ons21/36/41EUR, course discounts and conditional after-course body prices excluded. Generic45-60minute range not collapsed into a fixed duration. Exact Suvorov87/phone/daily10-20 from own footer/PDF; no neighbourhood or coordinates inferred. No clinical efficacy claims or images copied.',
})

// The embedded calendars for these two entries require a root-owned browser
// surface unavailable to this reviewer. A published tariff is not a substitute
// for actually reading the booking service menu.
// Root browser review completed the real Fitsys menu (59 services, no login or
// submission). Barbs remains held: its only displayed specialist is explicitly
// on long sick leave, so an active future appointment was not established.
const angelic = records.find(row => row.id === 'sofia-angelic-beauty-malinova-dolina')
const angelicSource = 'https://book.angelicbeauty.bg/reservations/start?site=1'
const angelicCondition = 'Отмяна поне 6 часа предварително. При по-късна отмяна или неявяване се начисляват 50% от стойността при следващо посещение.'
for (const [index, item] of angelic.services.entries()) {
  item.durationMin = index < 2 ? 60 : 90
  item.durationSourceUrl = angelicSource
  item.durationCheckedOn = checkedOn
  item.description = angelicCondition
}
for (const [name, amount, minutes] of [
  ['Класически масаж на цяло тяло', 50, 60],
  ['Дълбокотъканен масаж', 65, 60],
  ['Масаж на гръб', 30, 30],
  ['Масаж на скалп', 15, 15],
  ['Кола маска подмишници', 10, 30],
  ['Кола маска цели ръце', 18, 30],
  ['Кола маска цели крака', 35, 60],
  ['Персонализиран химичен пилинг', 70, 60],
]) angelic.services.push({ name, category: 'beauty', appointmentModel: 'appointment', description: angelicCondition,
  price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl: angelicSource, checkedOn },
  durationMin: minutes, durationSourceUrl: angelicSource, durationCheckedOn: checkedOn,
})
reviews.find(row => row.id === angelic.id).notes += ' Root subsequently read the real browser-rendered Fitsys service selection menu:59 services, matching50/50/80EUR core fees and actual60/60/90min durations. Eight further ordinary massage/wax/peel rows are literal menu facts. Six-hour cancellation/50percent late-cancel condition retained, no date/time/customer or submission step, no account, slots or simulated availability.'
const needsBookingMenu = new Set(['sofia-barbs-style-krasno-selo'])
for (const row of records) if (needsBookingMenu.has(row.id)) row.verification.status = 'draft'
const pendingReviews = reviews.filter(row => needsBookingMenu.has(row.id))
for (let index = reviews.length - 1; index >= 0; index--) if (needsBookingMenu.has(reviews[index].id)) reviews.splice(index, 1)
const pendingRecords = []

// Exact owner branch contacts and actual linked Book targets. A separate root
// UI audit is completing each branch menu; draft rows must not be published yet.
const puzzleBranches = [
  ['manastirski-livadi', 'Манастирски ливади', 'ул. Лъвски рид 7', '+359886556615', 'manastirski', 527987],
  ['borovo', 'Борово', 'ул. Пирински проход 47А', '+359878888181', 'borovo', 124541],
  ['ovcha-kupel', 'Овча купел', 'ул. Боряна 43', '+359886556601', 'ovchakupel', 527986],
  ['lozenets', 'Лозенец', 'ул. Цветна градина 38', '+359893446636', 'lozenetz', 124535],
  ['razsadnika', 'Разсадника', 'бул. Александър Стамболийски 249А', '+359885295580', 'razsadnika', 2739607],
  ['lyulin', 'Люлин', 'ул. Ген. Никола Генев 103', '+359886556689', 'lulin', 128950],
  ['nadezhda', 'Надежда', 'ул. Жорж Дантон 35', '+359886556671', 'blagoevgrad', 334610],
  ['geo-milev', 'Гео Милев', 'ул. Хемус 56', '+359888942522', 'geomilev', 128947],
  ['hadzhi-dimitar', 'Хаджи Димитър', 'жилищен комплекс Черковна резидънс', '+359888398802', 'hadjidimitar', 732779],
  ['mladost3', 'Младост 3', 'ул. Ген. Радко Димитриев, бл. 388', '+359889556605', 'mladost', 128945],
  ['mladost4', 'Младост 4', 'ул. Професор Александър Танев, бл. 488', '+359884789558', 'mladost4', 770991],
  ['druzhba2', 'Дружба 2', 'бул. Цветан Лазаров 602, сграда Давид и Авигея', '+359885295847', 'drujba', 2739612],
]
for (const [slug, neighborhood, address, phone, path, bookingId] of puzzleBranches) {
  const website = `https://puzzlekids.biz/${path}/`
  const url = `${bookingId > 2000000 ? 'https://www.fresha.com/bg' : 'https://bg.fresha.com'}/book-now/puzzle-children-s-hair-care-studio-gmlukots/all-offer?id=${bookingId}&pId=115852${bookingId > 2000000 ? '&share=true' : ''}`
  pendingRecords.push({ ...base, id: `sofia-puzzle-kids-${slug}`, name: `ПЪЗЕЛ · ${neighborhood}`, neighborhood, address: `София, ${address}`, category: 'hair', website, phone,
    services: ['Подстригване момче', 'Подстригване момиче', 'Мъжко подстригване'].map(name => service(name, 'hair')),
    openingHours: hours(website, [1, 2, 3, 4, 5, 6, 7], '10:00', '20:00'), booking: { kind: 'form', url },
    verification: verification(website, 'Изберете предпочитаната от Вас локация, запазете час ОНЛАЙН или по телефона', website, 'draft'),
  })
}

export default { records, reviews, pendingRecords, pendingReviews }
