// Research intake only. Parent owns shared imports, identities and photos.
const checkedOn = '2026-11-14'
const validUntil = '2027-02-12'
const micro = 'https://microblading28.com/'
// The actual customer section is #procedure on this page; public URL policy omits fragments.
const microBook = micro
const rapaks = 'https://rapaks-masterhands.com/'
const rapaksBook = 'https://rapaks-masterhands.com/?page_id=11'
const rapaksPrices = 'https://rapaks-masterhands.com/?page_id=21'
const kod = 'https://thekod.bg/'
const kodStudentski = 'https://thekod.bg/the-kod-%d1%81%d0%b0%d0%bb%d0%be%d0%bd-%d0%b7%d0%b0-%d0%ba%d1%80%d0%b0%d1%81%d0%be%d1%82%d0%b0-%d1%81%d1%82%d1%83%d0%b4%d0%b5%d0%bd%d1%82%d1%81%d0%ba%d0%b8-%d0%b3%d1%80%d0%b0%d0%b4/'
const microNotes = 'Actual owner customer-procedure entry is #procedure on the native homepage, not the external training-enrolment link. This complete section explicitly offers client Hair Stroke/micropigmentation by Rumiana Ignatova in the Sofia centre, with prior online photo consultation followed by phone appointment on879282768 or877282877. Selected first actual booking phone; no call or customer/photo entry. Complete native root service/course/contact/footer and canonical linked Privacy reviewed. No client-procedure fee or separate client Prices menu is published there; course fees/deposits/model practice are not regular client prices. No blocked or unrendered known client-price menu relabelled unpublished. The same own page identifies Hair Stroke as NanoBrows/FeatherBrows with machine, not a manual microblading blade. Only ordinary adult cosmetic eyebrow service, no post-surgical areola/scalp/scar restoration, chemical/laser removal, clinical/health/safety/results/credential claims or training course. Opening times describe office responses/course administration, not treatment hours, so omitted. ExactTretiMart28/Sofia and operator confirmed by own Privacy; general office number is separate from explicitly published client-booking phones. Whole linked Privacy concerns personal data/cookies, no explicit access/extraction restriction found; generic copyright is not permission. Full runtime plus ALL2000 intake domain/operator/name/phone/address preflight found no duplicate; one operator, no staff/course aliases. No source media/reviews, coordinates or inventoryIdentity.'
const records = [
  {
    id: 'sofia-eurostandart28-hair-stroke-treti-mart28', name: 'Евростандарт Център 28 · перманентен грим', cityCode: '68134', neighborhood: null,
    address: 'София, ул. 3-ти Март 28', locationKind: 'premises', coordinates: null, category: 'beauty', website: micro, phone: '+359879282768',
    booking: { kind: 'phone', phone: '+359879282768' },
    services: [
      { name: 'Hair Stroke (NanoBrows) — козметична микропигментация за пълнолетни', category: 'beauty', appointmentModel: 'appointment', description: 'Клиентска процедура при Румяна Игнатова, не обучение или практика на курсист. Преди телефонното записване е нужна онлайн консултация със снимки и уточняване на подходящата процедура с центъра. Каталожната услуга е за пълнолетни.' },
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: microBook, excerpt: 'Процедури за клиенти: Hair Stroke при Румяна Игнатова в София. След предварителна онлайн консултация със снимки записването е на 0879282768 или 0877282877.' }, contact: micro },
  },
  {
    id: 'sofia-rapaks-masterhands-pushkin13', name: 'Rapaks – Masterhands', cityCode: '68134', neighborhood: null,
    address: 'София, бул. Ал. Пушкин 13', locationKind: 'premises', coordinates: null, category: 'health', website: rapaks, phone: '+359887488878',
    booking: { kind: 'phone', phone: '+359887488878' },
    services: [
      { name: 'Релаксиращ масаж — гръб и кръст', category: 'health', appointmentModel: 'appointment', price: { amount: 40, currency: 'EUR', kind: 'fixed', sourceUrl: rapaksPrices, checkedOn, validUntil }, durationMin: 30, durationSourceUrl: rapaksPrices, durationCheckedOn: checkedOn, description: 'Релаксиращ масаж на гръб и кръст, 30 минути. Посещението се уговаря предварително по телефона поради плаващия график.' },
      { name: 'Релаксиращ масаж — цяло тяло', category: 'health', appointmentModel: 'appointment', price: { amount: 60, currency: 'EUR', kind: 'fixed', sourceUrl: rapaksPrices, checkedOn, validUntil }, durationMin: 60, durationSourceUrl: rapaksPrices, durationCheckedOn: checkedOn, description: 'Релаксиращ масаж на цяло тяло, 60 минути. Посещението се уговаря предварително по телефона поради плаващия график.' },
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: rapaksBook, excerpt: 'Собствени контакти: предварително позвъняване поради плаващ график; час за масаж може да се запише по телефона. За адрес и записване: 0887488878, бул. Ал. Пушкин 13, София.' }, contact: rapaksBook },
  },
]
records.push({
  id: 'sofia-the-kod-studentski-grad-block15', name: 'The KoD · Студентски град', cityCode: '68134', neighborhood: 'Студентски град',
  address: 'София, кв. Студентски град, пред блок 15', locationKind: 'premises', coordinates: null, category: 'nails', website: kodStudentski, phone: '+359877700766',
  booking: { kind: 'form', url: kod },
  services: [
    { name: 'Маникюр с гел лак и твърда база — къси нокти', category: 'nails', appointmentModel: 'appointment', price: { amount: 25.56, currency: 'EUR', kind: 'fixed', sourceUrl: kodStudentski, checkedOn, validUntil }, description: 'За къси нокти, с гел лак и твърда база. Часът се уточнява и потвърждава с екипа след заявката.' },
    { name: 'Класически маникюр без гел лак', category: 'nails', appointmentModel: 'appointment', price: { amount: 15.34, currency: 'EUR', kind: 'fixed', sourceUrl: kodStudentski, checkedOn, validUntil }, description: 'Класически маникюр без гел лак. Допълнителен лак или сваляне на предишно покритие се уточняват с екипа. Часът се потвърждава след заявката.' },
  ],
  verification: { status: 'approved', checkedOn, validUntil, booking: { url: kodStudentski, excerpt: 'Салонът в Студентски град пред бл.15 има Запазете час към собствената #contacts форма за име, имейл, телефон и съобщение.' }, contact: kodStudentski },
})
const reviews = [
  {
    id: 'sofia-eurostandart28-hair-stroke-treti-mart28', website: micro, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [micro, `${micro}robots.txt`, `${micro}privacy-policy`, `${micro}privacy-policy/`],
    pricingDecision: 'not_publicly_listed',
    priceSearch: { outcome: 'not_published', bookingUrl: microBook, serviceUrls: [micro], notes: microNotes },
    notes: microNotes,
  },
  {
    id: 'sofia-rapaks-masterhands-pushkin13', website: rapaks, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [rapaks, `${rapaks}robots.txt`, rapaksBook, rapaksPrices],
    notes: 'Actual owner Contact/Book page first reviewed: explicit phone appointments and mandatory advance call because the venue has a floating schedule, exact887488878 andPushkin13/Sofia. Native current price page then fully read with fresh ordinary public HTTP200. Selected ordinary relaxation rows are40EUR30min back/lowerback and60EUR60min whole body. Web reader serves an expressly five-month-old cached version with25.56/40.90EUR and50min; those obsolete cached figures are NOT imported. Root explicitly separates paid professional/teacher salon appointments from trainee-model practice; one CPO-operated venue, no teacher/course aliases. No clinical therapeutic/manual/needling/rehabilitation, safety/results/credential claims or undeveloped beauty/SPA categories imported. Actual root/contact/price navigation and footer expose no Terms/Privacy links; robots404 is not a ban or permission. Contact10–21 is a phone-information window, not confirmed daily venue hours, so no openingHours. Runtime plus ALL2000 intakes checked by domain, Rapaks/CPO names, both parent domains, phone and premise with zero overlap. Minimal factual paraphrase only, no source media/reviews/ratings/Maps, calls, customer data, dates, slots, identities or coordinates.',
  },
]
reviews.push({
  id: 'sofia-the-kod-studentski-grad-block15', website: kodStudentski, checkedOn, bookingEntry: kod, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: [kod, `${kod}robots.txt`, kodStudentski],
  notes: 'Actual dedicated StudentskiGrad Book buttons first followed to owner root #contacts; native public form visibly contains name/email/phone/message and send control. No fragment serialized under URL policy, calendar/availability claim, client entry, consent, slot selection or submission. Whole dedicated branch service/pricing/contact body and root/footer/cookie overview read. Exact owner StudentskiGrad premise is in front ofblock15; no street/number/coordinates guessed. Owner separately labels Buxton and MalinovaDolina, so this is one additional real chain premise, not staff alias. Current runtime/all2000 domain match only Buxton; shared877700766 is the chain contact, not a new operator. Selected two actual StudentskiGrad nail rows. RootusesliteralownerEUR25.56 shortgel+hardbase andEUR15.34classicwithoutgel, publishedbesideBGN50/30; no rootconversion. No removal/polish inclusion or duration invented. No other branch prices cloned; Malinova separate tariff binding unconfirmed. Root/navigation/footer contain no Terms/Privacy link; whole native cookie overview concerns cookies only and generic copyright is not permission. No medical/needle/laser claims, source photos/reviews/ratings/Maps or identities; reused map URLs ignored and never fetched. No venue hours found, omitted.',
})
export default { records, reviews }
