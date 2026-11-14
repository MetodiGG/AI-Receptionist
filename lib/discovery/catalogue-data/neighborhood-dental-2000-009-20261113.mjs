// Bounded ordinary-dentistry intake; parent owns shared identities, images and integration.
const checkedOn = '2026-11-14';
const validUntil = '2027-02-12';
const coldy = 'https://coldydent.com/';
const contact = `${coldy}contact/`;
const general = `${coldy}general-dentistry-coldy-dent/`;
const terms = `${coldy}general-terms-eng/`;
const privacy = `${coldy}privacy-policy-eng/`;
const about = `${coldy}welcome-to-coldy-dent/`;
const faq = `${coldy}faq/`;
const andreev = 'https://andreevdentalclinic.com/';
const andreevBook = `${andreev}uslugi/`;
const andreevMenu = 'https://andreevdentalclinic.bookdento.com/';
const andreevPrices = `${andreev}%D1%86%D0%B5%D0%BD%D0%BE%D1%80%D0%B0%D0%B7%D0%BF%D0%B8%D1%81/`;
const andreevFee = amount => ({ amount, currency: 'EUR', kind: 'from', sourceUrl: andreevMenu, checkedOn, validUntil });

export default {
  records: [{
    id: 'sofia-coldy-dent-balgarska-legiya2',
    name: 'Coldy Dent · Манастирски ливади',
    cityCode: '68134',
    neighborhood: 'Манастирски ливади',
    address: 'София, ж.к. Манастирски ливади, ул. Българска легия 2',
    locationKind: 'premises',
    coordinates: null,
    category: 'other',
    website: coldy,
    phone: '+359896593939',
    booking: { kind: 'form', url: contact },
    services: [{
      name: 'Първичен консултативен дентален преглед',
      category: 'other',
      appointmentModel: 'appointment',
      description: 'Начален дентален преглед по конкретен поставен от пациента проблем, след предварителна заявка и потвърждение по имейл. Не представлява целия диагностичен протокол или последващо лечение; сумата се уточнява с практиката.'
    }],
    openingHours: {
      sourceUrl: contact, checkedOn,
      days: [1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '08:00', close: '16:00' }] }))
    },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: contact, excerpt: 'Собственият Book consultations води към форма Set an appointment. Условията изискват предварително записване и потвърждение по имейл; не е моментално потвърден календар.' },
      contact
    }
  }, {
    id: 'sofia-andreev-dental-totleben95',
    name: 'Дентална клиника Андреев',
    cityCode: '68134', neighborhood: null,
    address: 'София, бул. Ген. Тотлебен 95',
    locationKind: 'premises', coordinates: null,
    category: 'other', website: andreev, phone: '+359884533345',
    booking: { kind: 'form', url: andreevBook },
    services: [{
      name: 'Общ дентален преглед', category: 'other', appointmentModel: 'appointment',
      description: 'Общ преглед с диагностика и план от действителното меню за записване. Публикувана е начална цена от 16 €; не е доплащане по НЗОК. При заявка през собствения сайт е нужно телефонно потвърждение от екипа.',
      durationMin: 15, durationSourceUrl: andreevMenu, durationCheckedOn: checkedOn,
      price: andreevFee(16)
    }, {
      name: 'Професионално почистване с ултразвук и полиране', category: 'other', appointmentModel: 'appointment',
      description: 'Отстраняване на зъбен камък и плака с ултразвуков апарат и полиране. Менюто публикува цена от 70 € за този вариант; не добавяме Air Flow от друга позиция. Заявката през собствения сайт изисква потвърждение от екипа.',
      durationMin: 45, durationSourceUrl: andreevMenu, durationCheckedOn: checkedOn,
      price: andreevFee(70)
    }],
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: andreevBook, excerpt: 'Собствената страница за услуги съдържа форма Запазете час с предпочитана дата и часови интервал. Часът се потвърждава след телефонна връзка от представител на клиниката.' },
      contact: `${andreev}kontakti/`
    }
  }],
  reviews: [{
    id: 'sofia-coldy-dent-balgarska-legiya2',
    website: coldy,
    checkedOn,
    bookingEntry: contact,
    bookingReview: 'owned_booking_reviewed',
    pricingDecision: 'not_publicly_listed',
    priceSearch: {
      outcome: 'not_published',
      bookingUrl: contact,
      serviceUrls: [general, terms, about, faq],
      notes: 'Actual owner Book consultations opens the native Contact appointment-request form, read first with name/phone/email/message and policy consent; no input or submission. Complete native GeneralDentistry, About and FAQ plus full English Terms and bilingual Privacy read, including navigation/footer. Terms define the initial consultative examination on a patient-raised problem separately from full dental-status analysis/treatment planning, and refer to the practice tariff without publishing an amount for this selected visit. No public price link, numeric visit fee, external calendar or inaccessible selected tariff was identified in these reviewed pages. No other diagnostic protocol, cleaning, osteopathy/physiotherapy, sleep-apnoea, surgical or specialist package imported or relabelled unpublished. This is one genuinely unpriced selected dental visit, not a claim of exhaustive prices for all services.'
    },
    reviewedUrls: [coldy, `${coldy}robots.txt`, contact, general, terms, privacy, about, faq],
    notes: 'Root explicitly clarified dentistry scope after the earlier007 multidisciplinary hold. Complete own About identifies a dental practice founded by dentistManolIvchev, and full Privacy identifies individual primary dental practice IPPDPColdyDent at BulgarskaLegiya2, SofiaManastirskiLivadi; no general medical-centre record or osteopath/physio/psychology staff clone added. ONLY initial consultative dental examination from actual Terms definitions selected, not the full diagnostic protocol with osteopath/body-balance analyses, no health or clinical-result claims copied. Actual root Book→Contact native request form read FIRST, not generic correspondence-only inference; Terms2.1/2.2 independently require advance booking/email confirmation and3.1 exclude emergency care. Description preserves prior request/confirmation and separates later treatment. Full English Terms EOF read; initial Bulgarian text had a small output gap in service definitions, which are independently complete in the English version, not claimed full bilingual Terms review. Entire native bilingual Privacy read to EOF; ordinary patient/contract/GDPR confidentiality is not repurposed as general public-facts restriction or a reuse licence. No express website automation/extraction/database/noncommercial-only restriction identified in those actual linked policies; not blanket legal clearance. Minimal independently phrased facts, no authored treatment descriptions, outcome promises, cases, testimonials, ratings or media reused. Root/contact agree MonFri08–16; missing weekend days not guessed closed. Same operator/ManolIvchev/normalized896593939/coldydent domains zero across current executable runtime and all2000 intakes; unrelated HNStudio at2B is not same exact address/operator. Point null, no Map extraction or geocoder. No restricted provider, calendar/API, form fields, uploads, consent, calls, payments, patient data or production writes.'
  }, {
    id: 'sofia-andreev-dental-totleben95', website: andreev, checkedOn,
    bookingEntry: andreevBook, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [
      andreev, `${andreev}robots.txt`, andreevBook, `${andreev}kontakti/`,
      `${andreev}about-us/`, `${andreev}lichni-danni/`, andreevPrices,
      'https://bookdento.com/robots.txt', 'https://bookdento.com/terms', 'https://bookdento.com/privacy',
      `${andreevMenu}robots.txt`, andreevMenu, `${andreevMenu}book`, `${andreevMenu}locations`
    ],
    notes: 'Owner actual Book href resolved FIRST as exact andreevdentalclinic.bookdento.com root. BEFORE merchant entry, actual merchant+corporate robots read (public allowed; /admin and /api disallowed and never requested) and complete current corporate Terms8sections/Privacy read EOF, September2026 version. No express automation/extraction/database/personal-noncommercial restriction found; Terms5 explicitly retain merchant ownership and grant the platform only its service-processing licence. This is NOT an express reuse licence for us, blanket permission, or legal clearance. Individual owner-linked merchant native public HTML root FULLread contains actual named service cards and service-level FROM16EUR15min generalexam withdiagnostics/plan, FROM70EUR45min ultrasoundcalculus/plaque+polish. Amounts label actual appointments, not deposit/bookingcharge/advance or retail fee; current full own tariff corroborates whole-service16/70 values, while NHS copay0 is distinct. Fresh full owner native Services nav revealed actual Cyrillic PriceList omitted by initial reader; full actual tariff read EOF. Own fixed16exam+consult and70clean+AirFlow are differently qualified from broader merchant FROM cards, not different amounts. Selected ONLY exact merchant FROM/names/durations; no consultation or AirFlow scope transferred from other owner variants, no staff choice, maximum or computed fee guessed. Actual merchant /book native start page read with by-doctor/by-service controls; no service/staff/date/slot chosen, hidden menu/API/dialog/availability/payment/booking confirmation not claimed. Actual own Services native appointment request form independently corroborated by fresh normalHTTP: name/surname/phone/email/date/timeinterval/optionalupload/consent, explicit staffphonecallback. Configured this real owner request-form URL, not generic Contact correspondence form. No fields, uploads, consent, actions or confirmation submitted. Full actual own Privacy/cookies EOF ordinary patient-data rules; About team dentistry-only, same exact Totleben95/884533345 corroborated by merchant /locations singlepremise. No separate ownTerms anchor observed in actual nav/footer, not a licence assertion. Friday owner19/provider18 and Saturday ownerprioragreement/provider09–14 differ, all weekly hours omitted rather than arbitrary selection. No medical aesthetic/non-dental services, staff clones, authored clinical prose/testimonials/ratings/media copied; Maps/geocoder/privateGPS/providerexport/customer/account/production writes zero. Root reviewed and approved this exact minimal FROM+scope path after full own-tariff comparison; static inventory identity left to root.'
  }]
};
