// One real private practice; no staff, service or online-office count clones.
const checkedOn = '2026-11-14', validUntil = '2027-02-12'
const website = 'https://existea.com/'
const url = path => new URL(encodeURI(path), website).href
const contact = url('контакти'), selected = url('индивидуално/психологическа-консултация-софия-или-онлайн')
const serviceIndex = url('услуги'), faq = url('въпроси/за-консултацията')
const records = [{
  id: 'sofia-existea-magdalina-altavanska', name: 'Екзистеа · Магдалина Алтаванска, психолог',
  cityCode: '68134', neighborhood: null, address: 'София, бул. Никола Вапцаров 17–21',
  locationKind: 'premises', coordinates: null, category: 'other', website, phone: '+359896778319',
  booking: { kind: 'phone', phone: '+359896778319' },
  services: [{ name: 'Индивидуална психологическа консултация на живо', category: 'other', appointmentModel: 'appointment',
    description: 'Среща в кабинета в София след предварителна телефонна уговорка. Таксата и продължителността се уточняват преди посещението. Безплатният опознавателен разговор по телефона не означава безплатна цяла присъствена консултация.' }],
  openingHours: { sourceUrl: contact, checkedOn, days: [...[1,2,3,4,5].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '20:00' }] })), { weekday: 6, periods: [{ open: '11:00', close: '18:00' }] }] },
  verification: { status: 'approved', checkedOn, validUntil,
    booking: { url: contact, excerpt: 'Собствените контакти изрично позволяват резервиране по телефона; FAQ обяснява как след опознавателен разговор се насрочва час в кабинета или онлайн.' }, contact },
}]
const reviews = [{
  id: records[0].id, website, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
  reviewedUrls: [website, contact, selected, serviceIndex, url('въпроси'), faq, url('общи-условия'), url('политиката-по-защита-на-личните-данни')],
  pricingDecision: 'not_publicly_listed',
  priceSearch: { outcome: 'not_published', bookingUrl: contact, serviceUrls: [selected, serviceIndex, faq],
    notes: 'Root full fresh native ordinaryHTTP200 actualBook→Contact read first, then entireselected individualconsultation, fullServicesindex andactualconsultationFAQ subsection (notjustFAQindex). Explicitphonebooking available; Contactonline text points to ownedmessageform, no distinctconfiguredexternalcalendar/menu found in actualnavigation/anchors. Noneofthesepagespublishesnumeric totalconsultationfee/range or Prices/tariff link. Freeintrobyphone/Viber is NOT wholepaidinpersonservice, not0; Contactfirst90min at60minfee with30freepart contains no monetary amount. Notdeclaredunpublishedfromtechnicalfailure/blockedcalendar. Strictservice_reviewed only, notfullpricecoverage.' },
  notes: 'Root actualPhoneBook896778319 and fullFAQexplicitlyschedule OFFICEoronlineappointmentafterintro. SelectedonlyphysicalSofiameeting, one namedprivatepractice notseparateonline/child/staff/servicesbusinesses. Selectedpagegeneral60–80min, FAQ60–90min andContactfirst90min are different/variablecontexts; no fixed durationMin inferred or arbitraryonechosen. CurrentContactMonFri10–20Sat11–18actualpracticehours; noSundayclosureguess. OwnpublishedrangeNikolaVaptsarov17–21 retained, no17/21individualpostalpointorcentroidselected. RepeatedgenericAppleMapsCentralOffice link seen butNOTopened oraccepted as precise venuepoint. FullPrivacy has unrelatedtechnical/digital-services wording plus differentregisteredaddress/legacylandline: template/adminmetadata documented, NOTcurrentvisitaddress/phone/anotherbranch or legal-identityguarantee. Currentroot/Book/selectedservices/FAQ allconsistently practitioner/privateoffice896778319/Sofia17–21. TermsJune2020 is ordinary disclaimer/external-link caveat; fullPrivacyGDPR no expressautomation/database/wholewebsitecommercial-useban observed, notuniversallegalclearance. Minimalindependentlyphrasedprofessionalappointment/contact/hoursfacts only; no copiedclinicaladvice, authoredtherapyprose/testimonials/clientnames/portraits/credentials/outcomes or diagnosticrecommendations. No medicaldoctorsoutsideownerscope, no medication/prescriptionclaims. Runtime+ALLintake host/currentphone/name/legacyphone dedupe required atintegration. No form/consent/captcha/phonecall/clientproblem/booking/Maps/Nominatim/API/account/email/productionwrites.',
}]
export default { records, reviews }
