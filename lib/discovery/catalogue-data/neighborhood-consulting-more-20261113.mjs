// Continued first-party appointment review after the first100-business commit.
// No qualification/outcome claims, legal advice, payments or bookings.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const base = { cityCode: '68134', neighborhood: null, locationKind: 'premises', coordinates: null, category: 'consulting' }
const service = (name, extra = {}) => ({ name, category: 'consulting', appointmentModel: 'appointment', ...extra })
const tml = 'https://tml-consult.bg/'
const tmlContact = `${tml}contact/`
const tmlTariff = `${tml}advokatsko-vaznagrazhdenie/`
const tadros = 'https://advokat-tadros.com/'
const tadrosContact = `${tadros}contact/`
const tadrosTariff = `${tadros}tarifa/`
const ilona = 'https://www.advokatpetrova.com/'
const ilonaFaq = `${ilona}faq`
const stefanov = 'https://stefanovlaw.com/'
const stefanovContact = `${stefanov}kontakti/`
const stefanovTariff = `${stefanov}tarifa/`
const records = [
  {
    ...base, id: 'sofia-todor-mangarov-tundzha', name: 'Адвокатска кантора Тодор Мангъров',
    neighborhood: 'Център', address: 'София, ул. „Тунджа“ 36, партер', website: tml, phone: '+359884929105',
    services: [service('Устна правна консултация в кантората', {
      description: 'Цена за устна консултация на място, без публикувано времево ограничение. При последващо възлагане на делото сумата се приспада от хонорара. Документи, процесуално представителство и външни такси се уговарят отделно.',
      price: { amount: 100, currency: 'EUR', kind: 'fixed', unit: 'консултация', sourceUrl: tmlTariff, checkedOn },
    })],
    openingHours: { sourceUrl: tmlContact, checkedOn, days: [
      ...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '18:00' }] })),
      { weekday: 6, periods: [] }, { weekday: 7, periods: [] },
    ] },
    booking: { kind: 'form', url: tmlContact },
    verification: { status: 'approved', checkedOn, validUntil, contact: tmlContact,
      booking: { url: tmlContact, excerpt: 'Срещите в кантората са с предварително уговорен час. За среща на място се попълва формулярът за запитване.' } },
  },
  {
    ...base, id: 'sofia-lina-tadros-alabin', name: 'Адвокатска кантора Лина Тадрос',
    address: 'София, ул. „Алабин“ 33, вх. А, ет. 4, офис 426', website: tadros, phone: '+359892313800',
    services: [service('Правна консултация в кантората', { description: 'Консултация след предварително записване по телефона. Хонорарът се договаря индивидуално според възложения случай и обхвата на работата.' })],
    booking: { kind: 'phone', phone: '+359892313800' },
    verification: { status: 'approved', checkedOn, validUntil, contact: tadrosContact,
      booking: { url: tadrosContact, excerpt: 'Консултации се предоставят след предварително записан час по телефона.' } },
  },
  {
    ...base, id: 'sofia-ilona-petrova-pozitano', name: 'Адвокат Илона Петрова',
    neighborhood: 'Център',
    address: 'София, ул. „Позитано“ 3, ет. 2, ап. 18', website: ilona, phone: '+359888237780',
    services: [service('Първоначална правна консултация в кантората', {
      description: 'Публикуван диапазон според сложността на въпроса; ориентировъчно 30–60 минути, а не фиксирана продължителност. Точният хонорар се уточнява предварително. Сложните казуси се договарят индивидуално.',
      price: { amount: 50, maximum: 100, currency: 'BGN', kind: 'range', unit: 'консултация', sourceUrl: ilonaFaq, checkedOn },
    })],
    openingHours: { sourceUrl: ilonaFaq, checkedOn, days: [
      ...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '17:30' }] })),
      { weekday: 6, periods: [] }, { weekday: 7, periods: [] },
    ] },
    booking: { kind: 'phone', phone: '+359888237780' },
    verification: { status: 'approved', checkedOn, validUntil, contact: ilonaFaq,
      booking: { url: ilonaFaq, excerpt: 'За записване на час се обадете на +359888237780 или изпратете имейл; препоръчва се предварително записване.' } },
  },
  {
    ...base, id: 'sofia-stanislav-stefanov-lyubata', name: 'Адвокатска кантора Станислав Стефанов · Любата',
    address: 'София, ул. „Любата“ 7, партер', website: stefanov, phone: '+359889921981',
    services: [service('Устна правна консултация в кантората', { durationMin: 30, durationSourceUrl: stefanovTariff, durationCheckedOn: checkedOn,
      description: '30-минутна устна консултация без отделен преглед на документи. Хонорарът се уточнява при записване и се заплаща предварително.' }),
      service('Устна правна консултация с преглед на документи в кантората', { durationMin: 60, durationSourceUrl: stefanovTariff, durationCheckedOn: checkedOn,
        description: '60-минутна устна консултация с преглед на документи. Хонорарът се уточнява при записване и се заплаща предварително.' })],
    booking: { kind: 'form', url: stefanovContact },
    verification: { status: 'approved', checkedOn, validUntil, contact: stefanovContact,
      booking: { url: stefanovTariff, excerpt: 'При записване на час поискайте предварително информация за цената. Консултациите се извършват след предварително заплащане.' } },
  },
]
const reviews = [
  {
    id: records[0].id, checkedOn, website: tml, bookingEntry: tmlContact, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [tml, tmlContact, tmlTariff],
    notes: 'Actual owner Contacts says onsite meetings require prior appointment and exposes name/email/phone/subject request fields. Current fee page explicitly100EUR for oral onsite/online consultation, no time limit, deducted from later litigation retainer. Selected onsite only, not free introductory phone call or200EUR written opinion. Exact own address, primaryphone and complete Mon-Fri09-18/weekendsclosed retained. No duration, coordinates, availability or outcome inferred; no form submitted.',
  },
  {
    id: records[1].id, checkedOn, website: tadros, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    pricingDecision: 'not_publicly_listed', reviewedUrls: [tadros, tadrosContact, tadrosTariff],
    priceSearch: { outcome: 'not_published', bookingUrl: tadrosContact, serviceUrls: [tadros, tadrosTariff],
      notes: 'Owner contact explicitly requires phone appointments. Actual Prices page describes individually agreed fees, not a numerical ordinary consultation amount; no numeric service fee imported from a statutory reference.' },
    notes: 'Read actual own phone appointment instruction first, then linked Prices and owner service overview. ExactAlabin33entranceAfloor4office426 and phone agree throughout. Only ordinary consultation, no statutory minimum inferred as this business fee. No weeklyhours, duration or coordinates published in inspected contact/footer; absent. Former about URL404 not used as a read. No images, ratings, protected advice or customer data copied; no call.',
  },
  {
    id: records[2].id, checkedOn, website: ilona, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [ilona, ilonaFaq],
    notes: 'Owner FAQ explicitly supports prior phone booking for onsite consultation and publishes exact Pozitano3floor2apt18, primaryphone, complete weekdayhours and50–100BGN initial consultation range.30–60minute wording retained as range in description, never flattened to duration. Complex cases individually agreed. Separate linked online calendar/contact reader unavailable; not claimed reviewed and not used as selected onsite booking path. Actual onsite phone route plus independently accessible onsite fee reviewed. No remote-only service fee, credentials or form submission.',
  },
  {
    id: records[3].id, checkedOn, website: stefanov, bookingEntry: stefanovContact, bookingReview: 'owned_booking_reviewed',
    pricingDecision: 'not_publicly_listed', reviewedUrls: [stefanov, stefanovContact, stefanovTariff],
    priceSearch: { outcome: 'not_published', bookingUrl: stefanovContact, serviceUrls: [stefanovTariff],
      notes: 'Actual own tariff lists30/60minute onsite consultation variants without amounts and instructs customers to request a fee when booking and prepay. Contact exposes actual name/email/phone/subject enquiry form. Written remote opinions100–300BGN are not selected ordinary onsite prices.' },
    notes: 'Own Contacts explicitly lists Lyubata7parter and a second StefanMladenov88office. Import only the first verified office, not a speculative chain expansion. Genuine Bulgarianphone retained; template Brooklyn/German fields ignored. Exact selected onsite service durations verified in actual tariff.10–18weekday-unspecified office window not invented as weekly openingHours. No coordinates, availability or form submission.',
  },
]
export default { records, reviews }
