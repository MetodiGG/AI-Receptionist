// Frozen manually reviewed intake017. Root owns integration/photos/identities.
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

const kirby = 'https://kirbyrental.com/'
add({
  id: 'sofia-kirbypro-home-cleaning', name: 'KirbyPro · почистване на адрес', category: 'home_services',
  address: null, website: kirby, phone: '+359896825553',
  services: [service('home_services', 'Почистване на прозорци до 10 м²', 'Почистване на стъкла, первази и рамки отвътре и отвън, без стълба, на адрес в София. Цената е за обем до 10 м². Денят и конкретният обект се уговарят предварително по телефона. Нестандартните обекти подлежат на предварителна оценка; това не е наем на уред.', { price: price(23, 'почистване на прозорци · до 10 м²', kirby) })],
}, {
  bookingUrl: kirby,
  excerpt: 'Собственият сайт отделя почистване от екипа от наем на уред; изброява услугата и кани за телефонна уговорка на свободен ден за посещение на адрес.',
  reviewedUrls: [kirby],
  notes: 'ActualownReserveentry#booking→SAMEpublicnativecalendar/requestform reviewedFIRST withoutselection/inputs/customerdata/checkbox/submission. CalendarJSslotsnotrendered, no availabledatepromise; independentexplicitCALL896825553forfreedays/advanceagreementchosen. SameBookdropdownincludescleaningpackagesandSEPARATESERVICESdescribedinnotes, notlimitedtorental. WholeHTMLbody12407charsreadincludingcompleteINLINErentalTermsNovember2026andPrivacyMarch2026(noalternateAPI/actions/hiddenendpoint). OwnerpublicKirbyProindependentphysical-personoperatorSofia, samevoice/email, notclaimedTheKirbyCompany/officialrepresentative/registeredcorporation. RealonsiteTEAMcleaningblockandselectedwindowsservice23EURUPTO10m2 fixedunit, windows/ledges/framesBOTHsidesWITHOUTladder, nonstandardobjectsassessedbeforehand. Otherwindows10–20m2=39EUR andover20m2=2EUR/m2NOTflattenedintoselectedtier; no inventedminimum/cancelrule/deliveryfeeinheritedfromRENTALcontract. Rentalday59/weekend99/3mo117prepaid packagesNOTimported, oldersearchrental49notclaimedcurrent/internalcleaningconflict. No healing/allergy/babysafety/HEPAperformanceclaimscopied. Generalrentaldelivery/contactMonSat08–20notprojectedasactualonsitecleaninghours; no fixedduration/office/ownerpointpublished=>allomitted,addresscoordsnull. ONE Sofiahomevisitprovider, not30km/quarter/rentaldepartmentclones. Allhost/KirbyPro/name/896825553/emailaliasesagainstALLruntime+WIPzero. Publicrobotsallow; fullinlinepoliciesordinaryrental/GDPRwithno websiteautomation/database/commercial-informationbanobserved, no unseenpolicy/licence/legalclearanceclaim. Minimalindependentservice/bookingfacts only, no authoredprose/images/reviews/qualificationscopied. No calendarAPI/Google/privateGPS/geocode/UI/cart/orderaction/calls/formwrite.',
})

const avia = 'https://accountingservice-bg.com/'
const aviaBook = `${avia}kontakti/`
add({
  id: 'sofia-avia-invest-stamboliyski41', name: 'Авиа Инвест · счетоводни консултации', category: 'consulting',
  address: 'София, бул. „Александър Стамболийски“ 41, вх. А, ет. 1, ап. 1', website: avia, phone: '+359897818116',
  booking: { kind: 'form', url: aviaBook },
  openingHours: { sourceUrl: aviaBook, checkedOn, days: [1,2,3,4,5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '17:00' }] })) },
  services: [service('consulting', 'Безплатна първа ориентационна счетоводна консултация', 'Първа среща за уточняване на въпроса и необходимата работа, след заявка за консултация в софийския офис. Безплатната ориентация не е цялостно счетоводно обслужване, подаване на декларации или платен абонамент. Последващите услуги се договарят отделно.', { price: price(0, 'първа ориентационна консултация · без обвързване', `${avia}uslugi/danachni-konsultacii/`) })],
}, {
  bookingUrl: aviaBook,
  excerpt: 'Действителната „Безплатна консултация“ води към собствената заявка; избраната услуга и FAQ изрично предлагат отделна консултация и среща в софийския офис.',
  reviewedUrls: [avia, aviaBook, `${avia}uslugi/danachni-konsultacii/`, `${avia}chesto-zadavani-vaprosi/`, `${avia}ceni/`, `${avia}politika-za-poveritelnost/`],
  notes: 'ActualrootFREEConsultation→ownContact#zapitvane nativeform reviewedFIRST: name/phone/email/message/privacycheckbox, no date/servicecontrolsclaimed. CanonicalContactURLwithoutfragmentreceipt; notinstantcalendar/automatedconfirmation. NamedFREEconsultationCTA repeatedroot/selectedtaxservice/prices/Contact, sameactualSofiaofficeFAQexplicitinpersonORonline andselectedserviceexplicitconsultationmaybeseparatelyagreedwithNONexistingclient. Thisisrealconsultationrequestnotgenericcontact-onlypathorclaimedon-the-spotpaidtaxservice. IncludedONLYFIRSTFREEorientationtoidentifyquestion/workscope, notsubsequentwrittenadvice/declarations/monthlypackage/2includedpremiumhours/wholebusinessconsultancy. ActualFULLPrices1650chars, selectedservice6946, FAQ5457, wholeContact1568/footerread; othermonthlyFROM80/150/250EUR EXVATnotborrowedasoneconsultfee orclaimedallservicesFREE. FullPrivacy5912charsEOF22Oct2026sameAviaInvestEOODEIK201628476/currentvenue/phone, ordinaryGDPR/cookies no websiteautomation/database/commercial-informationbanobserved; no separateTermsnav surfaced/no unseenpolicy/licence/legalclearanceclaim. SourceAIassistant/privacydescribesseparateAIservice, NOTused/called/inspectedforadvice; no chat/API/customerquestions. CurrentContactexplicitMonFri09–17actualofficehours, no fixedconsultduration. Allhost/897818116/legalbrand/EIKagainstALLruntimeSOFIA+ALL2000WIPzero; oneactualoffice no staff/servicealiases. No coordinatesinvented/publishedGooglemapopened. Robotsallowpublicactualpaths, no wp-admin/privateAPI. Minimalindependentlyphrasedappointment/merchant/servicefacts only, no legal/taxrules/statutorythresholds/claims/credentials/blogprose/reviews/photos copied. No customerdata/documents/forminputs/consent/submission/call/payment/cart/Google/geocode/UI/bookingwrite.',
})

const vyara = 'https://www.vyarabel.com/'
const vyaraBook = `${vyara}intenzivni-kursove-nvo-7`
add({
  id: 'sofia-vyarabel-mladost4-fontanite460v', name: 'Вярабел · учебно-артистичен център', category: 'education', neighborhood: 'Младост 4',
  address: 'София, ж.к. „Младост“ 4, к-с „Фонтаните“, бл. 460 В, във вътрешния двор', website: vyara, phone: '+359876900074',
  booking: { kind: 'form', url: vyaraBook },
  services: [
    service('education', 'Интензивен групов курс по БЕЛ за НВО 7. клас · 2027', 'Неделя 07:40–10:20, 28.03–13.06.2027. Под 18 г.: договор с родител и авансово плащане. Отказ ≥2 седмици преди старта без удръжка; до старта 10%; след старта до средата 20% плюс изминалите занятия, дори при отсъствие; след средата сумата не се връща.', { appointmentModel: 'group_reservation', price: price(797, 'пълен курс · 10 седмици по 4 уч.ч.; 3 сборника и пробни изпити отделно', vyaraBook) }),
  ],
}, {
  bookingUrl: vyaraBook, contactUrl: `${vyara}общи-разпоредби`,
  excerpt: 'Собствената форма отделя двата датирани присъствени курса, всеки с такса 797 EUR; записването изисква договор и плащане, не само заявка на интерес.',
  reviewedUrls: [vyara, `${vyara}общи-разпоредби`, `${vyara}политика-за-поверителност`, vyaraBook, `${vyara}въпроси-и-отговори`, `${vyara}ekip`],
  notes: 'ActualcurrentrootReserveIntensiveCourse→ownselectedpage reviewedFIRST, FULL12797charbodyincludingnativeCURRENT2026/27enrolform: mandatorySTUDENT+PARENTnames/phones/emails/school, separatelyselectableEXACTBEL28Mar–13Jun2027/Sun07:40–10:20orMATH27Mar–12Jun2027/Sat13:10–15:10 EACH797EURWHOLE10weeks/10sessions×4academicunits. Optional5/10practiceexams116/215EUR separateNOTcoursefee, combinedcourse10%promotionNOTapplied. ActualProceedToPaymentbutton andpublicinstructionpurchaseNOTcompletewithoutpayment observedONLY, notclicked/actionURLopened orclaimedpaymentgatewaytested/automaticplaceconfirmation; NOinputs/choice/consent/formsubmission/studentdata. Thisactualdatedpaidcoursepurchaseformnotgenericfreecallback/waitlist orcurrentNovclassclaim. No soldout/currentunavailability noticeobserved. FULLcurrentTerms13497charsEOF2026read: registrationinterestDISTINCTfromENROLMENTwithindividualcontractandADVANCEfee; under18parentcontract. Exactcancellationpublic: >=2weeksbeforestart0withheld,then10%,afterstartbeforemid20%+allpastlessonsEVENmissed,aftermidnofeerefund; rulesforfullintensivecourse notthreeinstalmentANNUALscheme. Publishedmaterialsresourcesincludedbutrequiredstudybooksandpracticeexamsseparate; selectedBELexplicit3booksextrapreserved, optionalexampackagesnotincluded. No797singlevisit/academic-unitamount/after-school-addon/membershipfee invented. Coursepackagenotfixedappointmentduration; literal4academicunitsretainedwithoutreconcilingunpublishedacademicminutesorMath2hclockdifferencebyguess. ActualsourceeachcourseMladost4Fontaniteblock460VCOURTYARD, oneCURRENTREALteachingpremise, no oldchildcare/subdomain/staff/otherroomsclones. ActualTermsownofficialcontact876900074+official@vyarabel.com, basehost/studentplatformvyarabel.eu/operator/phone/current460VaddressagainstALLruntime+WIPzero; studentplatformNOTopened/newbusiness. No businessweeklyhoursfromcourse-onlySat/Sunclock/childcare08–18/adminhours. Sourceintakecoordinatesnull. FULLPrivacy5190EOFordinaryWix/GDPR, fullTermsrestrictonlycourseSTUDENTMATERIALSdistribution, no websiteDB/automation/personalnoncommercialsourcebanobserved; no licence/legalclearanceclaim. Sourceclassprose/teachingmaterials/testquestions/statistics/claims/testimonials/qualifications/photosNOTcopied; onlyindependentlyphrasedmerchant/course/Book/venue/literalfeequalifiers. No studentaccounts/privateclassroom/WixAPI/checkout/payments/action/customerfields/calls/geocode/Google/UI.',
})

// Keep the clearly sourced Bulgarian-language course; do not turn the
// mathematics course's undefined academic-unit convention into a fixed time.
reviews.find(review => review.id === 'sofia-vyarabel-mladost4-fontanite460v').notes += ' MATHoptionisOBSERVEDBUTHELD, NOTincludedinventory: ownerprints4academicunitsyet13:10–15:10clock, versusBEL4units07:40–10:20; Terms/FAQdonotdefineacademicminutes. Couldbedifferentsessionunitconventionsbutnotinferred/reconciled, no30/40/45minarithmeticor797division. RetainedonlyclearlypricedBELwholecoursewithactualpaidadvanceenrolmentNOWforfutureMarch–June2027; no fullcourse-menucompletenessclaim.'

export default { records, reviews }
