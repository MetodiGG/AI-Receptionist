// Two independently reviewed Sofia operators, not floor/room/brand clones.
// Filename follows intake series; actual source observations are14Nov.
const checkedOn = '2026-11-14', validUntil = '2027-02-12'
const offensive = 'https://offensive.bg/', offensiveBook = offensive + 'booking-form/', offensiveFees = offensive + 'pricing/', offensiveService = offensive + 'zvukozapisno-studio/'
const anamorph = 'https://anamorphstudio.com/bg/', anamorphBook = anamorph + 'contact-us/', anamorphFees = anamorph + 'rates/'
const records = [
  {
    id: 'sofia-slightly-offensive-strandzha52a', name: 'Slightly Offensive Studio', cityCode: '68134', neighborhood: 'Център',
    address: 'София, ул. Странджа 52А', locationKind: 'premises', coordinates: null, category: 'other', website: offensive, phone: '+359879607085',
    booking: { kind: 'form', url: offensiveBook },
    services: [{ name: 'Студиен звукозапис · вокали или говор', category: 'other', appointmentModel: 'appointment',
      price: { amount: 60, currency: 'EUR', kind: 'from', unit: 'един час звукозапис', sourceUrl: offensiveService, checkedOn, validUntil },
      description: 'Начална ставка за час с аудио инженер, запис, обработка и миксиране според договорения обхват. Проектът, необходимото време и крайната оферта се уточняват след заявка; не е автоматично потвърден свободен час. Не включва видео или наем за събитие.' }],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: offensiveBook, excerpt: 'Запази час / Book a session: собствен формуляр за име, телефон, имейл, услуга, желана дата и проект. Екипът уточнява проекта и свободните дати.' }, contact: offensiveBook },
  },
  {
    id: 'sofia-anamorph-istoria-slavyanobalgarska7', name: 'Anamorph Studio', cityCode: '68134', neighborhood: null,
    address: 'София, ул. История Славянобългарска 7', locationKind: 'premises', coordinates: null, category: 'other', website: anamorph, phone: '+359878149019',
    booking: { kind: 'form', url: anamorphBook },
    services: [{ name: 'Наем на снимачно студио · етаж 1', category: 'other', appointmentModel: 'appointment',
      price: { amount: 80, currency: 'EUR', kind: 'fixed', unit: 'час; минимум 3 часа; без ДДС', sourceUrl: anamorphFees, checkedOn, validUntil },
      description: '80 €/час без ДДС; минимум 3 часа, от влизане до освобождаване. Отделно: почистване 80 €, ток, техника, подготовка и демонтаж по оферта. Реквизитът е включен. Периодът, доплащанията и плащането се потвърждават след заявка; няма гарантиран свободен час.' }],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: anamorphBook, excerpt: 'Собствената форма изрично приема резервации на студио: име, имейл, телефон, тип запитване и съобщение с дати и нужди; екипът връща оферта.' }, contact: anamorphBook },
  },
]
const reviews = [
  {
    id: records[0].id, website: offensive, checkedOn, bookingEntry: offensiveBook, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [offensive, offensive + 'robots.txt', offensiveBook, offensiveFees, offensiveService, offensive + 'politika-za-poveritelnost/'],
    notes: 'ActualrootBook followed FIRST; complete native own requestform read through ordinary200GET after technicalreaderlimitedformrepresentation: realname/phone/email/service/date/message/consent/submit controls, no input/choice/submission. Selected actual service menu and entirePrices read; literalFROM60EUR/hour recording/edit/mix plus engineer, no invented fixed duration, video80EUR/hour or events700EUR/day mixed. Rehearsalminimum4h not attached to recording. Source contains unfilled testimonial templates: ignored, no ratings/reviews/claims copied. Exact actualStrandzha52A/SofiaCenter/879607085 repeated nativefooter. Fullpublicrobots read before source. Actualbooking/service-consent Privacy link normal404, NOT bypassed or treated as a source-use ban/permission; no separate general-useTerms link surfaced in reviewednav/footer. Only minimal independently phrased factual listing, no source media/expressive text. No weeklyhours in reviewed root/Book/pricing/selectedservice, omitted. Fullruntime+ALL2000intakes domain/phonepreflight0. Not actual verified availability/confirmation, not clientdata/calls/API/bundle/map/geocoder/calendar actions.',
  },
  {
    id: records[1].id, website: anamorph, checkedOn, bookingEntry: anamorphBook, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [anamorph, 'https://anamorphstudio.com/robots.txt', anamorph + 'booking/', anamorphBook, anamorphFees, anamorph + 'cookie-policy/'],
    notes: 'ActualrootBook inspected FIRST: current public /booking native200HTML stops at booking-loading, not claimed rendered calendar or source availability. Independent own Contact explicitly accepts STUDIORESERVATION dates/needs for quote; full actual own requestform native200HTML read (name/email/phone/inquiry/message/submit), chosen as supported bookingpath, not generic contact inferred into booking. No fields/consent/date/cart/submit/payment/API/bundle actions. Entire current2026 Rates read: floor1base80EUR/hourEXVAT, min3h, timefromentrythroughvacation; cleaning80EUR plus electricity0.60EUR with sourceUNSPECIFIEDunit and technicalassistant120EUR no unit, preparation/dismantling45EUR/hour/floor. Publicdescription preserves separate extras/confirmedquote, does not invent energyunit, all-in total, deposit, setupduration or includedengineer. Floor2winterheating and2floor120EUR NOT selected; oneoperator/premise nottwofloorbusinesses. ExactownerIstoriaSlavyanobalgarska7/Sofia and878149019 repeatedContact/footer. 24/7accessONLYWITHRESERVATION not imported as ordinary servicehours/liveavailability. FullactualOctober2026cookiepolicy read through ordinary200 after technicalreaderCachemiss; no separate source-useTerms linked in checkednav/footer, no legalpermissionclaim. Robots exactpathchecked before publicrequests, no prohibitedcart/add-to-cart/admin/logs/privateAPI. No sourcephotos/prose/reviews/ratings/maps/GPS imported. Runtime+all2000domain/bothphones0.',
  },
]
export default { records, reviews }
