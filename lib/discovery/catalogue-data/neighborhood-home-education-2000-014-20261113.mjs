// Frozen manually reviewed intake014. Root owns integration/photos/identities.
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

const dahterov = 'https://dahterov.com/'
const dahterovBook = `${dahterov}services/property-deals/`
add({
  id: 'sofia-dahterov-tsarigradsko5', name: 'Нотариална кантора Дахтеров', category: 'consulting',
  address: 'София, бул. „Цариградско шосе“ 5, вх. Б', website: dahterov, phone: '+35929442887',
  openingHours: { sourceUrl: `${dahterov}contacts/`, checkedOn, days: [1,2,3,4,5].map(weekday => ({ weekday, periods: [{ open: '08:30', close: '17:30' }] })) },
  services: [service('consulting', 'Консултация с нотариус по документи за имот в София', 'Предварително записана среща по представени документи за собственост и въпроси около сделка с имот в София. Денят и часът се съгласуват с кантората. Самото изповядване на сделката, изготвянето на акт и удостоверяванията са отделни дейности, не включен пакет.')],
}, {
  bookingUrl: dahterovBook, contactUrl: `${dahterov}contacts/`,
  excerpt: 'Началната и избраната имотна страница изискват предварително записване за консултация с нотариуса; собствените контакти дават 02 944 2887 и работното време.',
  reviewedUrls: [dahterov, `${dahterov}contacts/`, dahterovBook], serviceUrls: [dahterovBook],
  priceSearchNotes: 'ActualrootЗапазваненачас→ownedContact inspectedfirst, fullroot/about andselectedpropertyconsultationBook/service/fees read. No fee/range/duration published forincludedPRETRANSACTIONCONSULTATION itself. Selectedpage DOESpublish separateBGNpropertytransaction/notarialact fees bymaterialinterest, draft/endorsement/copiestax/exVAT/additionalregistration/localtaxconditions; these arenot a consultationprice andnot converted orimported. No actualconsultationpricemenu blocked/conflicted or declaredunpublishedfromerror. Strictreceipt ONLYincludedconsultation, no claimwholewebsiteunpriced/completeorfree.',
  notes: 'ActualrootexplicitadvanceappointmentREQUIRED forNOTARYREAL-ESTATECONSULTATION andpropertytransactions; ordinaryothernotarywalk-in services deliberatelyNOT imported. Selectedpropertypage explicitЗапишетечас/Pozvanete→ownContact phone29442887/29461991/29441804, all3phones+IvanVasilevDahterov/operator/addresspreflightzero runtimeSOFIA+ALL2000WIP. OwnrootactualofficeTsarigradsko5entranceB, ground/firstfloor departmentsONEbusiness notfloor/staff/roomclones; no precisequarter/pin guessed. ActualofficeMonFri08:30–17:30 sourceContact; statutorytransaction08:30–13:30 onselectedpage NOT substitutedforconsultationhours, no fixedappointmentduration. Weekends/officialholidaysnotassertedavailable. Actualrootallhref/contact/selectedservice/footer no separateTerms/privacy surfaced, ordinary2023AllRightsReserved; minimalindependentlyphrasedbusiness/appointment/service/addressfacts only, no legalguidance/prose/documenttemplates/teamcredentials/photos copied or generallicence/legalclearanceclaim. SamepageBGNtransactiontariffandmanylegalrequirements not madecurrentlegaladvice or importedfees; sourceconsultationactualseparatebookedservice. Genuineunpublishedservice_reviewed notprice-reviewed. No clientdocuments/phone/form/date/consent/payment/action/API/Maps/UI/geocode/bookingwrite.',
})

const iskrenova = 'https://fidosova.bg/'
const iskrenovaBook = `${iskrenova}контакти/`
add({
  id: 'sofia-iskra-iskrenova-hubavka8', name: 'Нотариус Искра Искренова', category: 'consulting',
  neighborhood: 'Гео Милев', address: 'София, Гео Милев, ул. „Хубавка“ 8, партер', website: iskrenova, phone: '+359884800101',
  openingHours: { sourceUrl: iskrenovaBook, checkedOn, days: [...[1,2,3,4,5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '17:30' }] })), { weekday: 6, periods: [{ open: '10:00', close: '14:00' }] }] },
  services: [service('consulting', 'Консултация за нотариални документи и удостоверявания', 'Предварително записана консултация в нотариалната кантора относно документи и нотариални действия. Конкретният час и предметът на срещата се уточняват по телефона. Не се представя като пакет с извършено удостоверяване, сделка или изготвен документ.')],
}, {
  bookingUrl: iskrenovaBook,
  excerpt: 'Собствените контакти изрично канят за записване на час за консултация на 0884800101 или 0877229622 и посочват реалния адрес и работното време.',
  reviewedUrls: [iskrenova, iskrenovaBook, `${iskrenova}услуги/`], serviceUrls: [`${iskrenova}услуги/`],
  priceSearchNotes: 'ActualownedContactЗапишетечасзаконсултация phoneentry reviewedfirst, fullServicesindex withsameexplicitconsultationcall/phones/hours androotallnavigation/footerhrefs. No numericconsultationfee/range/duration orPrices/Tarifflink surfacedreviewedpages; includedONLYinitialnotarialconsultation, notunderlyingnotarialacts/propertytransfers/documentdrafting/unreviewedsubpages. No blocked/inaccessiblemenu orotherpublishedconflictingconsultationfee reclassifiedasunpublished. No statutoryrate/0free/conversion inferred; service_reviewed notprice-reviewed.',
  notes: 'ActualContact explicitadvancePHONEBookFORCONSULTATION, notgenericcontact-only, sameServicesindex Иматенуждаотконсултация/Позвънетени binds884800101/877229622. ActualownnameIskraFidosovaIskrenova: brand/currentnotaryIskraIskrenova andlegacyfidosova.bghost areONEpractice, notname/personaliasclones; teamassistantnotaries/staffnotseparatebusinesses. CurrentContact/ServicesaddressHubavka8groundfloorGeoMilev andsamephones/hours; runtimeSOFIA+ALL2000WIP bothphones/host/Fidosova/Iskrenova/name/addresspreflightzero. MonFri09–17:30Sat10–14 actualconsultationcall/service+officehours, no Sundayorholidayavailability/duration inferred. Robustactualrootnav/allhref/contact/services/footer no separateTerms/privacy/pricemenulink surfaced, ordinary2026copyrighttext only; no broadlicence/unseenpolicy/legalclearanceclaim. Independentlyphrasedminimalservice/Book/venuefacts only, no copiedlegalinstructions/documenttemplates/news/prose/teamqualifications/reviews/photos. No externalregistry/directions/Google/sociallinks followed, coordsnull. No phonecall, clientdocument/form/date/consent/payment/API/action/UI/bookingwrite.',
})

const belezhkov = 'https://notarius617.com/'
const belezhkovBook = `${belezhkov}нотариални-услуги/`
add({
  id: 'sofia-krasimir-belezhkov-hubcha2', name: 'Нотариус Красимир Бележков', category: 'consulting',
  neighborhood: 'Красно село', address: 'София, Красно село, ул. „Хубча“ 2, ет. 2, над супермаркет „Фантастико“', website: belezhkov, phone: '+35929876645',
  openingHours: { sourceUrl: `${belezhkov}контакти/`, checkedOn, days: [1,2,3,4,5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '17:00' }] })) },
  services: [service('consulting', 'Устна нотариална консултация с предварително записване', 'Публикувана такса на час без ДДС; добавя се 20% ДДС. Консултациите се провеждат само след предварително записване по телефона в работното време на кантората. Изготвяне или проверка на документи и нотариални удостоверявания се таксуват отделно.', { price: price(4.09, 'час устна консултация · без ДДС', `${belezhkov}notarialni-taksi/`) })],
}, {
  bookingUrl: belezhkovBook, contactUrl: `${belezhkov}контакти/`,
  excerpt: 'Избраната собствена страница включва консултациите сред услугите само с предварително записване и изрично посочва телефон 02 9876645 за запазване на час.',
  reviewedUrls: [belezhkov, belezhkovBook, `${belezhkov}контакти/`, `${belezhkov}notarialni-taksi/`, `${belezhkov}politika-za-poveritelnost/`],
  notes: 'ActualrootBook/#rezervacii inspectedfirst afterlinkedpolicyreview, embeddedformonlyloadingtext—notclaimedrenderedGooglecalendar, no Googleiframe/APIorformrequested. IndependentactualVOICEpath sourceNotarialniUslugi explicitlylistsCONSULTATIONS amongONLYADVANCEBOOKservices andendsPHONEBook29876645withinworkinghours; sameContact repeatsphoneinstruction/actualvenue/hours. Generalwalk-inendorsements/carcontracts not imported. LiteralOWNcurrentEURtariff4.09EUR PERHOURoralconsultation, EXVAT+20%VATpubliclypreserved, not ourconversionof8BGN/statutoryinference orcomputed4.91total. No fixed60mindurationMin/startedhourrounding/flatvisitfee inferredwherecurrentownedEURpageonlysayshour. Drafting/checking/documents/notarialacts separatefees notincluded. Currentcontact/updated24Oct2026full3558charprivacy exactHubcha2floor2KrasnoSelo, oneactualoffice notnearbylistedgovernmentaddresses/rowsofproximityplaces asvenues. Ownphone29876645Book chosen; alternative887326767 alsodedupedzero withoperator/host/address inruntimeSOFIA+ALL2000WIP. ActualMonFri09–17 office/phonebookhours preserved, no weekends/holidaydurationguess. FullprivacyordinaryGDPR/accesssecurity/formretention, no dataDB/automation/wholewebsitepersonalnoncommercialrestriction; actualroot/nav/footer no separateTerms surfaced, no unseenpolicy/licence/legalclearanceclaim. Minimalindependentlyphrasedservice/Book/fee/addressfacts only, no statutes/legaladvice/templates/prose/photos/qualifications copied, no customerdocuments/Google/Maps/call/form/date/consent/payment/action/API/UI/geocode/bookingwrite.',
})

const angelova = 'https://www.angelova789.com/'
add({
  id: 'sofia-violeta-angelova-james-bourchier95-97', name: 'Нотариус Виолета Ангелова', category: 'consulting',
  neighborhood: 'Лозенец', address: 'София, Лозенец, бул. „Джеймс Баучер“ 95–97, ет. 1 (надпартерен)', website: angelova, phone: '+359877900444',
  services: [service('consulting', 'Предварителна нотариална консултация по имотни документи', 'Предварително уговорена консултация по документи за собственост на имот в София. Обсъждат се специфичните изисквания и организацията на евентуалната сделка. Часът се уговаря с кантората; изповядване на сделка, изготвяне на акт и удостоверявания не се представят като включен пакет.')],
}, {
  bookingUrl: angelova,
  excerpt: 'Избраната имотна услуга изрично кани за предварително записан час за консултация; същата собствена страница посочва телефон 0877900444 и реалния адрес.',
  reviewedUrls: [angelova], serviceUrls: [angelova],
  priceSearchNotes: 'Read ENTIREactualonepage3464charbody andallnavigation/footerlinks, actualselectedpropertyconsultationappointmentinvitation beforefeesreview/contact. AllnavanchorsresolvewithinSAMEownedpage; no numericconsultationfee/range/duration, tariff/Prices link, separateBookcalendar/form orblockedactualpricemenu found. Genuineunpublishedreceipt ONLYexplicitpretransactionconsultation; notclaimallstatutorynotaryactionsfree/unpriced orcompletecourse/caseworktariff. No statutoryrate/0fee/EURconversion inferred; missingpriceremainsabsent/service_reviewed.',
  notes: 'Actualselectedpropertyservice expresslyinvitesADVANCEAPPOINTMENTFORCONSULTATIONonsubmittedownershipdocuments, linkedwithSAMEownedonepage solephone877900444/email andactualoffice. ThisisNOTgenericcontact-only; explicitserviceappointmentinvitation plusownpubliccontactisindependentphonearrangement, rootnarrowlyreviewedcachedlinkage. No fabricatedverbatimcalltobooktext, callbackpromise, onlinecalendar/form orinstantavailability claim. Fullbody/allhrefreview onephysicalnotaryofficeJamesBourchier95–97floor1abovegroundLozenets, ownerVioletaAngelova; fivejurists/twoclerks/severalroomsONEpractice, notstaff/roomclones. ThisisdistinctVIOLETAnotary, NOTglobalSTOPLyudmilaAngelovalawyerhost; no STOPrefsopened. RuntimeSOFIA+ALL2000WIP host/operator/phone/addresspreflightzero. No numericweeklyhours/duration/pin published, omittednotguessed. Ownfooterstatesnotarysiteownership, allnav/selectedservice/Contactfooterno separateTerms/privacy/pricelink surfaced, no broadlicence/unseenTerms/legalclearanceclaim. Minimalindependentlyphrasedbusiness/appointment/service/addressfacts only, no legalguidance/articles/sourceprose/teamqualifications/photographs copied. Strictservice_reviewed genuinelyunpublished notprice-reviewed, not a blockedmenuworkaround. No phone/form/date/customerdocuments/customerdata/consent/payment/action/API/Maps/geocode/UI or bookingwrite.',
})

export default { records, reviews }
