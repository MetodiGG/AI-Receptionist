// One independently reviewed owner appointment form and physical premises.
// Conflicting Saturday hours, numeric fees and durations are not inferred.
const checkedOn = '2026-11-16', validUntil = '2027-02-14'
const site = 'https://www.mim96.eu/'
const book = `${site}zaqvka/`, services = `${site}uslugi/`, contact = `${site}kontakti/`

export default {
  records: [{
    id: 'sofia-mim-auto96-knyazhevo-lyublyana69',
    name: 'М и М АУТО 96',
    cityCode: '68134', neighborhood: 'Княжево',
    address: 'София, кв. Княжево, ул. Любляна 69',
    locationKind: 'premises', coordinates: null,
    category: 'auto_repair', website: site, phone: '+359895969696',
    services: [
      { name: 'Механична диагностика на автомобил', category: 'auto_repair', appointmentModel: 'appointment',
        description: 'Заявка за проверка на автомобила с описание на проблема и желани дата и час. Сервизът потвърждава посещението; обхватът и цената се уточняват след оглед на място.' },
      { name: 'Ремонт и преглед на ходова част', category: 'auto_repair', appointmentModel: 'appointment',
        description: 'Преглед и ремонт на ходовата част с предварителна заявка за желани дата и час. Сервизът потвърждава посещението, необходимите операции и цената след оглед на място.' },
      { name: 'Ремонт на спирачна система', category: 'auto_repair', appointmentModel: 'appointment',
        description: 'Ремонт на спирачната система след предварителна заявка с данни за автомобила и желани дата и час. Сервизът потвърждава посещението; операциите и цената се уточняват на място.' },
      { name: 'Смяна на масло и филтри', category: 'auto_repair', appointmentModel: 'appointment',
        description: 'Обслужване с предварителна заявка за желани дата и час. Сервизът потвърждава посещението; подходящите масло и филтри, обхватът и цената се уточняват на място според автомобила.' },
    ],
    booking: { kind: 'form', url: book },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: book, excerpt: 'Собствената форма за ремонт приема автомобил, описание на проблема и желани дата и час; посещението изисква потвърждение от сервиза.' },
      contact,
    },
  }],
  reviews: [{
    id: 'sofia-mim-auto96-knyazhevo-lyublyana69', checkedOn, website: site,
    bookingEntry: book, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [site, book, services, contact, `${site}za-nas/`],
    pricingDecision: 'not_publicly_listed',
    priceSearch: {
      outcome: 'not_published', bookingUrl: book,
      serviceUrls: [services, site],
      notes: 'Actual own repair-request entry reviewed first, then complete Services, root, Contact and About including visible navigation/footer. All four selected mechanical diagnosis, chassis inspection/repair, brake repair and oil/filter operations are explicitly listed, but no numeric public fee, separate tariff or unread selected price menu is published. General competitive-price marketing is not an amount. Keep all fees and durations absent; no blocked price source, retail amount, roadside fee, free-service inference or currency conversion used.',
    },
    notes: 'Root independently reviewed the complete owner repair request, full service inventory and Contact after the child source review recorded in research-auto-004-20261116.json. The actual request accepts desired date/time, vehicle specifications, contact details and fault description; it is an appointment request requiring confirmation, not live availability or an automatic reservation. No inputs, dates, consents, submission, call or message exercised. Only four source-listed services are retained. Source wording Diagnostika is normalized to mechanical vehicle diagnosis, not computer diagnostics; grammar is normalized for brake repair and oil/filter change. DPF/EGR removal or defeat, unqualified tuning, retail parts and roadside assistance are excluded. Human-written root, Services and Contact consistently state Knyazhevo, Lyublyana69 and primary895969696/alternate876769696; the published primary contact is used. Owner services contains an unopened Maps URL with a Karpuzitsa place label; root approved the human-written Knyazhevo description, not an inferred boundary or provider point. No Maps, GPS, geocoder or approximate coordinates imported, and no second venue from old directory references to Okolovrasten941. Runtime and intake preflight checked brand, mim96.eu, old mimautorepair.com alias, both phones and street address without a duplicate. Root lists Saturday09–17 but dedicated Contact says Saturdayclosed; the entire openingHours field is deliberately absent rather than constructing a partial or roadside24/7 workshop schedule. Public root Book and all five known owner documents were read to completion via ordinary HTTPS200 after sandbox-only DNS failure; no authentication, challenge, private endpoint, hidden API or CAPTCHA bypass. Robots has empty wildcard Disallow; no sitemap crawl. No separate terms/privacy anchor or explicit minimal-facts reuse restriction surfaced in the inspected navigation/footer, not a licence or legal-clearance assertion. Only independently paraphrased factual service/contact data and separately approved illustrative artwork are used; no owner photos, prose, reviews, ratings, credentials or outcome claims copied. No customer data, partner account, booking, paid provider, production setting or database write. Root owns final normalized inventory identity, exact photo associations, aggregate wiring and publication.',
  }],
}
