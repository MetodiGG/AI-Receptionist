// One independently named teaching operator at two explicitly sourced halls.
// Individual lessons are agreed by phone; group fees do not price them.
const checkedOn = '2026-11-16', validUntil = '2027-02-14'
const site = 'https://yastra.dance/'
const schedule = `${site}index.php/bg/2021-04-19-11-01-29`
const contact = `${site}index.php/bg/2021-04-19-11-06-12`
const performances = `${site}index.php/bg/2021-04-19-11-02-51`
const about = `${site}index.php/bg/2021-04-19-10-59-30`
const today = `${site}index.php/bg/2021-04-19-11-00-44`
const calendar = `${site}index.php/bg/2021-04-19-11-02-18`
const phone = '+359895672657'
const halls = [
  {
    id: 'sofia-yastra-lyulin9-masalitinov901-private-folk',
    name: 'Ястра · Люлин 9', neighborhood: 'Люлин 9',
    address: "София, ж.к. Люлин 9, ул. Николай Масалитинов, до бл. 901, зала My Soul's Place",
    description: "Индивидуален урок в зала My Soul's Place в Люлин 9. Денят, часът и цената се уточняват предварително по телефона с ръководителя на Ястра.",
  },
  {
    id: 'sofia-yastra-lyulin10-mayski26-private-folk',
    name: 'Ястра · Люлин 10', neighborhood: 'Люлин 10',
    address: 'София, ж.к. Люлин 10, ул. Майски ден 26, ет. 2, зала Tancuvai.com',
    description: 'Индивидуален урок в зала Tancuvai.com в Люлин 10. Денят, часът и цената се уточняват предварително по телефона с ръководителя на Ястра.',
  },
]

export default {
  records: halls.map(hall => ({
    id: hall.id, name: hall.name, cityCode: '68134', neighborhood: hall.neighborhood,
    address: hall.address, locationKind: 'premises', coordinates: null,
    category: 'fitness', website: site, phone,
    services: [{ name: 'Индивидуален урок по български народни танци', category: 'fitness',
      appointmentModel: 'individual_training', description: hall.description }],
    booking: { kind: 'phone', phone },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: schedule, excerpt: 'Графикът на Ястра изрично предлага индивидуални уроци по договаряне в двете посочени зали и телефон 089 567 2657 за уговорка.' },
      contact,
    },
  })),
  reviews: halls.map(hall => ({
    id: hall.id, checkedOn, website: site, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [site, `${site}index.php/bg/`, `${site}robots.txt`, schedule, contact, performances, about, today, calendar],
    pricingDecision: 'not_publicly_listed',
    priceSearch: {
      outcome: 'not_published', bookingUrl: schedule, serviceUrls: [schedule, site],
      notes: 'Actual owned individual-lesson schedule and named halls reviewed with the same published phone, then the complete branch-specific tariff and Services page. Individual lessons explicitly require agreement and have no public numeric fee or duration. The8BGN/hour MySoulsPlace and9BGN/hour Tancuvai regular group fees,7BGN stage class, conditional second-hour6BGN and58BGN eight-visit card do not price the selected individual lesson. No separate unread private-lesson tariff, protection or conflicting selected price is relabeled unpublished.',
    },
    notes: [
      'Dated human source attestation from research-sport-education-010-20261116.json, not automatic verification or a crawler signal. Child read current ordinary verified HTTPS200 root, full actual Schedule/Prices, Services and Contact. Root independently read the owner root and rendered the actual schedule slider: its individual-lesson slide visibly binds both halls and895672657; complete DOM price slide explicitly has negotiated individual fees. A price screenshot caught a transition and is not claimed as a final visual tariff review. No date, customer or payment action was taken.',
      'The actual individual-lesson schedule names MySoulsPlace, Lyulin9, NikolayMasalitinov beside block901, and Tancuvai.com, Lyulin10, MayskiDen26floor2; the current root repeats both halls. Leader ElkaSlavova and Contact895672657 match the actual appointment instruction, not a generic phone-only inference. Both selected inventories contain only an individually agreed Bulgarian folk-dance lesson. No fixed duration, exclusive private1:1 promise, group fee, divided card, stage class, performance or free trial imported. Group BGN amounts are not fabricated published EUR private fees. Repeated responsive text and an older medium-group location mention are not selected. Suggested lesson starts are not openingHours or free slots.',
      'Actual Today16November2026 and Calendar16–22November2026 event views have no events in those visible windows; this neither proves closure nor promises availability. The owner beside-block901 qualifier is preserved without inventing a house or entrance. Coordinates remain null. Root HTML contains a Maps viewport link, not a verified destination; child made no Maps request. The main browser automatically loaded owner-embedded Maps iframes during its visible review, so zero map-resource loading is NOT claimed for that browser. Main did not click Maps, geocode or derive a point.',
      'Two independently evidenced halls of one operator, not teacher, level, service or nearby-quarter records. Current catalogue and all research-ledger host/name/phone/premises preflight found no Yastra duplicate. Existing Tancuvai wedding teaching shares the Lyulin10 hall but has different owner website and phone895481402; no contact, fee or point inherited. Public Joomla robots permits the inspected front-end documents, not administrative/system paths. No separate Terms/Privacy/reuse-policy anchor appears in the fully read root/schedule/contact/Services navigation/footer; not a licence or legal-clearance assertion. Only compact independently phrased facts retained, not source articles, biographies, photos, ratings or reviews. Ordinary GET followed reader cache misses and sandbox DNS failure, retaining normal curl TLS verification after a local Python trust-store failure. No source restriction bypass, hidden bundle/API, consent, form input, account, submission, call, email, booking, geocoder, paid service or production write. Root owns exact inventory binding, photo approval and aggregate publication.',
    ].join(' '),
  })),
}
