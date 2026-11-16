// Root rendered the actual public owner Book/Contact route and full tariff.
// Source captures supplement the earlier reader-only research015 hold.
const checkedOn = '2026-11-16', validUntil = '2027-02-14'
const site = 'https://dogspa.bg/'
// Actual SPA routes #/home and #/contacts are documented in review notes.
// Persist the same canonical public document; the shared URL guard rejects hashes.
const source = site, contact = site
const id = 'sofia-happy-pet-spa-druzhba2-283'
const breed = 'Породна тарифа, отделна от общите тарифи по тегло.'
const weight = 'Тарифа по тегло, отделна от специалните породни тарифи.'
const grooming = (name, amount, minutes, scope, tariff) => ({
  name, category: 'pets', appointmentModel: 'appointment',
  description: `${scope} ${tariff} Обхватът и приложимата тарифа се потвърждават по телефона при записване.`,
  price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl: source, checkedOn, validUntil },
  durationMin: minutes, durationSourceUrl: source, durationCheckedOn: checkedOn,
})

export default {
  records: [{
    id, name: 'Happy Pet Spa & Grooming · Дружба 2',
    cityCode: '68134', neighborhood: 'Дружба 2',
    address: 'София, ж.к. Дружба 2, Цариградско шосе, 7–11 км, Цариградски комплекс, бл. 283, вх. Б',
    locationKind: 'premises', coordinates: null,
    category: 'pets', website: site, phone: '+359898629839',
    services: [
      grooming('Цялостен груминг · Френски булдог / Мопс', 35, 120, 'За френски булдог / мопс.', breed),
      grooming('Цялостен груминг · Померан / Шпиц', 45, 180, 'За померан / шпиц.', breed),
      grooming('Цялостен груминг · Чао Чао', 90, 240, 'За чао чао.', breed),
      grooming('Цялостен груминг · куче до 5 кг', 40, 180, 'За куче до 5 кг.', weight),
      grooming('Цялостен груминг · куче от 5 до 10 кг', 45, 180, 'За куче от 5 до 10 кг.', weight),
      grooming('Цялостен груминг · куче от 10 до 20 кг', 60, 240, 'За куче от 10 до 20 кг.', weight),
      grooming('Цялостен груминг · куче от 20 до 30 кг', 70, 240, 'За куче от 20 до 30 кг.', weight),
      grooming('Цялостен груминг · куче над 30 кг', 90, 270, 'За куче над 30 кг.', weight),
    ],
    openingHours: {
      days: [{ weekday: 1, periods: [] }, ...[2, 3, 4, 5, 6].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '20:00' }] }))],
      sourceUrl: contact, checkedOn,
    },
    booking: { kind: 'phone', phone: '+359898629839' },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: contact, excerpt: 'Обадете ни се, за да запазите час.' },
      contact,
    },
  }],
  reviews: [{
    id, checkedOn, website: site,
    bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [site, `${site}robots.txt`, `${site}sitemap.xml`],
    notes: 'Parent /root independently rendered the actual normal public owner website, followed Book to #/contacts FIRST, inspected its explicit phone-appointment invitation and actual phone controls, then returned to #/home and read the full current service-card tariff. Coverage research agent inspected root-saved006 home/tariff and Contact screenshots afterwards, not a separate live browser review. Earlier research015 reader-only app-shell limitation is supplemented by this dated rendered-source review, not silently rewritten or relabeled unpublished. All eight selected full-grooming cards lead to the same native Contact/phone route. These are three alternative breed categories and five separate generic weight bands for one dog, not eight businesses, all-breed identical tariffs, two-dog bundles, per-kilogram prices, divided packages or staff-specific rates. FrenchBulldog/Pug35EUR120minutes, Pomeranian/Spitz45EUR180, ChowChow90EUR240; generic up-to5kg40EUR180,5–10kg45EUR180,10–20kg60EUR240,20–30kg70EUR240,over30kg90EUR270. Literal EUR amounts are retained without BGN conversion, invented FROM or crossed breed/weight assumptions; the appropriate band and procedure scope are confirmed with the salon by phone. Published weight-boundary wording is not silently changed into new exclusive limits. Selected service-card2/3/4/4.5hour durations are explicitly sourced; generic ContactFAQ usually1–3hours does not replace specific4/4.5hour cards or become a universal default. No claim these are available slots or guaranteed treatment outcomes. Starter-puppy package, additional cat/hygiene/detangling/ear/nail/CO2 rows and unclear add-on standalone eligibility are not imported. No health, safety, certification, founding-date, staff or clinical claims retained. Current rendered Contact explicitly identifies Sofia/Druzhba2/TsarigradskiComplex/block283/entranceB on the7–11kilometre section of TsarigradskoShose; that kilometre range is not house-number7–11, and the generic postal1000 is not imported. One premises, no directory neighborhood inference, copied registered residence, guessed coordinates, entrance point or cloned adjoining area. Contact explicitly publishes Tuesday–Saturday09–20 and Mondayclosed; Sunday is not stated, not assumed closed. Contact accepts walk-ins but explicitly invites advance phone booking; this is not a walk-in-only business or a native GoRez calendar. Root inspected full rendered home/Contact, current robotsAllow with ten-second crawl delay and the robots-declared sitemap; no legal document route or Terms link was present in those inspected sources. This is not a licence, blanket absence-of-Terms assertion or legal clearance. Only independently phrased service/merchant facts retained, no owner photographs, expressive prose, source card images, certifications, ratings or testimonials. Contact automatically loaded Leaflet resources during root inspection; no Maps directions/geocoder link clicked, coordinates copied or point inferred. All persisted source/contact/duration/booking-evidence URLs are the actually rendered canonical public document without #/home or #/contacts fragments because the existing URL guard remains unchanged. Actual routes are documented here only, never replaced by an invented /contacts path. No source challenge,401/403/429, hidden API, bundle extraction, proxy, consent, account, form field, slot, submission, phone call, email, customer/pet data, paid service or production write. Root owns final exact image review/associations, normalized inventory binding, shared integration and release.',
  }],
}
