// Isolated manually reviewed intake005. Root owns imports, photos and identities.
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

const boeva = 'https://boevilaw.eu/', boevaBook = `${boeva}contact/`, boevaFees = `${boeva}law-tax/`, boevaTerms = `${boeva}obshti-uslovia`
add({
  id: 'sofia-boeva-boeva-yanko-sofiyski11', name: 'Адвокатска кантора Боева & Боева · Лозенец', category: 'consulting', neighborhood: 'Лозенец', address: 'София, кв. Лозенец, ул. Янко Софийски войвода 11', website: boeva, phone: '+359898650195', booking: { kind: 'form', url: boevaBook },
  services: [service('consulting', 'Правна консултация в кантората', 'Предварителна заявка с тема, предпочитани дата и час. Екипът потвърждава срещата и предлага информация за хонорара. Възнаграждението се договаря според конкретния казус; без автоматично потвърждение на свободен час.')],
}, {
  bookingUrl: boevaBook, excerpt: 'Запазете час за консултация като използвате контактната форма по-долу',
  reviewedUrls: [boeva, boevaBook, boevaFees, boevaTerms], serviceUrls: [boevaFees, boevaBook],
  priceSearchNotes: 'Actual Book entry led to a consultation-request form with name/phone/email, preferred date/time and consultation topic. Own complete fee-policy page says fixed or hourly remuneration is individually agreed in advance; no numeric fee is published for this selected consultation in the form, fee policy or homepage. The linked statutory scale is not this firm’s published literal tariff. No inaccessible price menu classified as absent.',
  notes: 'One current central Lozenets office, corroborated by contact and November2025 own terms. Secondary Vitosha office is not cloned without branch-specific appointment assignment. First phone is consistent across header/contact/terms; inconsistent second phone omitted. Complete terms read through ordinary public HTTPS after reader cache miss; copyrighted prose/images/logo/video are not copied, only independently phrased minimal facts. No fields, dates or consent entered and no submission. No business hours or duration inferred.',
})

const markova = 'https://markovadent.com/'
add({
  id: 'sofia-nikoleta-markova-mur72', name: 'Дентална клиника Доц. д-р Николета Маркова', category: 'other', neighborhood: 'Манастирски ливади', address: 'София, ж.к. Манастирски ливади – Запад, ул. Мур 72', website: markova, phone: '+359893656688',
  services: [service('other', 'Детска стоматологична консултация и профилактика', 'Детска дентална консултация и профилактична грижа с предварително записване по телефон. Конкретните дейности, цена и продължителност се уточняват с клиниката; договорът с НЗОК не означава, че всяка услуга е безплатна.')],
  openingHours: hours(markova, [[1, '13:30', '19:30'], [2, '13:30', '19:30'], [3, '13:30', '19:30'], [4, '10:00', '16:00'], [5, '09:00', '15:00']]),
}, {
  bookingUrl: markova, excerpt: '+359893656688 ... Запазете час',
  reviewedUrls: [markova, `${markova}za-docent-markova/`], serviceUrls: [markova, `${markova}za-docent-markova/`],
  priceSearchNotes: 'Followed actual header Book path first: current public homepage HTML has tel:0893656688 immediately paired with Reserve-an-appointment label, not an unreviewed calendar. Complete homepage dental-offering/contact section and own specialist page reviewed; no numeric fee or public tariff link appears for the selected child dental consultation/preventive care. Only public clinical facts used; no fee derived from NZOK relationship or articles. No blocked fee menu treated as unpublished.',
  notes: 'One real Mur72 Sofia venue, no separate staff or university-location record. Actual telephone Book target independently confirmed in own public HTML without following map/photo links. Child dentistry and preventive programs are explicit own offerings; specialist is a dentist, not an out-of-scope general doctor. Literal weekday clinical schedule retained, weekends not inferred. Footer includes template placeholders and broken newsletter shortcode, neither used as evidence. No source articles/photos, patient data, duration or coordinates imported.',
})

const boudinoff = 'https://bb-lawoffice.com/', boudinoffBook = `${boudinoff}thefirm/contact/`, boudinoffServices = `${boudinoff}thefirm/services/`, boudinoffCalc = `${boudinoff}elements/cost-calc/`
add({
  id: 'sofia-boudinoff-boudinoff-baucher87', name: 'Адвокатско дружество Будинов и Будинов', category: 'consulting', neighborhood: 'Лозенец', address: 'София, кв. Лозенец, бул. Джеймс Баучер 87', website: boudinoff, phone: '+35924519495',
  services: [service('consulting', 'Почасова правна консултация в кантората', 'С предварително уговорен час. Публикуваната базова ставка е от 100 € за всеки започнат час, без ДДС. Конкретната ставка се договаря преди насрочване според ранга на адвоката и казуса; абонаментните клиенти са с приоритет.', { price: price(100, 'всеки започнат час · базова ставка без ДДС', boudinoffServices, { kind: 'from' }) })],
  openingHours: hours(boudinoffBook, [1,2,3,4,5].map(day => [day, '09:00', '18:00'])),
}, {
  bookingUrl: boudinoffBook, excerpt: 'Можете да запазите час за консултация като позвъните на нашите линии',
  reviewedUrls: [boudinoff, boudinoffBook, boudinoffServices, boudinoffCalc, `${boudinoff}thefirm/privacy-bb/`],
  notes: 'Actual contact/booking FAQ explicitly offers telephone scheduling and preferred-date request form. Full current services page publishes base from100EUR, standard140 and premium175; selected only base starting hourly consultation, not an invented universal rate. Calculator page read over ordinary HTTPS after reader miss: physical/online meetings billed per started hour excluding VAT, rank determines rate; no calculator values entered. Own exact office address/contact HOURS09–18 confirmed. Privacy page partial review only, not claimed full terms clearance. No staff clones, customer fields, consent or booking submission; no duration scalar inferred from hourly billing.',
})

const soflaw = 'https://soflaw.bg/', soflawBook = `${soflaw}contact/`, soflawConsult = `${soflaw}pravni-konsultacii/`
add({
  id: 'sofia-soflaw-dotova-bozhinova-bacho-kiro5', name: 'Адвокатска кантора Дотова & Божинова · SofLaw', category: 'consulting', address: 'София, ул. Бачо Киро 5, вх.Б, ет.3, ап.13', website: soflaw, phone: '+359896884719',
  services: [service('consulting', 'Правна консултация в кантората', 'С предварително записване по телефон и уговорен хонорар според сложността и продължителността. Обсъждат се казусът и относимите документи. Обичайните 30–60 минути не са фиксирана продължителност; последващо представителство се договаря отделно.')],
  openingHours: hours(soflawBook, [1,2,3,4,5].map(day => [day, '09:00', '18:00'])),
}, {
  bookingUrl: soflawBook, excerpt: 'Как да запишете час за консултация? Можете да се свържете с нас по телефон',
  reviewedUrls: [soflaw, soflawBook, soflawConsult], serviceUrls: [soflawConsult],
  priceSearchNotes: 'Actual meeting/contact entry first, then complete owner consultation page updated8June2026 and current homepage. Consultation fee section explicitly says amount is individually agreed when booking according to case complexity and meeting length; no numeric fee appears in the booking flow or selected service. Statutory-remuneration article is not this firm’s tariff. No blocked price menu was labelled unpublished and no free legal-aid eligibility inferred.',
  notes: 'Current contact FAQ explicitly accepts telephone scheduling for onsite meetings and gives exact entrance/floor/apartment; one firm, not separate staff. Current homepage also expressly offers to reserve consultation time by the stated phone. Literal business weekday09–18 retained; service has variable30–60minutes or longer, so no duration scalar. No source legal advice, ratings, client testimonials or photos reproduced. Own public menus/footer reviewed; no separate terms/tariff link there. No form or consent submitted.',
})

const dankov = 'https://dankov-advokat.com/'
add({
  id: 'sofia-petyo-dankov-deliyska-vodenitsa330', name: 'Адвокат Петьо Данков', category: 'consulting', neighborhood: 'Дружба 2', address: 'София, ж.к. Дружба 2, ул. Делийска воденица 330', website: dankov, phone: '+359882417923', booking: { kind: 'form', url: dankov },
  services: [service('consulting', 'Уговорена почасова правна консултация', 'Предварителна заявка с предпочитани дата и час. Публикуван е минимален ориентировъчен хонорар 60 €/час според нормативната уредба; окончателният хонорар се определя за конкретния казус. Безплатно е запитването, не платената консултация.', { price: price(60, 'час · минимален ориентировъчен хонорар', dankov, { kind: 'from' }) })],
  openingHours: hours(dankov, [1,2,3,4,5].map(day => [day, '09:00', '18:00'])),
}, {
  bookingUrl: dankov, excerpt: 'Запишете консултация ... Предпочитана дата ... Предпочитан час',
  reviewedUrls: [dankov],
  notes: 'Actual Book consultation buttons lead to same-document request form with case type, preferred date/time and contact fields, all publicly readable. Complete same-page services, price table, precise contact and privacy policy reviewed. Own price table labels agreed hourly consultation60EUR and explicitly describes all amounts as minimum indicative values based on regulation, final fee individual; public description and from-kind preserve that qualification. Not a universal fixed quote or free consultation. Literal address330 preserved without converting it into a guessed block number. Saturday10–14by-booking text is not flattened into ordinary opening hours. No field, submission, consent or chatbot used.',
})

const bogomil = 'https://bogomilyordanov.com/', bogomilBook = `${bogomil}contacts/`, bogomilServices = `${bogomil}practice/`
add({
  id: 'sofia-bogomil-yordanov-sveti-naum55', name: 'Адвокат Богомил Йорданов', category: 'consulting', address: 'София, бул. Свети Наум 55', website: bogomil, phone: '+359890399993',
  services: [service('consulting', 'Правна консултация в кантората', 'Присъствена правна консултация след предварително записване по телефон. Темата, документите, хонорарът и продължителността се уточняват с адвоката. Не включва закупуване на електронен наръчник или автоматично поемане на дело.')],
}, {
  bookingUrl: bogomilBook, excerpt: 'За да запишете час за консултация, моля, обадете се предварително по телефона.',
  reviewedUrls: [bogomil, bogomilBook, bogomilServices, `${bogomil}prices/`, `${bogomil}zashtita/`], serviceUrls: [bogomilServices, `${bogomil}zashtita/`],
  priceSearchNotes: 'Actual contact/telephone appointment instructions first, then complete own legal-service roster, homepage and real Prices menu destination. Old /prices/ redirects normally to current credit-defense /zashtita/ page, not an inaccessible tariff. It publishes54EUR for a retail PDF handbook and legal/court-cost examples, not an onsite consultation fee. No numeric fee for selected meeting in these reviewed pages; individual representation remuneration is agreed. Retail ebook and statutory/court amounts intentionally excluded.',
  notes: 'One current Sofia office at SvetiNaum55 and first published appointment phone verified across contact/home/service pages. Did not duplicate advocate via alternate email domain or staff/biography labels. No weekly hours/duration/coordinates published for this selected meeting, so absent. Public privacy link reader cache miss was not claimed a completed terms review. Only minimal appointment-service/contact facts retained; no legal advice, source publications, autobiographical family/health detail, client cases or source media copied. No form or map used.',
})

const yana = 'https://advokat-kantora.com/', yanaBook = `${yana}index.html`, yanaProperty = `${yana}page4.html`
add({
  id: 'sofia-yana-bogdanova-vashington13', name: 'Адвокат Яна Богданова', category: 'consulting', address: 'София, ул. Георги Вашингтон 13, ет.3, офис 3.6', website: yana, phone: '+359886895998', booking: { kind: 'form', url: yanaBook },
  services: [service('consulting', 'Правна консултация за недвижим имот', 'Предварителна заявка за среща чрез собствената форма. Консултация по въпроси за придобиване, разпореждане или съсобственост на имот. Часът, обхватът и хонорарът се уточняват с кантората.')],
  openingHours: hours(yanaBook, [1,2,3,4,5].map(day => [day, '09:00', '17:00'])),
}, {
  bookingUrl: yanaBook, excerpt: 'Изпратете Вашето запитване или запишете час за консултация',
  reviewedUrls: [yana, yanaBook, yanaProperty], serviceUrls: [yanaProperty, yanaBook],
  priceSearchNotes: 'Actual consultation/contact entry resolves to owned index.html and its visibly labelled appointment-request form with name/email/phone/message. Complete own property-service page and homepage/contact/footer reviewed via ordinary public HTTPS after reader cache misses. No numeric fee or tariff/menu link is published for selected property consultation on these pages; no blocked pricing source called unpublished. No fee inferred from retail property values or statutory charges.',
  notes: 'Exact Sofia office and weekday09–17 repeated in complete service/contact pages. Actual public appointment form inspected, not submitted; generic pre-rendered success message is not evidence of a submitted request or confirmed appointment. Form uses the site-builder infrastructure, no external account or private endpoint was accessed. No phone-only booking claim from generic number. Source copyright-only footer respected with minimal independently phrased facts, not service prose, articles or images. No duration or map coordinates inferred.',
})

const gyoshev = 'https://gyoshevlaw.com/bg', gyoshevBook = `${gyoshev}/kontakti`
add({
  id: 'sofia-nikolay-gyoshev-pozitano39', name: 'Адвокат Николай Гьошев', category: 'consulting', neighborhood: 'Зона Б-5-3', address: 'София, ж.к. Зона Б-5-3, ул. Позитано 39', website: gyoshev, phone: '+359887353539', booking: { kind: 'form', url: gyoshevBook },
  services: [service('consulting', 'Първоначална правна консултация в кантората', 'Само първата консултация е обявена като безплатна. Предварителна заявка за лична среща в софийския офис; уточняват се темата и часът. Това не означава безплатно последващо представителство или всяка следваща правна услуга.', { price: price(0, 'само първата консултация', gyoshevBook, { currency: 'BGN' }) })],
  openingHours: hours(gyoshevBook, [1,2,3,4,5].map(day => [day, '09:00', '18:00'])),
}, {
  bookingUrl: gyoshevBook, excerpt: 'Първата консултация е напълно безплатна - лична среща, онлайн или по телефона.',
  reviewedUrls: [gyoshev, gyoshevBook, `${gyoshev}/services`],
  notes: 'Actual Reserve-consultation entry leads to owned contact/request form. Current own contact explicitly offers first consultation in person in Sofia and literally publishes0лв; imported only that conditional initial meeting, not a free ordinary follow-up/representation claim or converted fee. Working /bg/services separately publishes regular online general consultation from80BGN; that different paid offer is not imported or represented as free. Exact office and weekdays09–18 read in contact. Broken alternate /bg/uslugi returned404, not claimed reviewed service/price page. No fields, request, consent or map activation. Privacy link aliases same contact section; no separate full terms clearance or duration/coordinates claimed.',
})

const gaidarova = 'https://breketi-sofia.com/', gaidarovaBook = `${gaidarova}%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/`, gaidarovaServices = `${gaidarova}%D1%83%D1%81%D0%BB%D1%83%D0%B3%D0%B8/`
const gaidarovaRules = `${gaidarova}%D0%B2%D1%8A%D1%82%D1%80%D0%B5%D1%88%D0%BD%D0%B8-%D0%BF%D1%80%D0%B0%D0%B2%D0%B8%D0%BB%D0%B0-%D0%B7%D0%B0-%D0%BA%D0%BB%D0%B8%D0%BD%D0%B8%D0%BA%D0%B0-%D0%B3%D0%B0%D0%B9%D0%B4%D0%B0%D1%80%D0%BE/`
const gaidarovaTerms = `${gaidarova}%D1%83%D1%81%D0%BB%D0%BE%D0%B2%D0%B8%D1%8F-%D0%B7%D0%B0-%D0%BF%D0%BE%D0%BB%D0%B7%D0%B2%D0%B0%D0%BD%D0%B5/`
add({
  id: 'sofia-gaidarova-orthodontics-toshev64b', name: 'Ортодонтска клиника Гайдарова', category: 'other', neighborhood: 'Манастирски ливади', address: 'София, Манастирски ливади – Запад, ул. Генерал Стефан Тошев 64Б', website: gaidarova, phone: '+359878535889',
  services: [service('other', 'Първоначален ортодонтски преглед', 'Преглед само след предварително телефонно записване в работно време. След него се уговарят анализът, лечебният и финансовият план. При обсъждане на плана за пациент под 18 години присъства родител или настойник, съгласно вътрешните правила.')],
  openingHours: hours(gaidarovaBook, [[1, '12:30', '17:30'], [2, '10:00', '15:00'], [3, '12:30', '17:30'], [4, '10:00', '15:00']]),
}, {
  bookingUrl: gaidarovaBook, excerpt: 'Записвания за часове се правят само по телефон и спрямо работното време на клиниката.',
  reviewedUrls: [gaidarova, gaidarovaBook, gaidarovaServices, gaidarovaRules, gaidarovaTerms], serviceUrls: [gaidarovaServices, gaidarovaRules],
  priceSearchNotes: 'Actual Book entry first leads to contact page explicitly restricting appointments to telephone, not its general inquiry form. Own full service roster, current homepage and internal first-exam rules reviewed. Initial examination followed by individualized analysis/financial plan is explicit, but no numeric fee or linked tariff appears in these selected booking/service pages. No blocked price menu classified as absent. Variable40–60minute manipulation example is not an examination duration.',
  notes: 'One real GenStefanToshev64Б orthodontic venue; literal MonWed12:30–17:30/TueThu10–15 retained and no Friday/weekend availability invented. Only dentist first-exam offering, not medical injections/general doctors. Ordinary copyright clause inspected via normal public HTTPS after cache miss, with legal exceptions; parent explicitly cleared minimal independently phrased factual treatment on13November, same narrow approach as Excelsior. No licence or legal guarantee claimed, no source text/photos/logo/clinical outcomes reused. No phone call, form, consent, map or booking submission.',
})


const rodina = 'https://www.kursovete-bg.com/', rodinaBook = `${rodina}contact.html`, rodinaIndividual = `${rodina}individualni-chastni-uroci-po-matematika.html`
add({
  id: 'sofia-rodina-klokotnitsa29', name: 'Родина · индивидуални уроци по математика', category: 'education', address: 'София, ул. Клокотница 29', website: rodina, phone: '+359887099730',
  services: [service('education', 'Индивидуален урок по математика · 2 учебни часа', 'За ученици от 4. до 12. клас и кандидат-студенти, след предварителна уговорка на ден, час и продължителност. Публикувана цена 40–50 € за посещение от 2 учебни часа, без ДДС. Не е цена за един учебен час или за групов курс.', { appointmentModel: 'individual_training', price: price(40, 'посещение · 2 учебни часа · без ДДС', rodinaIndividual, { kind: 'range', maximum: 50 }) })],
}, {
  bookingUrl: rodinaBook, excerpt: 'За записване в курс или в индивидуална форма, моля предварително позвънете на телефон 0887 099730.',
  reviewedUrls: [rodina, rodinaBook, rodinaIndividual, `${rodina}rodina-school-training-base.html`, `${rodina}terms.html`, `${rodina}privacy.html`],
  notes: 'Actual enrollment/contact path first and individual-service instructions explicitly require advance phone call to agree lesson day/time and length. Literal individual40–50EUR per two academic units retained, with footer exclusion of VAT; no conversion, single-unit price or assumed90minute scalar. Complete course terms and publicly linked website privacy/data policy read; no broad data/extraction/non-commercial restriction found there. Teaching-base page and terms bind all private/group classes to Klokotnitsa29. Unaddressed contact map labels and old Gurko74 information office are not additional venues. Conflicting administrative/teacher/footer hours omitted. No phone call, form, lesson/date choice or payment made.',
})

const bsg = 'https://servicebg.net/', bsgBook = `${bsg}index.php/zayavka-za-remont`, bsgContacts = `${bsg}index.php/kontakti`
const bsgService = `${bsg}index.php?catid=2:uncategorised&id=2:remont-na-peralna-susilna&view=article`
add({
  id: 'sofia-bulgaria-serviz-group-home', name: 'България сервиз груп · домашни посещения София', category: 'home_services', locationKind: 'service_area', website: bsg, phone: '+359882266900', booking: { kind: 'form', url: bsgBook },
  services: [service('home_services', 'Диагностика и ремонт на пералня на адрес', 'Заявка за посещение на сервизен специалист в София. Оператор уточнява случая и насрочва часа; цената и частите се съгласуват според уреда и повредата. Гаранционното обслужване зависи от условията и документите на уреда.', { appointmentModel: 'home_visit' })],
}, {
  bookingUrl: bsgBook, excerpt: 'Заявка за ремонт ... Населено място ... Адрес ... Кратко описание на повредата',
  reviewedUrls: [bsg, bsgBook, bsgContacts, bsgService, `${bsg}index.php/deklaracia-za-poveritelnost`], serviceUrls: [bsgService, bsg],
  priceSearchNotes: 'Actual owned repair-request form first, then full washer/dryer service article, homepage, contact and full privacy declaration. Service article expressly says operator calls back to clarify request and schedule technician visit. These pages publish no numeric repair/diagnosis tariff or linked service-price menu; parts ecommerce is distinct retail and not a repair fee. Warranty/nonwarranty offerings both explicit, but no zero fee inferred. No blocked menu called unpublished.',
  notes: 'Exactly one Sofia mobile-service record despite three own Sofia service bases and national coverage; no per-quarter clones or premises distance pin. Genuine technical repair service, not merely a spare-parts store. Shared published mobile0882266900 corroborated by current Sofia contact; national0700 number not incorrectly converted. Own request form inspected including appliance/warranty inputs and anti-spam field, without entering data, uploading documents, solving challenge or submitting. No public hours on relevant pages, so omitted. Robots allows public pages with3second delay respected between direct host requests.',
})

const iota = 'https://iotacentre.bg/', iotaMath = `${iota}podgotovka-za-nvo-7-klas-matematika/`
add({
  id: 'sofia-iota-studentski-bl55', name: 'Образователен център Йота', category: 'education', neighborhood: 'Студентски град', address: 'София, Студентски град, бл.55, вх.Г, откъм градинката', website: iota, phone: '+359888834740',
  services: [service('education', 'Частен урок по математика · 7. клас', 'При един урок седмично с уговорен час; месечно предплащане до 10-о число. При отмяна от ученика първият отменен урок не се таксува, а следващите се заплащат изцяло. Отменен от преподавателя урок се премества в същия месец по уговорка.', { appointmentModel: 'individual_training', durationMin: 90, durationSourceUrl: iotaMath, durationCheckedOn: checkedOn, price: price(35, 'частен урок · 90 минути · при 1 урок седмично', iotaMath) })],
}, {
  bookingUrl: iotaMath, excerpt: 'За записване или въпроси: Телефон: 0888 834 740', contactUrl: `${iota}contact-us/`,
  reviewedUrls: [iota, iotaMath, `${iota}contact-us/`, `${iota}terms-and-conditions/`, `${iota}podgotovka-za-parvi-klas/`],
  notes: 'Followed actual current2026/27 selected-course enrollment section explicitly accepting phone0888834740, not inferred from generic contact form. Same full page separately offers private mathematics lessons35EUR90minutes once/week with monthly prepayment and detailed cancellation terms, retained literally rather than course1080EUR/three360 installments. Full own terms read; onsite registration/contract/payment required and current centreblock55 differs registeredUniversityPark9, not a branch. Preschool130EUR/four visits not imported as one visit. No general opening hours inferred from group schedules; no claimed live slot or automatic enrollment. No child/customer fields, consent, calls, payment or map opened.',
})

const lozenetzDental = 'https://lozenetzdentalclinic.com/', lozenetzDentalBook = `${lozenetzDental}kontakti/`, lozenetzDentalPrices = `${lozenetzDental}cenorazpis/`
add({
  id: 'sofia-lozenetz-dental-bigla50', name: 'Lozenetz Dental Clinic', category: 'other', neighborhood: 'Лозенец', address: 'София, ж.к. Лозенец, ул. Бигла 50', website: lozenetzDental, phone: '+359883402585', booking: { kind: 'form', url: lozenetzDentalBook },
  services: [service('other', 'Обстоен дентален преглед със снемане на орален статус', 'Преглед на място след заявка и потвърждение от екипа. Публикувана цена за обстоен преглед със снемане на орален статус; снимки, сканиране и последващо лечение са отделни позиции в тарифата.', { price: price(30, 'обстоен преглед със снемане на орален статус', lozenetzDentalPrices) })],
  openingHours: hours(lozenetzDentalBook, [1,2,3,4,5].map(day => [day, '08:00', '20:00'])),
}, {
  bookingUrl: lozenetzDentalBook, excerpt: 'Попълнете нашия кратък формуляр, за да заявите среща, и нашият екип ще се свърже с вас, за да потвърди',
  reviewedUrls: [lozenetzDental, lozenetzDentalBook, lozenetzDentalPrices, `${lozenetzDental}uslugi/`, `${lozenetzDental}politika-za-poveritelnost/`, 'https://superdoc.bg/klinika/dentalna-klinika-lozenetz'],
  notes: 'Actual main Book first follows explicit owner link to this Superdoc clinic page, then owned contact/service-page meeting-request form independently inspected. Stored booking is owned appointment form requiring name/phone/service/message and later confirmation, not a claimed automated slot. Own current tariff has exact30EUR status exam; no provider ratings/photos/availability or clinician fees copied. One Bigla50 clinic, no six staff clones. Registered privacy-administrator addressSvOsiyKordobski124 is not treated as another clinic. Own current contact/footer addsSunday10–16 while provider page saysclosed; omittedSunday and retained only agreedweekday08–20. Privacy policy partial text review, not full terms clearance. No fields, consent or booking submitted, no maps/geocoding.',
})

const todorinov = 'https://www.martintodorinov.com/'
add({
  id: 'sofia-martin-todorinov-nadezhda173', name: 'Дентална клиника Тодоринов', category: 'other', neighborhood: 'Надежда 1', address: 'София, ж.к. Надежда 1, бл.173', website: todorinov, phone: '+359898539453', booking: { kind: 'form', url: todorinov },
  services: [service('other', 'Дентална профилактика', 'Предварителна заявка за час в денталната клиника с кратко описание на проблема. Екипът уточнява подходящата дейност, цена и продължителност. Не е автоматично потвърден час или обещание за конкретен лечебен резултат.')],
}, {
  bookingUrl: todorinov, excerpt: 'Заявете час: ... Вашето име ... Вашият телефон за връзка',
  reviewedUrls: [todorinov], serviceUrls: [todorinov],
  priceSearchNotes: 'Followed actual Reserve-an-appointment contact anchor first: owned same-document form requests name/email/phone and a brief problem description. Complete single-page clinic, service roster, appointment form and footer reviewed; prevention and dental treatment are explicit offerings, but no numeric fee or tariff link appears. No distinct hidden or inaccessible price menu identified and no fee derived from testimonials, equipment or outcomes. Own-page form is not a claimed confirmed calendar slot.',
  notes: 'One real Nadezhda1block173 dentist venue, not a general human clinic or separate staff profiles. Public form action/visible fields inspected in ordinary primary HTML, without calling endpoint, entering customer data or submitting. Complete main page contains no weekly hours or appointment duration, so omitted. Footer has ordinary copyright statement; minimal independently phrased facts only, no testimonials, source photos/logo or clinical assurances reused. Public robots404 is absent file, not an allow licence. Embedded map was not opened and its viewport coordinates were not imported.',
})

export default { records, reviews }
