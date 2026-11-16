// One private dental practice, not the general DKC or one business per dentist.
const checkedOn = '2026-11-16', validUntil = '2027-02-14'
const site = 'https://diamantdental.wixsite.com/diamantdental'
const services = `${site}/services`, contact = `${site}/contact`
const book = 'https://superdoc.bg/klinika/familna-praktika-diamant-dental-d-r-pashovi'
const pashova = 'https://superdoc.bg/lekar/d-r-dimitrichka-pashova-260'
const pashov = 'https://superdoc.bg/lekar/d-r-svetoslav-pashov'
export default {
  records: [{
    id: 'sofia-diamant-dental-pashovi-obelya316', name: 'Диамант-Дентал Д-р Пашови · Обеля 2',
    cityCode: '68134', neighborhood: 'Обеля 2',
    address: 'София, ж.к. Обеля 2, ул. Кривините, ДКЦ 30, кабинет 316',
    locationKind: 'premises', coordinates: null, category: 'other', website: site, phone: '+359888638741',
    services: [
      { name: 'Дентален преглед за възрастни', category: 'other', appointmentModel: 'appointment',
        description: 'Преглед с предварително записване при избрания стоматолог. Частната цена и евентуалното покритие по НЗОК се уточняват с практиката; няма публикувана сума.' },
      { name: 'Почистване на зъбен камък за възрастни', category: 'other', appointmentModel: 'appointment',
        description: 'С предварително уговорен час. Конкретният метод, обхватът и цената се потвърждават от стоматолога; няма публикувана сума.' },
    ],
    booking: { kind: 'form', url: book },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: book, excerpt: 'Публичният профил на практиката предлага „Запази час“ при двамата стоматолози на същия адрес и със същите професионални телефони.' },
      contact,
    },
  }],
  reviews: [{
    id: 'sofia-diamant-dental-pashovi-obelya316', checkedOn, website: site,
    bookingEntry: book, bookingReview: 'provider_booking_reviewed',
    reviewedUrls: [site, contact, services, `${site}/untitled`, book, pashova, pashov,
      'https://superdoc.bg/uslovia-za-polzvane', 'https://superdoc.bg/privacy-policy',
      'https://www.sofia.bg/bg/web/guest/w/7814054'],
    pricingDecision: 'not_publicly_listed',
    priceSearch: {
      outcome: 'not_published', bookingUrl: book, serviceUrls: [services, book, pashova, pashov],
      notes: 'Root rendered the actual practice-level Book entry and both linked dentists complete reason/calendar sections, then read the merchant-specific Services panel and full own Wix Services/Contact/About. Neither selected adult examination nor calculus-removal service has a monetary tariff in these inspected routes. There is no linked separate tariff. NHIF badges do not mean a free private service, a calendar interval is not procedure duration, and unrelated platform-wide reason options are not merchant services. No slot selected, booking/start URL followed or customer field entered. This is service_reviewed only, not a completed price review.',
    },
    manualIntakeResolution: {
      flag: 'first_party_appointment_evidence_required',
      decision: 'manually_verified_provider_merchant_identity', checkedOn,
      recordIdentity: '9cd8bc73ef17e4fa7cf771a48e04af853c71c502762074fe57ee53f8039d1c25',
      ownerContact: contact, providerPractice: book, providerProfiles: [pashova, pashov],
      matchingPhones: ['+359888638741', '+359878180263'],
      matchingPremises: 'Обеля 2, ДКЦ 30, кабинет 316',
      reviewedBy: ['/root', '/root/catalogue_workflow_audit'],
      note: 'The offline intake helper correctly flags the different provider host. Root and independent reviewer resolved that flag manually with matching exact practice/operator names, two published phones, premises and actual practice-to-dentist Book links. Own Wix has only an inquiry route; no invented own-site endorsement or Book link is asserted. The intake helper and its third-party-only warning remain unchanged.',
    },
    notes: 'One private dental practice, not DKC30 as a general medical centre and not one new record per clinician. Full own Contact places the practice at Obelya2 DKC30 rooms315/316 and names the same three dentists/phones. The live merchant practice and both inspected appointment profiles specifically select room316 and matching professional phones. Municipality current DKC30 property notice independently confirms Krivinite Street and Obelya2; no house number or map point guessed. Existing VIA Dental is a different operator/phone in rooms317/318, not a duplicate practice. Both actual provider calendars rendered in a normal public browser; primary reason selected without choosing any slot. Generic platform reasons including maternal care/administrative documents are not imported. Selected adult examination/calculus services have specific owner and merchant evidence; child-age differences, emergency treatment, other doctors, products/materials, procedures outside dentistry and all monetary prices excluded. Weekly schedule, service duration and coordinates absent, never inferred from transient availability. Full provider Terms/Privacy and robots reviewed before this pass: public routes allowed, no express minimal-facts database reuse prohibition found, not a copyright licence or legal clearance. No authored biography, photographs, ratings, patient names or reviews reused; only short independently phrased facts and approved illustrative service photos. Own root/Services/Contact/About fully reviewed; no separate tariff/terms link surfaced. No provider API, login, consent acceptance, booking/start, form submission, customer data, calls, messages, paid services, geocoder or production writes. Intake different-host flag resolved manually with documented merchant identity, never removed from the helper or evaded by replacing the real owner website.',
  }],
}
