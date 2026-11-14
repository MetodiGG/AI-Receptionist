// Manually reviewed intake only. Parent owns shared imports, identities and photos.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const tinta = 'https://tinta.bg/'
const tintaHair = 'https://tinta.bg/frizior/'
const tintaNails = 'https://tinta.bg/manikur-i-pedikur/'
const tintaContact = 'https://tinta.bg/контакти/'
const tintaPrices = 'https://tinta.bg/ceni/'
const gbar = 'https://gbar.bg/bg'
const gbarNails = 'https://gbar.bg/bg/sofia/gbarsofia/nail/manicure'
const gbarTerms = 'https://gbar.bg/bg/terms'
const dreamtime = 'https://dreamtime.bg/'
const dreamtimeTerms = 'https://dreamtime.bg/obshti-usloviya'
const dreamtimeContact = 'https://dreamtime.bg/kontakti'
const dreamtimeMenu = 'https://dreamtime.bg/masazhi'
const beautyPlace = 'https://www.beautyplace.bg/'
const beautyPlaceTerms = 'https://www.beautyplace.bg/privacy-policy-and-general-conditions'
const beautyPlaceContact = 'https://www.beautyplace.bg/contact'
const beautyPlaceMenu = 'https://www.beautyplace.bg/services'
const benyova = 'https://laserstudiobenyova.com/'
const benyovaPrices = 'https://laserstudiobenyova.com/ceni/migli/'
const benyovaContact = 'https://laserstudiobenyova.com/contacts/'
const benyovaBook = 'https://laserstudiobenyova.com/request/'
const eAtelier = 'https://emilpetrov.eu/'
const eAtelierContact = 'https://emilpetrov.eu/contacts/'
const veda = 'https://vedaspa.bg/'
const vedaContact = 'https://vedaspa.bg/kontakti/'
const vedaMassage = 'https://vedaspa.bg/uslugi/spa-czentar/masazhi/'
const tosia = 'https://groomtosia.com/en/'
const tosiaBook = 'https://book.groomtosia.com/book?lang=en'
const bgnNails = (name, amount) => ({ name, category: 'nails', appointmentModel: 'appointment', price: { amount, currency: 'BGN', kind: 'fixed', sourceUrl: tintaPrices, checkedOn, validUntil } })
const studioMassage = (name, amount, durationMin, sourceUrl) => ({ name, category: 'health', appointmentModel: 'appointment', price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn, validUntil }, durationMin, durationSourceUrl: sourceUrl, durationCheckedOn: checkedOn, description: 'Обикновен масаж в студиото, не домашно посещение или медицинска рехабилитация. Крайна цена; плащане на място след процедурата.' })
const expertNails = (name, amount) => ({ name, category: 'nails', appointmentModel: 'appointment', price: { amount, currency: 'BGN', kind: 'fixed', sourceUrl: beautyPlaceMenu, checkedOn, validUntil }, description: 'Публикувана тарифа за ниво EXPERT. Услуга извън редовното работно време се уговаря предварително и е с 50% надценка. Отмяна до 24 часа предварително; при неотменен час се дължат 50%.' })

const records = [
  {
    id: 'sofia-tinta-cherni-vrah181d', name: 'Tinta Aesthetic · маникюр', cityCode: '68134', neighborhood: null,
    address: 'София, бул. Черни връх 181-Д', locationKind: 'premises', coordinates: null, category: 'nails', website: tinta, phone: '+359888097771',
    booking: { kind: 'phone', phone: '+359888097771' },
    services: [
      bgnNails('Класически маникюр без лак', 48.90),
      bgnNails('Класически маникюр с обикновен лак', 54.76),
      bgnNails('Маникюр с гел лак с нормална база', 62.59),
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: tintaNails, excerpt: 'Страницата Маникюр и педикюр има Запиши час към собствените контакти. Там е публикуван бутон за обаждане tel:0888 097 771 и адрес Черни връх 181-Д, София.' }, contact: tintaContact },
  },
  {
    id: 'sofia-gbar-gorski-patnik40', name: 'G×Bar Sofia', cityCode: '68134', neighborhood: 'Лозенец',
    address: 'София, кв. Лозенец, ул. Горски пътник 40', locationKind: 'premises', coordinates: null, category: 'nails', website: gbar, phone: '+359882020721',
    booking: { kind: 'phone', phone: '+359882020721' },
    services: [
      { name: 'Маникюр с лак — Майстор', category: 'nails', appointmentModel: 'appointment', price: { amount: 33, currency: 'EUR', kind: 'fixed', sourceUrl: gbarNails, checkedOn, validUntil }, durationMin: 85, durationSourceUrl: gbarNails, durationCheckedOn: checkedOn },
      { name: 'Маникюр без покритие (класически/апаратен/европейски) — Майстор', category: 'nails', appointmentModel: 'appointment', price: { amount: 28, currency: 'EUR', kind: 'fixed', sourceUrl: gbarNails, checkedOn, validUntil }, durationMin: 60, durationSourceUrl: gbarNails, durationCheckedOn: checkedOn },
      { name: 'Сваляне, маникюр и гел лак без укрепване — Майстор', category: 'nails', appointmentModel: 'appointment', price: { amount: 40, currency: 'EUR', kind: 'fixed', sourceUrl: gbarNails, checkedOn, validUntil }, durationMin: 120, durationSourceUrl: gbarNails, durationCheckedOn: checkedOn, description: 'Комбинирана услуга в едно посещение. Включва сваляне, маникюр и гел лак; без укрепване. Публикуваната цена е за ниво Майстор, не Топ Майстор.' },
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: gbarTerms, excerpt: 'Условия 2.7: заявка за услуга по телефон. Реквизити: G×Bar Sofia, +359882020721, Lozenets,40 Gorski Patnik. Собствената Nails страница има Обади се към същия телефон.' }, contact: gbarTerms },
  },
]

records.push(
  {
    id: 'sofia-dreamtime-viskyar-planina2', name: 'DreamTime Studio · масажи', cityCode: '68134', neighborhood: 'Лозенец',
    address: 'София, кв. Лозенец, ул. Вискяр планина 2', locationKind: 'premises', coordinates: null, category: 'health', website: dreamtime, phone: '+359878779633',
    booking: { kind: 'phone', phone: '+359878779633' },
    services: [
      studioMassage('Релаксиращ масаж на цяло тяло — в студиото', 70, 60, 'https://dreamtime.bg/masazhi/relaksirasht'),
      studioMassage('Класически масаж на цяло тяло — в студиото', 50, 60, 'https://dreamtime.bg/masazhi/klasicheski'),
      studioMassage('Масаж на гръб и врат — в студиото', 40, 40, 'https://dreamtime.bg/masazhi/grab-i-vrat'),
    ],
    openingHours: { sourceUrl: dreamtimeContact, checkedOn, days: [...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '19:00' }] })), ...[6, 7].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '18:00' }] }))] },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: dreamtimeTerms, excerpt: 'Условия §5: записване през сайта или по телефона. Контакти и страниците на масажите дават 0878 779 633 като телефонна алтернатива за час.' }, contact: dreamtimeContact },
  },
  {
    id: 'sofia-beauty-place-kozyak27-29', name: 'Beauty Place', cityCode: '68134', neighborhood: 'Хладилника',
    address: 'София, ж.к. Хладилника, ул. Козяк 27–29', locationKind: 'premises', coordinates: null, category: 'nails', website: beautyPlace, phone: '+35929625885',
    booking: { kind: 'phone', phone: '+35929625885' },
    services: [
      expertNails('Маникюр без лак — EXPERT', 39.12),
      expertNails('Маникюр с обикновен лак — EXPERT', 46.94),
      expertNails('Маникюр с гел лак — EXPERT', 60.63),
    ],
    openingHours: { sourceUrl: beautyPlaceContact, checkedOn, days: [...[1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '08:00', close: '20:00' }] })), { weekday: 6, periods: [{ open: '10:00', close: '18:00' }] }, { weekday: 7, periods: [] }] },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: beautyPlaceTerms, excerpt: 'Условия §2.4.2: записване чрез телефон или имейл. Собствени контакти: 02 962 5885, салон Beauty Place, Козяк 27–29, София.' }, contact: beautyPlaceContact },
  },
)

records.push(
  {
    id: 'sofia-benyova-lyulin769b', name: 'Laser Studio Benyova', cityCode: '68134', neighborhood: 'Люлин',
    address: 'София, ж.к. Люлин, бл. 769 Б', locationKind: 'premises', coordinates: null, category: 'beauty', website: benyova, phone: '+359878998319',
    booking: { kind: 'phone', phone: '+359878998319' },
    services: [
      { name: 'Удължаване на мигли косъм по косъм', category: 'beauty', appointmentModel: 'appointment', price: { amount: 45, currency: 'EUR', kind: 'fixed', sourceUrl: benyovaPrices, checkedOn, validUntil }, description: 'Обикновена салонна услуга за мигли. Публикувана цена с ДДС; без добавена непосочена продължителност.' },
      { name: 'Ламиниране на мигли и боядисване', category: 'beauty', appointmentModel: 'appointment', price: { amount: 40, currency: 'EUR', kind: 'fixed', sourceUrl: benyovaPrices, checkedOn, validUntil }, description: 'Една комбинирана услуга за мигли с включено боядисване. Цена с ДДС; без добавена непосочена продължителност.' },
      { name: 'Поддръжка на мигли, поставени в студиото — до 3 седмици', category: 'beauty', appointmentModel: 'appointment', price: { amount: 35, currency: 'EUR', kind: 'fixed', sourceUrl: benyovaPrices, checkedOn, validUntil }, description: 'Само за мигли, поставени в студиото, в срок до 3 седмици. Публикувана цена с ДДС; не е първоначално поставяне.' },
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: benyova, excerpt: 'FAQ „Как да запиша час?“ изрично дава телефонно записване наред с онлайн и съобщение. Собственият номер е +359 87 899 83 19.' }, contact: benyovaContact },
  },
  {
    id: 'sofia-e-atelier-neofit-rilski13', name: 'Е Ателие · релаксиращ масаж', cityCode: '68134', neighborhood: null,
    address: 'София, ул. Неофит Рилски 13', locationKind: 'premises', coordinates: null, category: 'health', website: eAtelier, phone: '+359988383220',
    booking: { kind: 'phone', phone: '+359988383220' },
    services: [
      { name: 'Релаксиращ масаж — 25 минути', category: 'health', appointmentModel: 'appointment', price: { amount: 15, currency: 'EUR', kind: 'fixed', sourceUrl: eAtelier, checkedOn, validUntil }, durationMin: 25, durationSourceUrl: eAtelier, durationCheckedOn: checkedOn },
      { name: 'Релаксиращ масаж — 50 минути', category: 'health', appointmentModel: 'appointment', price: { amount: 30, currency: 'EUR', kind: 'fixed', sourceUrl: eAtelier, checkedOn, validUntil }, durationMin: 50, durationSourceUrl: eAtelier, durationCheckedOn: checkedOn },
      { name: 'Релаксиращ масаж — 75 минути', category: 'health', appointmentModel: 'appointment', price: { amount: 45, currency: 'EUR', kind: 'fixed', sourceUrl: eAtelier, checkedOn, validUntil }, durationMin: 75, durationSourceUrl: eAtelier, durationCheckedOn: checkedOn },
    ],
    openingHours: { sourceUrl: eAtelierContact, checkedOn, days: [1, 2, 3, 4, 5, 6, 7].map(weekday => ({ weekday, periods: [{ open: '10:00', close: '20:00' }] })) },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: eAtelierContact, excerpt: 'Контакти: Тел/Viber/WhatsApp 098 83 83 220; понеделник–неделя 10–20, само с предварително записване. София, Неофит Рилски 13.' }, contact: eAtelierContact },
  },
  {
    id: 'sofia-veda-metodi-andonov106', name: 'VEDA Swimming Pool & SPA · масажи', cityCode: '68134', neighborhood: 'Младост 1',
    address: 'София, ж.к. Младост 1 (Мусагеница), ул. Методи Андонов, бл. 106', locationKind: 'premises', coordinates: null, category: 'health', website: veda, phone: '+359884300333',
    booking: { kind: 'phone', phone: '+359884300333' },
    services: [
      { name: 'Релаксиращ масаж „Черно море“ Мини — гръб, врат и рамене', category: 'health', appointmentModel: 'appointment', price: { amount: 40, currency: 'EUR', kind: 'fixed', sourceUrl: vedaMassage, checkedOn, validUntil }, durationMin: 30, durationSourceUrl: vedaMassage, durationCheckedOn: checkedOn, description: 'Лек релаксиращ масаж с минерализирано масло с черноморска луга. Само понеделник–четвъртък, 16:00–21:00, с предварително записване на рецепция. Не е дълбокотъканен масаж.' },
      { name: 'Релаксиращ масаж „Черно море“ — цяло тяло', category: 'health', appointmentModel: 'appointment', price: { amount: 65, currency: 'EUR', kind: 'fixed', sourceUrl: vedaMassage, checkedOn, validUntil }, durationMin: 50, durationSourceUrl: vedaMassage, durationCheckedOn: checkedOn, description: 'Лек релаксиращ масаж на цяло тяло с минерализирано масло с черноморска луга. Процедурите от 40 минути нагоре са петък–неделя, с предварително записване на рецепция. Не е дълбокотъканен масаж.' },
    ],
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: vedaMassage, excerpt: 'Менюто за масажи изисква предварително записване на рецепция и води със Запази час към собствените контакти: телефон 0884 300 333 и форма за запитване.' }, contact: vedaContact },
  },
)

const reviews = [
  {
    id: 'sofia-tinta-cherni-vrah181d', website: tinta, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [tinta, 'https://tinta.bg/za-nas/', tintaContact, tintaNails, tintaHair, tintaPrices],
    notes: 'Actual selected Nails page ЗапишиЧас first followed to ownContact, whose fresh ordinaryHTML exposes real native tel:0888097771 control and exactCherniVrah181D/Sofia; not a generic homepage phone or invented form. Whole native own service/price/contact/About read, no external booking engine, date/service/customer entry or call. OwnAbout defines beautycentre with trainedcosmetician/nurseownerHristina and separatehairdresserAlbena/nailmasterTeodora, not a claimed physicianclinic; only three ordinary manicure variants imported. LiteralBGN48.90/54.76/62.59 retained, own correspondingEUR25/28/32 not our conversion. No inferred inclusions/durations or weeklyhours. All laser/RF/HydraFacial/medical/safety/outcome claims, consultations, packages, sourcephotos/reviews and coordinates excluded. One co-located operator, not staff clones. Dedupe exactdomain/phone/address against runtime1518+all2000intakes before authoring; no overlap.',
  },
  {
    id: 'sofia-gbar-gorski-patnik40', website: gbar, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [gbar, gbarNails, gbarTerms, 'https://gbar.bg/robots.txt', 'https://gbar.bg/bg/online-order'],
    notes: 'Chronology explicit: actual owner Book/bg/online-order was read once before robots reviewed; after discovering Disallow/online-order/ no further calendar access occurred and NO calendar facts are imported/claimed verified. Independent allowed native Nails page fully read, current visible activeМайстор tier confirmed in human-visibleHTML, not an unused JSbundle or TopMaster assumption. OwnTerms2.7 explicitlyphoneappointments plus ownNails ОбадиСе native tel:+359882020721 and Termscontact exactsamephone/Lozenets/GorskiPatnik40 independently support selectedphonepath. Three ordinary singlevisit fees33EUR85min,28EUR60min,40EUR120min; samevisitremoval+gelNOTstrengthening clear, no placeholder0EUR/0minutes imported. Terms9 genericcopyright not represented as permission/legalguarantee; minimalindependentfacts only, no descriptions/tables/media/reviews reused. Robotsallows public pages; only service/terms facts used. No timeslots/customer/account/consent/submit or call. Metadata09–20 has no weekdays, omitted; metadataGPS is not a verified visible owner business marker, coordinatesnull. One Sofia venue only, othercountrychainmembers notcloned. Exactdomain/phone/premise dedupezero runtime1518+all2000intakes.',
  },
]

reviews.push(
  {
    id: 'sofia-dreamtime-viskyar-planina2', website: dreamtime, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [dreamtime, 'https://dreamtime.bg/robots.txt', dreamtimeTerms, dreamtimeContact, dreamtimeMenu, 'https://dreamtime.bg/ekip', 'https://dreamtime.bg/masazhi/relaksirasht', 'https://dreamtime.bg/masazhi/klasicheski', 'https://dreamtime.bg/masazhi/grab-i-vrat'],
    notes: 'Pre-Bookrobotsgate found Disallow/rezervaciya/ and /api/ BEFORE anycalendarrequest; neither accessed, no slots or JS/API workaround. IndependentownTerms5 explicitlyphoneappointments and root/Contacts/selectedordinaryservicepages samephone/premise. WholeTerms/Contact/Team/Massagemenu and all3selectednative servicepages read; occasionalreaderCachemiss resolvedordinarypublicHTTP withoutchallenge. Exactfees agree menu+dedicatedpages: studio70EUR60relax,50EUR60classic,40EUR40backneck. OwnTerms3 says servicesarenotphysicianmedicalcare; selected3ordinarymassages only, notkinésio/rehabilitation/CME/dryneedling/manualmedical/outcomeclaims. No falsecalendarverification, homeprices/durations notmixedwithstudio. Fullweek ownContacthours. Copyright10 notclaimedaccesspermission, minimalparaphrasedbusinessfacts only, no copieddescriptions/media/reviews/ratings/Googlepins. Dedupe domain+phone+name+venue zero currentruntime1527+all2000intakes. No staffclones/coords/images/identities/calls or forms.',
  },
  {
    id: 'sofia-beauty-place-kozyak27-29', website: beautyPlace, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [beautyPlace, 'https://www.beautyplace.bg/robots.txt', 'https://book.beautyplace.bg/robots.txt', beautyPlaceTerms, beautyPlaceContact, beautyPlaceMenu, 'https://www.beautyplace.bg/team'],
    notes: 'ActualownerBooktarget identified but pre-opening book-hostrobotsDisallow/; STOPbeforecalendar, no calendar/tariff/availabilityclaim. IndependentownTerms2.4.2 explicitlyphone/emailappointmentpath, exactsameownphoneandpremise. NativeServices entirepricednailssection andallrelevantfeequalifications/FAQ/Contacts read. EXPERT3ordinarymanicurevariantsliteralBGN39.12/46.94/60.63, parallelownerEUR20/24/31 notourconversion. No durations inferred; no JUNIOR/mixedtier. Publicdescription retains50percentoutofhourssurchargewithprioragreement and24h/50percentcancellationrule. Otherhair/Bowen/medical/problemnail/AI/clinical/safety/outcomeclaims excluded. OwnTeamfetchednotclaimedall1188linesexhaustivelyread. Fullweekhours ownContact/rootconsistent. Terms5 genericcopyright notassertedpermission; onlyminimalindependentlyparaphrasedfacts, no prose/table/images/reviews/ratings/Maps reused. Phone/domain/exactpremisededupezero currentruntime1527+all2000intakes; differentCoquettePavlovonotthisoperator. No fakeform/service/date/account/customer/consent/submission/call, no coordinates/identities/images.',
  },
)

reviews.push(
  {
    id: 'sofia-benyova-lyulin769b', website: benyova, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [benyova, 'https://laserstudiobenyova.com/robots.txt', 'https://laserstudiobenyova.com/terms/', benyovaBook, benyovaContact, 'https://laserstudiobenyova.com/about-us/', benyovaPrices, 'https://laserstudiobenyova.com/usluga/migloplastika/'],
    notes: 'Pre-Bookrobotspermits/request, ownTermsfullyread andactualBookHEAD200nofollow thenpublicpage read. ActualpagecontainsStudio24iframe, no furtherproviderrequest afterpreviousStudio24accesslimits/noUI. IndependentrootFAQexplicitphoneappointments supportschosenphonepath, notfakecalendarapproval/unpublished. EntireownselectedLashPrices/Services/About/Contact/Terms read; literal45EURindividualextension/40EURlamination+dye/35EURmaintONLYownstudio≤3weeks; no durationspublished. OwnAboutnamedRenetaBenyovatherapy/beautystudio, notphysicianclinicclaim; parentclearsONLYordinary3lashrows. No laser/RF/BTL/salt/medical/results/safetyclaims imported. OwnTermsallowinformationusewithsourceattribution/link; allfeesdirectsourced, minimalindependentfactsnotprose/media/table/reviews reused. No weeklyhoursfound, no guessing. Dedupe exactdomain/phone/premise nooverlap allruntime+intakes; no staffclones, coords/images/identities/calls/clientdata/forms.',
  },
  {
    id: 'sofia-e-atelier-neofit-rilski13', website: eAtelier, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [eAtelier, 'https://emilpetrov.eu/robots.txt', eAtelierContact, 'https://emilpetrov.eu/About/'],
    notes: 'ActualownBooktext rootoffersmessenger/WhatsApp/Vibercontrols, no externalcalendarlink or calendarfactsclaimed. IndependentownContacts expresslyTel/Viber/WhatsApp plusonlyadvanceappointments, notchat-onlycontact or inventedtelURI. Publicconfiguredphonematchescontact/root/About. Wholeactualrootmenu includingselectedordinaryrelax25min15EUR/50min30EUR/75min45EUR read, menuNavauthorrelaxreturnsroot notindependentnewfee. WholeContact/Aboutread; operatorEmilPetrovselfidentifiesholistictherapist/privateatelier, notphysician/generalclinic or mandatorymedicalpatientintakeseen. ONLY3ordinarymanualrelaxvariants, NOTenergy/Reiki/Kundalini/posturalcorrection/medicaldeep/diseaseclaims, bonus30minconsult belongsdifferentauthor/Reikiservicesnotselected. No fullbody/partialarea inventedfor25min. FullweekownerContacthours10–20appointmentonly. Robotsallowsnativepublicpages, no APIs/wp-json/search attempted. Dedupephone/domain/venue zeroallruntime+intakes. No sourceprose/media/reviews/ratings copied; no calls/submissions/coordinates/identities/images.',
  },
  {
    id: 'sofia-veda-metodi-andonov106', website: veda, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed',
    reviewedUrls: [veda, 'https://vedaspa.bg/robots.txt', 'https://vedaspa.bg/za-nas/', vedaContact, vedaMassage, 'https://vedaspa.bg/czeni/'],
    notes: 'ActualownerBookhrefisOWNContact, fullyread afterrobotsgate; onlyowncall884300333 andgenericinquiryform. SelectedMassagepageexplicitadvancebookingatRECEPTION bindsservice/premise/phone, nofakeform/calendaravailabilityclaim. WholecurrentnativeMassageMenu/Prices/About/Contactsread; ONLYtwoordinarylightrelaxBlackSearituals30min40EURbackneckshoulders/50min65EURfullbody. Publicdescriptionsretaindifferentexactservicewindows:miniMonThu16–21,≥40minFriSun. No clinicalSOSpain/TMJ/intraoral/myofascial/therapeuticprotocols/needling/medical/outcomeclaims, no gym/pool/SPAadmission/membership/packageimports. ComplexContacthoursdaily07–22foundbutOMITTEDfromrecordratherthanpretendallmassageavailability; bookingwindowsremainservicedescriptions. OwnerTerms/privacypathsrobotsDisallow, notrequested/nopermissionclaim; no otheraccessban/challengefound. Onevenue/owner, therapistGuidonotstaffclone; autosportagentconfirmsnotworkingVEDA. Phone/domain/exactpremisededupezero currentruntime+allintakes. No providerAPI, Maps/photos/reviews/ratings copied or coords/images/identities/forms/calls/submits.',
  },
)

records.push({
  id: 'sofia-groom-tosia-asen-yordanov10', name: 'Tosia Grooming Salon', cityCode: '68134', neighborhood: 'Кръстова вада',
  address: 'София, кв. Кръстова вада, ул. Асен Йорданов 10', locationKind: 'premises', coordinates: null, category: 'pets', website: tosia, phone: '+359876078014',
  booking: { kind: 'form', url: tosiaBook },
  services: [
    { name: 'Пълен груминг — късокосместо куче до 3 кг', category: 'pets', appointmentModel: 'appointment', price: { amount: 30, currency: 'EUR', kind: 'fixed', sourceUrl: tosia, checkedOn, validUntil }, description: 'Едно посещение: нокти, уши, къпане, сушене, хигиенни зони и породна/желана прическа. Тарифа за късокосместо куче до 3 кг; цените варират според теглото и състоянието на козината.' },
    { name: 'Пълен груминг — йоркширски териер, бивер или малтийска болонка до 3 кг', category: 'pets', appointmentModel: 'appointment', price: { amount: 40, currency: 'EUR', kind: 'fixed', sourceUrl: tosia, checkedOn, validUntil }, description: 'Едно посещение: нокти, уши, къпане, сушене, хигиенни зони и прическа. Само посочените дългокосмести породи до 3 кг; цените варират според теглото и състоянието на козината.' },
    { name: 'Пълен груминг — померан до 4 кг', category: 'pets', appointmentModel: 'appointment', price: { amount: 40, currency: 'EUR', kind: 'fixed', sourceUrl: tosia, checkedOn, validUntil }, description: 'Едно посещение: нокти, уши, къпане, сушене, хигиенни зони и прическа. Тарифа за померан до 4 кг; цените варират според теглото и състоянието на козината.' },
  ],
  verification: { status: 'approved', checkedOn, validUntil, booking: { url: tosia, excerpt: 'Собственият бутон booking води към branded Tosia форма с Pet, Time, Details, dog/cat и избор на порода. Контакт: 0876078014, Асен Йорданов 10, София.' }, contact: tosia },
})

reviews.push({
  id: 'sofia-groom-tosia-asen-yordanov10', website: tosia, checkedOn, bookingEntry: tosiaBook, bookingReview: 'owned_booking_reviewed',
  reviewedUrls: ['https://groomtosia.com/', tosia, 'https://groomtosia.com/robots.txt', 'https://book.groomtosia.com/robots.txt', 'https://book.groomtosia.com/', tosiaBook],
  notes: 'Pre-BookownerrobotsDisallowempty, bookinghostrobotsbodyempty; actualnormalentryHEAD302/book, ownerEnglishbuttonreallyfollowed/book?lang=en. ReaderCachemiss resolvedordinarynativepublicHTTP, no challenge/accessbypass/API/JSbundle. ActualrenderedpublicHTML brandedTosia initialbookingform withPet/Time/Details, dog/cat, petname, breedselectorandChooseTime readONLY. No pet/service/breed/date/slot/customerdata chosen orsubmitted, noavailability/nextstep/confirmationclaim. WholecurrentownEnglishroot containsactualservices/fulltariff/contact; 3selectedsinglevisitFullGroom rowfees30EURshortcoat≤3kg/40EURYorkieBiewerMaltese≤3kg/40EURPomeranian≤4kg. Publishedvariationbyweight/coatcondition retainedPUBLIC, no inventedfrom/range/duration/discount; FullGroom is samevisitcombinedcare, notprepaidmultiplevisits. OwnAsenYordanov10/KrastovaVada/Sofia/876078014, directory12notusedasownerprooforoverriddenintoownpoint. No hoursfound. No dentalscaling/antiparasiticmedicalclaims/reviews/photos/Maps/coordinates imported. No externalhostedprovider/Termslink identifiedinactualnativeBookHTML, notclaiminglegalpermissionorfullunseenpolicyreview. Exactdomain/phone/name/premise dedupeallruntime+2000intakes, onevenue/owner notgroomerclones.',
})

export default { records, reviews }
