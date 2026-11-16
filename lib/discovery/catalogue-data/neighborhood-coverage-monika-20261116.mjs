// Isolated source-reviewed candidate, not a claim of root admission/publication.
// Root owns independent review, shared integration and final inventory binding.
const checkedOn = '2026-11-16', validUntil = '2027-02-14'
const site = 'https://semeino-konsultirane.bg/'
const contact = `${site}kontakti/`, individual = `${site}individualna-terapiya/`
const couples = `${site}terapiya-za-dvoiki/`, faq = `${site}vaprosi/`
const about = `${site}za-men/`, family = `${site}semejna-konsultacziya/`
const psychology = `${site}psiholog/`, privacy = `${site}privacy-policy/`
const id = 'sofia-monika-hristova-lagera53'

export default {
  records: [{
    id, name: 'Моника Христова · семеен психотерапевт',
    cityCode: '68134', neighborhood: 'Лагера',
    address: 'София, ж.к. Лагера, бл. 53, вх. Г',
    locationKind: 'premises', coordinates: null,
    category: 'other', website: site, phone: '+359878908731',
    services: [{
      name: 'Индивидуална терапия', category: 'other', appointmentModel: 'appointment',
      description: 'Индивидуална психотерапевтична среща в кабинет с предварително записване по телефона. Цената и продължителността се уточняват при записване; няма публикувана сума за услугата.',
    }, {
      name: 'Терапия за двойки', category: 'other', appointmentModel: 'appointment',
      description: 'Психотерапевтична среща за двойка в кабинет с предварително записване по телефона. Цената и продължителността се уточняват при записване; няма публикувана сума за услугата.',
    }],
    booking: { kind: 'phone', phone: '+359878908731' },
    verification: {
      status: 'approved', checkedOn, validUntil,
      booking: { url: contact, excerpt: 'За записване на час.' },
      contact,
    },
  }],
  reviews: [{
    id, checkedOn, website: site,
    bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [site, contact, individual, couples, faq, about, family, psychology, privacy,
      `${site}robots.txt`, `${site}sitemap_index.xml`, `${site}page-sitemap.xml`],
    pricingDecision: 'not_publicly_listed',
    notes: 'Dated source attestation from research010 by coverage research agent, not a crawler signal, root admission or production verification. Root independent source/photo review and normalized inventory binding remain separate. Followed the actual native Contact/phone appointment route FIRST, then complete individual therapy, couples therapy, About, FAQ and both additional footer service pages. Contact explicitly assigns878908731 to appointment booking; FAQ independently states sessions occur at Lagera53entranceG after advance arrangement. Generic inquiry form is not promoted to a live booking calendar and was not submitted. These are two literal own service titles at one private family-psychotherapy practice, not general clinic/physician procedures, diagnoses, tests, child therapy, group work, staff clones or claimed outcomes. Owner About describes systemic family psychotherapy and family-counselling training, supporting the factual professional label. Existing psychology categoryother is retained, correcting the research-only consulting proposal without changing taxonomy. Owner Contact, FAQ, footer and privacy agree on Lagera53entranceG; no street number, coordinates, map center, entry point, online-branch copy or citywide coverage inferred. No numerical fee in complete inspected selected-service/booking pages, FAQ or additional native psychology page despite prices in that page title. Robots-declared index and its one page sitemap disclose these native service/contact/about/FAQ/privacy documents, not another tariff or external booking provider. No known unread or blocked fee/menu relabeled unpublished. Original research010 proposed60minutes for both services subject to root confirmation; integration deliberately omits both durations: FAQ says one session60minutes within an answer about family counselling, then separately confirms individual sessions without a distinct service-specific duration. That scope is not expanded by assumption to both literal selected services. No weekly opening timetable published in inspected pages, so no weekday/weekend hours invented. FAQ usual weekly/fortnightly frequency is not opening hours, a package, slot or availability. Complete fourteen-section actual linked privacy policy dated20August2026 readHTTP200 after ordinary reader failure; it covers inquiry/appointment data, professional confidentiality, technical cookies and GDPR rights. No express minimal-facts automation/database/commercial reuse ban observed; no separate Terms link in inspected native navigation/page sitemap, not a licence or legal-clearance claim. Robots200 wildcard Disallow empty, no mass crawl. Reader cache misses resolved only by normal public same-host GETs/Cyrillic-to-canonical redirects, not401/403/429/challenge workaround. Source/name/phone preflight found no existing identity match. No source photographs, creative prose, quotes, biography, patient/family information, ratings or testimonials copied. No consent, account, input, slot, submission, call, email, private data, paid provider, geocoder/Maps request or production write.',
    priceSearch: {
      outcome: 'not_published', bookingUrl: contact,
      serviceUrls: [individual, couples, faq, family, psychology],
      notes: 'Actual native phone-appointment Contact route was inspected first; complete individual/couples service pages, FAQ and additional native family/psychology descriptions publish no numerical tariff. The psychology page title mentions prices but its full content has no amount. Public page sitemap was inspected only to identify actual policies/tariffs; no separate price page or unread external menu was found. This is service_reviewed only, never a completed numerical price review or a zero/free fee. Both prices remain absent; both durations also stay absent because the family-counselling FAQ60minute statement is not asserted as separately covering both selected service titles.',
    },
  }],
}
