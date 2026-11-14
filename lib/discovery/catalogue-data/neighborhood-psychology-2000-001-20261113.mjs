// Independently reviewed private practices; no staff/department clones.
const checkedOn = '2026-11-13', validUntil = '2027-02-11'
const records = [], reviews = []
function add(facts, { bookingUrl, contactUrl = bookingUrl, excerpt, serviceUrls, reviewedUrls, notes, priceNotes }) {
  const row = { cityCode: '68134', neighborhood: null, locationKind: 'premises', coordinates: null, category: 'other', ...facts,
    booking: { kind: 'phone', phone: facts.phone },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: bookingUrl, excerpt }, contact: contactUrl } }
  records.push(row)
  reviews.push({ id: row.id, checkedOn, website: row.website, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls, notes,
    pricingDecision: 'not_publicly_listed', priceSearch: { outcome: 'not_published', bookingUrl, serviceUrls, notes: priceNotes } })
}
const simeonovaService = 'https://simeonova.info/%D0%B8%D0%BD%D0%B4%D0%B8%D0%B2%D0%B8%D0%B4%D1%83%D0%B0%D0%BB%D0%BD%D0%BE-%D0%BA%D0%BE%D0%BD%D1%81%D1%83%D0%BB%D1%82%D0%B8%D1%80%D0%B0%D0%BD%D0%B5-%D0%B8-%D0%BF%D1%81%D0%B8%D1%85%D0%BE%D1%82%D0%B5/'
add({
  id: 'sofia-simeonova-psychotherapy-nansen29', name: 'Емилия и Надя Симеонови · психологичен кабинет',
  address: 'София, ул. Професор Фритьоф Нансен 29', website: 'https://simeonova.info/', phone: '+359877110741',
  services: [{ name: 'Индивидуално психологично консултиране и психотерапия', category: 'other', appointmentModel: 'appointment',
    description: 'Присъствена среща след предварително записване в общия кабинет. Специалистът, форматът, продължителността и таксата се уточняват преди посещението.' }],
}, {
  bookingUrl: 'https://simeonova.info/contacts/', excerpt: 'За предварително записване и повече информация: Надя Симеонова',
  serviceUrls: [simeonovaService, 'https://simeonova.info/answers-3/'],
  reviewedUrls: ['https://simeonova.info/', 'https://simeonova.info/contacts/', simeonovaService, 'https://simeonova.info/answers-3/'],
  notes: 'Actual own contact explicitly invites advance phone booking; selected individual service, home/about and complete FAQ inspected. Two practitioners use one named shared practice/address and are counted once, not one listing per staff member. This is psychological practice, not psychiatry inferred from an academic title. The consultation page contains a historic visitor comment: no visitor names, phone numbers, health information or comment content were retained or reused. No separate price, Book calendar or terms menu appears in the inspected navigation; no unavailable tariff was bypassed. No source photographs, testimonials, authored explanations, appointment data or map points copied.',
  priceNotes: 'Actual phone-enrollment contact, full selected individual counselling/psychotherapy page, current home/about and full FAQ were inspected. They publish no numeric fee or fixed session length for the selected in-person service, and do not link a separate tariff or blocked booking menu. No course price, online prepayment instruction, or third-party quote substituted for an in-person consultation fee.',
})
const georgieva = 'https://dr-georgieva.eu/', georgievaService = `${georgieva}%D1%83%D1%81%D0%BB%D1%83%D0%B3%D0%B8`, georgievaContact = `${georgieva}%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8`, georgievaPolicy = `${georgieva}%D0%BF%D0%BE%D0%BB%D0%B8%D1%82%D0%B8%D0%BA%D0%B0-%D0%B7%D0%B0-%D0%BF%D0%BE%D0%B2%D0%B5%D1%80%D0%B8%D1%82%D0%B5%D0%BB%D0%BD%D0%BE%D1%81%D1%82`
add({
  id: 'sofia-valya-georgieva-kavarna8', name: 'Д-р Валя Георгиева · частна психиатрична практика',
  address: 'София, ул. Каварна 8', website: georgieva, phone: '+359888673843',
  services: [
    { name: 'Първична психиатрична консултация', category: 'other', appointmentModel: 'appointment', description: 'Присъствена консултация след предварително записване по телефона. Таксата и продължителността се уточняват с практиката преди посещението.' },
    { name: 'Проследяваща психиатрична консултация', category: 'other', appointmentModel: 'appointment', description: 'Последваща среща след предварителна уговорка с практиката. Таксата и продължителността не са публикувани в собствения сайт.' },
  ],
}, {
  bookingUrl: georgievaService, contactUrl: georgievaContact, excerpt: 'можете да се свържете за записване на час. Обадете се: 0888 673 843',
  serviceUrls: [georgievaService, georgievaContact], reviewedUrls: [georgieva, georgievaService, georgievaContact, georgievaPolicy],
  notes: 'Own selected service page explicitly invites phone booking, corroborated by separate current contact and homepage. Complete current public service, contact and privacy pages inspected; normal HTTPS200 used only after reader timeouts/cache miss, not after an access denial. Actual owner consistently publishes Kavarna8; third-party Kavarna9 was not adopted. Independent private psychiatry practice only, not a general clinic department or one row per professional role. No unsupported treatment/outcome claims, qualifications, sensitive patient information, certificates, detoxification offers, source portraits or medical imagery reused. Address, fees, opening hours, duration and availability are not guessed. Privacy text read fully; no separate tariff/terms menu found or licence assumed.',
  priceNotes: 'Actual selected primary/follow-up service and explicit phone-booking entry, separate contact, homepage and privacy page publish no numeric consultation tariff, fixed duration or weekly opening schedule. Navigation has services, contact, professional biography and articles, but no price list or external booking calendar. No inaccessible tariff passed as unpublished; third-party prices and search-result addresses were not imported.',
})
export default { records, reviews }
