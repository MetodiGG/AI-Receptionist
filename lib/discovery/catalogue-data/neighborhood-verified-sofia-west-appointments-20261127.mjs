import { OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_SOURCE_URL } from '../official-sofia-address-source.mjs'

const cityCode = '68134', checkedOn = '2026-11-27', validUntil = '2026-12-18'
const born = {
  id: 'sofia-boantika-borovo-sveta-marina46',
  name: 'Boantika', neighborhood: 'Борово',
  address: 'София, кв. Борово, ул. Света Марина 46',
  category: 'education', website: 'https://boantika.bg/', phone: '+359882939400',
  admissionUrl: 'https://boantika.bg/book-trial-visit/',
  menuUrls: ['https://boantika.bg/study-room/', 'https://boantika.bg/activities/'],
  evidence: { latitude: 42.669163, longitude: 23.283911, addressId: '20936' },
  nameBG: 'Полудневна учебна занималня · 1.–4. клас',
  conditionBG: 'Месечна такса. Включва подготовка на домашни, дигитална математика и 2 учебни часа английски или немски седмично. Отстъпки: 5% за второ дете или 5% при предплащане на срок; сайтът не уточнява дали се комбинират. Формата е за пробно посещение, не за плащане или прием.',
  price: { amount: 279, unit: 'месец' },
  contact: 'https://boantika.bg/study-room/',
  bookingExcerpt: 'От страницата на полудневната занималня се изпраща заявка за пробно посещение, с клас и предпочитана дата.',
  notes: 'The provider links its trial-visit form directly from the half-day after-school programme. That form was read without filling or submitting it. The private provider lists the official 279 EUR monthly fee and conditional discounts, not a trial price. English/German and maths are included activities, not separate lessons offered at the monthly charge. No assumed discount combination, food subsidy, transport for all schools, availability or guaranteed enrolment. Address and neighbourhood on the programme and form match the exact Sofia civic record.',
  fingerprint: 'ad7f15ee4ae41482b55f641b6c54b9fb38073115cb0374167ab1a0c9dbe267af',
}

const vizio = {
  id: 'sofia-vizio-works-gorna-banya-boycho-boychev81',
  name: 'Визио Уъркс', neighborhood: 'Горна баня',
  address: 'София, кв. Горна баня, ул. Бойчо Бойчев 81',
  category: 'auto_repair', website: 'https://vizio.bg/', phone: '+359988832468',
  admissionUrl: 'https://vizio.bg/contacts/',
  menuUrls: ['https://vizio.bg/services/demontaj-montaj-balans-hotel-gumi-zavaryavane-izpravyane-djanti/'],
  evidence: { latitude: 42.683558, longitude: 23.239321, addressId: '38420' },
  nameBG: 'Смяна и баланс на 4 гуми · лек автомобил, 16–17″',
  conditionBG: 'За четири стандартни гуми на лек автомобил: сваляне и качване на колелата, демонтаж и монтаж на гумите и баланс. За Run Flat, SUV, 4×4 и микробус има отделни тарифи. Заявеният час се уточнява със сервиза.',
  price: { amount: 48 },
  contact: 'https://vizio.bg/contacts/',
  bookingExcerpt: 'Услугата има собствен избор „Час за смяна гуми“ във формата на сервиза, където се посочват предпочитани дата и час.',
  notes: 'The provider contact form has a tyre-change service option and preferred date/time. It was not filled or submitted. On the services page the current EUR table lists 48 EUR for four standard passenger-car tyres at 16–17 inches and distinguishes each included operation; separate SUV/van and run-flat rates do not use this amount. Ignore the separately dated 2022 promotion; no price conversion, duration or confirmation is inferred. Sofia point RN38420 matches the full official site address.',
  fingerprint: '0a2f9bffeec2f9b752731906ecbb6c1f0ef1b5e4ed2a5fdb0ace45199f8bb515',
}

const alz = {
  id: 'sofia-autolakir-center-moderno-predgradie-mickevich61',
  name: 'Автолакир Център', neighborhood: 'Модерно предградие',
  address: 'София, кв. Модерно предградие, ул. Адам Мицкевич 61',
  category: 'auto_repair', website: 'https://alzservice.com/', phone: '+359878299166',
  admissionUrl: 'https://alzservice.com/contact/',
  menuUrls: ['https://alzservice.com/services/' + encodeURIComponent('автобояджийски-услуги') + '/'],
  evidence: { latitude: 42.729492, longitude: 23.282617, addressId: '117411' },
  nameBG: 'Боядисване на автомобилен детайл',
  conditionBG: 'Подготовка и боядисване на автомобилен детайл с подбор на цвета. Онлайн формата е заявка за оглед или ремонт, не потвърден час.',
  contact: 'https://alzservice.com/contact/',
  additionalEvidence: ['https://www.armeec.bg/api/files/536d9a2e-49ef-4f99-9034-3bbd930559ed'],
  bookingExcerpt: 'Сервизът предлага заявка за час за оглед или ремонт. Формата приема избрана услуга и контакт, без да потвърждава свободен час.',
  notes: 'The workshop accepts requests for a time to inspect or repair a vehicle. Its body-painting page describes the work; the insurer repair-network record names the same branch and neighbourhood as municipal RN117411. Neither the public booking form nor the paint-service page or main navigation has a numeric rate. A gated different service was not used and is not part of this listing. No form data was entered.',
  unpricedNotes: 'The body-painting service page, navigation and actual inspection/repair request form were read. The form exposes a requested service without any charge and has no tariff link. The published paint service has no public fee. No price, package or duration has been inferred.',
  fingerprint: '0135364a07a624de023565f36768f226e53c33f435dc616aa6c50c3d1cb16f6f',
}

const ezda = {
  id: 'sofia-ezdasofia-slavia-haydushko-izvorche28',
  name: 'EzdaSofia · Конна база „Хан Аспарух“', neighborhood: 'Славия',
  address: 'София, ж.к. Славия, ул. Хайдушко изворче 28 · Конна база „Хан Аспарух“',
  category: 'fitness', website: 'https://ezdasofia.com/', phone: '+359899891184',
  admissionUrl: 'https://ezdasofia.com/contacts', bookingKind: 'phone',
  menuUrls: ['https://ezdasofia.com/ceni-club-ezda', 'https://www.ezdasofia.com/ezda-saveti/548-urok-po-ezda'],
  evidence: { latitude: 42.679609, longitude: 23.2765053 },
  coordinateSource: 'https://ezdasofia.com/contacts',
  additionalEvidence: ['https://natura2000.egov.bg/EsriBg.Natura.Public.Web.App/PublicDownloads/RIEWSofia/OVOS/SF-OVOS-2013-139.pdf'],
  nameBG: 'Индивидуален урок по конна езда · 30 минути',
  conditionBG: 'Еднократен урок за един човек с инструктор. За час в делничен ден извън 10:00–18:00 се изисква авансово плащане. По-удобният вход за посетители е откъм ул. Славия.',
  appointmentModel: 'individual_training', durationMin: 30, price: { amount: 35 },
  contact: 'https://ezdasofia.com/contacts',
  bookingExcerpt: 'За тази конна база сайтът изрично посочва записване по телефона, с отделен адрес и указания за влизане откъм ул. Славия.',
  notes: 'The booking contact explicitly applies to Han Asparuh. The linked named map marker, not its map viewport, identifies the riding club. The posted one-person single lesson is 35 EUR for 30 minutes; the service page identifies instruction and the price page preserves off-peak weekday advance payment. The separate Dragalevtsi branch, conflicting weekend opening hours, packages and pony offers were not imported. No call or booking was placed.',
  fingerprint: '0d44acc260c8739d6e2180e383c154c92da54197b344c8e805e4918292fcd0bd',
}

const abv = {
  id: 'sofia-abv-sporten-svyat-mladost1-dospevski9',
  name: 'АБВ Спортен свят', neighborhood: 'Младост 1',
  address: 'София, ж.к. Младост 1, ул. Димитър Доспевски 9',
  category: 'fitness', website: 'https://abvsport.com/', phone: '+359877695343',
  admissionUrl: 'https://abvsport.com/pluvane-private/', bookingKind: 'phone',
  menuUrls: ['https://abvsport.com/pluvane-private/'],
  evidence: { latitude: 42.652122, longitude: 23.376631, addressId: '108550' },
  nameBG: 'Индивидуален урок по плуване · 1 участник',
  conditionBG: 'За едно дете или възрастен, в самостоятелен коридор. Часът се уговаря по телефона и се потвърждава след пълно плащане. Отмяна за делничен урок — до 12:00 предходния ден, за уикенд — до 12:00 в петък. При по-късна отмяна сумата не се връща.',
  appointmentModel: 'individual_training', price: { amount: 45, unit: 'урок' },
  contact: 'https://abvsport.com/contacts/',
  bookingExcerpt: 'За индивидуалния урок рецепцията приема записване по телефона. Потвърждението е след уговорка с треньор и пълно заплащане.',
  notes: 'The pool operator explicitly handles bookings by phone for one swimmer in a private lane. Its own conditions specify full payment after a phone arrangement and separate weekday/weekend cancellation deadlines. The small-group fee in the same tariff is per person and was not imported. No published duration, shared venue prices from other operators, payment button, actual availability or medical service was copied. Municipal RN108550 matches the owner address; the dance organisation at that address is a separate operator.',
  fingerprint: '035cec76e039c1e1c9c291390861863db7f3e5b63b2756037dc0cbf84f94ad52',
}

const entries = [born, vizio, alz, ezda, abv]
const municipality = { source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION }

export const VERIFIED_SOFIA_WEST_APPOINTMENTS_20261127_RECORDS = entries.map(item => ({
  id: item.id, name: item.name, cityCode, neighborhood: item.neighborhood, address: item.address,
  website: item.website, phone: item.phone, category: item.category, locationKind: 'premises',
  coordinates: { ...item.evidence,
    ...(item.coordinateSource
      ? { source: item.coordinateSource, method: 'first_party_coordinates' }
      : { ...municipality, sourceCityCode: cityCode, sourceNeighborhood: item.neighborhood, sourceWebsite: item.website, checkedOn }),
    sourceAddress: item.address },
  services: [{
    name: item.nameBG, category: item.category, description: item.conditionBG, appointmentModel: item.appointmentModel ?? 'appointment',
    ...(item.durationMin && { durationMin: item.durationMin, durationSourceUrl: item.menuUrls[0], durationCheckedOn: checkedOn }),
    ...(item.price && { price: { ...item.price, currency: 'EUR', kind: 'fixed', sourceUrl: item.menuUrls[0], checkedOn } }),
  }],
  booking: item.bookingKind === 'phone' ? { kind: 'phone', phone: item.phone } : { kind: 'form', url: item.admissionUrl },
  verification: { status: 'approved', checkedOn, validUntil, contact: item.contact,
    booking: { url: item.admissionUrl, excerpt: item.bookingExcerpt } },
}))

export const VERIFIED_SOFIA_WEST_APPOINTMENTS_20261127_REVIEWS = entries.map(item => ({
  id: item.id, website: item.website, checkedOn,
  bookingEntry: item.bookingKind === 'phone' ? 'phone' : item.admissionUrl,
  bookingReview: item.bookingKind === 'phone' ? 'phone_booking_reviewed' : 'owned_booking_reviewed',
  reviewedUrls: [...new Set([item.website, item.admissionUrl, item.contact, ...item.menuUrls,
    ...(item.additionalEvidence ?? []), item.coordinateSource ?? OFFICIAL_SOFIA_SOURCE_URL])],
  inventoryIdentity: item.fingerprint, notes: item.notes,
  ...(!item.price && { pricingDecision: 'not_publicly_listed', priceSearch: {
    outcome: 'not_published', bookingUrl: item.admissionUrl, serviceUrls: item.menuUrls, notes: item.unpricedNotes,
  } }),
}))
