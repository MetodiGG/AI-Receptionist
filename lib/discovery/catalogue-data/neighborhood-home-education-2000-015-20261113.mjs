// Frozen manually reviewed intake015. Root owns integration/photos/identities.
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

const iva = 'https://advokattodorova.com/'
const ivaBook = `${iva}kontakti`
add({
  id: 'sofia-iva-todorova-dondukov93', name: 'Адвокат Ива Тодорова', category: 'consulting',
  address: 'София, бул. „Дондуков“ 93, партер, вход откъм ул. „Бяло море“', website: iva, phone: '+359887924687',
  openingHours: { sourceUrl: ivaBook, checkedOn, days: [1,2,3,4,5].map(weekday => ({ weekday, periods: [{ open: '08:30', close: '17:30' }] })) },
  services: [service('consulting', 'Присъствена правна консултация по семейно право', 'Платена консултация в кантората след предварителна телефонна уговорка за ден и час. Възнаграждението се уточнява индивидуално според казуса, обема работа и сроковете. Изготвяне на документи и процесуално представителство не се представят като включен пакет.')],
}, {
  bookingUrl: ivaBook,
  excerpt: 'Собствените контакти изрично изискват предварително уточняване по посочените телефони на ден и час за лична консултация с адвокат Тодорова.',
  reviewedUrls: [iva, ivaBook, `${iva}tarifa`, `${iva}semeino-pravo`], serviceUrls: [`${iva}semeino-pravo`, `${iva}tarifa`],
  priceSearchNotes: 'ActualownedContact voiceBookDAY/HOUR forINPERSONconsultation readfirst, thenFULLactualTariff1633chars andselectedfamilylawpage2598chars/rootallnav/footerlinks. TariffexplicitlystatesALLoraladvice/inquiries/officeconsultationsPAID andfeeagreedindividuallybycasecomplexity/work/time/deadline, butNO numericfee/range/duration/package. Referencesoldminimumremunerationregulation2004/2009/2010/2016 withoutamounts areNOTactualpublishedfee/ourlegalpriceinference. No blocked/inaccessibleactualPricesmenu; strictnot_publicly_listed coversONLYincludedconsultation, notcasework/abonement/otherlegalacts. Missingpricenot0/free/service_reviewednotprice-reviewed.',
  notes: 'ActualownContact explicitpersonalconsultation requiresadvanceagreementofDAYandTIME viapublished24177888/887924687/898763537, notgenericcontact-only/chat-onlypath. SelectedServicesfamilylawoffering+sameowner/phone andactualDondukov93groundfloorentranceByaloMore, oneprivatepractice notstaff/room/subjectclones. RuntimeSOFIA+ALL2000WIP all3phones/basehost/address/operatorpreflightclear; nearnameexistingIvanaTodorovaPHOTOGRAPHY differentfirstgivenname/domain/phone/industry notaliasedorclonedaslawyer. Currentactualcontactweekday08:30–17:30officeconsultationhours, holidays/weekendsonlyprioragreement,no numericweekendhours/closure promised. No fixedduration/coords guessed. ActualTariffoldlegalreferences observedbutnotcopiedascurrentlaw/advice/normativeprices; no sourcepublishedamountconverted/computed. Robustrootallhref/selectedContact/Tariff/Servicesfooter no separateTerms/privacy surfaced, ordinarycopyright2013 notproofexpiry nor blanketlicence/unseenpolicy/legalclearance. PublicJoomlarobots prohibitadministrator/cache/components/images/includes/libraries/logs/media/modules/plugins/templates/tmp; onlyrootandactualpubliclinkedcontentpagesrequested, no assets/privatepaths/API. Minimalindependentlyphrasedmerchant/service/appointment/venuefacts only, no legalinstruction/prose/formtemplates/qualifications/reviews/images copied. Contactonlineformantispamquestion observedonlynot solved/filled/submitted; emailJSnotdecoded, chosenvoicepathnoformclaim. No phonecall/clientdocuments/customerdata/consent/payment/action/Maps/geocode/UI/bookingwrite.',
})

const integral = 'https://www.integral.bg/'
const integralHigher = `${integral}visshe-obrazovanie-v-chuzhbina`
add({
  id: 'sofia-integral-evlogi-georgievi99', name: 'Интеграл · образователни консултации София', category: 'consulting',
  address: 'София, бул. „Евлоги и Христо Георгиеви“ 99', website: integral, phone: '+35928050600',
  booking: { kind: 'form', url: integral },
  services: [service('consulting', 'Безплатна първа консултация за висше образование в чужбина', 'Ориентационна среща за възможностите и процеса на кандидатстване. Безплатна е само първата консултация, не обучение или цял пакет за кандидатстване. Заявяват се офис София, предпочитани ден и час; консултант потвърждава. За лица под 16 г. се изисква родителско съгласие.', { price: price(0, 'първа ориентационна консултация за висше образование', integralHigher) })],
}, {
  bookingUrl: integral, contactUrl: `${integral}kontakti`,
  excerpt: 'Собствената заявка за консултация съдържа вид услуга, присъствен офис София, предпочитани ден и час и изрично последващо потвърждение от консултант.',
  reviewedUrls: [integral, `${integral}kontakti`, integralHigher, `${integral}privacy-policy`],
  notes: 'ActualownedReserveConsultation rootentry inspectedfirst, completepublicHTMLfieldsfor3steps: name/email/phone/residence, selectedHIGHEREDUCATION withdegree/interests, OFFICEMEETING vsONLINE, OFFICE SOFIA, PREFERREDday/hour andexplicitownconsultantconfirmation. HTMLallstepsreadONLY, no stepsadvanced/type/office/date/input/checkbox/submission; successmessagetemplateinHTML notanobservedsubmission. SourcehighereducationexplicitFREEFIRSTconsultation, NOTentireapplication/admission/teaching/travelpackage. ActualContactsbindmainSofiaEvlogiHristoGeorgievi99/28050600, full13053charPrivacyEOFsameIntegralEducationalProgramsOOD/EIK/address, no ambiguitywithseparateStudentskiGradWAToffice lackinghousenumber/servicebinding: latterNOTcounted orassignedhigheredoffer. Root/currentContact/nativeBookselectedSOFIAbranch realpremise; oneoperator not6country/city/24staffclones. AllpublishedSofiaphones/relatedoperator/basehost/name/address runtimeSOFIA+ALL2000WIP preflightzero. Privacyunder16explicitparentconsent publicconditionpreserved. Actualroot/Book/Contact/selectedservice/footer no numericweeklyconsultationhours/duration, omittednotfrompreferredtimefields. FullPrivacyordinaryGDPR/sourceidentity, no database/extraction/automation/sitepersonalnoncommercialrestriction observed; no separateTerms link surfaced, no unseenpolicy/licence/legalclearance claim. Robotsallowexcept/events/products; thatpath/catalogue/universitydatabase/pagesnotrequested orcopied. Minimalindependentlywordedappointment/merchant/service/addressfacts only, no prose/guaranteedoutcomes/qualifications/articles/studentreviews/photos orprogrammeinventory copied. No calls/clientdocuments/account/login/forms/date/consent/payment/actions/API/Maps/geocode/UI/bookingwrite.',
})

const unify = 'https://www.unify.bg/'
const unifyBook = `${unify}bezplatna-konsultaciq`
add({
  id: 'sofia-unify-nikolay-haytov2', name: 'UNIFY · образователни консултации София', category: 'consulting',
  address: 'София, ул. „Николай Хайтов“ 2, вх. Г, ет. 11, офис 36', website: unify, phone: '+359887717776',
  booking: { kind: 'form', url: unifyBook },
  openingHours: { sourceUrl: unifyBook, checkedOn, days: [1,2,3,4,5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '18:00' }] })) },
  services: [
    service('consulting', 'Първа безплатна консултация за университет в чужбина', 'Първа ориентационна среща до един час за бакалавърски или магистърски програми, след предварително записване за офис София. Последващите специализирани консултации са платени. Срещата не представлява цял пакет за кандидатстване, обучение или такси към университет.', { price: price(0, 'първа ориентационна консултация · до 1 час', unifyBook) }),
    service('consulting', 'Специализирана образователна консултация след първа среща', 'Почасова специализирана консултация след първата безплатна среща за избор и сравнение на програми и индивидуална стратегия за кандидатстване. Бакалавърският или магистърският интерес се уточнява в заявката. Самото подаване на кандидатури и университетските такси не са включен пакет.', { price: price(50, 'час специализирана консултация · след първа безплатна', unifyBook) }),
  ],
}, {
  bookingUrl: unifyBook, contactUrl: `${unify}contacts.html`,
  excerpt: 'Собствената форма отделя безплатна първа и платена специализирана среща, офис София/Варна/онлайн и показва реални бъдещи дни и часове за софийския офис.',
  reviewedUrls: [unify, unifyBook, `${unify}pricing`, `${unify}contacts.html`, `${unify}about-us/privacy-policy.html`],
  notes: 'ActualrootFREEConsultation→ownnativeBook reviewedFIRST, realtypesFREEBachelor/FREEMaster/PAIDspecialised, applicantresidence/school/interests/phone/email, actualseparateOFFICESOFIA/Varna/online andfutureSofiacalendar withbusy/nonbusyslots observedreadonly. No date/time/type/office/customerfield/consent/accountselection orsubmission, no currentpublicslotpromise. Initialfullplaintextoutputtruncateddue697schooloptions; boundednormalGETofSAMEpublicBook rereadwithlargeunrelatedschool/cityoptionTEXTlistsomitted, complete17218charremainingBookbody/meetingtypes/officechoices/calendars/footerreadEOF. No schoolDB copied/persisted, no privateAPI orbrowserJS. OwnBookexplicit0FIRSTorientationWITHIN1h(maximumnotfixed60min), additionalSPECIALISED50EUR PERHOUR AFTERfirstfree; ownPricingconfirms0first and50Bachelor/Master, plainpricecardsnotusedtoeraseBookhourunit/prerequisite. No computed/convertedfee/duration orclaimalladmissionservicesFREE; otherapplication/country/packages notimported. ActualcurrentBook/Contact/allfooters bindNikolayHaytov2entrGfloor11office36/887717776; full6770charPrivacyEOFlegacycontrollerEmiliyanStanev2A/877770732 notednotnewvenue/bookingphone, no location inferredfromoldmetadata. Bothcurrent/legacyphones/basehost/operator/address crosscheckedruntimeSOFIA+ALL2000WIPzero; oneactualSofiaoffice, no staff/Varna/mobileothercityclones. ActualBookofficeMonFri09–18, no inferredweekendhours; coordsnull. FullPrivacyordinaryGDPR, no data/extraction/automation/wholewebsitepersonalnoncommercialrestriction observed, no separateTerms link surfaced or blanketlicence/unseenpolicy/legalclearance claim. Minimalindependentfacts only, no programme/uniDB/blog/studentreviews/admissionguarantees/photos/credentials copied. No login/registration/studentdata/call/formdate/consent/payment/action/API/Maps/geocode/UI/bookingwrite.',
})

const edlanta = 'https://www.edlanta.com/'
const edlantaBook = `${edlanta}kontakti`
const edlantaSecondary = `${edlanta}sredno-obrazovanie-konsultacii`
add({
  id: 'sofia-edlanta-vasil-levski3', name: 'ЕДЛАНТА · образователни консултации София', category: 'consulting',
  address: 'София, бул. „Васил Левски“ 3, ет. 1, ап. 1', website: edlanta, phone: '+359887851919',
  booking: { kind: 'form', url: edlantaBook },
  services: [service('consulting', 'Безплатна консултация за средно образование в чужбина', 'Информационна среща за ученици и родители след заявка за присъствена консултация. Безплатната среща не е целият консултантски пакет, обучение или пътуване. За ученик под 14 години се изисква съгласие на родител или законен представител.', { price: price(0, 'информационна консултация за средно образование в чужбина', edlantaSecondary) })],
}, {
  bookingUrl: edlantaBook,
  excerpt: 'Избраната услуга кани за безплатна консултация и води към собствената форма с вид образование и присъствен/онлайн формат; контактите отделят софийския отдел.',
  reviewedUrls: [edlanta, edlantaSecondary, edlantaBook, `${edlanta}privacy-policy-gdpr`],
  notes: 'ActualrootSecondaryCONSULTATIONS→selectedservice exactFREEconsultationCTA href/kontakti#contact inspectedBEFOREnavigation, canonicalpublicContactpage/formread(nohashpersisted). NativeConsultationRequest haseducationTYPEinclSECONDARY, INPERSON/ONLINEformat, applicantresidence, name/email/phone, age14declaration/parentconditionalfields/GDPR/marketingchoice; no office/datechoiceclaimedwhereabsent. Requestarrangesconsultation, notclaimedinstantcalendar/availability orpaidpackagepurchase. CurrentContacts explicitSOFIAsecondary/languageDEPARTMENT887851919, sameactualVasilLevski3floor1apt1 office; highered889086089/Privacy29864001alsodedupednotstaffclones. OneactualSofiavenue, BurgasNOTcounted, oldunreviewedhistoricalPDFFridtjofNansenaddressNOTused. Full28738charPrivacyEOFcurrentEdlantaEducationAbroadEOOD/EIK/addresssame, under14parentconsentpublicqualificationpreserved. SelectedliteralFREECONSULTATION isactualservice notfreeadminreservation; no claimfullsecondaryconsultingpackage/languagepreparation/guardianship/application/travelfree, no inventedFIRSTrestriction/duration/weeklyhours/coordinates. Actualroot/nav/selectedBook/service/Contact/footer no separateTerms/Priceslink surfacedforincludedFREEmeeting; no blockedmenu declaredunpublished and no tariffcompletenessclaim. FullPrivacyordinaryGDPR/sourceidentity, no database/extraction/automation/wholewebsitepersonalnoncommercialrestriction observed, no licence/unseenpolicy/legalclearanceclaim. Robotsurlsoft404HTMLwithHTTP200notactualrobotdirectives, no accessdenial/challenge/bypass; actualroot/contentnormalpublicHTTPS. Minimalindependentlywordedmerchant/service/Book/addressfacts only, no articles/studentcaseinterviews/uniDB/credentials/photos/copiedsourceprose. No account/customerfields/parentdata/checkbox/marketingconsent/call/action/submission/bookingpayment/API/Maps/geocode/UI.',
})

export default { records, reviews }
