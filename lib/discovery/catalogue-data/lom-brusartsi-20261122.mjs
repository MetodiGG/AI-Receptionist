// Manual primary-owner review, 2026-11-22. This batch admits only two Lom
// premises with an explicit first-party appointment/enrolment invitation.
// Unresolved candidates and ambiguous price variants remain in the research
// ledger, not in this public inventory. No city-centre coordinates are used.
const checkedOn = '2026-11-22', validUntil = '2027-02-20'
const elenaSite = 'https://studiozakrasotaelena.com/'
const elenaBooking = 'https://studiozakrasotaelena.com/kонтакти/'
const elenaTariff = 'https://studiozakrasotaelena.com/elena/'
const europeSite = 'https://europeschools.net/branch/lom/'
const elenaDescription = 'Часът се уговаря по телефона. Цена от публикуваната EUR тарифа на фризьор Елена.'
const courseDescription = 'Предварително записване по телефона и определяне на нивото. Подходящият курс, графикът и таксата се уточняват с учебния център; не е резервация за единичен урок.'
const fixed = amount => ({ amount, currency: 'EUR', kind: 'fixed', sourceUrl: elenaTariff, checkedOn, validUntil })

export const REGIONAL_RAW_RECORDS = [
  {
    id: 'lom-studio-krasota-elena-dunavska18',
    name: 'Студио за красота Елена',
    cityCode: '44238', neighborhood: null,
    address: 'Лом, ул. Дунавска 18',
    locationKind: 'premises', coordinates: null,
    category: 'hair', website: elenaSite, phone: '+359887313032',
    services: [
      { name: 'Подстригване', category: 'hair', description: elenaDescription, price: fixed(10), appointmentModel: 'appointment' },
      { name: 'Оформяне на брада', category: 'barber', description: elenaDescription, price: fixed(5), appointmentModel: 'appointment' },
      { name: 'Официална прическа', category: 'hair', description: elenaDescription, price: fixed(60), appointmentModel: 'appointment' },
    ],
    openingHours: {
      days: [
        { weekday: 1, periods: [{ open: '09:00', close: '18:00' }] },
        { weekday: 2, periods: [{ open: '09:00', close: '18:00' }] },
        { weekday: 3, periods: [{ open: '09:00', close: '18:00' }] },
        { weekday: 4, periods: [{ open: '09:00', close: '18:00' }] },
        { weekday: 5, periods: [{ open: '09:00', close: '18:00' }] },
        { weekday: 6, periods: [{ open: '09:00', close: '13:00' }] },
        { weekday: 7, periods: [] },
      ],
      sourceUrl: elenaBooking, checkedOn,
    },
    booking: { kind: 'phone', phone: '+359887313032' },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: elenaBooking, excerpt: 'Записвания за час / Обадете се. Собствената страница за фризьор Елена води към същия контакт чрез „Запазете час“.' },
      contact: elenaBooking,
    },
  },
  {
    id: 'lom-europe-schools-slavyanska7',
    name: 'Училища ЕВРОПА · Лом',
    cityCode: '44238', neighborhood: null,
    address: 'Лом, ул. Славянска 7, ет. 2',
    locationKind: 'premises', coordinates: null,
    category: 'education', website: europeSite, phone: '+359878502178',
    services: [
      { name: 'Курсове по английски език за деца и ученици', category: 'education', description: courseDescription, appointmentModel: 'group_reservation' },
      { name: 'Езиково обучение за възрастни', category: 'education', description: courseDescription, appointmentModel: 'group_reservation' },
      { name: 'Подготовка за изпити за сертификати на Кеймбридж', category: 'education', description: courseDescription, appointmentModel: 'group_reservation' },
    ],
    booking: { kind: 'phone', phone: '+359878502178' },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: europeSite, excerpt: 'Как да се запишете? Обадете ни се. Страницата за Лом посочва телефон и прием след определяне на нивото; не е автоматично потвърден урок.' },
      contact: europeSite,
    },
  },
]

// Literal inventory identities are bound after manual source admission and
// schema normalization. They must not be recomputed automatically at runtime.
export const REGIONAL_PRICE_REVIEWS = [
  {
    id: 'lom-studio-krasota-elena-dunavska18',
    checkedOn, website: elenaSite, bookingEntry: 'phone',
    reviewedUrls: [elenaSite, elenaBooking, elenaTariff],
    bookingReview: 'phone_booking_reviewed',
    notes: 'Actual owner appointment entry inspected first: the dedicated hair page links its Book action to the owner contact page, whose appointment section supplies the published phone. Only three unambiguous standalone fixed EUR fees from the named hair specialist menu are admitted. The six multi-option tariffs and the slash-labelled fringe/wash row are held, not converted to guessed ranges, length tiers or unpublished prices. Adjacent BGN displays are not used to calculate EUR. Full contact-page hours are retained. No duration, quarter, appointment availability or precise point inferred. Owner map iframe contains only a textual address query, not coordinates. No form, call, booking, consent or Google request performed. Research ledger: docs/catalogue-regions/research-lom-20261122.json.',
    inventoryIdentity: 'ddf213c545f6986a0800ae787a403ad7be58f8793813d2da92c473a7fcccec18',
  },
  {
    id: 'lom-europe-schools-slavyanska7',
    checkedOn, website: europeSite, bookingEntry: 'phone',
    reviewedUrls: [europeSite],
    bookingReview: 'phone_booking_reviewed',
    pricingDecision: 'not_publicly_listed',
    priceSearch: {
      outcome: 'not_published', bookingUrl: europeSite, serviceUrls: [europeSite],
      notes: 'Read the actual Lom phone-enrolment instructions first, followed by all three selected branch course offers and the public branch navigation. No numeric course fee or separate unread tariff menu is published there. Free entry assessments and bonus learning resources are not free courses. Missing course fees stay absent; this is service_reviewed, not a completed price review. No inaccessible menu is used as proof of absence.',
    },
    notes: 'The exact Lom branch explicitly invites phone enrolment and publishes its Slavyanska7 second-floor address and primary878502178/alternate896695577. Only three actual language/course offers are retained. Entry assessment, suitable course, timetable and fees are agreed with the centre; the course offer is not a guaranteed single-lesson reservation. Class-frequency statements are not office opening hours, and no duration is inferred. Current 2026–27 intake and phone/address were corroborated in the public owner HTML. Linked Google application document and all forms were left untouched. No explicit business-marker coordinates occur in the inspected HTML; coordinates and quarter remain null. No booking, form, call, consent, Google request, paid provider or account created. Research ledger: docs/catalogue-regions/research-lom-20261122.json.',
    inventoryIdentity: 'ce8a2177d659b6e29f91d4930399fae93c61c05dfee634aa701de0d301ae8333',
  },
]
