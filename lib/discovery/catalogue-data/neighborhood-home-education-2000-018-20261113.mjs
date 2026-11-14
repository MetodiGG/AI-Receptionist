// Frozen manually reviewed intake018. Root owns integration/photos/identities.
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


const yanko = 'https://qnkovasilev73.bg/'
const yankoBook = `${yanko}index.php?p=contact`
const yankoService = `${yanko}index.php?p=service&slug=pretapitsirane-divani`
add({
  id: 'sofia-yanko-vasilev73-buxton-gortalov13', name: 'Янко Василев 73 · ателие Бъкстон', category: 'other',
  neighborhood: 'Бъкстон', address: 'София, ж.к. Бъкстон, ул. „Майор Горталов“ 13',
  website: yanko, phone: '+359988301635',
  services: [service('other', 'Претапициране на диван · уговорено посещение в ателието', 'Посещение в ателието за обсъждане и възлагане на претапициране на диван, само след предварително уговорен час по телефона. Материалът, работата, цената, срокът и евентуалният транспорт се уточняват индивидуално; посещението не означава завършен ремонт в един час.')],
}, {
  bookingUrl: yankoBook,
  excerpt: 'Контактите посочват ателието в Бъкстон и изрично искат обаждане преди посещение за уговорка на удобен час; избраната услуга води към собственото запитване.',
  reviewedUrls: [yanko, yankoBook, yankoService, `${yanko}index.php?p=services`, `${yanko}index.php?p=about`, `${yanko}index.php?p=privacy`],
  priceSearchNotes: 'Actual selected sofa-reupholstery request entry and own Contact reviewed first, then full selected service, full Services/About and Privacy/footer. The owner explicitly quotes each job by furniture condition, dimensions, material, scope and transport after discussion; no numeric sofa or atelier-visit fee, no Prices menu or blocked tariff found. Missing fee remains absent, not free. Other transport statements are not a standalone zero-price repair.',
  serviceUrls: [yankoService, `${yanko}index.php?p=services`, `${yanko}index.php?p=about`],
  notes: 'Actual selectedSERVICE→ownContact#inquiry request reviewedFIRST without opening any action/endpoint. Canonicalfragment-freeContact in receipt. Nativeform real namedservices inclsofas/chairs/antiques, customername/phone/message/optionalphotos+privacy, but chosenindependentVOICEbooking: sameContact explicitlylistsTHREEphysicalateliers andcallBEFOREvisittoagreeconvenientTIME; About repeatsadvanceTIMEforanyatelier. SelectedBuxtonMajorGortalov13 isrealnamedatelier, notquarter-onlyhomearea ortransportcompany. IncludedONEpremise first, Mladost2RUMandKarpuzitsaheldbranchconfirmationnotclonedcitywideprovider. Currentprimary988301635 andalternate888731120/legaloperatorYankoVasilev73EOOD/emailaliases/name againstALLruntime+ALL2000WIPzero. Fullselectedservice8348chars,Contact4937,Services3136,About3319,Privacy1707tokensreadEOF; no numeric selectedfee andno actualCenipage/blockedmenu. Jobprice/material/workscope/completiontime/transport individuallyagreed, no inventedFREEconsultation/price/hourlyslot/guaranteedrepairduration orfreealltransportconditions. Thisisappointmentatatelier categoryother, nothome_services/home_visit orwalkinretail. FullPrivacyGDPR/currentoperator/Mladost2controlleraddress, ordinarycookienoautomation/database/noncommercialrestrictionobserved; no separateTermslink surfaced/no unseenpolicy/licence/legalclearanceclaim. No openinghours orownerpointpublished, bothomitted; sources addressnotmunicipalguess. Sourcephotos/Googleembeddedreviews/ratings/artisanclaims/sourceprose NOTcopied, maplinksnotopened. Minimalindependentmerchant/service/appointmentfacts only. No ownformfields/images/upload/customerdata/checkbox/calls/messages/actions/submission/bookingwrite/Google/geocode/UI.',
})

const got = 'https://gotyourenglish.com/'
// The same owned contact invitation explicitly covers all three named ateliers;
// these are real visit premises, not one mobile operator cloned by quarter.
const yankoBuxton = records.find(row => row.id === 'sofia-yanko-vasilev73-buxton-gortalov13')
const yankoReceipt = reviews.find(review => review.id === yankoBuxton.id)
yankoReceipt.notes = yankoReceipt.notes.replace('IncludedONEpremise first, Mladost2RUMandKarpuzitsaheldbranchconfirmationnotclonedcitywideprovider.', 'IncludedTHREEnamedphysicalateliers: ContactallthreeimmediatelyboundtocallBEFOREvisit/agreeTIME, AboutrepeatsvisitingANYatelierforselectedmaterial/workscope/priceagreement; no merewarehouse/transport/retail/staffclones. Mladost2sourceidentifiesRUMbuilding/floor2office22withoutpublishedstreetnumber, preservednotinvented.')
for (const venue of [
  { id: 'sofia-yanko-vasilev73-mladost2-rum22', name: 'Янко Василев 73 · ателие Младост 2', neighborhood: 'Младост 2', address: 'София, ж.к. Младост 2, ул. „проф. Александър Теодоров-Балан“, търговски център РУМ, ет. 2, офис 22' },
  { id: 'sofia-yanko-vasilev73-karpuzitsa-bachiyski6', name: 'Янко Василев 73 · ателие Карпузица', neighborhood: 'Карпузица', address: 'София, ж.к. Карпузица, ул. „полк. Стойчо Бачийски“ 6' },
]) add({ ...yankoBuxton, ...venue }, {
  bookingUrl: yankoBook,
  excerpt: 'Собствените контакти изброяват трите ателиета и изискват обаждане преди посещение за уговорка на удобен час; About потвърждава прием във всяко от тях.',
  reviewedUrls: [...yankoReceipt.reviewedUrls],
  notes: yankoReceipt.notes,
  priceSearchNotes: yankoReceipt.priceSearch.notes,
  serviceUrls: [...yankoReceipt.priceSearch.serviceUrls],
})
const gotBook = `${got}contact/`
const gotService = `${got}english-courses/`
add({
  id: 'sofia-got-your-english-kliment-denchev11', name: 'Got Your English? · Гео Милев', category: 'education',
  neighborhood: 'Гео Милев', address: 'София, кв. Гео Милев, ул. „Климент Денчев“ 11',
  website: got, phone: '+359887632797', booking: { kind: 'form', url: gotBook },
  services: [service('education', 'Индивидуален присъствен урок по английски', 'Индивидуален урок в София след първоначално обсъждане на нивото, целите и учебния план. Цената се предоставя при запитване; не е безплатен урок или групов онлайн курс. Заявката през собствената форма е за последваща уговорка, не за незабавно потвърден свободен час.', { durationMin: 60, durationSourceUrl: gotService, durationCheckedOn: checkedOn })],
}, {
  bookingUrl: gotBook,
  excerpt: 'Собственият списък предлага Individual English Lessons, 60 Minutes, In-Person, Price upon request и отделен Book Now към действителната собствена форма за уроци.',
  reviewedUrls: [got, gotBook, gotService, `${got}privacy-policy/`, `${got}cookie-policy/`],
  priceSearchNotes: 'Actual Individual English Lessons Book Now leads to own Contact request, inspected first; full current English Courses and homepage, full Privacy and Cookie policies/footer then read. Selected individual sixty-minute physical lesson explicitly says Price upon request; no numeric selected tariff or separate blocked Prices menu. Online sold-out250EUR groups,147EUR online club, dated24EUR social event and other offers are not individual lesson prices. No fee guessed or free intro substituted.',
  serviceUrls: [gotService, got],
  notes: 'Prior13NovnextledgerheldgenericContactFormDemo/unfinishedselectedservice. CurrentactualOWN IndividualEnglishLessons card explicitlyPriceuponrequest/60Minutes/OnlineORInPerson→BookNowhref/contact/ inspectedFIRST, resolvesselectedservicebinding notgenericgoalcontactalone. Contact isFluentForms POSTform1 withrequiredname/email/lesson-needsmessage, optionalphone, normalformCAPTCHAcontrols; actualmarkup+submission-scriptreference observedONLY notexecuted/tested, no CAPTCHA/nonce used oractionAPIrequested. Demo isaccessible-screenreaderlegend notproofmocksuccess; no instantcalendar/date/service-typecontrols/availability claimed. Nativequestion/requestforselectedpaidlesson only, laterstudyplan/timeagreement notguaranteedcourseplace. Fullroot/currentContact andselectedCourse allbindcurrentKlimentDenchev11Sofia/887632797; older20Mar2024Privacy/Cookies listCopernicus27–29office17/878969021, retainedlegacyprivacycontactNOTnewvenue orprojectedcurrentteachingaddress. Current2026Nov/Dec datedcontent supportslivingownerpage, individualoffer notmarkedNOspots; three250onlinegroupsAREsoldout andexcluded, 2026Maturacourseold/futureworkshops/socialevents notusedasordinarylessonfees. FullPrivacy16558chars andCookie6510EOFordinaryGDPR/analytics, no websiteautomation/database/noncommercialsourcebanobserved/no separateTermsnav orlicence/legalclearanceclaim. ALLruntime+ALL2000canonicalhost/botholdnewphones/VesselinaNaidenova/name/currentpremise0 beforeinclusion. RealoneSofiateachingvenue, nooldCopernicus/online/corporate/staffaliases. No weeklyteachinghours published, omitted; sourcecoordinatesnull, no mapsopened. No sourceprose/testimonials/ratings/qualifications/statistics/copiedcurriculum/photos. Minimalindependentfacts only; no account/customerdata/formfields/consent/CAPTCHAinteraction/submit/calendar/date/payment/calls/bookingwrite/Google/geocode/UI.',
})


const vnl = 'https://www.vnltrans.bg/'
add({
  id: 'sofia-vnl-trans-furniture-home-visits', name: 'ВНЛ Транспорт · монтаж и демонтаж на адрес', category: 'home_services',
  address: null, website: vnl, phone: '+359892630308',
  openingHours: { sourceUrl: vnl, checkedOn, days: [1,2,3,4,5,6,7].map(weekday => ({ weekday, periods: [], byAppointment: true })) },
  services: [service('home_services', 'Монтаж и демонтаж на мебели на адрес', 'Монтаж и демонтаж на гардероби, легла, кухни и офис мебели в София, след предварителна уговорка за обхват, цена и срок. Офертата е индивидуална; плащането е след работата, без капаро. Безплатният оглед не означава безплатен монтаж или преместване.')],
}, {
  bookingUrl: vnl,
  excerpt: 'Действителната заявка и телефонът са за оглед, оферта и предварителна уговорка; услугата изрично включва демонтаж и сглобяване на мебели на адрес в София.',
  reviewedUrls: [vnl, `${vnl}usloviya.html`, `${vnl}poveritelnost.html`],
  priceSearchNotes: 'Actual own phone/quotation entry and native request form inspected first, then full Services/FAQ/contact/footer and complete Terms/Privacy. Selected furniture assembly/disassembly has an individually confirmed quote by volume, access, distance and scope, with no numeric service tariff or separate blocked Prices menu. Free survey/quote is not a free moving/assembly job; absent fee remains absent.',
  serviceUrls: [vnl, `${vnl}usloviya.html`],
  notes: 'ActualownCALL/FreeOffer→root#kontakti nativeform reviewedFIRST(name/email/subject/message/privacy); independentexplicitphoneprocess/onsiteORonlinesurvey/laterfixedoffer/advanceagreedDAYscope followed, notinstantbookingslot orcontractcreatedbyform. FULLrootServices6/4stepworkflow/FAQandContactEOFread; selectedfurnitureassembly/disassemblyrealprovidedonsiteSofia notretailproductdeliveryonly. ActualTerms20Jun2026§2noonlineorder/payment;§3contractonlyAFTERseparatebilateralconfirmationSCOPE/TIME/PRICE;§4individualfee/surveyofferFREE. CurrentFAQstatespaymentAFTERwork/noadvanceDEPOSIT, retainednotinventedallinclusiveVAT/partsprice. ONE citywideSofiahomevisitoperatorVNLTrans/VVIEngineeringEOODEIK206536665/892630308/vviengineering@gmail.com, ALLruntime+ALL2000WIPzero. RegisteredBankyaIvanyanskoShose1notclaimedSofiapremises, rootSofiaCenterquarter-onlynotinventedstreet/point; addresscoordinatesnull. ActualdailyBYADVANCEAGREEMENT includingweekends/outofhours, representedbyAppointmentwithNOinventedclock. FULLTerms3594chars+Privacy4553EOF; IP§6explicittexts/logo/images/design authoredassetsnarrowcopyright/reproductionclause, notdata/database/automation/personalnoncommercialban. Onlyindependentminimalservice/book/merchantfacts, no authoredprose/logos/design/photos/ratings/guarantees copied, no licence/legalclearanceclaim. No contactformvalues/consent/action/call/email/payment/order/customerdata/Google/geocode/UI/bookingwrites.',
})

const spotlight = 'https://ipinthespotlight.bg/'
const spotlightBook = `${spotlight}kontakti/`
const spotlightService = `${spotlight}konsultaciq-s-advokat/`
add({
  id: 'sofia-ip-in-the-spotlight-bersinski12', name: 'IP in the spotlight · адв. Теодора Лалова', category: 'consulting',
  address: 'София, ул. „Емил Берсински“ 12, ет. 5', website: spotlight, phone: '+359888100382',
  services: [service('consulting', 'Правна консултация за интелектуална собственост', 'Платена консултация за интелектуална собственост в кантората след предварително уговорен час. Възнаграждението и обхватът се уточняват с практиката; регистрация на марка, държавни такси и последваща работа не са представени като включени в една среща.')],
}, {
  bookingUrl: spotlightBook,
  excerpt: 'Контактите изрично канят да се запише час за консултация в кантората на Емил Берсински 12 и посочват телефон; собствената услуга изрично е платена.',
  reviewedUrls: [spotlight, spotlightBook, spotlightService, `${spotlight}zashtita-na-brand/`, `${spotlight}za-nas/`, `${spotlight}privacy-policy/`],
  priceSearchNotes: 'Actual consultation navigation and in-office appointment invitation/sole public phone inspected first, then full selected Paid Consultation, brand-service page, About, root navigation/footer and entire Privacy. The owner expressly provides paid consultations but no numeric consultation fee; no Prices menu or blocked tariff surfaced. Registration costs, statutory fees, grants and ongoing representation are separate topics, not an inferred one-visit fee or free statutory-aid exception.',
  serviceUrls: [spotlightService, `${spotlight}zashtita-na-brand/`],
  notes: 'ActualrootConsultationWithLawyer→ownselectedpaidconsultationpage, thenownedContactexplicitBOOKATIMEFORCONSULTATIONINOUROFFICE directlywithcurrentEmilBersinski12floor5 andsame888100382. Realindependentvoicearrangement notgenericcontactalone/chat-only/onlinecalendar. SelectedpageexplicitconsultationsPAIDandwillremainPAID; fixedtimeconversationmentionedWITHOUTnumericminutes, omittedduration/fee. Brandserviceoffersconsultationbeforetrademarkapplication; notclaimedregistrationcompleted/protectedlegaloutcome orfullstatefeesincluded. FULLselectedpage/Contact6013/About6902/brand5920/rootread; noCeni/Termsnav oractualblockedpricemenu, absentselectedfee remainsmissing. FullPrivacy27663charsEOFreadin4chunksAFTERfirsttooltruncatedoutputwasexplicitlyre-readnormally(notclaimedfirsttruncatedviewcomplete); ownTheodoraLalova identity+currentofficephone/allruntime+ALL2000WIPzero. PrivacyordinaryGDPRplusfinalcopyrightclauseSPECIFIEStexts/photographicimages/othercopyrightobjects: onlyminimalindependentmerchant/service/appointmentfacts included, notprose/images/logo/credentials/clientstories/testimonials/legallawtext/policy copied; no blanketlicence/legalpermissionclaim. FooterpluginmessageContentIsProtected observedonordinarypublicHTTPS200body, noaccesschallenge/CAPTCHAreaderdenial/blockbypass, no scripts/clipboardprotectiondisabled/externalAPI/UI. No sourceautomation/database/personalnoncommercialrestrictionobservedinfullyreadactualpolicy, no unseenTermsclaim. EUfundCURRENTnoapplicationsnoticeirrelevantandNOTlistedservice; nofalseavailabilityforgrant. No ownbusinessweeklyhours/numericduration/ownerpointpublished, allomitted. Oneactualpractice notstaff/branddivisionclone. No calls/email/customerdata/consent/forms/bookingwrite/Google/geocode/paidAPI.',
})

export default { records, reviews }
