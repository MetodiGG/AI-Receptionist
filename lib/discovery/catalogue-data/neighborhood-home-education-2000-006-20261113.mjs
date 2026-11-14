// Isolated manually reviewed intake006. Root owns imports, photos and identities.
const checkedOn = '2026-11-13', validUntil = '2027-02-11'
const records = [], reviews = []
const service = (category, name, description, facts = {}) => ({ category, appointmentModel: 'appointment', name, description, ...facts })
const price = (amount, unit, sourceUrl, extra = {}) => ({ amount, currency: 'EUR', kind: 'fixed', unit, sourceUrl, checkedOn, ...extra })
const hours = (sourceUrl, rows) => ({ sourceUrl, checkedOn, days: rows.map(([weekday, open, close]) => ({ weekday, periods: [{ open, close }] })) })
function add(facts, evidence) {
  const { bookingUrl, contactUrl = bookingUrl, excerpt, reviewedUrls, notes, priceSearchNotes, serviceUrls } = evidence
  const row = { cityCode: '68134', neighborhood: null, address: null, locationKind: 'premises', coordinates: null, ...facts, booking: facts.booking || { kind: 'phone', phone: facts.phone }, verification: { status: 'approved', checkedOn, validUntil, booking: { url: bookingUrl, excerpt }, contact: contactUrl } }
  records.push(row)
  const review = { id: row.id, checkedOn, website: row.website, bookingEntry: row.booking.kind === 'phone' ? 'phone' : row.booking.url, bookingReview: row.booking.kind === 'phone' ? 'phone_booking_reviewed' : 'owned_booking_reviewed', reviewedUrls, notes }
  if (priceSearchNotes) Object.assign(review, { pricingDecision: 'not_publicly_listed', priceSearch: { outcome: 'not_published', bookingUrl: row.booking.kind === 'form' ? row.booking.url : bookingUrl, serviceUrls, notes: priceSearchNotes } })
  reviews.push(review)
}

const moliks = 'https://moliks.com/', moliksService = `${moliks}courses/abacus_mental_math_brainobrain/`, moliksTerms = `${moliks}privacy-policy/`
add({
  id: 'sofia-moliks-tsvetna-gradina72', name: 'Образователен център Моликс', category: 'education', neighborhood: 'Лозенец', address: 'София, кв. Лозенец, ул. Цветна градина 72', website: moliks, phone: '+359889598980',
  services: [service('education', 'BRAINOBRAIN ментална аритметика · месец с 4 урока', 'Присъствена група за деца 6–12 г., с предварително уговорен график. Месечната цена е за 4 занятия по 120 минути, не за един урок. Програмата е на нива от по 3 месеца; предоставят се сметало и книги. Допълнителните условия са в индивидуален договор.', { appointmentModel: 'group_reservation', price: price(160, 'месец · 4 урока по 120 минути', moliksService, { currency: 'BGN' }) })],
}, {
  bookingUrl: moliksTerms, contactUrl: moliks, excerpt: 'Подаването на заявка се извършва в писмен вид по e-mail, по телефон, чрез формата за подаване на заявка',
  reviewedUrls: [moliks, moliksService, moliksTerms, `${moliks}courses/workshops/`],
  notes: 'Actual open-lesson/enrollment entry first, then selected paid course and complete own terms: requests for offered services accepted by phone/email, centre responds within2workingdays and confirms payment separately. Fresh primaryHTML verifies160BGN/month for4onsite120minute lessons, not lifetime-access template metadata, single lesson or free demo. Course-specific6–12years retained rather than broad4–14centre label. Terms concern teaching materials, not an explicit database/extraction ban; no curriculum, source prose/media or development/outcome claims reused. Course-payment100/50percent/byagreement is not imported as a deposit service. No general hours guessed from Thursday/Saturday demo windows. No calls, course/cart/form/consent/payment submission or admin/map paths.',
})

const bigBen = 'https://bigben.bg/', bigBenAdult = `${bigBen}за-възрастни/`, bigBenDiscounts = `${bigBen}отстъпки/`
for (const branch of [
  { id: 'mladost-yerusalim3', label: 'Младост', neighborhood: 'Младост 1', address: 'София, ж.к. Младост 1, бул. Йерусалим 3', phone: '+359888562593', contact: `${bigBen}биг-бен-клон-младост/` },
  { id: 'aksakov28', label: 'Аксаков', neighborhood: 'Център', address: 'София, ул. Аксаков 28, ап.1', phone: '+359878403086', contact: `${bigBen}биг-бен-клон-централен-офис/` },
]) add({
  id: `sofia-bigben-${branch.id}`, name: `Езиково училище Big Ben · ${branch.label}`, category: 'education', neighborhood: branch.neighborhood, address: branch.address, website: bigBen, phone: branch.phone,
  services: [service('education', 'Интензивен групов курс по английски за възрастни', 'Предварително записване в избрания филиал и уточняване на група и старт. Програмата е 3 месеца, за 5–12 души, с 2 или 3 занятия седмично. Учебните материали се заплащат отделно. Наличието на място и графикът се потвърждават от школата.', { appointmentModel: 'group_reservation' })],
}, {
  bookingUrl: bigBenAdult, contactUrl: branch.contact, excerpt: `Тел. за записване: ${branch.label === 'Младост' ? '0888562593' : '0878 40 30 86'}`,
  reviewedUrls: [bigBen, bigBenAdult, branch.contact, bigBenDiscounts, `${bigBen}за-деца/`, `${bigBen}wp-content/uploads/2020/08/A1_angl_28_09-300x225.jpg`, `${bigBen}wp-content/uploads/2020/08/A1_nemski-300x196.jpg`],
  notes: `Actual adult-course enrollment entry reviewed before course and branch details. The adult page has an explicit separate phone-enrollment subsection for ${branch.label}; the own branch page establishes a real teaching venue, not only an administrative or registered office. Standing intensive3month groups run throughout the year; no old September poster is presented as a current2026 start, guaranteed vacancy or live calendar. Public course posters visually inspected for fees; they show course/level/start only. Discounts page requires registration/payment and says materials are separate; no discounted fee or free voucher imported. No lesson duration or lesson hours inferred from office/contact content. Own footer has no surfaced separate terms link; no general licence claim. No phone call, form, payment, map or customer action.`,
  serviceUrls: [bigBenAdult, branch.contact],
  priceSearchNotes: 'Reviewed actual branch-specific adult phone-enrollment page, adult/child services, own venue and discounts/payment conditions, including visible A1 English/German course posters. No numeric base tariff for the selected paid intensive English course was published on these reviewed pages. Percentage discounts and separate materials are not a fee. Old poster starts are not current availability; school must confirm the group and fee.',
})

const svetlinki = 'https://svetlinki.com/', svetlinkiBook = `${svetlinki}kontakti`, svetlinkiArt = `${svetlinki}art-rabotilnitsi`, svetlinkiPrices = `${svetlinki}tseni`, svetlinkiTerms = `${svetlinki}obshti-usloviya`
add({
  id: 'sofia-svetlinki-sheynovo13a', name: 'Учебен център Светлинки', category: 'education', neighborhood: 'Център', address: 'София, ул. Шейново 13А', website: svetlinki, phone: '+359885808190',
  openingHours: hours(svetlinkiBook, [1,2,3,4,5,6,7].map(day => [day, '08:00', '20:00'])),
  services: [
    service('education', 'Кратка арт работилница за деца', 'За деца 4–12 г., до 6 участници. Самостоятелно съботно занимание с променяща се тема и включени материали. Предварително записване и потвърждение за избрана дата; плащане по банков път на място в деня, без абонамент.', { appointmentModel: 'group_reservation', durationMin: 90, durationSourceUrl: svetlinkiArt, durationCheckedOn: checkedOn, price: price(15, 'посещение · 90 минути · материали включени', svetlinkiPrices, { validUntil: '2026-11-21' }) }),
    service('education', 'Дълга арт работилница за деца', 'За деца 4–12 г., до 6 участници. Самостоятелно съботно занимание с по-многостъпков проект, различна тема и включени материали. Избраната дата се потвърждава от центъра; банково плащане на място в деня, без абонамент.', { appointmentModel: 'group_reservation', durationMin: 150, durationSourceUrl: svetlinkiArt, durationCheckedOn: checkedOn, price: price(25, 'посещение · 150 минути · материали включени', svetlinkiPrices, { validUntil: '2026-11-21' }) }),
  ],
}, {
  bookingUrl: svetlinkiBook, contactUrl: svetlinkiBook, excerpt: 'Ако датите не се заредят, обадете се и веднага Ви записваме: +359 885 808 190',
  reviewedUrls: [svetlinki, svetlinkiBook, svetlinkiArt, svetlinkiPrices, svetlinkiTerms],
  notes: 'Actual Book entry leads to owned contact/date page, with explicit voice-phone scheduling for paid art workshops as well as free trial lessons. Selected only the two paid standalone workshop types; did not misbind the free trial to a paid arithmetic/reading programme. Current booking page publishesNov14/21 paid dates; service page describes recurring Saturday workshops but receipt/fees conservatively expireNov21 rather than imply90days of available dates.90/150minute15/25EUR fees include all materials; not conditional fifth-free promotion, monthly package or ordinary cash payment (full terms explicitly bank transfer/QR on site, no cash). Terms read fully through normal publicHTTPS after reader cache miss: booking is a request pending vacancy confirmation, cancellation until date without fee, no online payment. Pleven registered address and former Oborishte1A photo caption are not Sofia teaching branches. Ordinary text/photo/material copyright only; no source prose/media/curriculum republished. No form, date, questionnaire, consent, payment, link cancellation, child/customer data or map action.',
})
records.at(-1).verification.validUntil = '2026-11-21'

const ibl = 'https://ibl.bg/', iblIndividual = `${ibl}individual-english/`, iblContact = `${ibl}contact-us/`, iblVenues = `${ibl}about/facilities/`, iblTerms = `${ibl}общи-условия/`, iblOffers = `${ibl}offers/`
for (const branch of [
  { id: 'knyazhevo-tsar-boris262', label: 'Княжево', neighborhood: 'Княжево', address: 'София, кв. Княжево, бул. Цар Борис III 262' },
  { id: 'vazrazhdane-sofroniy1', label: 'Възраждане', neighborhood: 'Център', address: 'София, пл. Възраждане, ул. Софроний Врачански 1, ет.2' },
]) add({
  id: `sofia-ibl-${branch.id}`, name: `IBL English Academy · ${branch.label}`, category: 'education', neighborhood: branch.neighborhood, address: branch.address, website: ibl, phone: '+359893821016',
  services: [service('education', 'Индивидуален урок по английски', 'Присъствено обучение 1:1 в избрания учебен център. Нивото, целта, честотата и точният график се уточняват предварително според свободните часове на преподавателите. Отмяна до 2 часа преди уговорения урок; по-късно се заплаща.', { appointmentModel: 'individual_training' })],
}, {
  bookingUrl: iblIndividual, contactUrl: iblContact, excerpt: 'Ще се свържем с вас, за да уточним часовете и нивото. Формата се зарежда… или се обадете на 0893 82 10 16.',
  reviewedUrls: [ibl, iblIndividual, iblContact, iblVenues, iblTerms, iblOffers],
  notes: `Actual homepage consultation/Book entry followed first, then separate ordinary paid individual-lesson page. That selected page explicitly offers ${branch.label === 'Княжево' ? 'KnyazhevoTsarBorisIII262' : 'SofroniyVrachanski1floor2'} as a real selectable onsite lesson location, requests a plan and offers voice-phone scheduling to agree actual teacher hours. This is not a clone of an administrative office or a claim that a free consultation calendar buys a paid course. Own facilities/contact corroborate both teaching venues. Full own terms read; individual cancellations at least2hours before, otherwise charge retained. Childhood annual course950EUR/from and promotional instalments do not establish an individual fee; old terms5instalments/newoffers8not exported. Example80minute visit and preference windows9–21 are not a fixed duration or opening hours. No Classes account/provider/private dashboard, forms, selectors, fields, phone call, consent or payment action.`,
  serviceUrls: [iblIndividual, iblVenues],
  priceSearchNotes: 'Reviewed actual selected individual lesson request/phone booking page, own two venue/contact pages, full course terms and current Offers/Prices page. The published from950EUR annual children-group tariff is a different service; no numeric individual English lesson fee is stated on these reviewed pages. Price and agreed lesson length must be confirmed with the centre. No blocked individual menu was treated as unpublished.',
})

const lingo = 'https://www.lingocentre.eu/', lingoIndividual = `${lingo}pages/individualno-obuchenie`, lingoContact = `${lingo}contacts`
add({
  id: 'sofia-lingo-centre-ivan-ivanov90-92', name: 'Езиков център Линго', category: 'education', address: 'София, бул. Инж. Иван Иванов 90–92', website: lingo, phone: '+359887709959',
  services: [service('education', 'Индивидуален урок по английски', 'Общ или специализиран английски 1:1. Учебната програма, честотата и удобното време на присъствените занятия се договарят според целите на курсиста. Предварително записване по телефона.', { appointmentModel: 'individual_training' })],
}, {
  bookingUrl: lingoIndividual, contactUrl: lingoContact, excerpt: 'За повече информация или записване: Телефон: +359 887709959',
  reviewedUrls: [lingo, lingoIndividual, lingoContact],
  notes: 'Actual homepage enrollment phone entry followed by selected individual English page and own deep contacts. Explicit phone enrollment repeated on selected service page, with individually agreed timetable; not merely generic contact. Exact90–92street number range retained rather than choosing an invented house number or location. No public lesson hours or duration stated. Main/menu/footer inspected: no surfaced separate price or terms page; no blanket licence claim. No call, contact/CAPTCHA/search field, form, map, account or submission action.',
  serviceUrls: [lingoIndividual],
  priceSearchNotes: 'Reviewed actual individual English lesson page and its explicit phone enrollment instruction, full main course navigation/footer and owned contacts. No numeric individual lesson tariff is published on these reviewed pages and no separately linked price menu was surfaced. No blocked menu was classified as unpublished; teacher availability, fee and lesson length require confirmation.',
})

const maximum = 'https://maximumsofia.com/', maximumBook = `${maximum}контакт/`, maximumCourse = `${maximum}курсове-за-възрастни/`, maximumSchedule = `${maximum}възрастни/`
add({
  id: 'sofia-maximum-solunska8', name: 'Езикова школа Максимум София', category: 'education', neighborhood: 'Център', address: 'София, ул. Солунска 8', website: maximum, phone: '+359882111603', booking: { kind: 'form', url: maximumBook },
  services: [service('education', 'Групов курс по английски C1 · начало 25.11.2026', 'Цял курс от 100 учебни часа, с начало 25.11.2026; понеделник и сряда 18:00–21:00. Предварително записване и потвърждение за място. Публикуваната сума е за целия курс, а не за едно занятие или първата вноска.', { appointmentModel: 'group_reservation', price: price(535, 'цял курс C1 · 100 учебни часа · начало 25.11.2026', maximumSchedule, { validUntil: '2026-11-25' }) })],
}, {
  bookingUrl: maximumCourse, contactUrl: maximumBook, excerpt: 'За записване свържете се с нас.',
  reviewedUrls: [maximum, maximumBook, maximumCourse, maximumSchedule],
  notes: 'Actual owned contact request form inspected first, then selected adult paid course page explicitly links that form for enrollment. Full actual timetable has one future C1start25Nov2026 at535EUR/100academicunits, not oldSeptember/October rows, conditional free voucher,285EURfirst instalment or a price per visit. Distinct school/teaching addressSolunska8; no staff or franchise-domain clone. Enrollment receipt and price expireNov25 conservatively; no open-end/90day future vacancy claim. Contact office hours9–18 conflict with evening lessons18–21, so no openingHours inferred. No separate terms link surfaced in reviewed navigation/footer; no licence assertion. No form values, customer data, date, consent, call, payment, social or map action.',
})
records.at(-1).verification.validUntil = '2026-11-25'

const vasilev = 'https://vasilevlawyers.com/', vasilevContact = `${vasilev}contacts/`, vasilevForm = `${vasilev}consultation/`, vasilevFamily = `${vasilev}semeino-pravo/`
add({
  id: 'sofia-nikolay-vivianov-vasilev-lavele16', name: 'Адвокат Николай Вивианов Василев · София', category: 'consulting', neighborhood: 'Център', address: 'София, ул. Лавеле 16, ет.2, офис 201', website: vasilev, phone: '+359898588776',
  openingHours: hours(vasilevContact, [1,2,3,4,5].map(day => [day, '09:00', '19:00'])),
  services: [service('consulting', 'Правна консултация по семейно право', 'Присъствена среща с предварително уговорен час в софийската кантора. Обсъждане на конкретен въпрос по семейно право. Хонорарът и необходимите документи се уточняват предварително; не се обещава безплатна обичайна консултация.')],
}, {
  bookingUrl: vasilev, contactUrl: vasilevContact, excerpt: 'Запазете час за консултация 0898 588 776',
  reviewedUrls: [vasilev, vasilevContact, vasilevForm, vasilevFamily],
  notes: 'Actual homepage Book entry explicitly gives voice-phone appointments; followed consultation request page, selected family-law services and own exact Sofia contact/hours. Other officesPlovdiv/Burgas not imported or represented as Sofia. Ordinary consultancy is not free: separate form limits free assistance to statutory eligibility; homepage wording about no additional phone charges is not a zero service fee. All reviewed menu/footer links expose legal areas, not a fee schedule or separate terms page; no general licence claim. MonFri9–19 ordinary published hours, weekend custody exceptions not imported as24/7availability. No call, legal/customer documents, consultation form, search field, message, review, map or submission.',
  serviceUrls: [vasilevFamily, vasilevForm],
  priceSearchNotes: 'Reviewed actual phone appointment entry, consultation-request and statutory-free-assistance conditions, exact contact/footer and selected family-law service page. No numeric ordinary family-law consultation tariff is published on these reviewed pages; no separate price menu is surfaced in the full reviewed navigation. Eligibility-based free aid and no-extra-phone-charge text are not an ordinary fee. Confirm quotation and appointment with the attorney.',
})

const educationCentre = 'https://centarzaobrazovanie.com/', educationCentreBook = `${educationCentre}contact/`, educationCentreCourses = `${educationCentre}courses/`
add({
  id: 'sofia-centre-education-career-miladinovi41', name: 'Център за образование, кариера и развитие', category: 'education', neighborhood: 'Център', address: 'София, ул. Братя Миладинови 41', website: educationCentre, phone: '+359893524014',
  services: [service('education', 'Индивидуален урок за кандидатстване в НГДЕК', 'За ученици в 4. и 7. клас. Присъствена подготовка с предварително уговорен график и потвърждение от центъра. Приемът за индивидуални уроци е целогодишен; таксата и продължителността се уточняват отделно.', { appointmentModel: 'individual_training' })],
}, {
  bookingUrl: educationCentreBook, contactUrl: educationCentreBook, excerpt: 'Можете да се запишете чрез нашата контактна форма, по телефон или лично в центъра. Ще се свържем с вас за потвърждение.',
  reviewedUrls: [educationCentre, educationCentreBook, educationCentreCourses, `${educationCentre}about/`],
  notes: 'Actual contact/Book instruction explicitly allows voice-phone enrollment and callback confirmation; FAQ expressly accepts individual students throughout the year, not merely a full/expired autumn group. Actual Courses page identifies individualNGDEKpreparation for4th/7thgrade; one realBratyaMiladinovi41teaching address and two staff contacts, not two businesses. Monthly180–320BGNrange on general course FAQ is not assigned to individual lessons; no undisclosed guarantee, success score or stock/customer image reused. About/course/contact/header/footer checked for service, tariff and hours; no separate terms or price page surfaced, no general licence claim. No hours/duration inferred from the141/144hour annual group programme. Publicrobots allows ordinary pages and excludesadmin/api/private; none accessed. No phone call, callback request, form, consent, customer/child data or map action.',
  serviceUrls: [educationCentreCourses],
  priceSearchNotes: 'Reviewed actual owned phone-enrollment/contact FAQ, full current2026/27Courses page, About and home navigation/footer. The site publishes a general180–320BGN/month range for course packages but does not specify any fee or package unit for the selected individualNGDEKlesson. Do not present that group-package range or free initial needs consultation as this paid service fee. No blocked tariff was treated as unpublished; confirm exact lesson quotation/length.',
})

const tsankova = 'https://venislavatsankova.com/', tsankovaBook = `${tsankova}kontakti/`, tsankovaFamily = `${tsankova}sferi-na-dejnost/semejno-pravo/`, tsankovaTerms = `${tsankova}obshti-usloviya/`
add({
  id: 'sofia-venislava-tsankova-makedonia1', name: 'Адвокатска кантора Венислава Цанкова', category: 'consulting', neighborhood: 'Център', address: 'София, пл. Македония 1, ет.13', website: tsankova, phone: '+359888459180',
  services: [service('consulting', 'Правна консултация по семейно право', 'Присъствена консултация в кантората след предварително уговорен час. Обсъждане на конкретен въпрос по семейно право; хонорарът и необходимите документи се уточняват с адвоката.')],
}, {
  bookingUrl: tsankovaBook, contactUrl: tsankovaBook, excerpt: 'При посещение на място е препоръчително предварително да уговорите час.',
  reviewedUrls: [tsankova, tsankovaBook, tsankovaFamily, tsankovaTerms],
  notes: 'Actual own contact/appointment page reviewed before selected family-law service with consultation CTA. Own terms identify activity officeMakedoniya1floor13, not registered residentialSlatinaaddress. No hours inferred from seven-day emergency assistance. Full current terms read through ordinary publicHTTPS after reader cache miss; narrow independently phrased minimal practice/service/contact facts only. IP clause addresses texts, images, structure, design, trade signs and other protected elements with express legal exceptions, not an explicit database/extraction ban. This is not permission, a general licence or legal guarantee: no article prose, graphics, testimonials, client cases, design or qualifications copied. No map destination, calls, messages, form fields, consent, customer/legal data or submission.',
  serviceUrls: [tsankovaFamily],
  priceSearchNotes: 'Reviewed actual own appointment/contact instructions, family-law consultation service, home navigation/footer and complete current terms. No numeric ordinary family-law consultation fee is published on these reviewed pages; no separate public fee menu is surfaced. Emergency availability is not an ordinary weekly schedule. No blocked tariff is treated as unpublished; confirm fee and appointment directly.',
})

const pilev = 'https://advokatpilev.com/', pilevBook = `${pilev}contacts/`, pilevPricing = `${pilev}pricing/`, pilevTerms = `${pilev}terms/`
add({
  id: 'sofia-emil-pilev-lavele19', name: 'Адвокатска кантора Емил Пилев', category: 'consulting', neighborhood: 'Център', address: 'София, ул. Лавеле 19, ет.5', website: pilev, phone: '+359896868352',
  openingHours: hours(pilevBook, [1,2,3,4,5].map(day => [day, '09:00', '18:00'])),
  services: [service('consulting', 'Платена правна консултация с преглед на документи', 'Присъствена консултация в кантората с предварителна уговорка по телефона. Включва обсъждане на казуса и преглед на документи; хонорарът се определя индивидуално. Не е безплатната първоначална консултация без документи.')],
}, {
  bookingUrl: pilevBook, contactUrl: pilevBook, excerpt: 'Свържете се с нас за организиране на платена консултация на 0896 868 352',
  reviewedUrls: [pilev, pilevBook, pilevPricing, pilevTerms],
  notes: 'Actual consultation entry/pricing form inspected first, then own contact page explicitly distinguishes paid document-review consultation scheduled by voice phone from the free no-document form. Selected only the ordinary paid appointment and exactSofiaLavele19floor5venue. Pricing page says quotation follows case review; own FAQ expressly has no predetermined fixed fee. No fake0fee, unlimited-minute scalar, success guarantee, review or source prose/media reused. Own contacts publishMonFri9–18; weekend closed not required as extra open interval. Linked/terms path actually contains the full privacy policy, read through normal publicHTTPS after reader cache miss; no separate extraction/database/noncommercial restriction surfaced. No protected plugin/admin route, map, phone call, legal/customer document, form, consent or submission.',
  serviceUrls: [pilevBook, pilevPricing],
  priceSearchNotes: 'Reviewed actual consultation/pricing request page, selected paid document-review appointment instruction, home FAQ, full contacts/footer and linked privacy/terms page. Own FAQ explicitly says there is no predetermined fixed price; quotation depends on the case. No numeric ordinary document-review consultation fee is published on these reviewed pages. Free initial contact excludes document review and is not this selected service. No blocked price menu was treated as unpublished.',
})

const artIzba = 'https://artizba.bg/', artIzbaBook = `${artIzba}produkt/planinska-krasota/`, artIzbaCalendar = `${artIzba}kalendar`, artIzbaTerms = `${artIzba}obshti-usloviya`
add({
  id: 'sofia-artizba-cherni-vrah33e', name: 'ART Izba · София', category: 'education', neighborhood: 'Лозенец', address: 'София, бул. Черни връх 33Е', website: artIzba, phone: '+359894394054', booking: { kind: 'form', url: artIzbaBook },
  openingHours: hours(`${artIzba}za-nas/`, [...[1,2,3,4,5,6].map(day => [day, '18:30', '22:00']), [7, '16:30', '20:00']]),
  services: [service('education', 'Рисуване и вино „Есенна кошница“ · 18.11.2026', 'Групово рисуване с художник на 18.11.2026 от 18:45. Включени материали, вино и вода или сок за непълнолетни. Публикувана стандартна цена за участник, без изчисляване на онлайн отстъпка. Провежда се при минимум 6 души; отказ повече от 48 ч. предварително по условията.', { appointmentModel: 'group_reservation', price: price(30, 'участник · събитие на 18.11.2026 от 18:45', artIzbaBook, { validUntil: '2026-11-18' }) })],
}, {
  bookingUrl: artIzbaBook, contactUrl: `${artIzba}za-nas/`, excerpt: 'Есенна кошница 18.11.2026 г. – 18:45 ч. Налични 50',
  reviewedUrls: [artIzba, artIzbaCalendar, artIzbaBook, `${artIzba}za-nas/`, `${artIzba}faq`, artIzbaTerms],
  notes: 'Actual own Sofia calendar followed to the literal safe product-description href, not its add-to-cart action. Selected future18Nov2026offering has an actual publicPOSTquantity/reservation form and50listed places at30EUR/person; not sold-out14Nov,2for1, voucher,20EURiris gift or an inferred15percent online discounted price. Form POST action, FAQ and complete own service terms describe later participant/payment/order steps; none performed and no account created. Current dated product tariff is retained only for that specific event, not old generalFAQ48BGN fee or a chain-wide standing tariff.2–3hour range versus narrative three hours is not a fixed duration scalar. Activity addressCherniVrah33E, not registeredDobrila10, historicVitosha192 orBlagoevgrad. All terms reviewed in chunks via normalHTTPS after reader cache misses: cancellation more than48hours allows refund or voucher; minimum6specific event retained. No photos, artwork, reviews or promotional prose copied. Robots disallows action-querycart routes; none requested for this source. No form/quantity/button/date/consent/payment/map action.',
})
records.at(-1).verification.validUntil = '2026-11-18'

const paintMe = 'https://paintmesofia.com/', paintMeBook = `${paintMe}pravila-i-usloviya/`, paintMeEvent = `${paintMe}sabitiya/risuvane-i-vino-zamraznalata-gora/`
add({
  id: 'sofia-paintme-bulgaria-mall69', name: 'Paint Me · Bulgaria Mall', category: 'education', neighborhood: 'Манастирски ливади', address: 'София, бул. България 69, Bulgaria Mall, ниво +1, над главния вход', website: paintMe, phone: '+359895647300',
  services: [service('education', 'Рисуване и вино „Замръзналата гора“ · 29.12.2026', 'Групово рисуване с художник на 29.12.2026 от 18:45. Включени материали и чаша вино; алкохол само за 18+. Мястото се потвърждава след приемане и плащане, при телефонна уговорка — писмено съгласие. Пренасрочване поне 48 ч. предварително; минимум 10 участници.', { appointmentModel: 'group_reservation', price: price(29, 'участник · събитие на 29.12.2026 от 18:45', paintMeEvent, { validUntil: '2026-12-29' }) })],
}, {
  bookingUrl: paintMeBook, contactUrl: paintMeBook, excerpt: 'Телефон и Viber: 0895 647 300. При телефонно договаряне потребителят се обвързва след подписване на предложението или изпращане на писмено съгласие.',
  reviewedUrls: [paintMe, paintMeEvent, `${paintMe}sabitiya/risuvane-i-vino-chasha-rozi/`, paintMeBook],
  notes: 'Actual homepage Book entry first, then owned future selected event menu and complete current service terms. Important accidental request: reader click on homepageBook link requestedhttps://paintmesofia.com/cart/?add-to-cart=18970; tool rewrote to/cart/ and displayed empty cart. That GET could have attempted anonymous cart mutation; no claim that no action link was opened. No purchase, booking/customer fields, selection, consent, payment or subsequent cart/reset operation occurred. Investigation then used only safe description and terms URLs, and genuine own phone-contracting alternative§2.10; voicephone path requires written acceptance and payment confirmation, not direct live availability. Event lists35places,29EURand2.5–3hour range; no fixed duration or open hours inferred, no guarantee any slot stays available. Selected only dated29Dec offer; not50EURtwo-personHalloween, promotional code, voucher, video course orVarna/franchise clone. ExactBulgariaMall+1activity location, not registeredVelizarVelkov19orEcontreturn office.48hour rescheduling conditions and minimum10publicparticipants preserved; no customer reviews, artwork/media, claims or recipe prose copied. No Google/map or restricted provider requests.',
})
records.at(-1).verification.validUntil = '2026-12-29'

const gicheva = 'https://www.lawyer-mediate.com/', gichevaBook = `${gicheva}контакти/`, gichevaServices = `${gicheva}сфери-дейност/`, gichevaFamily = `${gicheva}service/семейно-наследствено-право/`, gichevaCookies = `${gicheva}политика-бисквитки/`
add({
  id: 'sofia-lawyer-mediate-gicheva-tundzha25', name: 'Lawyer Mediate · адвокат Стефания Гичева', category: 'consulting', address: 'София, ул. Тунджа 25', website: gicheva, phone: '+35928517259', booking: { kind: 'form', url: gichevaBook },
  openingHours: hours(gichevaBook, [1,2,3,4,5].map(day => [day, '09:30', '17:00'])),
  services: [service('consulting', 'Правна консултация по семейно и наследствено право', 'Присъствена среща в кантората с предварително уговорен час. Заявката посочва избраното правно направление и подлежи на потвърждение от кантората. Хонорарът се уточнява според конкретния въпрос.')],
}, {
  bookingUrl: gichevaBook, contactUrl: gichevaBook, excerpt: 'Консултациите са само с предварително уговорен час.',
  reviewedUrls: [gicheva, gichevaBook, gichevaServices, gichevaFamily, gichevaCookies],
  notes: 'Actual Consultation CTA leads to the owned contact form. Public actual form has name/email/message and service-type selector explicitly including family/inheritance law; no selection or values entered. Selected a real ordinary onsite consultation, not walk-in legal information or free emergency contact. Current home/contact identifyStefaniyaGicheva; stale reader titleNiyaGicheva is not imported as a second person/business. ExactTundzha25venue andMonFri9:30–17publishedhours retained, no map point inferred. Own services, detailed selected service and full cookie policy inspected by normal publicHTTPS after reader cache misses; navigation/footer exposes no separate price or general terms page. No copied article prose, qualifications, photographs, artwork, ratings or client cases. No search, phone call, form, message, cookies/consent or map actions.',
  serviceUrls: [gichevaServices, gichevaFamily],
  priceSearchNotes: 'Reviewed actual owned appointment form with selected service option, full practice home/contact/footer, services overview and detailed family/inheritance page. No numeric ordinary consultation fee or separate public fee schedule is published on these reviewed pages; references to package servicing do not state this service price. No blocked tariff was treated as unpublished. Fee, documents and appointment time require confirmation by the practice.',
})

export default { records, reviews }
