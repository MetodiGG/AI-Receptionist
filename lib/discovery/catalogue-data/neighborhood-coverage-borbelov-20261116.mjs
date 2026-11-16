// One first-party Borovo dental practice and one verified cleaning procedure.
// Root integration, final inventory binding and visual photo approval are separate.
const checkedOn = '2026-11-16', validUntil = '2027-02-14'
const site = 'https://borbelov.com/'
const contact = `${site}kontakti/`, services = `${site}uslugi/`
const procedure = `${services}profilaktika/`
const practice = `${site}dentalna-klinika/`
const privacy = `${site}politika-za-zashtita-na-lichnite-danni/`
const id = 'sofia-borbelov-dental-borovo61a'

export default {
  records: [{
    id, name: 'Borbelov Dental Solutions',
    cityCode: '68134', neighborhood: 'Борово',
    address: 'София, ж.к. Борово, ул. Пирински проход 61А',
    locationKind: 'premises', coordinates: null,
    category: 'other', website: site, phone: '+359884204080',
    services: [{
      name: 'Професионално почистване на плака и зъбен камък',
      category: 'other', appointmentModel: 'appointment',
      description: 'Професионална орална хигиена. Цената, обхватът и часът се уточняват предварително с кабинета; няма публикувана сума за услугата. Последният възможен час за записване е 18:00.',
    }],
    openingHours: {
      days: [1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '19:00' }] })),
      sourceUrl: contact, checkedOn,
    },
    booking: { kind: 'phone', phone: '+359884204080' },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: site, excerpt: 'Запишете час за преглед или процедура' },
      contact,
    },
  }],
  reviews: [{
    id, checkedOn, website: site,
    bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [site, contact, services, procedure, practice, privacy, `${site}robots.txt`],
    pricingDecision: 'not_publicly_listed',
    notes: 'Dated source attestation by coverage research agent, not automatic verification or a crawler signal; independent root admission review and final normalized inventory binding remain separate. Followed the actual homepage appointment invitation FIRST to its native Contact destination, then read complete Services, practice and selected Prophylaxis pages. Homepage explicitly invites examination/procedure appointments by the same884204080 phone; actual native Contact form distinguishes examination and procedure appointment requests from consultation/other. It is a request requiring practice confirmation, not a live calendar or GoRez availability. One owner-listed professional plaque/calculus cleaning with clinical oral hygiene is selected; no child sealant/fluoride procedure, splint, package, retail product, free examination, staff-specific fee, invented adult-only restriction or clinical outcome is imported. Entire selected page returned ordinary publicHTTP200 after reader cache miss, with no numerical tariff or separate booking-provider/price-list link. Full native Services, actual Book/Contact, homepage and practice navigation/footer likewise publish no selected-service amount or known unread external tariff. Missing fee and duration remain absent, not zero or a converted old tariff. Owner root and Contact agree on Borovo/PirinskiProhod61A, phone and Monday–Friday09–19. Last possible appointment18 is a separate booking-start condition, not closing18 or a claim of a free18:00 slot. Saturday and Sunday are unstated, not assumed closed. Privacy controller floor2/office4 is not silently added to the patient premises. No coordinates, map center, inferred entrance or geocoder. Observed linked old privacy URL normally301 redirects to the canonical policy recorded here; full ten-section GDPR policy dated23May2018 was read including all initially truncated middle text. No express automation, minimal-facts/database extraction or commercial-use prohibition found in that policy; ordinary copyright is not a licence or legal clearance. Robots200 disallows wp-admin only; no administrative endpoint requested. Local owner/name/phone/address preflight found no exact existing catalogue or intake match. Only independently phrased merchant/service facts and short factual labels are retained, no owner photographs, expressive prose, patient information, testimonials or ratings. No401/403/429, challenge, account, hidden API, restricted provider workaround, consent acceptance, inputs, slot, submission, call, email, customer data, paid service or production write.',
    priceSearch: {
      outcome: 'not_published', bookingUrl: site,
      serviceUrls: [services, procedure, contact, practice],
      notes: 'Actual own phone-appointment invitation and native Contact request destination were inspected first. Complete selected professional plaque/calculus-cleaning page, full service index and practice page were read; none publishes a numerical fee for this procedure or links a known unread tariff/provider menu. No separate online booking calendar observed. This is service_reviewed only, not a completed price review: price and duration stay absent and are confirmed by the practice before the visit. Reader cache miss for the selected page was resolved by a normal HTTP200 public GET, not misrepresented as unpublished because inaccessible.',
    },
  }],
}
