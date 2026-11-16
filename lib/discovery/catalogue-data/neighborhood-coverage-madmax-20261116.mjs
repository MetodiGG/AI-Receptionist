// Root-reviewed rendered owner booking controls and current legal/contact data.
// Only the consistent full-grooming EUR offer is admitted; other tariffs held.
const checkedOn = '2026-11-16', validUntil = '2027-02-14'
const site = 'https://madmax-grooming.com/'
// Existing URL safeguards reject fragments. These inspected sections belong
// to the same canonical public document; do not weaken the shared URL guard.
const book = site, contact = site

export default {
  records: [{
    id: 'sofia-madmax-grooming-suhata-reka18',
    name: 'Груминг салон Лудият Макс',
    cityCode: '68134', neighborhood: 'Сухата река',
    address: 'София, ж.к. Сухата река, бл. 18',
    locationKind: 'premises', coordinates: null,
    category: 'pets', website: site, phone: '+359878412046',
    services: [{
      name: 'Цялостен груминг · смесица до 5 кг с нормална козина',
      category: 'pets', appointmentModel: 'appointment',
      description: 'За смесица до 5 кг с нормална козина: къпане, сушене, разресване, подстригване, нокти и уши. Цена от 40 €; крайната сума се уточнява на място. При сплъстена козина се доплаща.',
      price: {
        amount: 40, currency: 'EUR', kind: 'from',
        unit: 'една процедура за смесица до 5 кг с нормална козина',
        sourceUrl: book, checkedOn, validUntil,
      },
    }],
    openingHours: {
      days: [{ weekday: 1, periods: [] }, ...[2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '19:00' }] }))],
      sourceUrl: contact, checkedOn,
    },
    booking: { kind: 'form', url: book },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: book, excerpt: 'Собствената форма предлага цялостен груминг според порода, тегло и козина; посещенията са с предварително записване и потвърждение.' },
      contact,
    },
  }],
  reviews: [{
    id: 'sofia-madmax-grooming-suhata-reka18', checkedOn, website: site,
    bookingEntry: book, bookingReview: 'owned_booking_reviewed',
    reviewedUrls: [site],
    notes: 'Parent /root independently rendered the actual owner #booking section in a normal public browser, inspected all four procedure controls, selected the full-grooming option with mixed-breed dog up to5kg and normal coat, and checked its literal starting total40EUR. Root restored that exact full-grooming context after checking an optional nail control and verified40EUR again. Only this selected full-grooming offer is admitted, with its weight/coat scope and FROM qualifier. Bathing, drying, brushing, haircut, nails and ears are included; final fee is confirmed onsite and matting incurs an extra charge. The full-grooming public card and actual procedure menu both agree on40EUR; their companion BGN labels disagree (card88 versus booking78.23), explicitly retired as inconsistent secondary-currency presentation. The admitted amount is the actual published EUR40, not a conversion of either BGN figure. Hygiene card20EUR versus procedure25EUR, puppy card35EUR versus procedure40EUR, and nail checkbox8EUR versus selected-total10EUR remain held; none is imported as a service, price or inferred add-on. Flea/blade and tick charges are not standalone appointments. FAQ usually-two-hour guidance is not a guaranteed service-specific duration, so no fixed minutes are added. Current rendered #contact and complete Impressum independently agree on SuhataReka block18, phone878412046 and operator MayaksEOOD/MariyanDimitrov. Old Strelbishte/MayorParvanToshev8 in static noscript/JSON-LD is retired metadata, not a second branch or current destination. Contact explicitly publishes Tue–Sun09:00–19:00 and Mondayclosed. The owner page automatically loaded its map iframe during inspection, but no external Maps link was clicked, iframe coordinates copied, geocoder queried or point guessed. Root read the full on-page terms/rules, Impressum and privacy text: appointment-only condition retained; no express minimal-facts reuse prohibition found, not a legal licence or blanket permission claim. No source prose, images, rating, reviews or staff claims reused. Root did not accept the mandatory terms, click the date/next control, select a slot, enter customer/pet identity or contact details, submit, call or send a message; the downstream calendar is intentionally not claimed reviewed. The service-pricing menu was fully inspected before that consent boundary. Booking remains the actual owner inquiry/confirmation flow, not a GoRez availability calendar. All stored source/contact/booking URLs use the actual canonical single-page document without fragments because the existing URL guard rejects them; #booking/#contact here document the inspected sections only, not invented separate routes. Earlier pets004 reader-only hold is supplemented by this dated rendered-source review, not silently rewritten. Root owns final normalized inventory identity, photo association, aggregate wiring and production publication.',
  }],
}
