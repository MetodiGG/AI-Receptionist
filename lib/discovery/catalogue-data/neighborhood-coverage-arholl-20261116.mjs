// One named Obelya1 premises and one instructor-reserved Reformer visit.
// The current published single-person tariff is not a package or duet split.
const checkedOn = '2026-11-16', validUntil = '2027-02-14'
const site = 'https://arholl-arena.bg/'
const book = `${site}service/reformer-pilates`, prices = `${site}prices`, contact = `${site}contacts`
const schedule = 'https://shop.arholl-arena.bg/Schedulev2/EmbedGroupScheduleV2?Namespace=ARHOLL&filterActivity=false&gymId=75&language=bg&login=false&loginRequired=false&showFilters=false&showInstructor=false&showlogo=false'
const purchase = 'https://shop.arholl-arena.bg/membership/PurchaseV2?&Namespace=ARHOLL&gymId=75'

export default {
  records: [{
    id: 'sofia-arholl-arena-obelya1-124-reformer', name: 'Arholl Arena · Обеля 1',
    cityCode: '68134', neighborhood: 'Обеля 1',
    address: 'София, ж.к. Обеля 1, бл. 124, комплекс Архолл Парк',
    locationKind: 'premises', coordinates: null,
    category: 'fitness', website: site, phone: '+359889758011',
    services: [{
      name: 'Reformer Pilates · еднократно посещение с инструктор',
      category: 'fitness', appointmentModel: 'individual_training',
      description: 'Еднократно посещение за един човек с индивидуална работа с инструктор. Денят, часът и инструкторът се уточняват предварително по телефона. Работното време е на клуба, не график за свободни часове.',
      price: { amount: 20, currency: 'EUR', kind: 'fixed', unit: 'еднократно посещение за един човек', sourceUrl: prices, checkedOn, validUntil },
    }],
    openingHours: {
      days: [...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '07:00', close: '22:00' }] })),
        ...[6, 7].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '21:00' }] }))],
      sourceUrl: contact, checkedOn,
    },
    booking: { kind: 'phone', phone: '+359889758011' },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: book, excerpt: 'В раздела Reformer Pilates собственикът изрично посочва 0889 758 011 за график и запазване на час при инструктор.' },
      contact,
    },
  }],
  reviews: [{
    id: 'sofia-arholl-arena-obelya1-124-reformer', checkedOn, website: site,
    bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [site, book, prices, contact, schedule, purchase,
      `${site}page/obshchi-usloviya`, `${site}page/politika-za-poveritelnost`,
      `${site}page/usloviya-za-vzstanovyavane-na-sredstva`, `${site}page/obshchi-usloviya-biskvitki`],
    notes: 'Dated human source attestation by root, not automated verification or a crawler signal. Root independently read the actual named Reformer service PHONE appointment section FIRST, then complete current Terms/Privacy/Refund, browser-rendered Prices and Contact. The Reformer page explicitly directs schedule and instructor reservations to889758011, not merely a generic Contact number. Current literal one-person single Reformer visit is20EUR with individual instructor work; the distinct two-person offer is30EUR TOTAL, never15EUR per person or the selected20EUR fee. Eight-visit packages are not divided into fabricated visit prices. No exclusive private1:1 promise, named-instructor-specific rate, fixed duration or health outcome inferred. Root rendered the actual shared embedded group schedule: its visible16–29November2026 window showed Zumba, HighHeels, yoga and dance with no Reformer entry IN THAT WINDOW ONLY; this is not a blanket assertion about other dates. Root followed the EXACT single-Reformer price card Buy href and rendered the public PurchaseV2 membership selector: it lists subscriptions including Reformer8visits and8visitsfor2, but no single-Reformer option. Thus this specifically priced single visit uses the separate explicit owned instructor PHONE appointment route; an inaccessible or conflicting single-visit tariff is not relabeled unpublished or evaded. The child research007 reader-only widget/purchase limitation was resolved by this subsequent human browser review, not silently treated as a rendered review. All inputs and auto-today value remained untouched; no selector choice, slot, next/submit, terms acceptance, payment, login, account or customer data used. Full linked cookie policy was read to EOF via ordinary public GET after reader cache miss, parsed with stdlib HTMLParser without dependency installation. One independently named real Obelya1 block124 ArhollPark premises, corroborated by current root, selected service and Contact; not one record per staff member, activity or surrounding neighborhood. Current Contact gives club MonFri07–22/SatSun09–21, not instructor availability or free slots. Privacy/refund alternative policy contact879044545 and historical arholl.com phone877121456/hours are not substituted for the repeatedly matching actual booking/contact889758011. Root offline municipal CSV check found TWO exact block124 candidates, entrancesA/B, so no entrance or point was guessed and coordinates remain null. Contact map iframe src was inspected as HTML only: it contains a text-address query, not a numeric destination. No external Google Maps request, geocoder, viewport or coordinate copying. General gym/cardio admission, duets, subscriptions, salt-room/vibration packages, medical/rehabilitation offers, loyalty/free-parking/first-visit promotions and health/credential claims are excluded. Source host/name/phone/aliases and premises preflight against current catalogue/all intake found no duplicate. Public root robots allows the inspected pages; shop robots returned a404 document, not permission or a ban. Full current source policies contain club conduct, data, refund and cookie rules; no express minimal-facts automation/database-reuse prohibition observed, not a licence or legal-clearance assertion. Only independently phrased merchant/service facts and separately approved illustrative artwork retained; no owner photos, expressive prose, ratings or customer reviews copied. No hidden API, bundle extraction, protection bypass, calls, emails, forms, customer account, real booking, paid provider or production write. Root owns final inventory binding, exact existing-photo visual approval, aggregate integration and release checks.',
  }],
}
