// Coverage-first intake. Primary sources manually reviewed; root owns final
// inventory binding, photo associations, aggregate import and publication.
const checkedOn = '2026-11-16', validUntil = '2027-02-14'
const agron = 'https://agronservice.bg/'
const agronBook = `${agron}zayavka-za-remont/`
const agronServices = `${agron}uslugi/`
const vasval = 'https://vasvalauto.com/'
const vasvalServices = `${vasval}index.php?lang=1&page=2`

export default {
  records: [{
    id: 'sofia-agron-service-benkovski-karavelov28',
    name: 'Агрон Сервиз · Бенковски',
    cityCode: '68134', neighborhood: 'Бенковски',
    address: 'София, кв. Бенковски, ул. Любен Каравелов 28, промишлена зона',
    locationKind: 'premises', coordinates: null,
    category: 'auto_repair', website: agron, phone: '+35929367344',
    services: [
      { name: 'Смяна на двигателно масло и филтри', category: 'auto_repair', appointmentModel: 'appointment',
        description: 'Периодично обслужване с предварително потвърден ден и час. Маслото, филтрите и цената се уточняват според автомобила.' },
      { name: 'Ремонт на спирачна система', category: 'auto_repair', appointmentModel: 'appointment',
        description: 'Диагностика и ремонт на спирачки след предварителна уговорка. Частите, операциите и цената се уточняват след оглед.' },
      { name: 'Ремонт на ходова част', category: 'auto_repair', appointmentModel: 'appointment',
        description: 'Ремонт на окачване и кормилни елементи след оглед и индивидуална оферта. Сервизът потвърждава деня и часа.' },
      { name: 'Реглаж на преден и заден мост', category: 'auto_repair', appointmentModel: 'appointment',
        description: 'Регулиране на геометрията с предварително потвърден ден и час. Обхватът и цената се уточняват индивидуално.' },
    ],
    openingHours: {
      days: [...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '08:30', close: '18:00' }] })), { weekday: 6, periods: [] }, { weekday: 7, periods: [] }],
      sourceUrl: `${agron}kontakti/`, checkedOn,
    },
    booking: { kind: 'form', url: agronBook },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: agronBook, excerpt: 'Собствената заявка приема вид ремонт, автомобил и желан ден; сервизът се обажда за окончателна уговорка на деня и часа.' },
      contact: `${agron}kontakti/`,
    },
  }, {
    id: 'sofia-vas-val-auto-malashevtsi-lavandula53',
    name: 'Вас Вал Авто · Малашевци',
    cityCode: '68134', neighborhood: 'Малашевци',
    address: 'София, кв. Малашевци, ул. Лавандула 53',
    locationKind: 'premises', coordinates: null,
    category: 'auto_repair', website: vasval, phone: '+359887471956',
    services: [{
      name: 'Компютърна диагностика на автомобил', category: 'auto_repair', appointmentModel: 'appointment',
      description: 'Компютърна диагностика с предварително уговорен час по телефона.',
    }],
    booking: { kind: 'phone', phone: '+359887471956' },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: vasvalServices, excerpt: 'Разделът за компютърна диагностика изрично изисква обаждане за час; публикуваният телефон е 0887 471 956.' },
      contact: `${vasval}map.php?lang=1&page=1`,
    },
  }],
  reviews: [{
    id: 'sofia-agron-service-benkovski-karavelov28', checkedOn, website: agron,
    bookingEntry: agronBook, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [agron, agronBook, agronServices, `${agron}kontakti/`, `${agron}chesto-zadavani-vaprosi/`, `${agron}poveritelnost/`],
    pricingDecision: 'not_publicly_listed',
    priceSearch: {
      outcome: 'not_published', bookingUrl: agronBook,
      serviceUrls: [agronServices, `${agron}chesto-zadavani-vaprosi/`],
      notes: 'Actual own repair-request entry reviewed first, then full Services, Contact, FAQ and Privacy/footer. The selected maintenance, brake, chassis and alignment operations have no numeric public tariff. FAQ explicitly provides an individual EUR quote after inspection or diagnosis and customer approval before repair. No blocked Prices page was treated as an absent tariff.',
    },
    notes: 'Coverage-first physical Benkovski premises, not a citywide landing-page clone. Own root Book followed first to the complete public five-step request document: repair kind, vehicle, applicant, desired working day/time-band and review; the server-side HTML exposes the fields and callback-confirmation requirement. No inputs, steps, consents, mailto/send actions, submissions or availability were exercised or claimed verified. Services explicitly bind maintenance/oil/filter, brakes, chassis and two-axle alignment to the same request. Full Contact confirms Benkovski industrial zone, Lyuben Karavelov28, primary29367344/alternate886434910, MonFri08:30–18 and weekends closed. Full FAQ clarifies private customers without an insurance instruction are accepted with an individual EUR quote; insurance compensation, retail parts and included carwash-before-handover are not standalone priced appointments. Full Privacy identifies AgronServiceEOOD at the same premises and describes requests/callbacks; no separate terms link or source/database-reuse prohibition surfaced, not a blanket licence claim. Robots Allow:/; status-query, stats and API paths not requested. Web-reader cache misses were followed only by ordinary public HTTPS200 GETs, without authentication/challenge bypass. Current catalogue and intake domain/phones/name/address checked for duplicates; no source photos, prose, reviews, ratings or credential claims reused. No Maps, geocoder, GPS, calls, emails, customer data, accounts, booking writes, paid providers or production changes. Coordinates and repair duration remain absent.',
  }, {
    id: 'sofia-vas-val-auto-malashevtsi-lavandula53', checkedOn, website: vasval,
    bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [vasval, vasvalServices, `${vasval}map.php?lang=1&page=1`, `${vasval}faq.php?lang=1&page=5`],
    pricingDecision: 'not_publicly_listed',
    priceSearch: {
      outcome: 'not_published', bookingUrl: vasvalServices,
      serviceUrls: [vasvalServices, `${vasval}faq.php?lang=1&page=5`, vasval],
      notes: 'The actual appointment entry is embedded in the owner Services page: its named computer-diagnostics section expressly asks customers to call for a time. Full current Services, root, Contact and FAQ were read. No numeric diagnostic tariff, price menu or blocked tariff found. Retail oils, batteries and accessories are not diagnostic-service prices; the fee remains absent.',
    },
    notes: 'One real Sofia Malashevtsi premises, Lavandula53, independently stated on owner root, Contact and FAQ. Current runtime and all existing intake domain/887471956/brand/address preflight produced zero duplicates. Root has no standalone Book link; Services is the actual selected phone-appointment entry: the computer-diagnostics section explicitly says call for a time, not merely a generic contact. Only this named appointment-qualified service is retained; the broad repair, paint, motorcycle and retail menus are not silently cloned into bookable services. Full selected Services to EOF, root, Contact and FAQ reviewed; no numeric diagnostic fee and no separate Prices/Terms/Privacy link surfaced. This is service_reviewed without a public price, not a complete tariff review or legal permission assertion. Robots public HTTPS200 has an empty wildcard block and specific named email-harvester prohibitions; no disallowed path, image, email collection, sitemap crawl, hidden API, account, form, call or message was used. The owner copyright and authored prose remain untouched; minimal merchant/service/appointment facts only. Contact is the owner map-information page; no map image/provider link or geocoder was opened. Owner GPS typography is malformed, so no decimal point was inferred and coordinates remain null. No own weekly garage hours or diagnostic duration published in inspected pages; both omitted. The related RoyalEnfield representative is the same operator, not a second business, and its retail/test-drive hours are not imported. No photos, reviews, ratings, credentials or warranties copied; no paid services, customer data, bookings or production writes.',
  }],
}
