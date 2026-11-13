// Manually inspected public owner sources, 2026-11-13. No network at runtime.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const dental = (name, amount, sourceUrl, extra = {}) => ({
  name, category: 'other', appointmentModel: 'appointment', ...extra,
  ...(amount == null ? {} : { price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn } }),
})
const brilliant = 'https://www.dentalbg.com/'
const brilliantContact = `${brilliant}KONTAKT.html`
const brilliantPrice = `${brilliant}98zlz-2025-10.pdf`
const nikolaev = 'https://www.dentalnostudio.com/'
const nikolaevBooking = `${nikolaev}bg/make_appointment`
const nikolaevCalculus = `${nikolaev}bg/page/obshta-stomatologiya/zaben-kamak`
const parusheva = 'https://dr-parusheva.com/'
const parushevaPrice = `${parusheva}pricelist/`
const records = [
  {
    id: 'sofia-briliant-dent-lerin', name: 'Брилянт Дент · Лерин', cityCode: '68134', neighborhood: 'Бели брези',
    address: 'София, ул. „Лерин“ 46, вх. Б', locationKind: 'premises',
    coordinates: { latitude: 42.676917, longitude: 23.291083, source: brilliantContact, method: 'first_party_coordinates' },
    category: 'other', website: brilliant, phone: '+359878585661',
    services: [
      dental('Консултация със стоматолог', 20, brilliantPrice),
      dental('Обстоен стоматологичен преглед', 30, brilliantPrice),
      dental('Контролен стоматологичен преглед', 15, brilliantPrice),
      dental('Кореново лечение · едноканален зъб', 105, brilliantPrice),
      dental('Отстраняване на зъбен камък · първо посещение', 95, brilliantPrice),
      dental('Отстраняване на зъбен камък · последващо посещение', 80, brilliantPrice),
      dental('Кабинетно избелване на зъби', 310, brilliantPrice),
      dental('Домашно избелване · една или две зъбни дъги', 190, brilliantPrice),
    ],
    openingHours: { checkedOn, sourceUrl: brilliantContact, days: [
      ...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '19:00' }] })),
      { weekday: 6, periods: [], byAppointment: true }, { weekday: 7, periods: [] },
    ] },
    booking: { kind: 'phone', phone: '+359878585661' },
    verification: { status: 'approved', checkedOn, validUntil,
      booking: { url: brilliantContact, excerpt: 'Приемът е след предварително записване на публикувания телефон 087 85 85 661; съботните посещения са по уговорка.' }, contact: brilliantContact },
  },
  {
    id: 'sofia-dentalno-studio-nikolaev', name: 'Дентално студио д-р Николаев', cityCode: '68134', neighborhood: 'Хаджи Димитър',
    address: 'София, ул. „Клисура“ 20, 23 ДКЦ, ет. 1, кабинет 100', locationKind: 'premises', coordinates: null,
    category: 'other', website: nikolaev, phone: '+359879945750',
    services: [
      dental('Профилактичен стоматологичен преглед'),
      dental('Ултразвуково почистване на зъбен камък'),
      dental('Композитно възстановяване на зъб'),
      dental('Ендодонтско лечение'),
      dental('Избелване на зъби'),
    ],
    openingHours: { checkedOn, sourceUrl: nikolaev, days: [
      ...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '19:00' }] })),
      ...[6, 7].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '17:00' }] })),
    ] },
    booking: { kind: 'form', url: nikolaevBooking },
    verification: { status: 'approved', checkedOn, validUntil,
      booking: { url: nikolaev, excerpt: 'Студиото предлага записване чрез контактната форма или на телефон 0879 945 750; страницата за час избира стоматолог и дата.' }, contact: nikolaev },
  },
  {
    id: 'sofia-dr-parusheva-oborishte', name: 'Дентална клиника д-р Парушева', cityCode: '68134', neighborhood: 'Оборище',
    address: 'София, ул. „Васил Друмев“ 4', locationKind: 'premises', coordinates: null,
    category: 'other', website: parusheva, phone: '+359899915986',
    services: [
      dental('Първичен стоматологичен преглед', 65, parushevaPrice),
      dental('Спешен стоматологичен преглед', 100, parushevaPrice),
      dental('Лазерно почистване на зъбен камък', 120, parushevaPrice,
        { description: 'За нов пациент е необходим първичен преглед и индивидуален план на лечение; прегледът се заплаща отделно.' }),
      dental('Поставяне на фотополимерна пломба', 120, parushevaPrice,
        { description: 'Новите пациенти първо преминават първичен преглед за план на лечение; цената на прегледа е отделна.' }),
      dental('Избелване с лазер', 210, parushevaPrice,
        { description: 'Кабинетна процедура. За нов пациент се изисква отделен първичен преглед и индивидуален план.' }),
    ],
    booking: { kind: 'form', url: `${parusheva}booking/` },
    verification: { status: 'approved', checkedOn, validUntil,
      booking: { url: `${parusheva}booking/`, excerpt: 'Формата избира услуга и лекар, след това дата и час. Клиниката се свързва с клиента за потвърждение на заявката.' }, contact: `${parusheva}contacts/` },
  },
]
const reviews = [
  {
    id: records[0].id, checkedOn, website: brilliant, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [brilliant, brilliantContact, `${brilliant}CENI.html`, brilliantPrice, `${brilliant}KARIES.html`, `${brilliant}ENDODONTIA.html`],
    notes: 'Followed owner appointment instructions on contact page, then Services/Prices and the explicitly linked current statutory tariff. Visually rendered the complete one-page PDF: final right column is EUR, separate from patient/NZOK/MZ BGN columns. Retained literal EUR, not a conversion; older filename is not represented as a newly issued tariff. Selected complete appointment services only, no retail/material/surcharge/partial treatment rows. First vs repeat calculus cleaning and one-canal scope remain separate. Explicit owner coordinates and address copied as facts; no geocoding or Google extraction. Saturday by appointment without invented hours; Sunday closed. No customer booking, form submission, image copying or live writes.',
  },
  {
    id: records[1].id, checkedOn, website: nikolaev, bookingEntry: nikolaevBooking, bookingReview: 'owned_booking_reviewed',
    pricingDecision: 'not_publicly_listed',
    reviewedUrls: [nikolaev, nikolaevBooking, nikolaevCalculus],
    priceSearch: { outcome: 'not_published', bookingUrl: nikolaevBooking, serviceUrls: [nikolaev, nikolaevCalculus],
      notes: 'Booking page exposes dentist/date/customer fields but no tariff. Owner navigation and calculus service page provide procedures, address and weekly hours, not numerical prices; no Prices entry. Do not treat the generic affordable-prices wording as a fee.' },
    notes: 'Read actual appointment entry with three named dentists and date/customer fields without submitting, then owner service page and contact/hours section. No numeric public tariff encountered in those inspected routes; prices and durations absent, never zero or estimated. The service page confirms ultrasound calculus treatment and separate AirFlow; these were not falsely bundled. Kept actual Hadzhi Dimitar premises and owner weekly hours. No other human medical specialty or injectables imported. Exact coordinates not published as reviewed facts, so null; no guessed neighborhood centre. No forms submitted or production data changed.',
  },
  {
    id: records[2].id, checkedOn, website: parusheva, bookingEntry: `${parusheva}booking/`, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [parusheva, `${parusheva}booking/`, `${parusheva}contacts/`, parushevaPrice],
    notes: 'Opened actual Bookly booking page in the browser after reader cache miss, waited for rendered service/staff selectors, inspected ten actual options and selected first examination only; no next/date/customer/submission steps. No price displayed at this selection stage, so sourced explicit public tariff and retained mandatory new-patient first examination as an extra cost, not an included treatment. Literal EUR values; no hardcoded duration, unavailable weekly hours or fabricated coordinates. Contact page and footer bind Oborishte/Vasil Drumev4 and real phone. Services reader was sparse; procedure names and fees come from the actual booking options plus full public tariff. Owner confirmation remains required by their form, not an instant GoRez reservation. No reviews/photos copied or production requests submitted.',
  },
]
export default { records, reviews }
