// Frozen manually reviewed intake011. Root owns integration/photos/identities.
// Filename is intake identifier; actual new source review day is UTC2026-11-14.
const checkedOn = '2026-11-14', validUntil = '2027-02-12'
const records = [], reviews = []
const service = (category, name, description, facts = {}) => ({ category, appointmentModel: category === 'home_services' ? 'home_visit' : 'appointment', name, description, ...facts })
const price = (amount, unit, sourceUrl, extra = {}) => ({ amount, currency: 'EUR', kind: 'fixed', unit, sourceUrl, checkedOn, ...extra })
function add(facts, evidence) {
  const { bookingUrl, contactUrl = bookingUrl, excerpt, reviewedUrls, notes, priceSearchNotes, serviceUrls } = evidence
  const row = { cityCode: '68134', neighborhood: null, address: null, locationKind: facts.category === 'home_services' ? 'service_area' : 'premises', coordinates: null, ...facts, booking: facts.booking || { kind: 'phone', phone: facts.phone }, verification: { status: 'approved', checkedOn, validUntil, booking: { url: bookingUrl, excerpt }, contact: contactUrl } }
  records.push(row)
  const review = { id: row.id, checkedOn, website: row.website, bookingEntry: row.booking.kind === 'phone' ? 'phone' : row.booking.url, bookingReview: row.booking.kind === 'phone' ? 'phone_booking_reviewed' : 'owned_booking_reviewed', reviewedUrls, notes }
  if (priceSearchNotes) Object.assign(review, { pricingDecision: 'not_publicly_listed', priceSearch: { outcome: 'not_published', bookingUrl: row.booking.kind === 'form' ? row.booking.url : bookingUrl, serviceUrls, notes: priceSearchNotes } })
  reviews.push(review)
}

const kraftek = 'https://mebeli.kraftekdesign.com/'
const kraftekBook = `${kraftek}zapazete-chas-za-bezplatna-srestha/`
add({
  id: 'sofia-kraftek-design-pimen-zografski16a', name: 'Kraftek Design · мебелно студио', category: 'consulting',
  neighborhood: 'Дианабад', address: 'София, НПЗ Дианабад, ул. „Свети Пимен Зографски“ 16А',
  website: kraftek, phone: '+359889012323', booking: { kind: 'form', url: kraftekBook },
  openingHours: { sourceUrl: kraftekBook, checkedOn, days: [1,2,3,4,5].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '17:00' }] })) },
  services: [service('consulting', 'Безплатна предварителна среща с дизайнер за обзавеждане', 'Начална среща в офиса след предварителна заявка и потвърждение до един работен ден. Избира се предпочитан диапазон в следващите 10 работни дни, понеделник–петък 10–17 ч. Препоръчва се предварително запитване за бюджет. Не включва пълен проект, изработка или монтаж.', { price: price(0, 'начална среща с дизайнер', kraftekBook) })],
}, {
  bookingUrl: kraftekBook, contactUrl: `${kraftek}kontakti/`,
  excerpt: 'Собствена форма за безплатна начална среща с предпочитани дата, диапазон и офис; екипът потвърждава посещението до един работен ден.',
  reviewedUrls: [kraftek, kraftekBook, `${kraftek}kontakti/`, `${kraftek}politika-za-poveritelnost/`],
  notes: 'Actual owned Book form inspected first after robots and full privacy review: name, surname, phone, email, preferred date/time and explicit office-versus-Sofia-site location choices; confirmation within one working day. One actual office selected, not a second mobile operator/architect staff alias. Form explicitly limits requested appointments to next10 working days MonFri10–17; openingHours is this appointment request window, not guaranteed availability. Contact binds exactPimenZografski16A and889012323. Free initial meeting only; no project/manufacturing price or duration invented. Full18637charprivacy read across stored chunks; ordinary privacy/tracking text references Terms but no separate Terms link surfaced in reviewed root/footer/privacy links. No broad licence or legal-clearance claim; no source prose, portfolio, customer cases, logos, images or qualifications copied. No date/time/customer input, file attachment, consent, call, form submission, map or action link followed. Runtime and all numbered intake base-domain/subdomain/phone dedupe completed independently.',
})

const proHamali = 'https://prohamali.bg/'
const proHamaliBook = `${proHamali}kontakti/`
const proHamaliService = `${proHamali}hamalski-uslugi/`
add({
  id: 'sofia-prohamali-home-moving', name: 'Хамали Иванов · ProHamali', category: 'home_services',
  website: proHamali, phone: '+359882264648',
  services: [service('home_services', 'Товаро-разтоварни хамалски услуги', 'Ориентировъчна ставка на човек за час в София; могат да се заявят само хамали без транспорт. При нужен транспорт отделната ставка е 25,56 EUR/час. Тежки вещи, етажи и труден достъп могат да променят цената. Денят, екипът, обемът и крайната оферта се уговарят предварително.', { price: price(12.78, 'час на човек · ориентировъчно · транспорт отделно', proHamaliService) })],
}, {
  bookingUrl: proHamaliBook,
  excerpt: 'Услуги всеки ден с предварителна уговорка; собствен телефон и форма за избрана услуга, след която екипът уточнява цена и срок за изпълнение.',
  reviewedUrls: [proHamali, proHamaliBook, proHamaliService, `${proHamali}premestvane-na-doma/`],
  notes: 'Actual owned contact/service request flow inspected first: named service dropdown and callback to agree price and execution timing, with explicit every-day prior-arrangement wording and published voice phone882264648. Chosen phone path; no form data submitted. One Sofia mobile provider under namedIvanovPROTransEOOD, not one row per quarter or staff member. Nadhezda block324floor8 is contact/registration, not claimed visitor premises. Selected full13221charhamalski page explicitly offers labour without transport and literal12.78EUR per person/hour in Sofia;25.56EUR/hour specialised vehicle with driver is separate, not an included whole-move price. Literal dualBGN/EUR fees copied as EUR source facts, no conversion by us. Both rates indicative; crew/time/volume/addresses/floors/access/weight affect final quote, not a guaranteed minimum order or fixed duration. Separate home-moving bundles with lift/person/time conditions were reviewed but not imported. No VAT assumption, guessed minimum, capacity or numeric hours; every-day by-arrangement remains text only. Root/contact/service/footer contain no surfaced Terms/privacy link; ordinary rights-reserved footer, no general permission or full unseen Terms clearance claimed. No articles, staff biographies, reviews, ratings, customer cases, media or marketing claims copied; no quote/action/call/map/input/payment/submission. Runtime+allWIP phone/domain/operator dedupe clear.',
})

const inout = 'https://inoutdesign.bg/'
const inoutBook = `${inout}contact`
add({
  id: 'sofia-inout-design-ishirkov23', name: 'InOutDesign · интериорно студио', category: 'consulting',
  neighborhood: 'Студентски град', address: 'София, Студентски град, ул. „Професор Атанас Иширков“ 23',
  website: inout, phone: '+359899881544',
  services: [service('consulting', 'Безплатна първоначална консултация за интериорен проект', 'Първоначална среща за нуждите, стила, бюджета и обхвата на бъдещ интериорен проект. Часът се уговаря по телефона; точната оферта за проекта се изготвя след срещата. Безплатната консултация не включва пълен проект, чертежи, реализация или авторски надзор.', { price: price(0, 'първоначална консултация', inout) })],
}, {
  bookingUrl: inoutBook,
  excerpt: 'Контактната страница изрично предлага запазване на час по телефона за обсъждане на интериорен проект; началната консултация е посочена като безплатна.',
  reviewedUrls: [inout, inoutBook, `${inout}pricing`, `${inout}about`],
  notes: 'Actual owned Book entry Startwithfreeconsultation points to/contact, whose explicit instruction says reservehourbytelephone; two published ownerphones899881544/897809979, selectedfirst. Exact visitor contactStudenskiGradIshirkov23 bound to same owner. Rootactual workflow initial conversation needs/style/budget, explicitFREE preliminary consultation; ownpricing27/33/42EURper-square-metre projectpackages reviewed separately and not presented as a consultation or fixed visitfee. About lists realinteriordesign/concept/workdrawings/realisation, not generic furniture retail. No duration, numeric servicehours, coordinates or VAT assumed. Root/allnavigation/contact/pricing/about footer have no surfaced Terms/privacy link; no broad licence or unseenTerms clearance claim. No portfolios/renderings/reviews/marketing prose/qualifications copied. Robotsactualallow+CrawlDelay1respected with separated requests. No input, contactform submission, customerdata, telephone/map/social action or bookingwrite. Runtime+ALLWIP domain/bothphones/operator dedupe clear.',
})

const lili = 'https://chistoslili.eu/'
const liliBook = `${lili}контакти/`
const liliPrices = `${lili}цени/`
add({
  id: 'sofia-chisto-s-lili-home-cleaning', name: 'Чисто с Лили · почистване в София', category: 'home_services',
  website: lili, phone: '+359877620205', booking: { kind: 'form', url: liliBook },
  services: [service('home_services', 'Почистване на апартамент 40–60 м²', 'Публикувана ориентировъчна цена за апартамент 40–60 м², не почасова ставка. Минимална поръчка 70 лв. Предвидено е оскъпяване 30–100% при силно замърсяване, ремонт, стълбища, извънработни/празнични дни, местене на мебели и неспецифична работа. Датата и офертата се потвърждават.', { price: price(150, 'апартамент 40–60 м² · ориентировъчно', liliPrices, { currency: 'BGN', kind: 'range', maximum: 180 }) })],
}, {
  bookingUrl: liliBook,
  excerpt: 'Собствената форма за поръчки включва еднократно почистване на дома, предпочитана дата и предпочитан обратен контакт; детайлите се уточняват с екипа.',
  reviewedUrls: [lili, liliBook, liliPrices, `${lili}почистване-на-домове/`, `${lili}условия-за-ползване/`, `${lili}поверителност/`],
  notes: 'Actual owned Requestoffer entry/contact form inspected before selected home/prices: named single-homecleaning choice, preferred date, name/email/phone and phone-versus-email callback preference. No customer fields or date submitted; no claim of automatic availability. Ownphone877620205, fullservice confirms Sofia home visits. One mobile provider only; Rudartsi registration inTerms is not a Sofia visitor address. Literal undated current published150–180BGN range for40–60m2, min70BGN and30–100percent surcharge triggers retained publicly, no EUR conversion/discount/time/VAT invented. Range is indicative, ownerquote needed; no blanket completed-all-tariff claim. Full13001charTerms and1292charprivacy read; Art9.2 only forbids software that creates difficulty for other users, not a blanket data-extraction ban. Privacy contains isolatedDomestina cookie wording, recorded as a template inconsistency rather than evidence of a second operator or affiliation; actual brand/domain/phone/contact/service/fees consistently identifyChistoSLili. Ordinary personal data/booking/payment/registration provisions, no broad licence or unseenTerms clearance assertion. No articles, staff, reviews, ratings or media copied; no login, form/call/payment/map/action executed. Runtime+ALLWIP domain/phone/name preflight clear. Root says every day but no numeric service hours or weekend fee waiver inferred.',
})

const chista = 'https://chistarabota-sofia.com/'
const chistaBook = `${chista}index.php/contact-us/`
const chistaService = `${chista}services/транспортни-услуги/`
const chistaPrices = `${chista}pricing-plan/`
add({
  id: 'sofia-chista-rabota-home-moving', name: 'Чиста работа · разчистване и преместване', category: 'home_services',
  website: chista, phone: '+359894554750',
  services: [service('home_services', 'Товаро-разтоварни услуги при преместване', 'Ставка за един работник на час без ДДС, с минимален наем два астрономически часа. Транспортът с бус се заплаща отделно по 17,90 EUR/час без ДДС. Обхватът, екипът, графикът и крайната оферта се съгласуват предварително; това не е цена за цялостно преместване.', { price: price(17.90, 'час на работник · минимум 2 часа · без ДДС', chistaPrices) })],
}, {
  bookingUrl: chistaService, contactUrl: chistaBook,
  excerpt: 'ЧЗВ към действителната транспортна услуга посочва резервиране чрез обаждане на 0894554750; екипът уточнява поръчката и графика предварително.',
  reviewedUrls: [chista, chistaBook, `${chista}services/`, chistaService, chistaPrices],
  notes: 'Actual root Bookentry literal/index.php/contact-us/ inspected first; ownform offers property/service choices and generic inquiry. Selected fulltransport page subsequently provides explicit Howtoreserveservice answer: phone894554750 or ownercallback/contact; schedule agreed before delivery. Chosen directvoice path bound to selectedservice rather than generic contact or demoform. Root contains one unrelated live21lab theme-demo anchor; it was inspected ashref only, not opened or used as booking evidence. One Sofia mobile operator, Dianabadblock57office not claimed visitor premises. Fullliteral pricemenu17.90EUR PERWORKER/HOUR, minimum2astronomicalhours andVATexcluded; separatevehicle17.90EUR/hour (up to1.5t fortransport) not bundled into labour fee. No120min duration scalar from minimum, no entiremove fee, discount, VAT inclusion or availability assumed. Fullservices/prices/selectedFAQ/Book and rootfooter links checked; no separateTerms/privacy link surfaced, no full unseenTerms clearance orlicence claim. Weekday8–19 contactavailability could be office timing, therefore numeric servicehours omitted. No articles, ratings/testimonials/photos/marketing claims copied; no form input, date, call, calculator, map, action, request or payment submitted. Runtime+allWIP domain/phone/operator dedupe clear.',
})

const sfumato = 'https://www.sfumato-design.com/'
const sfumatoBook = `${sfumato}контакти/`
const sfumatoConsult = `${sfumato}експертни-консултации-за-интериорен/`
add({
  id: 'sofia-sfumato-design-home-consultation', name: 'Sfumato Design · консултация на адрес', category: 'home_services',
  website: sfumato, phone: '+359879100099', booking: { kind: 'form', url: sfumatoBook },
  services: [service('home_services', 'Базова интериорна консултация на адрес в София', 'Посещение на обект в София до два часа, с устни препоръки и без писмено становище. Цената е без ДДС. Не включва пълен интериорен проект, технически чертежи или управление на ремонта. Заявката се обсъжда с екипа и посещението се потвърждава допълнително.', { price: price(150, 'базова консултация до 2 часа · без ДДС', sfumatoConsult) })],
}, {
  bookingUrl: sfumatoBook,
  excerpt: 'Избраният платен пакет за посещение на обект в София води към собствената форма за консултация; екипът се свързва за уточняване и уговорка, без незабавна резервация.',
  reviewedUrls: [sfumato, `${sfumato}privacy`, sfumatoConsult, sfumatoBook, `${sfumato}цени/`],
  notes: 'Selected standalonepaid BASEconsultation ownpage actual three Zayaveteconsultatsia CTA hrefs inspected and all point to own/kontakti form; name/email/phone/message and ownerfollowup to clarifydetails. Contact also expressly requires priorarrangedmeeting, not walkin/instantavailability. Source explicitONSITE SOFIA150EUR VATexcluded UPTO2hours maximum, oralonly/no writtenstatement/project/technicaldrawings/repairmanagement retained publicly. No durationMin120 from maximum. Chosen oneSofiahome_visit provider, address/coordinatesnull: ContactBODYAlexiRilets16 versus FOOTERRalevitsa86A officeconflict recorded and neither published as visitor venue. Numeric8–18 versusheader9–18 are office/contact timing conflicts, noopeningHours. Selectedstandalone150 versus projectpackages30/50/80EURm2 plus30m2minimum were reviewed as separateoffers, no flattening/promo/conversion. Full3064charprivacy ordinaryGDPR, reviewed root/footer/privacy no separateTerms surfaced, ordinaryrightsreserved not claimed licence/full unseenTerms clearance. Parent explicitly agreed this narrow independentfactual ONEhomevisit intake after address/CTA review; no sourceprose/creativeassets/cases/reviews/credentials copied. RobotsAllow, no privateAPI/UI, form/customer/date/time input, consent, file upload, call, submission, Maps/social/action/payment. Runtime+ALLWIP domain/bothphones/operator dedupe clear.',
})

export default { records, reviews }
