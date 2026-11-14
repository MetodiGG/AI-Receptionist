// Manually reviewed Sofia beauty intake; no shared imports, identities or photos.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const ny = 'https://www.notino.bg/saloni/new-york-barbershop/'
const emotion = 'https://www.notino.bg/saloni/emotion-by-teodora-pramatarova/'
const miracle = 'https://miraclebarber.com/'
const miracleContact = 'https://www.notino.bg/saloni/miracle-barber-studio/'
const dima = 'https://dimastyle.com/'
const dimaBook = 'https://dimastyle.com/zayavi-chas-v-nash-salon'
const dimaHair = 'https://dimastyle.com/frizyorstvo'
const dimaNails = 'https://dimastyle.com/manicure'
const dayNight = 'https://www.lazernaepilaciq.bg/'
const bb = 'https://studiobbcare.bg/'
const bbBook = 'https://book.studiobbcare.bg/reservations/start?site=1'
const alex = 'https://www.notino.bg/saloni/alex-nails/'
const byWay = 'https://www.notino.bg/saloni/by-the-way-studio/'
const base = { cityCode: '68134', neighborhood: null, locationKind: 'premises', coordinates: null }
const priced = (name, category, amount, sourceUrl, durationMin, description, currency = 'EUR') => ({
  name, category, appointmentModel: 'appointment',
  price: { amount, currency, kind: 'fixed', sourceUrl, checkedOn, validUntil },
  ...(durationMin ? { durationMin, durationSourceUrl: sourceUrl, durationCheckedOn: checkedOn } : {}),
  ...(description ? { description } : {}),
})
const records = [
  {
    ...base, id: 'sofia-alex-nails-bademova11', name: 'Alex Nails',
    address: 'София, ул. Бадемова гора 11', category: 'nails', website: alex, phone: '+359878928701',
    booking: { kind: 'phone', phone: '+359878928701' },
    services: [
      priced('Маникюр с гел лак', 'nails', 45, alex, 40, 'Включва сваляне на стар гел лак, оформяне, кожички и изравняваща база.', 'BGN'),
      priced('Класически маникюр — оформяне на нокти', 'nails', 30, alex, 40, undefined, 'BGN'),
      priced('Педикюр с гел лак', 'nails', 55, alex, 50, 'Включва накисване, оформяне на нокти и кожички и гел лак.', 'BGN'),
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: alex, excerpt: 'Маникюр и педикюр — резервация по телефон. Моля, обадете се на салона, за да запазите най-удобния за Вас час. +359878928701.' }, contact: alex },
  },
  {
    ...base, id: 'sofia-by-the-way-vrabnitsa632', name: 'By The Way Studio', neighborhood: 'Връбница 2',
    address: 'София, ж.к. Връбница 2, бл. 632, до вход А откъм Ломско шосе', category: 'nails', website: byWay, phone: '+359890115744',
    booking: { kind: 'phone', phone: '+359890115744' },
    services: [
      { name: 'Маникюр с гел лак и изравняване', category: 'nails', appointmentModel: 'appointment', description: 'Включва изравняване и укрепване. Публикувана продължителност 90–120 минути.', price: { amount: 20.45, maximum: 25.56, currency: 'EUR', kind: 'range', sourceUrl: byWay, checkedOn, validUntil } },
      priced('Мъжки маникюр', 'nails', 10.23, byWay, 45),
      priced('Сух педикюр без лак', 'nails', 23.01, byWay, 60),
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: byWay, excerpt: 'Маникюр и педикюр — резервация по телефон. Обадете се на салона за удобен час. +359890115744.' }, contact: byWay },
  },
  {
    ...base, id: 'sofia-bb-care-bogdan15', name: 'Studio BB Care', neighborhood: 'Оборище',
    address: 'София, ул. Богдан 15', category: 'nails', website: bb, phone: '+359896051260',
    booking: { kind: 'form', url: bbBook },
    services: [
      priced('Маникюр с гел лак GAMA', 'nails', 31, bbBook, 90),
      priced('Обикновен маникюр', 'nails', 18, bbBook, 50),
      priced('Педикюр с гел лак', 'nails', 37, bbBook, 60),
    ],
    openingHours: { sourceUrl: 'https://studiobbcare.bg/kontakti/', checkedOn, days: [...[1, 2, 3, 4, 5, 6].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '20:00' }] })), { weekday: 7, periods: [] }] },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: bb, excerpt: 'Запази час — към онлайн резервации и цени; или резервирайте на +359 896 051 260. Маникюр и педикюр.' }, contact: 'https://studiobbcare.bg/kontakti/' },
  },
  {
    ...base, id: 'sofia-den-i-nosht-mogilite2a', name: 'Ден и Нощ · студио за красота', neighborhood: 'Левски',
    address: 'София, кв. Левски, ул. Могилите 2А, вход откъм бул. Владимир Вазов', category: 'nails', website: dayNight, phone: '+359884273408',
    booking: { kind: 'phone', phone: '+359884273408' },
    services: [
      priced('Маникюр с гел лак', 'nails', 23, dayNight),
      priced('Класически маникюр', 'nails', 8, dayNight),
      priced('Класически маникюр без лак', 'nails', 5.5, dayNight),
    ],
    openingHours: { sourceUrl: dayNight, checkedOn, days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '22:00' }] })) },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: dayNight, excerpt: 'За да запазите час при нас, моля свържете се с нас по телефона или ни посетете на място. Телефон 0884273408.' }, contact: dayNight },
  },
  {
    ...base, id: 'sofia-dima-style-osogovski1', name: 'Дима Стил · София',
    address: 'София, ул. Осоговски проход 1, на ъгъла с ул. Добри Христов', category: 'hair', website: dima, phone: '+359888924371',
    booking: { kind: 'form', url: dimaBook },
    services: [
      { name: 'Подстригване', category: 'hair', appointmentModel: 'appointment' },
      { name: 'Боядисване на коса', category: 'hair', appointmentModel: 'appointment' },
      { name: 'Маникюр с гел лак', category: 'nails', appointmentModel: 'appointment' },
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: dimaBook, excerpt: 'Заяви час в наш салон; Салон: София — Дима Стил; Услуга: Фризьорство, Маникюр; наш оператор ще се свърже с Вас по телефона, за да потвърди желания час.' }, contact: 'https://dimastyle.com/saloni' },
  },
  {
    ...base, id: 'sofia-emotion-teodora-bulgaria106', name: 'Emotion by Teodora Pramatarova',
    address: 'София, бул. България 106', category: 'hair', website: emotion, phone: '+359879100012',
    booking: { kind: 'phone', phone: '+359879100012' },
    services: [
      priced('Дамско подстригване', 'hair', 35.79, emotion, 60),
      priced('Боядисване на корени с подсушаване', 'hair', 76.69, emotion, 90),
      priced('Мъжко подстригване с измиване и стайлинг', 'barber', 16.87, emotion, 25),
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: emotion, excerpt: 'Дамско и мъжко фризьорство — резервация по телефон; обадете се на салона за час. +359879100012.' }, contact: emotion },
  },
  {
    ...base, id: 'sofia-miracle-barber-obikolna275', name: 'MIRACLE Barber Studio', neighborhood: 'Дружба 2',
    address: 'София, ул. Обиколна 275', category: 'barber', website: miracle, phone: '+359878113915',
    booking: { kind: 'phone', phone: '+359878113915' },
    services: [
      priced('Мъжко подстригване', 'barber', 15, miracle),
      priced('Подстригване и оформяне на брада', 'barber', 20, miracle),
      priced('Оформяне на брада', 'barber', 13, miracle),
    ],
    openingHours: { sourceUrl: miracle, checkedOn, days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '20:00' }] })) },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: miracle, excerpt: 'Запази своя час — Обади се сега 0878 113 915; MIRACLE Barber Studio, София, Дружба 2.' }, contact: miracleContact },
  },
  {
    ...base, id: 'sofia-new-york-barbershop-kiril90', name: 'New York Barbershop',
    address: 'София, ул. Св. св. Кирил и Методий 90', category: 'barber', website: ny, phone: '+359879604898',
    booking: { kind: 'phone', phone: '+359879604898' },
    services: [
      priced('Мъжко подстригване', 'barber', 10.23, ny, 30),
      priced('Оформяне на брада с машинка', 'barber', 5.11, ny, 10),
      priced('Мъжко подстригване и оформяне на брада', 'barber', 15.34, ny, 30, 'Включва измиване, финално стилизиране и класическо оформяне на брадата.'),
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: ny, excerpt: 'Бръснарски услуги — резервация по телефон; обадете се на салона, за да запазите час. +359879604898.' }, contact: ny },
  },
]
const reviews = [
  {
    id: 'sofia-alex-nails-bademova11', website: alex, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [alex],
    notes: 'Actual named merchant native nail menu explicitly phone-only; selected three full variants then About/contact/footer read before a later different Notino merchant challenge stopped all further domain requests. Literal BGN45gel40min/BGN30classic40min/BGN55gelpedicure50min retained; no manual EUR conversion. Public inclusion conditions paraphrased, maintenance timing tiers and complex addons omitted. Fullreader three months, recent primarysearch lastmonth corroborates same studio, menu and phone; no independent own domain found by bounded exactbrand/phone discovery. Exact BademovaGora11/0878928701, no assumed quarter or weeklyhours from transient status/retail footer. Old2020promotionaldirectory result excluded. PDFlabel exposes no readableURL, not claimed completed PDF review. Runtime/all2000 exactmerchantURL/phone/premise no match. No clinical claims, staff clones, reviews/ratings/photos, Maps, calls or reservations.',
  },
  {
    id: 'sofia-by-the-way-vrabnitsa632', website: byWay, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [byWay],
    notes: 'Actual named merchant native menu, explicit phone-only booking and full About/contact/footer read before a later different Notino merchant challenge stopped all further domain access. Three-week primary page: gel+leveling20.45-25.56EUR with90-120minute range preserved in public description, no falsely fixed duration; male10.23EUR45min and drypedicurewithoutpolish23.01EUR60min literal. Generic English gel description not copied, French/ombre addons not mistaken for full manicure. One multi-staff salon at Vrabnitsa2block632 beside entranceA towardLomskoShose,0890115744; no independent owner domain found bounded exactbrand/phone discovery. No published fullweek schedule; transient opening status and retail9-17 omitted. PDFcontrols no exposedURL, no completedPDF/unpublishedclaim. Ordinary nails only, no medicalpedicure/physiotherapy or efficacyclaims. Runtime/all2000 fullmerchantURL/phone/premise dedupe no match; coordinates null, no reviews/photos/Maps/customerentry/booking.',
  },
  {
    id: 'sofia-bb-care-bogdan15', website: bb, checkedOn, bookingEntry: bbBook, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [bb, bbBook, 'https://studiobbcare.bg/manikyur/', 'https://studiobbcare.bg/pedikyur/', 'https://studiobbcare.bg/kontakti/', 'https://studiobbcare.bg/studio/'],
    notes: 'Fresh exclusive native Safari followed owner Book to real Fitsys site1, selected ordinary nails category and ALL14 menu, not a service/date. Literal visible GAMA gel31EUR90min/ordinarymanicure18EUR50min/gelpedicure37EUR60min; no packages, addons or durations from other variants imported. Browser-added analytics omitted; original actual own href retained unchanged. Full live native manicure page independently read via ordinary HTTPS after reader timeout: links current booking and explicit phone fallback, no conflicting selected fees; pedikyur linked route returns own404 honestly, actual current pedicure menu itself was rendered. Own About/Team identifies cosmetic studio and manicurist, not a general medical clinic; import ordinary nails only, no needles or clinical efficacy/qualification claims. Exact Bogdan15/Oborishte comes from owner contact page published venue label, not opening its external map. Own contact full MonSat09-20/Sunclosed and0896051260. No service/date/customer entry, calls, login, reservation, Maps extraction, ratings, reviews or photos. Full runtime/all2000 domain/phone/address dedupe no match; no identities/coordinates.',
  },
  {
    id: 'sofia-den-i-nosht-mogilite2a', website: dayNight, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [dayNight, 'https://www.lazernaepilaciq.bg/prices', 'https://www.notino.bg/saloni/studio-za-krasota-den-i-nosh/'],
    notes: 'Own actual appointment section explicitly says call or visit to book, matching0884273408; public root Book buttons do not expose external booking href, no simulated online form claimed. Full current native root hair/nails/services/About/contact/footer read and ordinaryHTTP button/href inspection; selected three nail fees visibly in native rootHTML, NOT JSasset literals: gel23EUR/classic8/withoutpolish5.50. No nail durations published or borrowed. Separate Prices initially shows laser promotion table; no promo or strikethrough fee imported and unrendered other tabs not claimed reviewed. Named primary Notino same operator/phone corroborates Mogilite2 (owner more precise2A); its current cosmetics fees differ from owner, so ALL facials/laser/waxing/body services held, no unresolved samevariant price imported. No merchant nail service section found before its retail footer, only owner native nail rows selected. Ordinary nail subset only; no clinical claims, qualification claims, reviews, ratings or stock gallery copied. Own fullMonSun10-22 repeated contact/footer, quarter exactly Levski not inferred G suffix. Current runtime/all2000 fullmerchantURL,phone and premise dedupe no match; GPoint Mogilite2 shop59 is different operator, not assumed same. No Maps/GPS, calls, dates/customerdata or reservation.',
  },
  {
    id: 'sofia-dima-style-osogovski1', website: dima, checkedOn, bookingEntry: dimaBook, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [dima, dimaBook, dimaHair, dimaNails, 'https://dimastyle.com/saloni', 'https://dimastyle.com/kontakti', 'https://dimastyle.com/istoriya', 'https://dimastyle.com/frizyorski-uslugi-sofiya', 'https://dimastyle.com/udalzhavane-i-sgastyavane-sofya', 'https://dimastyle.com/race-sofiya'],
    pricingDecision: 'not_publicly_listed',
    priceSearch: { outcome: 'not_published', bookingUrl: dimaBook, serviceUrls: [dimaHair, dimaNails], notes: 'Current ordinary HTTPS reads confirm the actual Sofia request form and both full native service pages contain no visit tariff or durations; current navigation removed Prices. The formerly indexed Sofia hair tariff now returns the own 404 page, and old manicure30/50BGN lines are removed from current service HTML. None of those cached legacy fees are imported. Old hands-tariff route says Upgrading and is not represented as reviewed current nail pricing. This receipt covers the current selected native haircut, hair-color and gel-manicure listings only, not all aesthetic treatments.' },
    notes: 'Actual own Book followed first; full fresh ordinaryHTTPS form exposes Sofia–DimaStil separately from ParkSalonVarna and real hair/manicure service choices. Read only: no dropdown/date choice, personal details, CAPTCHA solving or submission; operator confirmation required, not instant slot promise. Current exact Sofia OsogovskiProhod1 contact/salon and own public phones reviewed; Varna directions field has an older address but is outside scope, not another Sofia venue. Current whole hair/manicure pages and footer independently reread; legacy indexed prices demonstrably removed, no stale conversion/duration used. Central-office client hours not asserted as full salon weekly schedule. Ordinary salon hair/nails only; needle/medicalpedicure/aesthetic treatments and branded efficacy prose not imported. All catalogue/all2000 intake domain, three phones and venue dedupe no match. No Maps, coordinates, photos, reviews, calls or bookings.',
  },
  {
    id: 'sofia-emotion-teodora-bulgaria106', website: emotion, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [emotion],
    notes: 'Actual named merchant women/menhair sections explicitly phone-only, full selected tariff then About/contact/footer. Women35.79EUR60min,rootswithdry76.69EUR90min,menwashstyle16.87EUR25min literal; ranges/complexcolor/memberships not imported. Exact Bulgaria106/Sofia and0879100012; About identifies multi-staff boutique salon, not each employee business. Fullreader cache four months, recent primary search two weeks corroborates selected women/roots tariffs; no claim live availability. No independent domain found in bounded discovery. No weeklyschedule: byrequest/transientstatus and providerretail09-17 omitted. PDFcontrol exposes no URL, not completedPDF/unpublished claim. Dedupe allcurrentcatalogue/intakes phone/brand/address no match. No reviews/photos/prose/Maps/coordinates/call/booking.',
  },
  {
    id: 'sofia-miracle-barber-obikolna275', website: miracle, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [miracle, miracleContact],
    notes: 'Discovered own domain after named merchant review. Actual own Book section explicitly Callnow0878113915, no form or service/date chosen. Full ownroot selected tariff/About/contact/footer read: men15EUR,combo20EUR,beard13EUR; older merchant12.78/15.34/10.23 not imported. Own durations absent, no older merchant durations borrowed. Own Sofia/Druzhba2/phone exactly corroborates named merchant Obikolna275; exactstreet comes from merchant, not map. Full own MonSun10-20 schedule. One studio, not staffalias. Current ownsource three days; allcatalogue/all2000intake phone/domain/venue dedupe no match. No Google/reviews/photos/marketingclaims/coordinates/call/reservation.',
  },
  {
    id: 'sofia-new-york-barbershop-kiril90', website: ny, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [ny],
    notes: 'Actual named merchant barber section explicitly phone-only; full selected menu then About/contact/footer read. Men10.23EUR30min,clipperbeard5.11EUR10min,combo15.34EUR30min with published wash/style qualifier. Other treatments and conflicting age-labelled child variants excluded. Exact KirilMetodiy90/Sofia and0879604898. Two-month full reader plus four-day primary search corroboration. No independent owner domain found in bounded discovery. No weeklyschedule; transientclosing and providerretail hours not imported. PDFcontrol exposes no readableURL, not a completedPDF/unpublished claim. Dedupe current catalogue/all2000intakes fullmerchantURL/phone/venue, no match. No staffclones, reviews, ratings, photos, Maps, coordinates, call or reservation.',
  },
]
export default { records, reviews }

