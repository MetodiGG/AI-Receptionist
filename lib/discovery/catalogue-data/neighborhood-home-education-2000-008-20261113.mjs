// Frozen manually reviewed intake008: 10 businesses, 10 services, 10 dated receipts. Root owns integration/photos/identities.
// Review dates follow UTC calendar days; Sofia booking hours retain Europe/Sofia.
const checkedOn = '2026-11-13', validUntil = '2027-02-11'
const records = [], reviews = []
const service = (category, name, description, facts = {}) => ({ category, appointmentModel: category === 'home_services' ? 'home_visit' : 'appointment', name, description, ...facts })
const price = (amount, unit, sourceUrl, extra = {}) => ({ amount, currency: 'EUR', kind: 'fixed', unit, sourceUrl, checkedOn, ...extra })
const hours = (sourceUrl, rows) => ({ sourceUrl, checkedOn, days: rows.map(([weekday, open, close]) => ({ weekday, periods: [{ open, close }] })) })
function add(facts, evidence) {
  const { bookingUrl, contactUrl = bookingUrl, excerpt, reviewedUrls, notes, priceSearchNotes, serviceUrls } = evidence
  const row = { cityCode: '68134', neighborhood: null, address: null, locationKind: facts.category === 'home_services' ? 'service_area' : 'premises', coordinates: null, ...facts, booking: facts.booking || { kind: 'phone', phone: facts.phone }, verification: { status: 'approved', checkedOn, validUntil, booking: { url: bookingUrl, excerpt }, contact: contactUrl } }
  records.push(row)
  const review = { id: row.id, checkedOn, website: row.website, bookingEntry: row.booking.kind === 'phone' ? 'phone' : row.booking.url, bookingReview: row.booking.kind === 'phone' ? 'phone_booking_reviewed' : 'owned_booking_reviewed', reviewedUrls, notes }
  if (priceSearchNotes) Object.assign(review, { pricingDecision: 'not_publicly_listed', priceSearch: { outcome: 'not_published', bookingUrl: row.booking.kind === 'form' ? row.booking.url : bookingUrl, serviceUrls, notes: priceSearchNotes } })
  reviews.push(review)
}

const gancheva = 'https://jennygancheva.com/bg/', ganchevaServices = 'https://jennygancheva.com/bg/online_services', ganchevaInternet = 'https://jennygancheva.com/bg/internet_law', ganchevaContact = 'https://jennygancheva.com/bg/contacts', ganchevaPrivacy = 'https://jennygancheva.com/bg/privacy-policy'
add({
  id: 'sofia-evgenia-gancheva-alabin8', name: 'Адвокат Евгения Ганчева', category: 'consulting', neighborhood: 'Център', address: 'София, ул. Алабин 8, ет. 4, офис 3', website: gancheva, phone: '+359888233024',
  services: [service('consulting', 'Правна консултация по интернет право', 'Присъствена консултация в кантората след предварително уговорен по телефон час. Темата, необходимите документи и хонорарът се уточняват с адвоката. Не включва изготвяне на документи, абонаментно обслужване или гарантиран правен резултат.')],
}, {
  bookingUrl: ganchevaServices, contactUrl: ganchevaContact, excerpt: 'Ако предпочитате среща в офиса на чаша кафе, резервирайте час за консултация по email или по телефона.',
  reviewedUrls: [gancheva, ganchevaServices, ganchevaInternet, ganchevaContact, ganchevaPrivacy],
  notes: 'Robotsfirst200publicallowedexceptwp-admin. ActualownServices Book section explicitlyinvites voicephone/email reservation forin-officeconsultation beforefullservice/fees/contactreview; phonechosen, notonlinewrittenproductrequest or email-onlybooking. Selectedactualinternetlawconsultation, notlegaladvice/contentcopiedfromarticles. ExactAlabin8floor4office3 owncontact/Services andprivacyactivityaddressconsistent; 1Legal.net samefounder/phonealias isnotanotherbusiness. RuntimeSOFIA+all2000domain/phone/operator noexistingmatch atreview. Fullcurrentprimarynavigation/service/contactfooter andprivacyread inordinarypublicHTMLafterreaderCachemiss (truncatedmiddle separatelyfinished); policyexplicitlyallowsbrowsingwithoutpersonaldata/registration, no explicitautomation/database/extraction/noncommercialban found. No generallicence/legalclearanceclaim. No numericconsultationfee/price link surfaced; projectquotesafterinquiry are notpublistedfee. Weeklyhours/duration notpublished in reviewedcontact/footer, omitted. No contactforms/querysearch/testaccount/sourcephotos/logo/ratings/clientcases/customerlegaldata/Maps/geocode/call/action/submission.',
  serviceUrls: [ganchevaServices, ganchevaInternet],
  priceSearchNotes: 'Reviewed actual in-officeconsultation voicephone booking invitation in Services, complete selected InternetLaw offering, owncontact and primaryhomepage/footer navigation plus privacy. No numeric initialin-personconsultation fee or price-list link is published in those reviewedpages. Written/onlinedocument products receive individualquotes afterinquiry; those are differentdeliverables and nofee is inferredforconsultation. No blocked pricemenu is markedunpublished. Consultation scope and fee requireconfirmation by thelawyer.',
})

const zdravkov = 'https://zdravkov-legal.com/'
add({
  id: 'sofia-zdravkov-legal-pozitano3', name: 'Адвокатска кантора Здравков', category: 'consulting', neighborhood: 'Център', address: 'София, пл. Позитано 3', website: zdravkov, phone: '+359886722772', booking: { kind: 'form', url: zdravkov },
  services: [service('consulting', 'Безплатна първоначална правна консултация', 'Първоначална консултация след заявка през собствената контактна форма на кантората. Темата и часът се потвърждават от екипа; не е гарантирана незабавна наличност. Последващо представителство, документи или други правни услуги не са включени.', { price: price(0, 'първоначална консултация', zdravkov) })],
}, {
  bookingUrl: zdravkov, excerpt: 'Запази час за консултация; Свържете се с нас днес за безплатна първоначална консултация!',
  reviewedUrls: [zdravkov],
  notes: 'Robotsfirst200Yoastpublicallowed. ActualownBookCTA points#contacts on same primarypage; fragmentnotstoredasURL. Fullyrendered ordinarypublicHTML provides own name/case/email/phone/message requestform, SofiaPozitano3 and0886722772. Formonlyinspected; no fields/consents/actions orsubmission. Source explicitlyoffersfreeinitialconsultation; onlythatlimitedoffer importedaszero, notsubsequentpaidlegalwork or invented duration. Mainservices/rootFAQ/footerreviewed; no separateTerms/Privacy/price link surfaced inactualprimarynavigation/footer, no globallicence/legalpermissionclaim. Exactphone/domain runtimeSOFIA+all2000 noexistingmatch. Weeklyservicehours notpublishedin reviewedfooter/contacts, omitted. No sourcearticles/reviews/clientcases/photos/logos copied; noGooglelink/image/map requests, privateAPI, geocode, call, customerdata.',
})

const paneva = 'https://paneva.eu/', panevaService = 'https://paneva.eu/konsultacii/individualni-psihologicheski-konsultacii', panevaContact = 'https://paneva.eu/kontakt'
add({
  id: 'sofia-marina-paneva-banat3', name: 'Марина Панева · психолог', category: 'other', neighborhood: 'Лозенец', address: 'София, ул. Банат 3, партер', website: paneva, phone: '+359886331306',
  services: [service('other', 'Индивидуална психологическа консултация', 'Индивидуална среща в кабинета след предварително уточняване на ден и час по телефона. Хонорарът и конкретните условия се потвърждават с психолога; не се обещава медицинска диагностика, лечение или гарантиран резултат.')],
  openingHours: hours(panevaService, [1, 2, 3, 4, 5].map(day => [day, '09:00', '18:00'])),
}, {
  bookingUrl: panevaService, contactUrl: panevaService, excerpt: 'Свържи се с мен за записване час за консултация; или 0886 33 13 06',
  reviewedUrls: [paneva, panevaService],
  notes: 'Robotsfirst200publicallowed exceptinternal/queryroutes notrequested. Actualselectedservice Booksection provides form and explicitvoicephonealternative; phonechosenwithoutCAPTCHAinteraction. Servicepage itself confirms actualBanat3parter cabinet, appointmentdaysMonFri09–18; not administrativehourssubstitution. Fullselectedoffering/rootnavigation/footer reviewed; usual50minute wordingnotmadefixedscalar, no numericfee orpricelinkobserved. Contactroute/kontaktreaderCachemiss and guessed/kontakti404notrepresentedassuccessfulreview; exactservicepageindependentlycontainsfullcontactandBookevidence. No separatepolicy/termslink surfaced inprimarynavigation/footer, no licenceclaim. RuntimeSOFIA+all2000host/phone noexistingmatch. No formfields/CAPTCHA/consents/submission/customerdata/medicalclaims/sourcearticles/photos/Google/geocode.',
  serviceUrls: [panevaService],
  priceSearchNotes: 'Reviewed actualselectedindividualconsultation pageincludingentireBook/phonealternative, fullserviceinformation andcontact/footer, plusownhomepage/navigation. No numericindividualconsultation fee or separatepricelistlinkpublishedin those reviewedprimarypages. Failedcontactreader/404routeisnotusedasproof; allnecessaryBook/service/contactfactsare independentlyvisibleonselectedservicepage. Priceandappointmentconditions requiredirectconfirmation. No blockedpricemenu claimedunpublished.',
})

const gidikova = 'https://stelagidikova.com/', gidikovaContact = 'https://stelagidikova.com/kontakti/', gidikovaServices = 'https://stelagidikova.com/uslugi/'
add({
  id: 'sofia-stela-gidikova-ivan-vazov38', name: 'Стела Гидикова · психолог и психотерапевт', category: 'other', neighborhood: 'Център', address: 'София, ул. Иван Вазов 38', website: gidikova, phone: '+359893513598',
  services: [service('other', 'Индивидуална психотерапия и консултация', 'Присъствена индивидуална среща в софийския кабинет само след предварително записване по телефона. Конкретният час, продължителността и хонорарът се уточняват с терапевта. Не включва други предлагани практики или медицински услуги.')],
}, {
  bookingUrl: gidikovaContact, excerpt: 'Работя само с предварително записване на телефон 0893 513 598.',
  reviewedUrls: [gidikova, gidikovaContact, gidikovaServices],
  notes: 'Robotsfirst200explicitsearch=yes/use=reference/ai-train=no; onlyminimalindependentlyphrasedfactualreference, nottraining/AItrainingreuse. No namedbotdisallowapplicabletoreferencepath observed; noaccesschallenge. ActualowncontactBookphonefirst; currentcontactlistsSofiaIvanVazov38asactualcabinet separatelyfromPlovdiv/Asenovgrad. Onlyactualindividualpsychotherapy/consultationimported; noBach/colourtherapy/clinicaldoctorclaims. EntireServices/contact/footer androotprimarynavigationreviewed; no numericfee/pricelink, no separateTerms/Privacylink surfaced. No globallicence/legalclearanceclaim. Weeklybranchschedule/duration notpublishedinreviewedpages, omitted. RuntimeSOFIA+all2000host/phone noexistingmatch. No mapslinksopened/formsfilled/consents/calls/sourcephotos/articles/clientcases/reviews/privateAPI/geocode.',
  serviceUrls: [gidikovaServices],
  priceSearchNotes: 'Reviewed actualadvancevoicephonebooking instruction andfullcontactpage, fullServices pageforindividualpsychotherapy/consultation andownhomepage/footer navigation. No numericordinaryindividualsession tariff orpricelistlinkpublishedinthesereviewedpages. SeparatebrancheslistedbutnoSofia-specificweeklyhours/durationclaimed. Feeandactualappointmentneed directconfirmation; nofailedtariff/menuisrepresented asunpublished.',
})

const filipova = 'https://filipova.bg/', filipovaContact = 'https://filipova.bg/contacts/', filipovaService = 'https://filipova.bg/%D0%B8%D0%BD%D0%B4%D0%B8%D0%B2%D0%B8%D0%B4%D1%83%D0%B0%D0%BB%D0%BD%D0%B0-%D0%BF%D1%81%D0%B8%D1%85%D0%BE%D1%82%D0%B5%D1%80%D0%B0%D0%BF%D0%B8%D1%8F/'
add({
  id: 'sofia-adelina-filipova-knyaz-boris108', name: 'Аделина Филипова · психолог и психотерапевт', category: 'other', neighborhood: 'Център', address: 'София, ул. Княз Борис I 108, ет. 3, офис 5', website: filipova, phone: '+359888956760',
  services: [service('other', 'Индивидуално психологично консултиране', 'Индивидуална консултация в софийския кабинет след предварително записан по телефон час. При записването се потвърждават софийската локация, времето и хонорарът. Не е спешна медицинска помощ и не включва други самостоятелни услуги или обучения.')],
}, {
  bookingUrl: filipovaContact, excerpt: 'Психологична консултация или терапевтична сесия се провежда след предварително записан час. Можете да запазите час по телефон',
  reviewedUrls: [filipova, filipovaContact, filipovaService],
  notes: 'Robotsfirst200publicWPpathsallowed. ActualownBookcontactfirst, directvoicephoneappointmentexplicit. FreshordinarypublicHTTPScontactcorroboratesreader: separatelylistedSofiaKnyazBorisI108floor3office5andVarnaPreslav49; footerVarnadoesnotremoveexplicitcurrentSofiabranch. OneSofiavenueonlynoonline/staff/citywideclone. Fullselectedindividualpsychologicaloffering/rootnavigation/contactfooterreviewed; no numericfee/pricelink orseparateTerms/Privacylink surfaced. Onlyminimalindependentlyphrasedbooking/service/venuefacts, no copiedarticles/media/credentials/clientcases/reviewsorlegallicenceclaim. GeneralMonFri09–18contacthoursnotassignedtoSofiasessions becausebranchspecificteaching/consultationhoursnotbound. Durationomitted. RuntimeSOFIA+all2000host/phone noexistingmatch. No maps/providerlinksopened/formfields/call/submission/privateAPI/geocode/customerdata.',
  serviceUrls: [filipovaService],
  priceSearchNotes: 'Reviewed actualownphoneappointmentcontactpage, fullindividualpsychologicalconsultation service and ownhomepage/navigation/footer. No numericordinaryindividualconsultationfee orpricelistlinkpublishedinthecheckedprimarypages. Broadsitearticles/events andseparatemethodofferingsnotcopiedorpriced asthisservice. CurrentcontacthasSofiaandVarnabranches; no branchfee orcontacthourspretendedtobeserviceavailability. FeeandactualSofiaappointmentrequireconfirmation. No inaccessiblepricemenu declaredunpublished.',
})

const chankova = 'https://cantorachankova.com/', chankovaBook = 'https://cantorachankova.com/%D0%B0%D0%B4%D0%B2-%D0%B3%D0%B0%D0%BB%D0%B8%D0%BD%D0%B0-%D1%87%D0%B0%D0%BD%D0%BA%D0%BE%D0%B2%D0%B0/', chankovaContact = 'https://cantorachankova.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82/', chankovaFees = 'https://cantorachankova.com/%D0%B2%D1%8A%D0%B7%D0%BD%D0%B0%D0%B3%D1%80%D0%B0%D0%B6%D0%B4%D0%B5%D0%BD%D0%B8%D1%8F/', chankovaTerms = 'https://cantorachankova.com/%D0%BE%D0%B1%D1%89%D0%B8-%D1%83%D1%81%D0%BB%D0%BE%D0%B2%D0%B8%D1%8F/'
add({
  id: 'sofia-galina-chankova-tri-ushi1', name: 'Адвокат Галина Чанкова', category: 'consulting', neighborhood: 'Център', address: 'София, ул. Три Уши 1, етаж 3, офис 1', website: chankova, phone: '+359887201222',
  services: [service('consulting', 'Правна консултация', 'Консултация в кантората след предварително записване по телефона. Темата и хонорарът се уточняват с адвоката; публикуваните нормативни справки не са представени като фиксирана индивидуална цена. Процесуално представителство и изготвяне на документи не са включени.')],
}, {
  bookingUrl: chankovaBook, contactUrl: chankovaContact, excerpt: 'ЗАПИШЕТЕ ЧАС ЗА КОНСУЛТАЦИЯ',
  reviewedUrls: [chankova, chankovaBook, chankovaContact, chankovaFees, chankovaTerms],
  notes: 'Robotsfirst200Yoastpublicallowed. OwnactualBookCTA on About/consultation page anddirectphone/contact first. Owncontactpublishedlinktext itself states TriUshi1floor3office1; no Googlelinkedpage/mapwasopened. Actualconsultationoffered beforeprocessrepresentation. ActualFeespage readerTimeout thenordinarypublicHTTPSread: statutoryOrdinance1reference, notbusiness-specificnumericappointmenttariff. No100BGNstatutoryoraladvicefigureconverted/copiedasthisfirmfee. Termsfullread: ordinaryIPresources/copyrightclause, lawfuluseexceptions, noexplicitautomation/database/noncommercialaccessban observed; independentlyphrasedminimalfacts only, no licence/legalguaranteeclaim. Weeklyhours/duration omitted. RuntimeSOFIA+all2000host/phone noexistingmatch. No legalarticles/cases/ratings/photos/qualificationscopied, formfields/consents/actions/calls/customerdata/privateAPI/geocode.',
  serviceUrls: [chankovaBook, chankovaFees],
  priceSearchNotes: 'Reviewed actualconsultationBook/phone evidence, fullcontact andprimaryroot/footer plusaccessibleFeespage. Thelatter reproduces statutoryOrdinance1, whoseopeningstatesfreelyagreed writtenfee; it doesnot publishanindividualbusiness-specificamounttiedtothischosenconsultation. Thisisnotablockedmenu; reference100/200BGNstatutoryfiguresarenot assertedasthepracticecurrentappointmenttariff. No numericownconsultationfeeobserved incheckedBook/contact pages. Actualscopeandfee requireconfirmation.',
})

const ies = 'https://ies.bg/', iesContact = 'https://ies.bg/kontakti/', iesFees = 'https://ies.bg/ceni/', iesPrivacy = 'https://ies.bg/politika-za-poveritelnost/'
add({
  id: 'sofia-ies-pozitano3-office10', name: 'Правна кантора IES · София', category: 'consulting', neighborhood: 'Център', address: 'София, площад Позитано 3, етаж 2, офис 10', website: ies, phone: '+359885462318',
  services: [service('consulting', 'Присъствена правна консултация по застрахователен казус', 'Среща в централния софийски офис след предварително уговорен по телефона час. Темата и приложимите финансови условия се уточняват с кантората. Безплатните дистанционни консултации и условните кампании не се представят като обща безплатна присъствена услуга; последващо представителство е отделно.')],
}, {
  bookingUrl: iesContact, excerpt: 'След предварително уговорена среща можете да ни посетите на адрес гр. София, площад „Позитано” №3, етаж 2, офис 10',
  reviewedUrls: [ies, iesContact, iesFees, iesPrivacy],
  notes: 'Robotsfirst200publicWPpathsallowed. ActualBookcontactsection saysadvanceagreedvisit atSofiaheadquarter andnationalvoicephones; freshordinaryHTTPScontactconfirmsPozitano3floor2office10. OneactualSofiaoffice notnationalstaff/cityaliases. ActualPricesreadbeforefee decision: freeallphone/online differsdelivery; freeoffice/video forinjuredPTPpersonswithinacampaign orseverehealthconditionsisconditional, notunconditionalordinaryofficefee. Representationpercentageonsuccessunnumeric/differentservice notconsultationfee. Rootactualinsurancelegalconsultationofferingreviewed; no medicalservicesimported. PrivacysectionsI–XVIIreviewedordinaryGDPR/publicbrowsing, noextractionbanobserved; no licenceclaim. NationalphoneMonSun09–19:30notassignedtoofficeappointments; hours/durationomitted. RuntimeSOFIA+all2000host/bothphonesnoexistingmatch. No formfields/consents/booking/customerclaimsdata/calls/Maps/sourcephotos/reviews/clientcases/privateAPI/geocode.',
  serviceUrls: [ies, iesFees],
  priceSearchNotes: 'Reviewed actualownin-personBook/contactinstructions, fullprimaryinsuranceconsultationoffer andpublishedPricesconditions. No unconditionalnumericfee forordinaryin-personofficeconsultationislisted. Phone/onlinefreeisadifferentdeliveryoffer. Conditionalfreein-personcampaignforPTPinjuriesandseverehealthconditionsisnotgeneralisedorimportedaszeroforthisordinaryservice. Outcome-basedrepresentationpercentage isseparateandnon-numeric. Feeandeligibilityconditionsmustbeconfirmedwiththefirm. No blockedmenu treatedasunpublished.',
})

const arnaudov = 'https://advokatarnaudov.com/', arnaudovContact = 'https://advokatarnaudov.com/%D0%BA%D0%BE%D0%BD%D1%82%D0%B0%D0%BA%D1%82%D0%B8/', arnaudovFees = 'https://advokatarnaudov.com/%D1%82%D0%B0%D1%80%D0%B8%D1%84%D0%B8/', arnaudovTerms = 'https://advokatarnaudov.com/%D1%83%D1%81%D0%BB%D0%BE%D0%B2%D0%B8%D1%8F-%D0%B7%D0%B0-%D0%BF%D0%BE%D0%BB%D0%B7%D0%B2%D0%B0%D0%BD%D0%B5-%D0%BD%D0%B0-%D1%81%D0%B0%D0%B9%D1%82%D0%B0/'
add({
  id: 'sofia-arnaudov-uzunova-tsar-boris19', name: 'Адвокатско дружество Арнаудов и Узунова · София', category: 'consulting', address: 'София, бул. Цар Борис III 19, до вх. А, партер', website: arnaudov, phone: '+359894367935',
  services: [service('consulting', 'Присъствена правна консултация', 'Обстойна платена правна консултация в софийската кантора след предварително уточняване по телефона. Хонорарът се договаря според казуса и обема на работата. Безплатното кратко запитване през формата не е тази услуга; документи и процесуално представителство са отделни.')],
}, {
  bookingUrl: arnaudovContact, excerpt: 'Ако желаете обстойна платена правна консултация на място в някоя от нашите кантори или онлайн, може да се свържете с нас',
  reviewedUrls: [arnaudov, arnaudovContact, arnaudovFees, arnaudovTerms],
  notes: 'Robotsfirst200publicWPpathsallowed. ActualowncontactBookexplicitpaidin-personconsultationwith0894367935, distinctfromfreewrittenbriefinquiry. Owncontact/rootconfirmsSofiaTsarBorisIII19nexttoentranceAparter, samebranchphone. OneSofiavenueonly, notothercities/staffaliases. FullactualTariffsread: feeindividuallynegotiatedbycasecomplexity/workscope, possibleinstalments; externalstatutoryminimumreference notcopiedasownnumericfee andnolegalvalidityclaim. OwnTermslinkreadererror thenordinarypublicHTTPSreturnsheadingandnavigationbutnoactualtermstext; thislimitationrecorded, notlicenceorfulllegalclearanceclaim. Noexplicitaccessbanobserved. No weeklybranchhours/fixeddurationpublishedincheckedcontact/footer, omitted. RuntimeSOFIA+all2000host/bothphonesnoexistingmatch. No formsfields/actions/calls/customerlegaldata/sourcephotos/reviews/clientcases/Maps/statuteexternalrequests/privateAPI/geocode.',
  serviceUrls: [arnaudovContact, arnaudovFees],
  priceSearchNotes: 'Reviewed actualpaidconsultationphonebooking instructions andfullownTariffs/contact/rootfooter. Tariffexplicitlysetsconsultationfeesindividuallybyfactual/legalcomplexityandworkscope; no numericbusinessconsultationamountpublishedinthosecheckedpages. Briefwritteninquiryisexpresslyfreebutdifferentofferandnotimportedasthispaidservicefee. ExternalOrdinance linknotusedtoguessnumericownfee. Theactualtariffisreadable, notablockedpricemenu; emptyTermsbodyisnotrepresentedastarifffindings.',
})

const tfb = 'https://tfb.bg/', tfbBook = 'https://tfb.bg/advokat-v-grad-sofia/', tfbContact = 'https://tfb.bg/kontakti-advokatska-kantora-tfb/'
add({
  id: 'sofia-tfb-city-tower-makedonia', name: 'Адвокатска кантора ТФБ · Бизнес център Сити тауър', category: 'consulting', neighborhood: 'Център', address: 'София, пл. Македония, Бизнес център Сити тауър, при ул. Алабин и бул. Христо Ботев', website: tfb, phone: '+359876888878',
  services: [service('consulting', 'Безплатна правна консултация', 'Консултация след предварително запазен по телефон час в посочения софийски офис в Бизнес център Сити тауър. Часът и темата се потвърждават от кантората; последваща защита, представителство и документи не са включени.', { price: price(0, 'консултация', tfbBook) })],
}, {
  bookingUrl: tfbBook, contactUrl: tfbContact, excerpt: 'Свържете се с нас още сега и запишете час за безплатна правна консултация с професионалист.',
  reviewedUrls: [tfb, tfbBook, tfbContact],
  notes: 'Robotsfirst200publicpathsallowed. ActualSofiaBookphone0876888878/+359876888878atCTA/contact, explicitfreeconsultation andadmissiononlyafterreservedhour. Actualowncontacts/cityservicefooterbindnamedSofiaheadquarterBusinessCentreCityTowerMakedoniasquareatAlabin/HristoBotevcrossing. Rootconfirmedthisspecificpublishedofficebuildingaddressacceptable; no invented1streetnumber/floor/office/point. Thisisrealnamedpremisesnotservicearea. OtherSlavyanska5vs5asourceconflictHELDnotimported; onlyoneoperatorvenuehere. Actualselectedfreeofferonly, notunlimitedfreelegalrepresentation. Root/navigation/contact/servicefooterreviewed; no separatepolicy/termstarifflinksurfaced, no licenceclaim. Weeklyservicehours/durationomitted. RuntimeSOFIA+all2000host/phonenomatch. No bookingfields/calls/actions/customerdata/sourcecases/clientlogos/reviews/images/Maps/geocode/privateAPI.',
})

const colomba = 'https://colomba.bg/', colombaService = 'https://colomba.bg/usluga/profesionalno-pochistvane-osnovno/', colombaContact = 'https://colomba.bg/kontakti/', colombaPrices = 'https://colomba.bg/ceni/', colombaTerms = 'https://colomba.bg/obshti-usloviya/', colombaPayments = 'https://colomba.bg/plashtania/'
add({
  id: 'sofia-colomba-home-cleaning', name: 'Коломба Къмпани · почистване на адрес', category: 'home_services', website: colomba, phone: '+359899806696', booking: { kind: 'form', url: colombaService },
  services: [service('home_services', 'Основно почистване на жилище', 'Еднократно почистване на жилище в София след заявка с адрес и желана дата и потвърдена оферта. Обхватът и цената се договарят, при нужда след оглед. Пране на мебели, работа на височина, извозване, вътрешности на уреди и следремонтно почистване не са автоматично включени.')],
}, {
  bookingUrl: colombaService, contactUrl: colombaContact, excerpt: 'Запитване. Получаваме адрес/район, площ, вид обект, снимки и желана дата. Оферта. Потвърждаваме цена и условия',
  reviewedUrls: [colomba, colombaService, colombaContact, colombaPrices, colombaTerms, colombaPayments],
  notes: 'Robotsfirst200publicAllow, prohibitedinternal/actionroutesnotaccessed. ActualownBookquoteform first: visible name/phone/email/serviceoption/message/consentfields notfilled. Selectedrealonsitecleaningservice explicitlyreceivesdesiredvisitdate/address andplansscope/confirmedquote beforecleaning; notretail/inspection-only orautomaticconfirmedslot. OwnTerms sayformnotcontract/guaranteedcapacity; descriptionpreservesagreement. OneSofiaservice_arearowaddress/coordinatesnull; SuhaReka69apartmentismanagementaddressnotcustomerpremises. Fullactualselectedservice/Prices/payment/Terms/contactread ordinarypublicHTTPS afterreadererrors, outputtailscompleted. Earlierguessed/usluga/osnovno-pochistvane404notactualmenu; actuallinkresolvedfromownnavigationandfullyread. GeneralPriceshasotherofferindicativefees butselectedbasiccleaningexplicitlyhasno universalnumericfee; no transplantofsubscription/DDD/ozone/firefees. TermsIPtext/design/assetsnotcopied, no permission/licenceclaim. RuntimeSOFIA+all2000host/phonenoexistingmatch. No hours/durationguess, cart/action/formsubmission/calls/customerdata/Google/privateAPI/geocode/sourceimages/reviews.',
  serviceUrls: [colombaService, colombaPrices],
  priceSearchNotes: 'Reviewed actualBookform andselectedonsitebasiccleaningprocess, fullservice/Prices/contact/paymentpages andTerms. BothselectedserviceandgeneralPricesexplicitlystateindividualquotebyarea/condition/scope, no universalsqmfee forthisservice. NumericexampleselsewhereonPricesareforotherseparateofferingsincludingperiodicsubscription/DDD/ozone/firecleaning, notthisone-offbasiccleaningandarenotcopied. Visitdate/capacity/price/scope requireconfirmation, requestaloneisnotacceptedorder. Allrelevantselectedpricetextisreadable; no inaccessiblemenu claimedunpublished.',
})

export default { records, reviews }
