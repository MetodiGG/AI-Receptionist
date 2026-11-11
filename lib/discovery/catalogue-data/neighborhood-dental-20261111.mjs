// First-party manual checks, 11 November 2026. One row per practice, not per
// dentist or procedure. No reviews, photographs or availability are imported.
const checkedOn = '2026-11-11', validUntil = '2027-02-09'
const priced = (name, amount, sourceUrl, options = {}) => ({
  name, category: 'other', appointmentModel: 'appointment',
  ...(options.description ? { description: options.description } : {}),
  price: { amount, currency: 'EUR', kind: options.maximum == null ? (options.from ? 'from' : 'fixed') : 'range',
    ...(options.maximum == null ? {} : { maximum: options.maximum }), sourceUrl, checkedOn, validUntil },
})
const practice = (id, name, website, phone, neighborhood, address, services, booking, evidenceUrl, excerpt) => ({
  id, name, website, phone, neighborhood, address, category: 'other', cityCode: '68134',
  locationKind: 'premises', coordinates: null, services, booking,
  verification: { status: 'approved', checkedOn, validUntil,
    booking: { url: evidenceUrl, excerpt }, contact: evidenceUrl },
})
const smile = 'https://smilespot.bg/'
const vanina = 'https://ortovanina.bg/', vaninaPrices = 'https://ortovanina.bg/ceni'
const via = 'https://viadentalstudio.com/', viaPrices = `${via}ceni/`, viaContacts = `${via}kontakti/`
const gradent = 'https://www.gradent.bg/'
const gradentServices = `${gradent}%D0%BD%D0%B0%D1%88%D0%B8%D1%82%D0%B5-%D1%83%D1%81%D0%BB%D1%83%D0%B3%D0%B8`
const gradentPrices = `${gradent}_files/ugd/cdc9bb_49ffc186f0764f36b4ba379cc1b0118b.pdf`
const gradentBook = 'https://ovelon.com/results/index?dom=wEgO651jQjhGpgkl2rP6wg%3D%3D'
const viaBranches = [
  ['strelbishte', 'Стрелбище', 'София, ж.к. Стрелбище, ул. Йордан Йовков 18–20, вход от ул. Дедеагач', '+359895473333'],
  ['krasno-selo', 'Красно село', 'София, ж.к. Красно село, бл. 194, вход А', '+359898641414'],
  ['obelya', 'Обеля 2', 'София, ж.к. Обеля 2, ул. Кривините, ДКЦ 30, кабинети 317 и 318', '+359888557577'],
]
const records = [
  practice('sofia-smile-spot-borovo', 'Smile Spot · Борово', smile, '+359887993003', 'Борово',
    'София, кв. Борово, ул. Невестина скала 5', [
      priced('Дентален преглед със зъбен статус', 20, smile),
      priced('Почистване на зъбен камък, плака и оцветявания с полиране', 40, smile, { maximum: 80 }),
      priced('Флуоризация на съзъбието', 20, smile),
      priced('Полиране с Air Flow', 20, smile),
      priced('Силант за зъб', 30, smile),
      priced('Кариес на временен зъб · една повърхност', 30, smile, { maximum: 50 }),
      priced('Кариес на временен зъб · две повърхности', 40, smile, { maximum: 60 }),
      priced('Кариес на постоянен зъб · една повърхност', 40, smile, { maximum: 60 }),
      priced('Кариес на постоянен зъб · две повърхности', 50, smile, { maximum: 70 }),
      priced('Кореново лечение · един канал', 50, smile, { maximum: 80 }),
      priced('Екстракция на еднокоренов зъб с упойка', 80, smile),
      priced('Екстракция на мъдрец с упойка', 150, smile),
    ], { kind: 'form', url: smile }, smile,
    'Изберете удобен ден и час при Д-р Самер Макки'),
  practice('sofia-ortodont-vanina-atanasova', 'Д-р Ванина Атанасова · ортодонт', vanina, '+359879395588', 'Стрелбище',
    'София, ж.к. Стрелбище, ул. Бадемова гора 5', [
      priced('Първичен ортодонтски преглед и консултация', 50, vaninaPrices,
        { description: 'Ориентировъчна тарифа. Прегледът и анализът се приспадат при започване на ортодонтско лечение.' }),
      priced('Отпечатъци, снимки, ортодонтски анализ и лечебен план', 100, vaninaPrices,
        { description: 'Ориентировъчна тарифа. Прегледът и анализът се приспадат при започване на ортодонтско лечение.' }),
      priced('Контролен преглед във фазата на ретенция', 50, vaninaPrices,
        { description: 'Ориентировъчна цена за един контролен преглед.' }),
      priced('Фиксиране на отлепен или свален ритейнър', 100, vaninaPrices,
        { from: true, description: 'Ориентировъчна начална цена; точната стойност се определя след преглед.' }),
    ], { kind: 'phone', phone: '+359879395588' }, vanina,
    'Запазете час за преглед на: 0879 395 588'),
  ...viaBranches.map(([slug, area, address, phone]) => practice(`sofia-via-dental-${slug}`, `VIA Dental Studio · ${area}`,
    via, phone, area, address, [
      priced('Обстоен дентален преглед за деца и възрастни', 35, viaPrices,
        { description: 'Частна тарифа. За приложимото покритие по НЗОК и окончателния лечебен план попитай при записване.' }),
      priced('Професионално почистване на зъбен камък и полиране', 95, viaPrices,
        { description: 'Окончателната стойност се потвърждава след преглед. За конкретния метод на полиране уточни с избрания лекар.' }),
    ], { kind: 'form', url: via }, viaContacts,
    'Онлайн за минута или по телефон. Изберете клиника, лекар и удобен час.')),
  practice('sofia-gradent-borovo', 'GRADENT · д-р Александър Грънчаров', gradent, '+359876000215', 'Борово',
    'София, кв. Борово, ул. Пирински проход 42', [
      priced('Първичен дентален преглед и консултация', 40, gradentPrices),
      priced('Почистване на зъбен камък с Air Flow полиране', 90, gradentPrices),
      priced('Фотополимерна пломба · една повърхност, среден клас', 90, gradentPrices),
      priced('Фотополимерна пломба · две повърхности, среден клас', 100, gradentPrices),
      priced('Фотополимерна пломба · три повърхности, среден клас', 110, gradentPrices),
      priced('Фотополимерна пломба · една повърхност, висок клас', 120, gradentPrices),
      priced('Избелване на горен и долен фронт с лампа', 300, gradentPrices),
    ], { kind: 'form', url: gradentBook }, gradent,
    'ЗАПАЗЕТЕ ЧАС СЕГА'),
]
const reviews = [
  { id: records[0].id, website: smile, checkedOn, bookingEntry: smile, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [smile],
    notes: 'Opened the owner Book button and the named-dentist modal in the browser; its live Google Calendar appointment page rendered, without choosing a day/time or submitting anything. Reviewed the common owner EUR tariff and exact Borovo address/contact. Imported only dental procedures; aesthetic injections and retail excluded. No duration copied from a consultation appointment to other procedures. No ratings or photos copied.' },
  { id: records[1].id, website: vanina, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [vanina, vaninaPrices],
    notes: 'Owner appointment entry explicitly requests calling the published phone at the Sofia Strelbishte address. Followed that entry before the Prices page. Imported only initial/diagnostic and retention appointments, not entire multi-visit treatment as a visit price. Indicative-price qualification and deduction of exam/analysis when treatment starts are preserved. No provider or directory prices substituted.' },
  ...viaBranches.map(([slug, area]) => ({ id: `sofia-via-dental-${slug}`, website: via, checkedOn,
    bookingEntry: via, bookingReview: 'owned_booking_reviewed', reviewedUrls: [via, viaPrices, viaContacts],
    notes: `Inspected actual owner Book modal in browser: general examination35EUR and professional cleaning95EUR, then practitioner selection, without choosing any date/time or entering customer details. Owner tariff explicitly states it applies to all clinics; ${area} is separately identified in owner contacts with exact address and phone. Only general dental services retained, no aesthetic injections, NHIF copay price, chain-wide specialist availability or provider rating. Method wording differs ProphyJet/AirFlow across modal and tariff, so generic polishing is retained and method confirmation disclosed. No unsupported branch-specific URL appended.`,
  })),
  { id: 'sofia-gradent-borovo', website: gradent, checkedOn, bookingEntry: gradentBook,
    bookingReview: 'provider_booking_reviewed', reviewedUrls: [gradent, gradentServices, gradentPrices, gradentBook],
    notes: 'Followed actual owner Book link in browser to the named GRADENT Ovelon appointment portal. It requires email-code verification before further steps; no email entered and no login, code or booking requested. Owner Services links the eight-page PDF tariff, downloaded and text-checked in full; relevant pages4–5 rendered and visually checked for EUR column and surface/material distinctions. No inferred durations, insurance copays, multi-visit totals or whole treatment prices substituted. Exact Borovo address and published phone read on owner site.',
  },
]
export default { records, reviews }
