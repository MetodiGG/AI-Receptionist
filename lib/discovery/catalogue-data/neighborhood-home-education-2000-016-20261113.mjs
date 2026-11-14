// Frozen manually reviewed intake016. Root owns integration/photos/identities.
// Filename is intake identifier; actual new source review day is UTC2026-11-14.
const checkedOn = '2026-11-14', validUntil = '2027-02-12'
const records = [], reviews = []
const service = (category, name, description, facts = {}) => ({ category, appointmentModel: category === 'home_services' ? 'home_visit' : 'appointment', name, description, ...facts })
const price = (amount, unit, sourceUrl, extra = {}) => ({ amount, currency: 'EUR', kind: 'fixed', unit, sourceUrl, checkedOn, ...extra })
function add(facts, evidence) {
  const { bookingUrl, contactUrl = bookingUrl, excerpt, reviewedUrls, notes, priceSearchNotes, serviceUrls, expiresOn = validUntil } = evidence
  const row = { cityCode: '68134', neighborhood: null, address: null, locationKind: facts.category === 'home_services' ? 'service_area' : 'premises', coordinates: null, ...facts, booking: facts.booking || { kind: 'phone', phone: facts.phone }, verification: { status: 'approved', checkedOn, validUntil: expiresOn, booking: { url: bookingUrl, excerpt }, contact: contactUrl } }
  records.push(row)
  const review = { id: row.id, checkedOn, website: row.website, bookingEntry: row.booking.kind === 'phone' ? 'phone' : row.booking.url, bookingReview: row.booking.kind === 'phone' ? 'phone_booking_reviewed' : 'owned_booking_reviewed', reviewedUrls, notes }
  if (priceSearchNotes) Object.assign(review, { pricingDecision: 'not_publicly_listed', priceSearch: { outcome: 'not_published', bookingUrl: row.booking.kind === 'form' ? row.booking.url : bookingUrl, serviceUrls, notes: priceSearchNotes } })
  reviews.push(review)
}

const champs = 'https://www.unichamps.bg/'
const champsService = `${champs}konsultacia-za-universitet-v-chujbina/`
add({
  id: 'sofia-university-champions-hadzhi-dimitar135a', name: 'University Champions · Данбъл София', category: 'consulting',
  address: 'София, ж.к. „Хаджи Димитър“ 135А', website: champs, phone: '+359893291761',
  openingHours: { sourceUrl: `${champs}kontakti/`, checkedOn, days: [1,2,3,4,5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '17:00' }] })) },
  services: [
    service('consulting', 'Безплатна консултация за университет в чужбина', 'Ориентационна среща в софийския офис след предварителна телефонна уговорка. С кандидат-студента се очаква да присъства родител. Безплатната среща е 40 минути; тя не включва целия пакет за кандидатстване. Допълнителната специализирана консултация е отделна платена услуга.', { price: price(0, 'ориентационна консултация · 40 минути', champsService), durationMin: 40, durationSourceUrl: champsService, durationCheckedOn: checkedOn }),
    service('consulting', 'Допълнителна специализирана консултация за университет', 'Допълнително обсъждане на конкретния случай след безплатната ориентационна среща, с предварителна телефонна уговорка за софийския офис. Публикуваната такса е почасова в лева, не цена на цял пакет за кандидатстване или университетска такса.', { price: price(50, 'час допълнителна специализирана консултация', champsService, { currency: 'BGN' }) }),
  ],
}, {
  bookingUrl: champsService, contactUrl: `${champs}kontakti/`,
  excerpt: 'Избраната собствена услуга изрично кани за запазване на консултация в офиса в София чрез обаждане; контактите посочват действителния офис и телефон.',
  reviewedUrls: [champs, champsService, `${champs}kontakti/`, `${champs}obshti-usloviq`, `${champs}politika-na-sigurnost/`, `${champs}gdpr-politika/`],
  notes: 'ActualrootReserveConsultation→ownContact reviewedfirst, selectedownFREEconsultationpage expresslyallowsOFFICESOFIAorZoom byPHONE/email/form; voicepathchosen893291761, notclaimedcalendar/formconfirmedslot. Fullselectedpage7320charsreadEOF: FREEorientation40minutes gift, parentpresencewithapplicant expected, furtherSPECIALISED50BGN PERHOUR. LiteralBGN retainedNOTourEURconversion/expiredbycurrencyassumption; no feeinferredfromapplicationadministrationcharges. Includedonlyorientationandexplicitadditionalconsultation, notwholeadmission/visa/travel/degreepackage orpromisedoutcomes. FullownTerms8544charsEOF contractconditionsforDanbulEIK203651897, ordinarycopyrightonlyno websiteDB/extraction/automation/wholewebsitepersonalNCbanobserved; fullGDPR9870charsEOFunder16parentconsent, cookiepolicy3756charsEOF. No licence/legalclearance/unseenpolicyclaim. ContactcurrentOFFICEHad zhiDimitar135A+samefooterallpages; registeredprivacy135entrAapt15 notinventedasseparatevenue/suffixcorrection. CurrentContactexplicitMonFri09–17andweekendclosed; nohoursborrowedfromanotheroperator. DANBUL/UniversityChampions/danbulstudy.com oneactualoperator, notroom/staff/country/sitealiases; allcurrentBG/DKphones+domains+name/address againstruntimeSOFIAandALL2000WIPzero. Publicrobotsallowexceptwp-admin, no private/admin/API/assets/maps/Googleiframes orotherdomainrequested. Minimalindependentlyphrasedservice/appointment/venuefacts only; no authoredprose/credentials/reviews/images copied. ActualcontactformwithFBprofile/applicationquestions observedreadonly, no customerdata/input/checkbox/formsubmission/call/payment/booking/action/UI/geocode.',
})

const compass = 'https://student-compass.com/'
add({
  id: 'sofia-student-compass-stamboliyski175a', name: 'Студентски компас · консултации за следване', category: 'consulting',
  address: 'София, бул. „Александър Стамболийски“ 175 А', website: compass, phone: '+359886338883',
  services: [service('consulting', 'Безплатна консултация за кандидатстване в чужбина', 'Ориентационна консултация за изискванията при кандидатстване, след предварително свързване по телефона за посещение. Безплатната среща не е цялата процедура: последващото посредничество се възлага с отделен договор и такса според държавата.', { price: price(0, 'ориентационна консултация за изискванията за прием', compass) })],
}, {
  bookingUrl: compass, contactUrl: `${compass}kontakti.html`,
  excerpt: 'Собствената начална страница изрично кани за телефонна регистрация и посещение на безплатна консултация; контактите потвърждават същия софийски адрес.',
  reviewedUrls: [compass, `${compass}kandidatstvane_form.php`, `${compass}kontakti.html`],
  notes: 'ActualownentryONLINEAPPLICATION→ownedcandidateform readfirst; fieldsidentity/education/country/languagebutnotappointmentcalendar, notmisrepresentedascustomervoiceBook. SAMEownroot explicitlyREGISTRATIONby9780700/886338883/896220815 thenCALL886338883or896220815andVISITFREEconsultation; thisrealadvancevoicearrangement+selectedconsultation qualifies notpuregenericcontact. CurrentContactandroot agreeStamboliyski175Aactualsubmission/consultoffice, nototherdomainsDruzhba36unreviewedsearchaddress. SelectedFREEconsultaboutrequirementsforadmission notwholeagencyapplication/legalisation/translation/teaching; Contactexpressseparatecontractanddestination-dependentfeeafterconsult, no packagepriceinvented. Root/fullContact/nativeapplicationformreadcomplete, allhrefnav/footerexamined no separateTerms/privacy/fee table surfaced; no blockedprice menudeclaredunpublished; no fullagencytariffcompleteness/licence/legalguaranteeclaim. Robotsfile200content-signalexplanatorycommentsbutNOactualyes/no directives orpathdisallow; notatrainingrequestorconsentclaim. StudentCompass/CollegeSvAriadna/translationaffiliate ONEagencyvenue, allaliases+3phones/address runtimeSOFIAandALL2000WIPzero; no school/department/staff/sitealiasclones. No numericweeklyhours/fixedduration/ownmarkerpublishedonreviewedpages, omittedallnotinferredfromcopyrigh t2008 oroldtransitdirections. Minimalindependentlyphrasedmerchant/service/appointment/addressfacts only; no schoolaccreditation/admissionguarantee/copiedsourceprose/photos/reviews. No mapdestination/affiliatecollege/translationdomain/actions/counters/privateAPI/Google/geocode/UI/customerfields/formsubmission/call/booking/payment.',
})

const shiny = 'https://shinyhousebg.bg/'
const shinyBook = `${shiny}калкулатор/`
add({
  id: 'sofia-shiny-house-home-cleaning', name: 'Shiny House BG · почистване София', category: 'home_services',
  address: null, website: shiny, phone: '+359878746893', booking: { kind: 'form', url: shinyBook },
  openingHours: { sourceUrl: `${shiny}контакти/`, checkedOn, days: [1,2,3,4,5,6,7].map(weekday => ({ weekday, periods: [{ open: '07:00', close: '19:00' }] })) },
  services: [service('home_services', 'Основно почистване на жилище в София', 'Услуга на адрес след потвърждение на ден и час. Минимум 160 € за посещение. Доплащания: празници/нощем +50%; извън работно време/почивни дни +20%; техника без асансьор 1 €/етаж; извън Околовръстния път транспорт 0,55 €/км. Осигуряват се вода и ток.', { price: price(2.80, 'м² · минимум 160 EUR за посещение; доплащанията са отделно', shinyBook) })],
}, {
  bookingUrl: shinyBook, contactUrl: `${shiny}контакти/`,
  excerpt: 'Собствената онлайн резервация избира почистваща услуга и адрес; FAQ изрично казва, че служител се свързва след заявката, за да уточни ден и час.',
  reviewedUrls: [shiny, shinyBook, `${shiny}услуги/`, `${shiny}контакти/`, `${shiny}за-нас/`],
  notes: 'ActualownReserveOnline→Calculator page reviewedFIRST includingFULLnativeform/servicechoices/address/phone/approxarea/message andFAQservicecallbacktoagreeDAY/HOUR, notinstantavailability. Realownedformobservedreadonly, no field/calculator/defaultquantity changed, antispamnot solvedor submitted. ThenFULLselectedServices6386chars, actualContact3689chars, About1765chars/sourceidentitySofiadelivery andpublicnav/footer/allactualformlinksread. Literalpublished2.80EUR/m2 BASICcleaningMINIMUM160EUR/PERVISIT, notdefaultcalculator160asfixedwholehouseprice; no sqm-calculationperformed. Commonpublishedextrasfullypreservedinpublicdescription: holiday/night+50%, out-of-hours/weekend+20%, equipmentcarrywithoutlift1EUR/floor, transportbeyondringroad0.55EUR/km, clientwater/electricity. Doesnotinventstackingruleforoverlappingsurcharges. Otherpricedtypes/seats/mattresses/officepackagesnotimported, no wholemenutariffcompletenessclaim. OwnServiceincludesfloor/surface/kitchen/bath/windowcleaning, notclinical/disinfectantguarantees/machine-brandmethod. ActualContactMonSun07–19workhours; expresssame-day/drying2–5h/typical2–4hNOTfixedduration forselectedbasicservice. ONE Sofiahomevisitoperator, city/15kmcoverageNOTquarter/venueclones; noactualcustomerpremise published soaddress/coordsnull. Allcurrentphones878746893/899469630/basehost/name runtimeSOFIA+ALL2000WIPzero; fuzzyShayni unrelatedLashVegasotherphone/domainnotduplicate. Robustroot/Book/Services/Contact/Aboutfooter no separateTerms/privacy surfaced, no unseenpolicy/licence/legalclearanceclaim; ordinarypublicrobotsallow. Minimalindependentfacts only, no testimonials/photos/logos/advertisingprose copied. No rental/retail/cart/order-submit/privateAPI/Google/maps/geocode/UI/customerdata/action/call/bookingwrite.',
})

const remont = 'https://remontiram.bg/'
add({
  id: 'sofia-remontiram-home-survey', name: 'Ремонт София · remontiram.bg', category: 'home_services',
  address: null, website: remont, phone: '+359897479475', booking: { kind: 'form', url: remont },
  services: [service('home_services', 'Безплатен оглед за цялостен ремонт на жилище', 'Оглед на адрес в София за апартамент или къща до 100 м² РЗП. След заявка изпълнителят се свързва за уговорка и изготвя индивидуална оферта. Безплатен е огледът, не ремонтът, материалите или довършителните дейности. Възможността за поемане на обекта се потвърждава.', { price: price(0, 'оглед за цялостен ремонт · жилище до 100 м² РЗП', remont) })],
}, {
  bookingUrl: remont,
  excerpt: 'Действителният „Запази оглед“ води към собствената форма с имот, площ и срок; страницата обещава последваща връзка за безплатен оглед и индивидуална оферта.',
  reviewedUrls: [remont],
  notes: 'ActualownReserveSurvey href#contact inspectedinHTML thenSAMEpubliconepageBook/service/prices/process/FAQ/footerreadFULL3993chars; canonicalrootURLwithoutfragmentreceipt. Realnativefieldsname/phone/quarter/photosOPTIONAL/area/condition/startpreference/messageandREQUESTSURVEYbuttonobservedreadonly, no customerdata/photo/date/selection/submission/action. OwnonepageexplicitFREEONSITESURVEYandFOLLOWUPcontact, serviceSofiaarea+apartments/housesUPTO100m2RZP. Includedonlythisactualappointment, not0wholeconstruction/remontmaterials. Separateapproxwhole-renovation50–750EUR/m2RZP conditionalestimateobservedNOTborrowedasinspectionfee/notignoredasnewunpublishedmenureceipt; laterbindingofferaftervisit, no fulltariffcompletenessclaim. RepeatedcurrentbrandREMONT SOFIA/remontiram.bg/897479475/serviceprocessallmatch; allhost/phone/brand runtimeSOFIA+ALL2000WIPzero. No editorinstructions/placeholders/authenticityclaimnoticed; missinglegalname/EIKnotfilledfromassumption. No fakeexistingwork/Googletestimonials copied, sourcebrandnotclaimedregisteredtrademark. No numericweeklyhours/fixedvisitduration/exactoffice/ownerpointpublished, allomitted/addresscoordsnull, ONE Sofiahomevisitoperatornotquarterclones. Rootallhref/footeronlyinternalanchors/ownphotosandexternalGoogle-review link; no separateTerms/privacy link surfaced, no licence/unseenpolicy/legalclearanceclaim. RobotsurlordinaryNetlify404not403/challenge, rootnormal200; no bypass/alternateprivateendpoint. Minimalindependentlyphrasedmerchant/service/bookingfacts only, no sourceprose/media/reviews. No assets/Googleprofile/reviewwrite/Maps/privateAPI/actionURL/cart/payment/customerform/call/geocode/UI/bookingwrite.',
})

export default { records, reviews }
