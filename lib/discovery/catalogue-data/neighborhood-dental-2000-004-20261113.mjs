// Fresh 14 November primary-source review. One record per actual practice.
const checkedOn = '2026-11-14', validUntil = '2027-02-12'
const asova = 'https://asova.net/'
const asovaServices = `${asova}%d1%83%d1%81%d0%bb%d1%83%d0%b3%d0%b8`
const asovaContact = `${asova}%d0%ba%d0%be%d0%bd%d1%82%d0%b0%d0%ba%d1%82%d0%b8`
const bgm = 'https://bgmdent.com/'
const bgmBook = `${bgm}%d0%ba%d0%be%d0%bd%d1%82%d0%b0%d0%ba%d1%82%d0%b8/`
const bgmFilling = `${bgm}%d0%bf%d0%bb%d0%be%d0%bc%d0%b1%d0%b8-%d0%b5%d1%81%d1%82%d0%b5%d1%82%d0%b8%d1%87%d0%bd%d0%b8-%d0%be%d0%b1%d1%81%d1%82%d1%83%d1%80%d0%b0%d1%86%d0%b8%d0%b8/`
const records = [
  {
    id: 'sofia-spaska-asova-ekzarh-stefan62', name: 'Д-р Спаска Асова · дентален кабинет',
    cityCode: '68134', neighborhood: 'Надежда 2', address: 'София, ж.к. Надежда 2, ул. Екзарх Стефан 62',
    locationKind: 'premises', coordinates: null, category: 'other', website: asova, phone: '+359898209672',
    booking: { kind: 'phone', phone: '+359898209672' },
    services: [{ name: 'Стоматологичен преглед', category: 'other', appointmentModel: 'appointment',
      description: 'След предварително записване по телефона. Цената и условията за конкретното посещение се потвърждават с кабинета. Сайтът обявява безплатни прегледи и консултации в четвъртък; приложимостта се уточнява при записване.' }],
    openingHours: { sourceUrl: asova, checkedOn, days: [
      { weekday: 1, periods: [{ open: '14:00', close: '19:00' }] },
      { weekday: 2, periods: [{ open: '09:00', close: '13:00' }] },
      { weekday: 3, periods: [{ open: '14:00', close: '19:00' }] },
      { weekday: 4, periods: [{ open: '14:00', close: '19:00' }] },
      { weekday: 5, periods: [{ open: '09:00', close: '13:00' }] },
    ] },
    verification: { status: 'approved', checkedOn, validUntil,
      booking: { url: asova, excerpt: 'Собствената начална страница изрично дава телефон 0898209672 за предварително записване в личния кабинет на ул. Екзарх Стефан 62.' }, contact: asovaContact },
  },
  {
    id: 'sofia-bgm-dent-lyulin8-block802', name: 'БГМ-Дент · Люлин 8',
    cityCode: '68134', neighborhood: 'Люлин 8', address: 'София, ж.к. Люлин 8, бл. 802, вх. Д, задна част',
    locationKind: 'premises', coordinates: null, category: 'other', website: bgm, phone: '+359879000171',
    booking: { kind: 'phone', phone: '+359879000171' },
    services: [{ name: 'Лечение на кариес с композитна пломба', category: 'other', appointmentModel: 'appointment',
      description: 'Посещение след предварително записване. Подходящото възстановяване, обхватът и цената се уточняват след преглед; няма посочена фиксирана цена или продължителност за тази услуга.' }],
    verification: { status: 'approved', checkedOn, validUntil,
      booking: { url: bgmBook, excerpt: 'Действителната страница „Запишете си час онлайн или по телефона“ показва телефон 0879000171 и форма за предпочитан ден и часови диапазон.' }, contact: bgmBook },
  },
]
const reviews = [
  {
    id: records[0].id, website: asova, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [asova, asovaServices, asovaContact], pricingDecision: 'not_publicly_listed',
    priceSearch: { outcome: 'not_published', bookingUrl: asova, serviceUrls: [asovaServices],
      notes: 'Fresh ordinary native HTTP200 root actual explicit advance-phoneBook read before full selected Services and Contacts. The current served Services page lists examination without amounts and explicitly says last updated2015; no current general examination tariff/Prices link in actual root/service/contact navigation/footer. Root separately announces freeThursday examination/consultation: retained as a conditional public fact, not silently ignored, not0all-days service. No inaccessible configured fee menu was relabelled unpublished. Missing ordinary appointment fee stays absent; only service_reviewed, not completedpricecoverage.' },
    notes: 'Own root explicit personalpractice newaddressNadezhda2EkzarhStefan62/898209672, corroborated ownServices/Contact. Selected phone method is actualBook, not generalquestionform/review/newsletter; no customerinput/captcha/action/call. Only examination admitted, not every old2015 medicalprocedure list/anaesthetic/material/fee or otherphysician. Root real Mon14–19Tue9–13Wed14–19Thu14–19Fri9–13 preserved; weekends emergency-only withoutnumericwindow omitted, notclosed/24hguessed. No duration/insuredeligibility/outcome/credentials/point inferred. Actualroot/fullServices/Contact allnavigation/footer no separate Terms/Privacy route surfaced; robots200disallowswp-admin only, no broadsourcepermission/legalclearance claimed. Minimal independently phrased name/contact/appointment/service/hours facts, no authoredadvice/prose/reviews/patientnames/photos/brandassets copied. Rootcommentspam not used as merchantdata. Fullruntime+ALLintake domain/phone/addressoperator dedupe required at integration. No Maps/geocode/production/customerdata/bookings/notifications.',
  },
  {
    id: records[1].id, website: bgm, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [bgm, bgmBook, bgmFilling], pricingDecision: 'not_publicly_listed',
    priceSearch: { outcome: 'not_published', bookingUrl: bgmBook, serviceUrls: [bgmFilling, bgm],
      notes: 'ActualrootBookhref first followed to ownedContact/Book normalnativeHTTP200. Title explicitly onlineORphonebooking, primary879000171, realname/phone/email/preferredday/timewindow/message requestform. Phone chosen; fields inspected withoutvalues/input/submit/captcha/API. Fullrootserviceindex, fullselectedcompositefilling page andactualBook show no numericservicefee or Prices/tariffPDF/image link. No blockedconfiguredmenu/unresolved numericprice conflict; genuinelyunpublished only for selected filling, not allservices. WebsitePHPwarnings did not prevent reading entire publicmenu; not evidence of missingfees by themselves.' },
    notes: 'One named dentalpractice, not7staff/roomrecords or a secondstreetaddressbranch. Root/Book/service headers consistentlyLyulin8block802entranceDback; Bookbody also saysstreet3004No9. Bothsourceaddressnotations documented; no inferredpostalidentity/point and no extra branch. RootBookformwindows08–14/14–20 andweekday/weekend are requestchoices NOTstaff/businessopeninghours: nohoursscalar/duration imported. Compositefilling explicitlyoffered selectedownmenu, no unverified surfacecount/materialbrandinclusion/clinicaloutcome/insuredprice copied. Exclude retailtoothpaste, stemcellstorage andnon-dentalfiller/mesotherapy rows. Fullactualroot/Book/service navigation/footer no separateTerms/privacy route surfaced; robots200wp-adminDisallowandadmin-ajaxAllow notprivateAPIpermission, no suchrequests; no broadsourceclearanceclaimed. Minimalindependentmerchant/appointmentfacts only, not authoredprocedure/advice/reviews/photos/logos; no Maps/sourceiframe/call/formsubmission/customerdata/productionwrites or bookingconfirmation.',
  },
]
export default { records, reviews }
