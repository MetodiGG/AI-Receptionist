// Independently reviewed first-party dental intake. No source media or clinical prose reused.
const checkedOn = '2026-11-14';
const validUntil = '2027-02-12';
const nora = 'https://www.noradent.bg/';
const noraPrices = `${nora}prices/`;
const fee = (amount, unit) => ({ amount, currency: 'EUR', kind: 'fixed', unit, sourceUrl: noraPrices, checkedOn, validUntil });

export default {
  records: [{
    id: 'sofia-noradent-slavyanska6',
    name: 'НораДент · д-р Нора Дамянова',
    cityCode: '68134',
    neighborhood: null,
    address: 'София, ул. Славянска 6',
    locationKind: 'premises',
    coordinates: null,
    category: 'other',
    website: nora,
    phone: '+359899128852',
    booking: { kind: 'phone', phone: '+359899128852' },
    services: [
      {
        name: 'Първичен дентален преглед и снемане на зъбен статус',
        category: 'other',
        appointmentModel: 'appointment',
        description: 'Първичен преглед със снемане на зъбен статус след уговорен час. Подробният лечебен план и последващите манипулации са отделни позиции в ценоразписа.',
        price: fee(42, 'първичен преглед и статус')
      },
      {
        name: 'Първичен дентален преглед и зъбен статус за дете',
        category: 'other',
        appointmentModel: 'appointment',
        description: 'Детският вариант на първичния преглед със снемане на зъбен статус. Не включва отделната комбинация от преглед и почистване с четка и паста.',
        price: fee(42, 'детски първичен преглед и статус')
      },
      {
        name: 'Първично почистване и Airflow · степен 1',
        category: 'other',
        appointmentModel: 'appointment',
        description: 'Точният първичен вариант „степен 1“ от собствения ценоразпис. Степен 2 и самостоятелното отстраняване на налепи с Airflow имат други тарифи; не са включени тук.',
        price: fee(98, 'първично почистване и Airflow, степен 1')
      }
    ],
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: {
        url: `${nora}booking/`,
        excerpt: 'Собствената страница за записване изрично предлага телефон 0899128852 като алтернатива на външния календар. Проверена е само независимата телефонна пътека.'
      },
      contact: `${nora}contacts/`
    }
  }],
  reviews: [{
    id: 'sofia-noradent-slavyanska6',
    website: nora,
    checkedOn,
    bookingEntry: 'phone',
    bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [
      nora, `${nora}robots.txt`, `${nora}booking/`, `${nora}contacts/`, noraPrices,
      `${nora}karta/`, `${nora}team/`,
      `${nora}services/pochistvane-na-zaben-kamak/`,
      `${nora}services/pochistvane-i-polirane-na-zabi-s-airflow/`
    ],
    notes: 'Actual root Book entry inspected first: same-page owner request form exists, then dedicated own booking page explicitly offers phone 0899128852. Its external Fresha target was identified but NEVER requested because of the inherited provider STOP; no calendar, availability, provider menu, price comparison or reservation confirmation is claimed. Selected phone path is independently supported by own booking/contact/service pages and current own native prices. Fresh normal HTTP price page corroborates literal EUR42 primary exam/status, EUR42 child primary exam/status, EUR98 initial cleaning+Airflow grade1. Grade2 EUR132, standalone Airflow EUR58, child exam+brush/paste EUR65, treatment plans and other procedures are not mixed into selected variants. No duration, full-mouth unit, health-insurance coverage or outcome inferred. Root/contacts/team establish Nora Damyanova dental practice at Slavyanska6; no staff aliases or medical-aesthetic services added. Complete reviewed native navigation/footer and sitemap disclose no Terms/Privacy link; this is bounded link inspection, not a claim that no policy exists or blanket source-use/legal permission. Minimal independently worded factual references only; no authored clinical prose, cases, testimonials, ratings, media or images copied. No public weekly hours identified in reviewed contact/root/booking/team pages; hours and quarter absent, coordinates null. No form fields, consents, uploads, payment, phone calls, private data, Maps, restricted providers, API or production writes.'
  }]
};
