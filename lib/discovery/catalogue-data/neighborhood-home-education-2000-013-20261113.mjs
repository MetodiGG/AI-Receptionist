// Frozen manually reviewed intake013. Root owns integration/photos/identities.
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

const famete = 'https://www.fatibg.com/'
const fameteBook = `${famete}online-zapisvane/`
const fameteGerman = `${famete}individualni-uroci-po-nemski-ezik/`
add({
  id: 'sofia-famete-rakovski99', name: 'Езиков център Фамете', category: 'education',
  address: 'София, ул. „Г. Раковски“ 99', website: famete, phone: '+359899884630',
  booking: { kind: 'form', url: fameteBook },
  services: [service('education', 'Индивидуални присъствени уроци по немски език', 'Цена за учебен час от 45 минути, не за пакет от 20 часа. Графикът и материалите се съгласуват с центъра; заявката и плащането са по уговорените условия. Отмяна до 10:00 предходния ден, до 20% от заявените часове; иначе часът се таксува. Онлайн формата е само за навършили 18 години.', { price: price(25, 'учебен час · 45 минути', fameteGerman) })],
}, {
  bookingUrl: fameteBook, contactUrl: `${famete}контакти/`,
  excerpt: 'Собствената форма приема заявка за избран език; центърът потвърждава мястото и подробностите. Индивидуалният график се уговаря предварително.',
  reviewedUrls: [famete, fameteBook, fameteGerman, `${famete}контакти/`, `${famete}общи-условия/`],
  notes: 'Actual rootBook→online-zapisvane inspected first after full26664charTerms reviewed; visible requiredname/email/phone/language/message/Termsconsent/18+declaration, ownercallback confirmsplace/details, no claimedinstantavailability or submittedfields. IndividualGerman selectedpage explicitly offersinperson atoffice, currentownBook/contact bindRakovski99 and899884630; TermsMete5EOOD/Druzhba1block156 is supplierregisteredaddress, not addedas secondvenue or substituteactivityaddress. Under18 enrollment onlyinpersonwithparent perTerms§9, publiconline18+qualification preserved without claimingallteachingadultonly. Literal25EUR PER45min academicunit, NOT470EUR20unitpackage or23.50packageunitfee, no fixedappointmentdurationMin inferred; Terms§26 groupmodule40min distinctfromexplicitindividual45minfee. Termsindividualschedule agreedatstart orweekahead, maydeclineflexibility; materialsagreed, cancelby10previousday andmax20%hours elsecharged, latenessdoesnotextend, withdrawaldoesnotrefund; no inventedminimumunits/prepaymentrate from group50%deposit. Actualroot/Book/contact no weeklyteachinghours found; omittedratherthanofficeguess. FullTerms§55 copyrightsTEACHINGmaterials forpersonalstudentuse, §56 confidentialclassinformation withpublicinformationexception; no sitefact/database/extraction/noncommercialwholewebsiteban observed. Minimalindependentlyphrasedmerchant/service/appointmentfacts only, no educationalmaterial/articles/reviews/images/qualifications/design copied, no licence/legalclearance claim. RuntimeSOFIA+ALL2000WIP domain/operator/phone/address preflight zero; oneactualvenue, coordsnull. No form/date/customerdata/consent/call/payment/action/API/Maps/UI or bookingwrite.',
})

const engineering = 'https://computer-serviz.bg/'
const engineeringBook = `${engineering}comp/repcomp.html`
add({
  id: 'sofia-serviz-engineerings-home-computers', name: 'Сервиз Инженерингс · компютри на адрес', category: 'home_services',
  website: engineering, phone: '+359896793133',
  services: [service('home_services', 'Общи хардуерни услуги на адрес в София', 'Труд за общи хардуерни задачи до един час, след предварителна уговорка на ден и час по телефона. Посещението в София е без отделна такса, но резервните части не са включени. Конкретният проблем и възможността за ремонт на място се уточняват предварително.', { price: price(48.99, 'труд за общи хардуерни услуги · до 1 час', `${engineering}prices.html`) })],
}, {
  bookingUrl: engineeringBook, contactUrl: `${engineering}contacts.html`,
  excerpt: 'Собствената услуга за посещение в София изрично препоръчва предварително записване на удобен ден и час; същата страница и контактите посочват сервизния телефон 0896793133.',
  reviewedUrls: [engineering, engineeringBook, `${engineering}contacts.html`, `${engineering}prices.html`],
  notes: 'Actual rootЗаявказасервиз→contacts inspected before selectedSofiahomevisitBook page, which explicitly recommendsbookingconvenientDAYandHOUR inadvance via current896793133; notgenericcontact-only or guaranteedSamedayservice. Fullselectedservice andfulltariff agree48.99EUR GENERALHARDWARELABOUR UPTO1h, partsEXCLUDED. FREEvisitwithinSofia is onlyattendancecondition alongsidepaidlabour, never importedasstandalone0EURservice; no fixed60mindurationMin, VAT/mincrew/partsamount guessed. OneSofia service_area/home_visit; no streetpublished so address/coordinatesnull, no quarter/shop/retailbranch clones. ContactMonFri09–18 is generalservice/contactworkingtime not explicitlyconfirmedhomevisitschedule, omittednumericopeningHours. ActualcontactnamesServizEngineeringsEOOD andcurrentwebsite/phone; Mark-Onecopyrightfooter observedandcheckedasoperatoralias, not a secondmerchant. Robustpublicrootallhref/nav/footer/contact/service/pricelinks no separateTerms/privacy surfaced, ordinaryAllRightsReserved only; no unseenpolicyclearance or contentlicence claim. Minimalindependentlyphrasedmerchant/service/bookingfacts only, no marketingqualityclaims/articles/repairinstructions/photos/logos/customerdata copied. RuntimeSOFIA+ALL2000WIP domain/phone/ServizEngineerings/Mark-One/name preflight zero. No calls, customeraddress, form/booking/payment/action, deviceaccess, API, Maps/geocode or UI.',
})

const allegro = 'https://suggestopediabg.com/'
const allegroBook = `${allegro}contact/`
for (const venue of [
  { id: 'sofia-allegro-vivace-shesti-septemvri37', name: 'Алегро Виваче · Шести септември', address: 'София, Essence Center, ул. „Шести септември“ 37', phone: '+359988833411' },
  { id: 'sofia-allegro-vivace-andrey-lyapchev72', name: 'Алегро Виваче · Младост 2', neighborhood: 'Младост 2', address: 'София, ж.к. Младост 2, бул. „Андрей Ляпчев“ 72', phone: '+359893355354' },
  { id: 'sofia-allegro-vivace-dimitar-manov18', name: 'Алегро Виваче · Иван Вазов', neighborhood: 'Иван Вазов', address: 'София, кв. Иван Вазов, ул. „Димитър Манов“ 18', phone: '+359893355354' },
]) add({
  ...venue, category: 'education', website: allegro,
  services: [service('education', 'Първоначална езикова среща-събеседване за възрастни', 'Безплатно първоначално събеседване-тест с преподавател след предварително уговорени ден, час и обект. Целта е определяне на езиковото ниво и обсъждане на предстоящите обучения. Това не е платен урок или записване в цял курс; наличието на място се потвърждава отделно.', { price: price(0, 'първоначална среща-събеседване за възрастен', `${allegro}pricing-info/`) })],
}, {
  bookingUrl: allegroBook,
  excerpt: 'Контактите свързват трите реални центъра с адреси и телефони и изискват предварителна уговорка на ден и час за първоначален тест с преподавател.',
  reviewedUrls: [allegro, allegroBook, `${allegro}terms-of-use/`, `${allegro}pricing-info/`, `${allegro}english-courses/individual-classes/`],
  notes: 'ActualrootContact/Свържетесе enrollmententry inspected before selectedprogram/prices: sameownedContact bindsallTHREEcurrentnamedphysicallearninglocations/phones andexplicitRESERVEDDAY/HOUR initialteacherplacementtest. Venue-specificpublicphone retained, shared893355354foractualMladost2/IvanVazovphysicalcentres isnotstaff/mobileclone; EssenceCenterShestiSeptemvri37 actualnamedlocationnotgenericofficeassumption. Currentpricing separatelyexplicitFREE initialmeetingforADULTS andchildren; includedONLY adultinitialplacementtest, notpaidEnglishlesson orfree-demo masqueradingaspaidcourse. SourceindividualEnglish sayssomeowncentre, insufficienttoassignpaidEnglishtoALL3: no40BGNindividualfee/60minduration projected. PaidgroupTerms690BGN vscurrentpricing790BGNconflictHELD; no fullcoursepriceclearance. Terms150BGNdeposit/futurecourseavailability/cancellationcreditrules applysubsequentcourse, not a fee forincludedFREEinitialtest. Full1912charTerms reviewed, courseparticipation/paymentconditions only, no dataDB/extraction/automation/wholewebsitepersonalnoncommercialban observed; minimalindependentlyphrasedfacts only, no educationalmaterial/reviews/marketingclaims/photos/prose/licence/legalguarantee. Robotsallowsgeneralpublicwith10sCrawldelay; successiveownhostrequests spacedatleast10seconds, no bannedbotidentityclaimed. No numericweeklyinitialtesthours/duration published, omittedratherthanprojectinggroupcalendar/officehours. RuntimeSOFIA+ALL2000WIP exacthost/base/operator/988833411/893355354/address preflightzero; rootnarrowbranch/testreviewaccepted actualContactbinding, rootownsIDs/photos/independentCSVpoints. No phone/form/date/customerdata/consent/payment/API/action/Maps/UI or bookingwrite.',
})

const vbt = 'https://www.vbt-law.com/'
const vbtBook = `${vbt}contact`
add({
  id: 'sofia-yonev-kanchelov-dimitar-petkov111', name: 'Адвокатско дружество Йонев и Канчелов', category: 'consulting',
  address: 'София, ул. „Димитър Петков“ 111, ет. 2, офис 4', website: vbt, phone: '+359878588541',
  openingHours: { sourceUrl: vbtBook, checkedOn, days: [1,2,3,4,5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '18:00' }] })) },
  services: [service('consulting', 'Правна консултация по семейно и наследствено право', 'Предварително уговорена среща в кантората за обсъждане на семеен или наследствен казус. Конкретният час се съгласува по телефона. Процесуално представителство и изготвяне на документи не се представят като включени в самата консултация.')],
}, {
  bookingUrl: vbtBook,
  excerpt: 'Контактната страница изрично кани за обаждане на посочените телефони, за да се уговори среща в удобно време, и свързва реалния адрес на кантората с работното ѝ време.',
  reviewedUrls: [vbt, vbtBook, `${vbt}services`],
  serviceUrls: [`${vbt}services`],
  priceSearchNotes: 'Read actualownedContact/phoneappointment instructionfirst, fullselectedServicesindex andfullroot/body/navigation/footerallhrefs. Selectedfamily/inheritancelawconsultations areexplicitlyoffered but no numericfee/range/package/duration orPrices/tarifflink appears inthesereviewedpages. No actualpricemenu blocked/inaccessible or conflictingfee reclassifiedasunpublished. Strictreceipt coversONLYincludedconsultation, notunreviewedcasework/representation/documentpreparation; absentprice isnot0/free andnotprice-reviewed.',
  notes: 'Actual ownContactУговоретесреща explicitlyinviteCALLcurrent878588541/887610499/878588561 toagreeconvenientmeetingtime, notgenericphonecontact or chat-onlypath. OneactualYonevKanchelovlawfirm atDimitarPetkov111floor2office4; currentrootnamesoperator andsameaddress/3phones, selectedServicesexplicitfamily/inheritanceconsultations. Threepubliclawyers/phones areONEoperator/premise notstaffbusinessclones; runtimeSOFIA+ALL2000WIP all3phones/host/operator/name/address preflightzero. ContactactualfirmworkingMonFri09–18 preserved, no weekendclosure/afterhours guessed. No numericconsultationduration/fee published; noneinferredfromstatutorytariffs orgeneralcasework. PublicSquarespace robots allowroot/contact/services, prohibitconfig/search/account/API/static/formatqueries; no bannedpaths/APIqueried. Robustrootallhref andreviewedcontact/service/footer no separateTerms/privacy/pricelink surfaced, no unseensourceclearance/licence/legalguarantee claim. Independentlyphrasedminimalmerchant/realappointment/service/addressfacts only, no caseadvice/articles/creativeprose/teamcredentials/photos/clientcases/reviews copied. Phonebookingreceipt sourceexactactualContact; genuineunpublishedservice_reviewed distinctfromprice-reviewed. Coordinatesnull, no ownerpoint/viewport/geocode guess. No calls, customerform/address/documentdata/consent/calendar/action/payment/bookingwrite/API/Maps/UI.',
})

export default { records, reviews }
