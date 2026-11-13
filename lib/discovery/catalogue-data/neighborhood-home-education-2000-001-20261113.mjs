// Isolated manually reviewed intake. No shared imports, photos or inventory identities.
const checkedOn = '2026-11-13', validUntil = '2027-02-11'
const service = (name, description, facts = {}) => ({ name, category: 'other', appointmentModel: 'appointment', description, ...facts })
const price = (amount, currency, unit, sourceUrl, extra = {}) => ({ amount, currency, kind: 'fixed', unit, sourceUrl, checkedOn, ...extra })
const hours = (sourceUrl, rows) => ({ sourceUrl, checkedOn, days: rows.map(([weekday, open, close]) => open ? { weekday, periods: [{ open, close }] } : { weekday, periods: [], byAppointment: true }) })
const records = [], reviews = []
function add(facts, evidence) {
  const { bookingUrl, contactUrl = bookingUrl, excerpt, reviewedUrls, notes, priceSearchNotes, serviceUrls, provider = false } = evidence
  const row = { cityCode: '68134', neighborhood: null, address: null, locationKind: 'premises', coordinates: null, category: 'other', ...facts,
    booking: facts.booking || { kind: 'phone', phone: facts.phone },
    verification: { status: 'approved', checkedOn, validUntil: evidence.validUntil || validUntil, booking: { url: bookingUrl, excerpt }, contact: contactUrl } }
  records.push(row)
  const review = { id: row.id, checkedOn, website: row.website, bookingEntry: row.booking.kind === 'phone' ? 'phone' : row.booking.url,
    bookingReview: row.booking.kind === 'phone' ? 'phone_booking_reviewed' : provider ? 'provider_booking_reviewed' : 'owned_booking_reviewed', reviewedUrls, notes }
  if (priceSearchNotes) Object.assign(review, { pricingDecision: 'not_publicly_listed', priceSearch: { outcome: 'not_published', bookingUrl: row.booking.kind === 'form' ? row.booking.url : bookingUrl, serviceUrls, notes: priceSearchNotes } })
  reviews.push(review)
}

const petya = 'https://jeeiims.wixsite.com/newdental'
const petyaContact = `${petya}/contact`, petyaPrices = `${petya}/untitled`
add({ id: 'sofia-petya-ivanova-newdental-kazbeg30', name: 'Newdental · д-р Петя Иванова', neighborhood: 'Манастирски ливади',
  address: 'София, ж.к. Манастирски ливади, ул. Казбег №30', website: petya, phone: '+359888977617', booking: { kind: 'form', url: petyaContact },
  services: [service('Стоматологичен преглед, статус и план за лечение', 'Посещение след предварителна заявка и потвърждение от кабинета. Публикувана цена в лева; продължителност не е посочена.', { price: price(20, 'BGN', 'преглед, статус и план', petyaPrices) }),
    service('Почистване на зъбен камък и полиране с Air flow', 'Дентална профилактика след предварително записване. Тарифата не посочва фиксирана продължителност.', { price: price(80, 'BGN', 'почистване и полиране', petyaPrices) })],
  openingHours: hours(petyaContact, [1,2,3,4,5].map(d => [d,'09:00','19:00']).concat([[6,'09:30','17:00']]))
}, { bookingUrl: petyaContact, excerpt: 'ЗАПАЗИ ЧАС ИЛИ ПОПИТАЙ', reviewedUrls: [petya,petyaContact,petyaPrices],
  notes: 'Followed actual owner Book/Ask entry to the named contact form with callback telephone and message fields, then fully read the ordinary tariff and contacts/footer. Exact public source spelling Казбег30 retained, not silently renamed or geocoded. Mon–Fri09–19 and Sat09:30–17 are stated by the owner. BGN fees retained literally; no currency conversion, duration or current availability invented. Distinct from existing NewDentalSolutions by domain, telephone and address.' })

const stoyanov = 'https://stoyanovdent.bg/'
add({ id: 'sofia-ivaylo-stoyanov-408ma42', name: 'Дентална клиника д-р Ивайло Стоянов', neighborhood: 'Манастирски ливади',
  address: 'София, кв. Манастирски ливади, ул. 408-ма 42', website: stoyanov, phone: '+359887490661',
  services: [service('Профилактичен стоматологичен преглед', 'Преглед на зъбите и устната кухина с предварително записване по телефона. Цената и продължителността се уточняват с кабинета.'),
    service('Почистване на зъбен камък и полиране', 'Предлагана дентална профилактика след уговорен час; конкретната такса и продължителност се уточняват при записване.')]
}, { bookingUrl: stoyanov, excerpt: 'ЗАПИШЕТЕ СЕ ЗА ПРЕГЛЕД', reviewedUrls: [stoyanov], serviceUrls: [stoyanov],
  priceSearchNotes: 'Fully read actual Book an examination contact anchor, the detailed one-page dental service sections and contact/footer. No numeric examination/cleaning fee or linked tariff appears in the public menu. No inaccessible price page was treated as absent.',
  notes: 'Owner Book an examination CTA resolves to its on-page address/telephone contact section. Detailed prevention section explicitly offers examination and calculus removal/polishing. Single practice, not individual staff clones. Source says Monday–Saturday and emergency contact Sunday/holidays but gives no clock times; no openingHours guessed from those statements. No clinical guarantees or review text reused.' })

const elhnedi = 'https://www.drelhnedi.com/', elhnediContact = `${elhnedi}contacts/`
add({ id: 'sofia-elhnedi-priroda7', name: 'Дентална клиника д-р Елхнеди', neighborhood: 'Борово', address: 'София, кв. Борово, ул. Природа 7',
  website: elhnedi, phone: '+359888007713', services: [service('Стоматологичен преглед и консултация', 'Предварително запазен час по телефона за преглед и обсъждане на денталното лечение. Таксата и продължителността се уточняват с клиниката.')],
  openingHours: hours(elhnediContact, [1,2,3,4,5].map(d=>[d,'10:00','19:00']))
}, { bookingUrl: elhnedi, contactUrl: elhnediContact, excerpt: 'Час за преглед и консултация в дентална клиника д-р Елхнеди можете да запишете на тел. 0888 007 713.',
  reviewedUrls: [elhnedi,elhnediContact], serviceUrls: [elhnedi],
  priceSearchNotes: 'Read explicit examination/consultation telephone booking, extensive own service descriptions and the dedicated contact page. No numeric ordinary consultation fee or tariff link is published in the accessible site navigation. Appointment duration is not stated; estimates for different surgical procedures are not substituted.',
  notes: 'Explicit own-site telephone appointment sentence establishes real booked examination, not merely a phone contact. Dedicated contacts confirm Priroda7 and Mon–Fri10–19. Only dental service is included; no staff clones, cosmetic medical injections, ratings, photos or treatment-outcome promises copied.' })

const giulia = 'https://giuliadent.com/bg'
add({ id: 'sofia-giulia-dent-buxton57', name: 'Giulia Dent · д-р Таня Ангелова', neighborhood: 'Манастирски ливади', address: 'София, кв. Манастирски ливади, бул. Братя Бъкстон №57',
  website: giulia, phone: '+359896362586', services: [service('Профилактичен стоматологичен преглед', 'Преглед след предварително записване по телефона. Конкретните такса, продължителност и лечебен план се уточняват с кабинета.'),
    service('Почистване на зъбен камък', 'Дентална профилактика след предварително уговорен час. Публичната страница не посочва цена или фиксирана продължителност.')],
  openingHours: hours(giulia, [[1,'09:30','18:30'],[2,'09:30','18:30'],[3,'09:30','15:30'],[4,'09:30','18:30'],[5,'09:30','18:30'],[6,'10:00','16:00']])
}, { bookingUrl: giulia, excerpt: 'Обадете се за записване на час или консултация', reviewedUrls: [giulia], serviceUrls: [giulia],
  priceSearchNotes: 'Fully read the owner one-page site, phone Book now/contact entry, service list, FAQ headings and detailed weekday hours. No numeric examination or cleaning price and no separate tariff/menu link is published. Whitening has a45–60-minute range, which is unrelated to these selected services and was not imported.',
  notes: 'Actual owner phone booking invitation is explicit several times. Exact Buxton57 and ManastirskiLivadi are stated by the practice, not inferred from the boulevard. Real weekly service hours imported including shorter Wednesday and Saturday. The prophylaxis section explicitly offers regular examinations and cleaning; no precise machine/method, fee, duration or Google material inferred.' })

const deathmag = 'https://deathmagtattoo.wordpress.com/', deathmagFaq = `${deathmag}faq/`, deathmagContact = `${deathmag}contact-us/`
add({ id: 'sofia-deathmag-tattoo-sixth-september33', name: 'Deathmag Tattoo', neighborhood: 'Център', address: 'София, ул. 6-ти септември 33', website: deathmag, phone: '+359879330150',
  services: [service('Татуировка по индивидуален проект', 'Дата и час се уговарят предварително чрез контактите на студиото. След уговорката се оставя капаро, което се приспада от крайната цена. Приемат плащане в брой или Revolut; крайната цена е индивидуална.')]
}, { bookingUrl: deathmagFaq, contactUrl: deathmagContact, excerpt: 'How can I book an appointment? You can do so by using any of the contact methods listed here.', reviewedUrls: [deathmag,deathmagFaq,deathmagContact], serviceUrls: [deathmag],
  priceSearchNotes: 'Actual own FAQ appointment entry explicitly permits all listed contact methods and links the contact page with studio telephone. Read public tattoo service homepage and FAQ payment/deposit rules. Consultations are free, but no numeric tattoo session/project tariff is published; free consultation or deposit is not used as the tattoo price.',
  notes: 'Read own FAQ via normal public HTTP after reader cache miss; no block bypass. Contact page confirms SixthSeptember33 and common studio telephone. FAQ explicitly allows booking by any listed contact method, including that phone. Walk-ins are also welcome but do not negate the separately documented advance appointment path. No weekly clock schedule is stated; hours absent. Studio is one record, not seven staff profiles.' })

const smokov = 'https://smokov.com/home-bg/', smokovContact = 'https://smokov.com/contact/'
add({ id: 'sofia-smokov-tattoo-tsar-asen20', name: 'Smokov Tattoo', neighborhood: 'Център', address: 'София, ул. Цар Асен 20', website: smokov, phone: '+359888230765', booking: { kind: 'form', url: smokovContact },
  services: [service('Авторска татуировка', 'Предварителна консултация и индивидуален проект. Цената зависи от сложност, размер и стил; студиото описва минимална такса и почасово или сесийно заплащане, без да публикува конкретна сума.')],
  openingHours: hours(smokovContact, [1,2,3,4,5,6].map(d=>[d,'11:00','19:00']))
}, { bookingUrl: smokovContact, excerpt: 'Безплатна консултация', reviewedUrls: [smokov,smokovContact], serviceUrls: [smokov],
  priceSearchNotes: 'Followed actual owner Free consultation CTA to the own contact form with Name/Email/Message fields. Read service styles and explicit Prices and booking section: price depends on complexity, size and style, with minimum/hourly/session charging but no numeric amounts. No inaccessible price menu was treated as unpublished.',
  notes: 'Actual owner consultation CTA opens the form; this is an inquiry followed by studio agreement, not automated availability. Own homepage and contact page agree on TsarAsen20 and phone. Mon–Sat11–19 applies to studio. No quoted customer prices, portfolio images, ratings or artist staff clones. Free consultation is not represented as a free tattoo.' })

const ralev = 'https://zabolekar-ralev.com/', ralevPrices = `${ralev}tseni/`, ralevContact = `${ralev}kontakti/`
add({ id: 'sofia-ralev-rayko-aleksiev4', name: 'Дентална клиника Ралев', neighborhood: 'Изток', address: 'София, ж.к. Изток, ул. Райко Алексиев №4', website: ralev, phone: '+359876427784',
  services: [service('Първичен стоматологичен преглед на нов пациент', 'Ориентировъчна цена. Включва личен картон, преглед, анализ на рентгенови снимки и подходящ лечебен план; носете актуална панорамна снимка. Отмяна под 48 часа или неявяване: 50 € за час.', { price: price(50,'EUR','първичен преглед',ralevPrices) }),
    service('Профилактичен или контролен стоматологичен преглед', 'Ориентировъчна цена, зависеща от конкретния случай. Отмяна по-малко от 48 часа предварително или неявяване се таксува 50 € за час. Не е пакетът с писмен лечебен план.', { price: price(20,'EUR','профилактичен/контролен преглед',ralevPrices) })],
  openingHours: hours(ralev, [1,2,3,4,5].map(d=>[d,'09:00','20:00']).concat([[6,'10:00','17:00'],[7]]))
}, { bookingUrl: ralev, contactUrl: ralevContact, excerpt: 'Запишете час ·0876 42 77 84', reviewedUrls: [ralev,ralevPrices,ralevContact],
  notes: 'Actual phone Book appointment entry reviewed first, then dedicated ordinary tariff and contacts. Public tariff explicitly calls prices indicative; new-patient exam requires a current panoramic image and late cancellation/no-show under48hours is50EUR/hour. Those conditions retained publicly. Sunday is only by prior agreement, not an invented clock period. One dental practice, not separate staff profiles. Source rights notice respected: only public factual fees/address/hours paraphrased, no creative text/images copied.' })

const multi = 'https://www.multimplants.com/obadise/', multiContact = 'https://www.multimplants.com/bg/contact', multiBooking = 'https://superdoc.bg/lekar/d-r-hristo-hristov-3782'
add({ id: 'sofia-multimplants-hristo-hristov-postoyanstvo253', name: 'Multimplants · д-р Христо Христов',
  address: 'София, ул. Постоянство, бл. 253, вх. 12, ап. 91', website: multi, phone: '+359888948072',
  services: [service('Диагностичен стоматологичен преглед и план за лечение', 'Първичен преглед за нов пациент с оценка на състоянието и индивидуален лечебен план. Записването се потвърждава от кабинета; плаща се в брой на място.', { price: price(50,'EUR','първичен преглед и план',multi) })]
}, { bookingUrl: multi, contactUrl: multiContact, excerpt: 'Запишете диагностичен преглед още днес · +359 888 948 072', reviewedUrls: [multi,multiBooking,multiContact],
  notes: 'Followed actual owner-linked Superdoc Book entry to named Multimplants practice, visit-reason selector, exact matching address/phone and primary50EUR service menu; then own ordinary diagnostic service fee and contact page. Own page separately offers telephone booking, used in this record. Provider cash-on-site condition retained; review text/ratings/photos excluded. Contact page has no weekly clock schedule, so no hours or duration inferred. Dental practice only, not a general surgical clinic.' })

const robotika = 'https://robotika.bg/robotika-5-6', robotikaBook = 'https://robotika.bg/register-course?group=02pgrlb99', robotikaContact = 'https://robotika.bg/kontakti', robotikaTerms = 'https://robotika.bg/obshti-uslovia-robotika'
add({ id: 'sofia-robotika-manastirski-flora1a', name: 'Академия Роботика · Манастирски ливади', category: 'education', neighborhood: 'Манастирски ливади',
  address: 'София, ул. Флора 1А', website: robotika, phone: '+359879205253', booking: { kind: 'form', url: robotikaBook },
  services: [service('Роботика за 5-годишни · I ниво с Kubo · курс 7 занятия', 'Целият курс: 7 занятия по 60 минути, събота 14:00, 07.11–19.12.2026. Еднократно плащане 158 €; схемата с две вноски по 86 € е отделна. Записването и плащането се потвърждават от академията; точните учебни дати подлежат на промяна.', { category: 'education', price: price(158,'EUR','цял курс · 7 занятия по 60 минути',robotika,{validUntil:'2026-12-19'}) })]
}, { validUntil: '2026-12-19', bookingUrl: robotikaBook, contactUrl: robotikaContact, excerpt: 'Роботика за 5-годишни – I ниво с Kubo · София / Манастирски ливади / 07.11 от 14:00 / събота', reviewedUrls: [robotika,robotikaBook,robotikaContact,robotikaTerms],
  notes: 'Root independently rendered exact named-group registration URL and confirmed selected Kubo course, disabled selected ManastirskiLivadi Saturday14 group, parent/child/birthdate/contact/payment/terms fields and submit control; no data entered/submitted. I read own branch-specific service schedule,158EUR seven-lesson course and contact address plus full general terms. One instalment total, not a single lesson or86EUR instalment. Office10–18 is not class availability; finite seven-date course not encoded as year-round hours. No other-city or full waiting-list group cloned.' })

const fotoMiasto = 'https://fotomiasto.com/services/ирисова-фотография/', fotoBook = fotoMiasto, fotoContact = 'https://fotomiasto.com/contact/', fotoTerms = 'https://fotomiasto.com/terms/'
add({ id: 'sofia-fotomiasto-smirnenski16', name: 'ФотоМясто · ирисова фотография', address: 'София, бул. Христо Смирненски №16', website: fotoMiasto, phone: '+359882629254', booking: { kind: 'form', url: fotoBook },
  services: [service('Заснемане на 1 ирис + фотохартия 20×20 см и дигитално копие', 'Пакет за заснемане на един ирис с краен отпечатан продукт 20×20 см и дигитално копие; ДДС е включен. Заявеният час се потвърждава допълнително от студиото. Не е самостоятелен печат от предоставена снимка.', { price: price(49.39,'EUR','1 ирис · фотохартия 20×20 см + дигитално копие',fotoMiasto) })]
}, { bookingUrl: fotoBook, contactUrl: fotoContact, excerpt: 'Ще се свържим с вас, за да потвърдим резервацията.', reviewedUrls: [fotoMiasto,fotoBook,fotoContact,fotoTerms],
  notes: 'Root rendered actual #reservation-form: iris service selector, date/time/name/email/telephone/consent and Book button, no form submission. I read own exact iris package tariff, venue/contact and16Sept2026 terms. Selected49.39EUR one-iris20×20 photographic paper plus digital copy, VAT included, not unrelated print-only retail. Terms identify MacroStudio as common provider of FotoMiasto/PrintLab16; no separate brand clone. Store Mon–Fri9–19/Sat10:30–18 is explicitly shop hours, not claimed appointment hours. Counterintuitive45.50 larger package is not silently corrected or imported.' })

const kodent = 'https://kodent.bg/', kodentBook = 'https://kodent.bg/contact', kodentExam = 'https://kodent.bg/services/profilaktichen-pregled'
add({ id: 'sofia-kodent-metodi-popov16', name: 'KoDent', neighborhood: 'Изток', address: 'София, ж.к. Изток, ул. Академик Методи Попов 16', website: kodent, phone: '+35924233999', booking: { kind: 'form', url: kodentBook },
  services: [service('Профилактичен стоматологичен преглед', 'Преглед и оценка на зъбите, венците и устната кухина с предварителна заявка. Таксата, продължителността и необходимите допълнителни изследвания се уточняват с кабинета.')],
  openingHours: hours(kodentBook, [1,2,3,4,5].map(d=>[d,'08:30','19:00']).concat([[6,'10:00','14:00']]))
}, { bookingUrl: kodentBook, excerpt: 'Запазете своя час още днес!', reviewedUrls: [kodent,kodentBook,'https://kodent.bg/services?profilaktika-i-lechenie=',kodentExam,'https://kodent.bg/terms'], serviceUrls: [kodentExam],
  priceSearchNotes: 'Followed actual Book entry to service/optional-doctor/contact appointment form, then services overview and dedicated prophylactic-examination page, terms and footer. No numeric examination fee, duration or separate tariff link is published on these accessible pages. No blocked tariff was treated as absent.',
  notes: 'Actual form has name/email/phone/service/optional clinician/message and Book control. Own contacts confirm exact MetodiPopov16 and weekly08:30–19/Sat10–14. Included dental examination only; unrelated injectable aesthetic procedures are excluded. Owner literal GPS numbers are not imported in this intake; no map/geocoding call or spatial-accuracy claim. No individual staff rows.' })

const dentalive = 'https://www.dentalive.bg/', dentaliveContact = `${dentalive}contact/`, dentalivePrices = `${dentalive}pricing/`
add({ id: 'sofia-dentalive-filip-kutev2a', name: 'dentAlive', address: 'София, бул. Филип Кутев 2а', website: dentalive, phone: '+359877003220',
  services: [service('Първична дентална консултация', 'Преглед и обсъждане на индивидуален лечебен план след предварително уговорен час. Публикувана цена за основна услуга; продължителност не е посочена.', { price: price(50,'EUR','първична консултация',dentalivePrices) }),
    service('Професионално почистване на зъби', 'Дентално почистване на плака и зъбен камък след предварително записване. Конкретният метод и продължителност се уточняват с клиниката.', { price: price(100,'EUR','почистване на зъби',dentalivePrices) })],
  openingHours: hours(dentaliveContact, [1,2,3,4,5].map(d=>[d,'09:00','20:00']).concat([[6,'10:00','17:00']]))
}, { bookingUrl: dentaliveContact, excerpt: 'Имате въпрос или искате да запишете час? Свържете се с нас по телефон или имейл.', reviewedUrls: [dentalive,dentaliveContact,dentalivePrices,`${dentalive}services/`],
  notes: 'Own booking workflow explicitly uses phone/email followed by agreed convenient time; read it before ordinary named-service tariff and contact/service pages.50EUR first consultation and100EUR cleaning are literal basic service prices, not promotions or treatment-package totals. Services fetched via ordinary public HTTP after reader cache miss. Exact FilipKutev2a and service weekly hours sourced; quarter not guessed. No treatment duration or specific cleaning machine inferred.' })

const vclinic = 'https://www.vclinic.bg/', vclinicContact = `${vclinic}контакти`, vclinicWhitening = `${vclinic}услуги/избелване-на-зъби`
add({ id: 'sofia-vclinic-james-bourchier83-85', name: 'VClinic · дентална клиника', address: 'София, бул. Джеймс Баучер 83–85, ет. 1, оф. 2', website: vclinic, phone: '+359879552956',
  services: [service('Избелване на зъби', 'Дентална услуга след предварителна консултация и записване по телефона. Конкретният подход, такса и продължителност се уточняват с клиниката; няма гарантиран резултат.')],
  openingHours: hours(vclinicContact, [1,2,3,4,5].map(d=>[d,'09:00','18:00']))
}, { bookingUrl: vclinic, contactUrl: vclinicContact, excerpt: 'Запазете час · Обадете ни се · +359 879 552 956', reviewedUrls: [vclinic,vclinicContact,vclinicWhitening,`${vclinic}услуги/почистване-на-зъбен-камък`], serviceUrls: [vclinicWhitening],
  priceSearchNotes: 'Actual owner Book/Call entry, whitening service and contacts/footer are accessible and reviewed. No numeric whitening tariff or separate price/booking menu is published. A different page titled calculus cleaning contains copied whitening body text; that inconsistent service page was not used to invent a cleaning method or price.',
  notes: 'Explicit owner phone Book appointment path and exact JamesBourchier83–85 office2 confirmed. Imported only clearly named whitening service supported by its proper service page, not the inconsistent cleaning template. Monday–Friday09–18 is own contact schedule. No guaranteed shades, clinical promises, fixed duration or price inferred. No maps, photos or customer material copied.' })

const familySmile = 'https://semeinausmivka.bg/', familyServices = `${familySmile}services`, blagova = 'https://superdoc.bg/lekar/kristina-blagova', koleva = 'https://superdoc.bg/lekar/pavlina-koleva'
add({ id: 'sofia-semeina-usmivka-kyustendil53', name: 'Семейна усмивка', neighborhood: 'Белите брези', address: 'София, ж.к. Белите брези, ул. Кюстендил 53', website: familySmile, phone: '+359878861068',
  services: [service('Първичен стоматологичен преглед', 'Предварителен час с д-р Кристина Благова или д-р Павлина Колева; тарифите им за тази услуга съвпадат. Носете предходна документация и актуални рентгенови снимки, ако разполагате с тях.', { price: price(50,'EUR','първичен преглед',blagova) }),
    service('Почистване на зъбен камък и полиране', 'При д-р Кристина Благова или д-р Павлина Колева. За онлайн записване се избират два последователни часа; носете налична предходна документация и рентгенови снимки.', { durationMin: 60, durationSourceUrl: blagova, durationCheckedOn: checkedOn, price: price(100,'EUR','почистване и полиране',blagova) })],
  openingHours: hours(familySmile, [1,2,3,4,5].map(d=>[d,'09:00','19:00']).concat([[6]]))
}, { bookingUrl: familySmile, excerpt: 'Запазете час за консултация или ни задайте своите въпроси на: 0878 861 068', reviewedUrls: [familySmile,familyServices,'https://superdoc.bg/klinika/dentalna-klinika-semeyna-usmivka',blagova,koleva],
  notes: 'Followed actual owner-linked practice booking directory into both named clinicians visit-reason/fee menus before own services and venue. Both publish50EUR primary examination and100EUR sixty-minute calculus cleaning/polishing requiring two consecutive online slots. Own phone consultation-booking path used; no staff clones. Source-exact Mon–Fri9–19 and Saturday only by agreement. General shop subscriptions/ratings/photos excluded. No assumption that every clinician treats children; selected services have no inferred child-age scope.' })

const vasident = 'https://www.vasident.com/', vasiPrices = `${vasident}терапия/`, vasiContact = `${vasident}контакти`
add({ id: 'sofia-vasident-angista8', name: 'Васидент · д-р Вася Стойнева', neighborhood: 'Сточна гара', address: 'София, Сточна гара, ул. Ангиста №8, ет. 1', website: vasident, phone: '+359888257496',
  services: [service('Обстоен стоматологичен преглед', 'Преглед след предварително записване по телефона. Публикуваната цена е за прегледа, а не за упойка или допълнително лечение.', { price: price(20,'EUR','обстоен преглед',vasiPrices) })]
}, { bookingUrl: vasident, contactUrl: vasiContact, excerpt: 'Запазване на час става след предварително записване по телефона. Обадете ни се на тел: 0888 257 496', reviewedUrls: [vasident,vasiPrices,vasiContact],
  notes: 'Actual owner telephone appointment instructions reviewed before ordinary Therapy tariff and dedicated contact page.20EUR examination is literal; anesthesia20EUR is a separate row, not silently bundled. Exact Angista8 first floor and source-stated StochnaGara retained. Heading Working hours contains booking instructions only, no clock/weekday schedule; no openingHours invented. One family practice, not two clinicians counted separately.' })

const tsonev = 'https://drtsonev.com/', tsonevBook = `${tsonev}contacts/`, tsonevExam = `${tsonev}prevention/`
add({ id: 'sofia-stoyan-tsonev-chavdar-mutafov22', name: 'Д-р Стоян Цонев · дентален кабинет', address: 'София, ул. Чавдар Мутафов 22, партер', website: tsonev, phone: '+359899834020', booking: { kind: 'form', url: tsonevBook },
  services: [service('Профилактичен стоматологичен преглед', 'Преглед на зъбите и венците с предварителна заявка за ден и час. Таксата и действителната продължителност се уточняват с кабинета; потвърждението не е автоматично.')],
  openingHours: hours(tsonevBook, [1,2,3,4,5].map(d=>[d,'09:00','18:00']).concat([[6]]))
}, { bookingUrl: tsonevBook, excerpt: 'Свържи се с мен или си запази час', reviewedUrls: [tsonev,tsonevBook,tsonevExam], serviceUrls: [tsonevExam],
  priceSearchNotes: 'Followed actual Book entry into own form containing names, phone, email, date/time and message. Read complete prevention service page plus contact/footer; no numeric examination fee or linked tariff is published. Generic claims of affordable prices are not a published amount.',
  notes: 'Contact and prevention pages read via normal public HTTP after reader timeouts. Actual date/time inquiry form establishes appointment request, not just generic contact. Own contacts confirm ChavdarMutafov22 ground floor; Lozenets is stated as municipality, so quarter remains null. Mon–Fri09–18 and Saturday by agreement, no Sunday opening. No private form submission or map request.' })

const yovcheva = 'https://yovcheva.com/', yovchevaBook = 'https://superdoc.bg/lekar/dora-yovcheva'
add({ id: 'sofia-dora-yovcheva-cherni-vrah7', name: 'Д-р Дора Йовчева · стоматологична практика', address: 'София, бул. Черни връх 7', website: yovcheva, phone: '+359888401918', booking: { kind: 'form', url: yovchevaBook },
  services: [service('Профилактичен стоматологичен преглед', 'Предварително записан преглед в практиката на д-р Дора Йовчева. Таксата и продължителността се уточняват с кабинета; носете налична предходна медицинска документация.')]
}, { bookingUrl: yovcheva, contactUrl: yovcheva, excerpt: 'Запазете час · Стоматологична практика д-р Йовчева', reviewedUrls: [yovcheva,yovchevaBook], serviceUrls: [yovcheva], provider: true,
  priceSearchNotes: 'Followed own actual Book link to named practice visit-reason/booking panel at CherniVrah7, then read own full service, inquiry and footer sections. Neither own service page nor actual public booking panel publishes a numeric examination tariff. Provider Plus subscription prices are unrelated and excluded.',
  notes: 'Own site and owner-linked booking panel agree on exact CherniVrah7 and primary phone. Provider visit reasons and appointment panel reviewed without reservation. Owner schedule alternates even dates13–19 and odd dates09–14, with weekends closed; this cannot be represented honestly as a fixed weekly clock schedule, so hours omitted. Lozenets/Centre SEO is ambiguous, so no quarter guessed. One practice, not separate staff clones.' })

const bb = 'https://bbdental.eu/', bbBook = `${bb}contact-us/`, bbWhitening = `${bb}teeth-whitening/`
add({ id: 'sofia-bb-dental-sredna-gora32', name: 'BB Dental', neighborhood: 'Зона Б-5', address: 'София, ж.к. Зона Б-5, ул. Средна гора 32', website: bb, phone: '+359988970222', booking: { kind: 'form', url: bbBook },
  services: [service('Дентален преглед и консултация', 'Предварително уговорена консултация и преглед; след оценката се представят лечебен план и цена. Запитването за предпочитан ден, час и лекар се потвърждава допълнително.')]
}, { bookingUrl: bbBook, excerpt: 'Обадете се, пишете ни или изпратете запитване — ще намерим удобен за Вас час.', reviewedUrls: [bb,bbBook,bbWhitening], serviceUrls: [bb],
  priceSearchNotes: 'Read actual appointment form with service, preferred clinician, day/time, callback details and consent before own first-visit service workflow and whitening page. The first-visit workflow explicitly states plan and price are provided after examination; no numeric consultation tariff or price-menu link is published.',
  notes: 'Exact SrednaGora32/ZoneB5 and common appointment phone are own published facts. Two clinicians have different individual work schedules; no single universal consultation schedule or staff clone is inferred. Actual form is request/callback, not instantaneous confirmed availability. No clinical promises, Google reviews/photos or individualized private quote imported.' })

const batinkov = 'https://zabolekar-reduta.com/', batiContact = `${batinkov}контакти/`, batiPrices = `${batinkov}uslugi-i-ceni/`, batiBook = 'https://superdoc.bg/lekar/martin-batinkov'
add({ id: 'sofia-batinkov-dental-velcho-atanasov9', name: 'Батинков Дентал', neighborhood: 'Редута', address: 'София, ж.к. Редута, ул. Велчо Атанасов №9', website: batinkov, phone: '+359877073305',
  services: [service('Лечение на кариес на една повърхност или шийката · възрастни', 'Пълна частна цена, без условната тарифа по НЗОК. Упойката е включена според сайта; за пломба първо се свържете по телефона, защото може да е необходима рентгенова снимка.', { price: price(100,'EUR','пломба · една повърхност/шийка',batiPrices) })],
  openingHours: hours(batinkov, [1,2,3,4,5].map(d=>[d,'11:00','19:00']))
}, { bookingUrl: batiContact, excerpt: 'Записване на час-с телефонно обаждане', reviewedUrls: [batinkov,batiContact,batiPrices,batiBook],
  notes: 'Actual own Book link and named provider appointment panel reviewed before own fee/service/contact pages. Imported only own ordinary100EUR one-surface/cervical filling with anesthesia, not conditional NHIF57.85EUR. Cleaning tariff conflicts95–105own vs90provider are held out; photo-exam45 plus optional20plan wording also not imported. Adult-only selected service avoids source conflict children10+vs12+. Own contact exact VelchoAtanasov9; Mon–Fri11–19. No inferred duration.' })

for (const branch of [
  ['sofia-robotika-serdika-todor-aleksandrov17','Сердика','Център','София, бул. Тодор Александров №17','f3tp47obb','сряда 18:30','04.11–16.12.2026'],
  ['sofia-robotika-mladost1-saharov25','Младост 1','Младост 1','София, ул. Академик Андрей Сахаров 25','txext3c7r','събота 13:00','07.11–19.12.2026']
]) {
  const groupUrl = `https://robotika.bg/register-course?group=${branch[4]}`
  add({ id: branch[0], name: `Академия Роботика · ${branch[1]}`, category: 'education', neighborhood: branch[2], address: branch[3], website: robotika, phone: '+359879205253', booking: { kind: 'form', url: groupUrl },
    services: [service('Роботика за 5-годишни · I ниво с Kubo · курс 7 занятия', `Целият курс: 7 занятия по 60 минути, ${branch[5]}, ${branch[6]}. Еднократна такса за целия курс, не за посещение; плащане по банка след записване. Точните учебни дати и приемът се потвърждават от академията.`, { category: 'education', price: price(158,'EUR','цял курс · 7 занятия по 60 минути',robotika,{validUntil:branch[0].includes('serdika')?'2026-12-16':'2026-12-19'}) })]
  }, { validUntil: branch[0].includes('serdika') ? '2026-12-16' : '2026-12-19', bookingUrl: groupUrl, contactUrl: robotikaContact, excerpt: `Роботика за 5-годишни – I ниво с Kubo · София / ${branch[1]} / ${branch[5]}`, reviewedUrls: [robotika,groupUrl,robotikaContact,robotikaTerms],
    notes: `Root separately rendered this exact group URL after hydration and confirmed real registration fields plus readonly selected ${branch[1]} group and158EUR whole-course option, no data/consent/submission. I read own branch-specific seven60-minute course row, dates and dedicated venue contact. Not a chain-wide price inference: both exact group rows separately state158EUR. Same common phone but distinct actual teaching premises; no staff/citywide clone. Ten-to-eighteen office hours and finite class schedule are not year-round openingHours.` })
}

export default { records, reviews }
