// Frozen manually reviewed intake012. Root owns integration/photos/identities.
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

const areti = 'https://demetriosbride-bg.com/'
const aretiMenu = `${areti}booking`
const aretiPhoneBook = `${areti}contact`
add({
  id: 'sofia-areti-krum-popov63', name: 'Арети · булчински салон', category: 'other',
  neighborhood: 'Лозенец', address: 'София, Лозенец, ул. „Крум Попов“ 63',
  website: areti, phone: '+359878521660',
  openingHours: { sourceUrl: aretiPhoneBook, checkedOn, days: [...[1,2,3,4,5].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '19:00' }] })), { weekday: 6, periods: [{ open: '10:30', close: '18:00' }] }] },
  services: [service('other', 'Първа консултация и проба на булчински рокли', 'Платена първа 90-минутна персонална среща с консултант и проба на рокли, без задължение за покупка. Не е безплатната втора проба за връщащи се клиентки. Само след предварителна заявка и потвърден час; промяна или отмяна до 24 часа преди срещата.', { price: price(30, 'първа консултация с проба · 90 минути', aretiMenu), durationMin: 90, durationSourceUrl: aretiMenu, durationCheckedOn: checkedOn })],
}, {
  bookingUrl: aretiPhoneBook,
  excerpt: 'Реалният салон приема с предварително записан час; контактната страница свързва точния адрес и телефон, а собственото меню отделя платената първа среща от втората проба.',
  reviewedUrls: [areti, `${areti}terms`, aretiMenu, aretiPhoneBook],
  notes: 'Actual ownedrootReserve→/booking readonly firstservice menu inspected before contact: FIRSTconsultation30EUR90min withconsultant/collection, SECONDfittingFREE ONLYreturningcustomers withspecificpreviouslytrieddress. No type/date/time/dress selected or stepsadvanced, no inputs/submission. Chosen genuinePHONEpath: ownContact expressly worksbypriorappointment, binds878521660 andactualKrumPopov63Lozenetsstudio/hours; no claimactualonlinecalendarcompleted. Full2205charTerms§3 precisely says RESERVATIONforfitting free/nonbinding, not actualFIRSTfittingservice free; administrativebooking cost distinguished from explicit30EUR firstservice, never inferred0fee or contradictorywhole-priceclearance. Terms24hchange/cancel andownerconfirmation preserved; two-plusunannouncednoshowscanleadfuturebookingrefusal. NamedAretiTomosEOOD/areti.bgmail ownerbinding, runtime+ALLWIP alias/basehost/phone/name dedupe zero. FullTerms§5 ordinaryauthoredtexts/images/logo/designcopyright, no dataDB/automation/wholeServicesnoncommercialrestriction; minimalindependentlyphrasedfacts only, no contentlicence/legalclearance claimed and no dresses/images/designs/productrows/creativeassets copied. OnlyoneSofiavenue, no staff/singlefittingroom clones. MonFri10–19Sat10:30–18 actualpriorbookstudiohours, noSundayclosure inferred. No coordinates from directions/map, call, action, purchase, bookingwrite or customerdata.',
})

const itDoctor = 'https://itdoctor.bg/'
const itDoctorBook = `${itDoctor}it-pomosht-na-adres/`
add({
  id: 'sofia-it-doctor-home-support', name: 'IT Doctor · компютърна помощ на адрес', category: 'home_services',
  website: itDoctor, phone: '+359877913424',
  services: [service('home_services', 'Компютърна IT помощ на адрес в София', 'Начална цена за посещение според проблема, времето, устройствата и адреса. Часът, обхватът и ценовият ориентир се потвърждават след разговор. Допълнителен труд, части и лицензи се съгласуват отделно. Не всеки хардуерен ремонт може да приключи на място.', { price: price(45, 'посещение на адрес · начална цена', `${itDoctor}czeni/`, { kind: 'from' }) })],
}, {
  bookingUrl: itDoctorBook, contactUrl: `${itDoctor}kontakti/`,
  excerpt: 'Избраната услуга на адрес изрично предлага обаждане на 0877913424 и потвърждаване на наличен час, обхват и ценови ориентир преди посещението.',
  reviewedUrls: [itDoctor, itDoctorBook, `${itDoctor}kontakti/`, `${itDoctor}czeni/`, `${itDoctor}uslugi/`],
  notes: 'Actual selectedhomevisitBook section inspected before services/prices: explicitphone877913424 and step2confirmavailablehour/expectedscope/price before actualSofiahomevisit; rootBookCTAs→ownContact also inspected, chosen voicepath not genericcontact alone. ITDoctor is computingbrand, NOThumanmedicaldoctor/clinicaloffering. OneSofia mobilebusiness only, no unproven shop/pin/quarterclone. Literalfrom45EUR PER VISIT currentownerpricecard, not30EURremoteoffer/90EURmonthlysupport or unrelated visibletemplateStart19USDmonthlyplans. GenericEnglishplaceholderpricing/table and advisoryFAQ fragments recorded but not imported asmerchantfees/services; selectedBGoffering/phone/homevisit/scope consistent acrossroot/selectedpage/contact/prices/services. Additionalwork/parts/licences require agreement, no guaranteedrepair/duration/hours/VAT guessed. Actualallnavigation/footer/prices/contact/source no separateTerms/privacy link surfaced; no broadlicence/unseenTerms clearance claim. Minimalindependentlyphrasedmerchant/servicefacts only, no advicearticles/prose/ratings/reviews/images copied. No personaldevice/data access, remotecontroltool, password, request, form, call, calendar, Maps/social/action/API/payment/UI. Runtime+ALLWIP host/phone/operator preflight clear.',
})

const enter = 'https://enterbg.com/'
const enterMobileBook = `${enter}мобилен-сервиз-и-поддръжка/`
add({
  id: 'sofia-enter-computers-mobile-support', name: 'Enter Computers · мобилен компютърен сервиз', category: 'home_services',
  website: enter, phone: '+359877911900',
  services: [service('home_services', 'Посещение на компютърен техник в София', 'След предварителна уговорка на адрес, проблем и график в обслужваните райони на София. Цената се уточнява според адреса, задачата и очакваната работа. Части и допълнителни действия се одобряват отделно; сложен хардуерен ремонт може да изисква приемане в сервиза.')],
}, {
  bookingUrl: enterMobileBook, contactUrl: `${enter}contact/`,
  excerpt: 'Собствената мобилна услуга кани за заявка на 0877911900; преди посещението се потвърждават обслужваният адрес, възможността, условията и организацията на услугата.',
  reviewedUrls: [enter, enterMobileBook, `${enter}contact/`, `${enter}общи-условия/`, `${enter}политика-за-поверителност/`],
  serviceUrls: [enterMobileBook],
  priceSearchNotes: 'Reviewed actual owned mobile-visit phoneBook/service page in full, root navigation/footer, actualContact, fullTerms andprivacy. The selectedSofiaonsitevisit has no numeric fee, range, duration or tariff link: its ownfee section explicitly says price agreed beforehand byaddress, service andexpectedwork. Generalretailrepair/modelparts warnings and remoteassistance are not a quotedhomevisitprice. No blocked/inaccessibleactualpricemenu found and none declaredunpublished becauseofHTTPerror. Includedonlythisonsitevisit; price remainsabsent, not0/free and not a completedprice review.',
  notes: 'Actual selectedowner mobilevisitBook phone instructions reviewed before contact/services/fees: explicit877911900, describesdevice/problem/address, confirmsareaavailability/terms/serviceorganisation withowner beforeattendance. OneSofia service_area provider, not secondMladost1block54shop clone orquarterstaffaliases. Possibleattendance dependsaddress/problem/schedule, no same-day/fullcityguarantee. Terms/contact/service samecurrentphone877911900; privacytemplatefooterlegacy888912900 noted, not used ascurrentbooknumber and independentlydeduped. OwncontactformJS disabledmessage isNOTactualpriceblock; independentvoicepath alreadyproven, no formclaim/input/submission. Full7282charTerms ordinarycopyright protects authoredtext/images/structure andsubstantialcommercialcontentcopy, no database/extraction/wholeServicesnoncommercial restriction observed; minimalfactualreference only, no licence/legalclearance or creativeassetcopy. Full4046charprivacy ordinaryGDPR withtemplatecompanyblank/oldphone noted, not resolved withguessedidentity. No numericservicehours/duration/coords/fee inferred. No articles/credentials/reviews/customerdata/media/Maps/call/remoteaccess/password/UI/action/API/purchase/bookings executed. Strictgenuineunpublishedreceipt isservice_reviewed, notprice-reviewed; runtime+ALLWIP host/phones/operator preflight clear.',
})

const jollie = 'https://www.jollie.bg/'
const jollieBook = `${jollie}запазетечас`
add({
  id: 'sofia-atelier-jollie-rozova-dolina12b', name: 'Atelier Jollie · София', category: 'other',
  neighborhood: 'Лозенец', address: 'София, Лозенец, ул. „Розова долина“ 12Б, на ъгъла с ул. „Стоян Заимов“',
  website: jollie, phone: '+359888336111',
  openingHours: { sourceUrl: jollie, checkedOn, days: [2,3,4,5,6].map(weekday => ({ weekday, periods: [{ open: '11:00', close: '18:00' }] })) },
  services: [service('other', 'Персонална консултация и проба на рокли', 'Само с предварително резервиран час в софийския бутик, до един астрономически час и до трима придружители. Таксата отпада при покупка на рокля. Закъснението не удължава срещата; над 15 минути без предупреждение часът може да бъде анулиран. Корекции и покупка не са включени.', { price: price(20, 'персонална консултация и проба · до 1 час', jollieBook) })],
}, {
  bookingUrl: jollieBook, contactUrl: jollie,
  excerpt: 'Действителната страница за проба изрично предлага запазване по телефона за София на 0888336111; всички посещения са само с предварителна резервация.',
  reviewedUrls: [jollie, jollieBook, `${jollie}faq`, 'https://www.atelierjollie.com/'],
  notes: 'Actual ownlegacyatelierjollie.com currentContact→www.jollie.bg, canonicalrootactualBook→/запазетечас inspected first. ExplicitvoiceSofia888336111, selectedSofiabusiness notPlovdivphone/venue clone. CurrentrootbindsSofiaRozovaDolina12BcornerStoyanZaimov andactualTueSat11–18bookedstudioworkinghours; fullFAQ saysvisitsONLYofficialstudiohours, no after-hoursavailability or holidayguarantee. RootalsohasPlovdivphonecopy same888 butactualBookseparatesPlovdiv899933511; irrelevantPlovdivdata NOTimported. Literal20EUR appointmentfee waivedONPURCHASE (not a requiredpurchase/0standalonefee/deposit/product price), samefee inroot/actualBook/fullFAQ. Bookstates60min butFAQclarifiesUPTO1astronomicalhour, conservative maximum inpublictext/unit and nofixed durationMin scalar. UpTo3companions/late>15minwithoutwarningmaycancel/noextension preserved. FAQexplicitNOcustomsewing/NOhire; alterationsviaexternalatelierextra, not importedasownservicerows. Root/allreviewednav/Book/FAQfooter noTerms/privacy surfaced, no broadlicence or unseenTerms clearance claim. Minimalindependentappointmentfacts only, no dresses/productinventory/designs/images/reviews/brandassets copied. No wishlist/garment/customer/date/time/form/phone/Map/social/action/payment/bookingwrite/UI/providerAPI. Runtime+ALLWIP canonical/legacydomain/name/phone preflight clear.',
})

const servizComputri = 'https://servizcomputri.com/'
const servizComputriBook = `${servizComputri}uslugi/kompyutaren-serviz-na-myasto/`
add({
  id: 'sofia-serviz-computri-home-support', name: 'Сервиз Компютри и Лаптопи · на адрес', category: 'home_services',
  website: servizComputri, phone: '+359887235478',
  openingHours: { sourceUrl: servizComputriBook, checkedOn, days: [1,2,3,4,5,6,7].map(weekday => ({ weekday, periods: [{ open: '07:00', close: '22:00' }] })) },
  services: [service('home_services', 'Компютърен сервиз на адрес в София', 'Диагностика и настройки на компютър, мрежа или принтер в дома или офиса след телефонна уговорка. Конкретният час се съгласува според свободния график. След диагностиката се уточняват цена и срок; ремонтът започва само след съгласие. Не е гаранция за посещение същия ден.')],
}, {
  bookingUrl: servizComputriBook, contactUrl: `${servizComputri}kontakti/`,
  excerpt: 'Конкретната мобилна услуга и контактите изрично предлагат обаждане на 0887235478 за уговаряне на посещение и най-близък свободен час в София.',
  reviewedUrls: [servizComputri, servizComputriBook, `${servizComputri}kontakti/`, `${servizComputri}uslugi/`],
  serviceUrls: [servizComputriBook, `${servizComputri}uslugi/`],
  priceSearchNotes: 'Read actual owned selectedonsiteBook/phone page fully before services/contact, fullroot actualnavigation/footer, fullserviceindex andactualContact. The selectedSofiahomevisit andgeneralserviceindex show no numeric fee/range/tariff link; selectedprocess explicitly says diagnostic thenownerprice/time beforeauthorisedrepair. No actualpricesmenu was blocked or declaredunpublishedfromHTTPfailure. Customeraddress/timing/work agreed bytelephone; no price/duration guessed. This only covers the includedonsitevisit, not allindividualretailrepairfees/parts/otherbranches. Missingprice staysabsent, not0/free orprice-reviewed.',
  notes: 'Actual ownerhomevisitBook process explicitcall887235478, chooseon-site, nearestavailablehour agreed; currentContact also saysCALLorViber toarrangehomevisit/collection. SelectedVOICEpath, no chat-only booking claim. OneSofia mobileoperator not7Sofiabranch/8city/quarter clones; their unreviewedretailvenues/Varna notaccepted as separatebusinesses. Actualselectedpage/FAQeveryday07–22 includesweekends/holidays, numericservicehours directlybound to homevisits not office-only. No guaranteeofsamedaycapacity/freepickup/repaircompletion. Currentowncontactemailrosen@yankov.net observed, relatedhost/name/localruntimephone preflight checked; not a secondstaffmerchant. Root/selected/Contact/serviceindex/footer no separateTerms/privacy/pricelink surfaced, no broadlicence/fullunseenTerms clearance claimed. Only independentlyphrasedmerchant/onsiteBook/servicefacts, no news/advice/portfolio/reviews/marketingclaims copied, no passwordbypass/remoteaccess/datahandlingoffer imported. No call/form/date/customerdata/Map/directions/social/action/API/payment/UI. Strictgenuinelyunpublishedreceipt isservice_reviewed, not completepricecoverage; runtime+ALLWIP host/phone/operator dedupe clear.',
})

const beQueen = 'https://www.bequeen.bg/'
const beQueenBook = `${beQueen}za-nas/`
add({
  id: 'sofia-be-queen-kaliakra27', name: 'Be Queen · бутик София', category: 'other',
  neighborhood: 'Лозенец', address: 'София, Лозенец, ул. „Калиакра“ 27',
  website: beQueen, phone: '+359892207879',
  openingHours: { sourceUrl: `${beQueen}contacts/`, checkedOn, days: [...[1,2,3,4,5,6].map(weekday => ({ weekday, periods: [{ open: '11:00', close: '19:00' }] })), { weekday: 7, periods: [{ open: '11:00', close: '17:00' }] }] },
  services: [service('other', 'Персонална консултация и проба на сватбени рокли', 'До един час и до седем модела след телефонно записване; сватбените мостри в бутика са размер 38 EU. До трима придружители. Таксата за проба се приспада при покупка на рокля. Покупката и допълнителните корекции не са включени в консултацията.', { price: price(20, 'консултация и проба · до 1 час', beQueenBook) })],
}, {
  bookingUrl: beQueenBook, contactUrl: `${beQueen}contacts/`,
  excerpt: 'Собствената страница за организацията на пробите изрично препоръчва телефонно записване на 0892207879; всички посещения са само с предварителен час.',
  reviewedUrls: [beQueen, `${beQueen}contacts/`, beQueenBook, `${beQueen}coockies/`],
  notes: 'ActualrootContactentry inspected first; initialarticle-onlyparser returnedjusttitle, oneboundedfullpublicbodyparse exposes realownerphone/address/fee/hours (not accessblock or unpublishedtariff). SelectedownAbout/appointmentinstructions explicitlyVOICE892207879 and20EUR personalconsult/fitting upTO1h/upTO7models/upTO3companions. Bridalmodels physicallyatboutiqueEU38 incoversoutsidepublicshowroom, not inferredunavailable; sample-size restriction retained publicly. Feecreditedonpurchase, not0ordinaryfee/retaildressprice/60percentproductdeposit. ExactSofiaLozenetsKaliakra27/currentMonSat11–19Sun11–17 actualbookedboutiquehours. Full6360charactualfooterLearnMore/coockies privacy read, ordinaryGDPR/cookies withnamedBoryanaVelikovaTradeEOOD; no DB/extraction/wholeServicesnoncommercial ban observed/no licenceorunseenTerms clearance claim. No additionalTerms surfacedroot/Contact/About/footer; no authoredprose/garmentdesign/photos/reviews/brandassets copied. Oneoperator/premise not designer/staff/countryclone. No form/date/garmentselection/wishlist/input/call/consent/Maps/action/API/payment/UI. Runtime+ALLWIP domain/phone/operator zero.',
})

const carrie = 'https://carriewedding.com/'
const carrieBook = `${carrie}contacts`
add({
  id: 'sofia-carrie-bridal-vaccarini3', name: 'Carrie Bridal Boutique · София', category: 'other',
  address: 'София, ул. „Риккардо Ваккарини“ 3', website: carrie, phone: '+359888771773',
  openingHours: { sourceUrl: carrieBook, checkedOn, days: [2,3,4,5,6].map(weekday => ({ weekday, periods: [{ open: '10:30', close: '19:00' }] })) },
  services: [service('other', 'Проба на булчински рокли с цена над 1500 EUR', 'Еднократната такса за проба е само за рокли с продажна цена над 1500 EUR и се приспада при поръчка на рокля. Посещението в софийския бутик е само с предварително записан час по телефона. Не е цена на самата рокля и не е такса за проба на всички модели.', { price: price(35, 'еднократна проба · модели над 1500 EUR', carrieBook) })],
}, {
  bookingUrl: carrieBook,
  excerpt: 'Действителният собствен бутон „Запиши час за проба“ води към контактите с телефон за София, конкретен бутик и изрично предварително записване.',
  reviewedUrls: [carrie, carrieBook, `${carrie}aboutus`],
  notes: 'ActualrootZAPISHICHASZAPROBA href→own/contacts inspected before ownAboutconditions. CurrentSofia888771773/Vaccarini3 bound independently, Varna988708748extrafooterphone notmadeSofiasecondvenue; bothnumbersoperator/domain/name deduped. Contacts/About repeatedlysame35EUR ONE-TIMEfee ONLYforgarmentsretailvalueABOVE1500EUR, creditedONORDER; exactgarmentvaluecondition inservicename/unit/description, not general35fee/retail1500fee/freeothermodelinference. LiteralTueSat10:30–19 actualbookedboutiquehours; no duration/quarter/coordinate/holidaycapacity invented. Responsive-repeatedSofia/Varnafooterblocks are notmultiplepremises/rows. Fullrootallanchors/BookContact/Aboutfooter noTerms/privacy/pricelinks surfaced; no broadlicence or unseenTerms clearance claim. Minimalindependentmerchant/appointmentfacts, no copyrightedgarmentdesigns/productinventory/prose/portfolio/images/branding/reviews copied. No form/garment/date/time/customer/call/Map/action/privateAPI/UI/purchase/bookingwrite.',
})

const weddingResidence = 'https://weddingresidence.com/'
const weddingResidenceBook = `${weddingResidence}za-nas/kontakti.html`
const weddingResidenceFAQ = `${weddingResidence}za-nas/chesto-zadavani-vaprosi.html`
add({
  id: 'sofia-wedding-residence-bunaya16', name: 'The Wedding Residence · София', category: 'other',
  address: 'София, ул. „Буная“ 16, на ъгъла с ул. „Оборище“', website: weddingResidence, phone: '+359890911771',
  booking: { kind: 'form', url: weddingResidenceBook },
  openingHours: { sourceUrl: weddingResidenceBook, checkedOn, days: [2,3,4,5,6].map(weekday => ({ weekday, periods: [{ open: '11:00', close: '19:00' }] })) },
  services: [service('other', 'Първоначална консултация и проба на булчинска рокля', 'Предварително заявена и потвърдена персонална проба с консултация. Първоначалната такса подлежи на връщане при поръчка или покупка на съответния модел рокля. Няма ограничение в броя модели в рамките на уговорения час; покупка, корекции и индивидуално ушиване не са включени.', { price: price(30, 'първоначална консултация и проба', weddingResidenceFAQ) })],
}, {
  bookingUrl: weddingResidenceBook,
  excerpt: 'Собствената форма за проба изисква предпочитана дата и контакти; екипът потвърждава срещата. Има и изрично телефонно записване при представител на салона.',
  reviewedUrls: [weddingResidence, `${weddingResidence}kolekcii/svatbeni-rokli-aria-bride.html`, weddingResidenceBook, weddingResidenceFAQ],
  notes: 'ActualrootBookCTA firstleadsownAriaBridecollection(readonlyHTML, no productselected), thenactualContactBookandfull9283charFAQ provepersonalbookedservice. OwnContactexplicitarrangeconsult/fitting preferredDATE/time forownerconfirmation orphone890911771; realformname/email/phone/date/comments/GDPR/antispamlabels inspected, no values/consent/antispamsolved/submission. Chosen ownedFORMnotinstantavailability. ExactBunaya16cornerOborishte/currentTueSat11–19actualbookedstudiohours, noquarter/pin/duration guessed. LiteralFIRSTfitting30EUR refundableONORDERorPURCHASEOFCORRESPONDINGMODEL, not garmentprice/0ordinaryfee/freebridesmaid/accessoryoffer. FAQunlimitedmodels withinagreedappointment, NOcustomclientsewing/NOhire, externalalterationsextra; no suchownservices/guarantees imported. Fullroot/nav/actualContact/FAQ/collectionfooter noTerms/privacy link surfaced(otherthanformdata-useconsent), no contentlicence/legalclearance/unseenTerms claim. Onlyminimalindependentlyphrasedmerchant/appointmentfacts, no brands/garmentdesigns/photos/reviews/sourceprose copied, noShop/Cart/checkout/action/Map/privateAPI/UI/bookings/customerwrites. Runtime+ALLWIP domain/phone/operator zero.',
})

export default { records, reviews }
