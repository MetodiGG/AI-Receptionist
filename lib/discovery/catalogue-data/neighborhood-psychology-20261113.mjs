// Bounded factual first-party review, 2026-11-13. No bookings submitted.
// Root supplies inventoryIdentity only after final inventory/source validation.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const base = { cityCode: '68134', category: 'other', locationKind: 'premises', coordinates: null }
const fee = (amount, sourceUrl, unit) => ({ amount, currency: 'EUR', kind: 'fixed', unit, sourceUrl, checkedOn })
const session = (name, amount, sourceUrl, description, durationMin) => ({
  name, category: 'other', appointmentModel: 'appointment', description,
  price: fee(amount, sourceUrl, 'една сесия'),
  ...(durationMin == null ? {} : { durationMin, durationSourceUrl: sourceUrl, durationCheckedOn: checkedOn }),
})
const verified = (url, excerpt, contact = url) => ({ status: 'approved', checkedOn, validUntil, booking: { url, excerpt }, contact })
const markovskaBook = 'https://superdoc.bg/lekar/desislava-markovska'
const mariaBook = 'https://superdoc.bg/lekar/maria-genova'
const kralevBook = 'https://superdoc.bg/lekar/petar-kralev'
const azonPrices = 'https://azon.bg/%D1%86%D0%B5%D0%BD%D0%B8-%D0%BD%D0%B0-%D1%86%D0%B5%D0%BD%D1%82%D1%8A%D1%80-%D0%B0%D0%B7%D0%BE%D0%BD/'
const kralevServices = 'https://psihoterapevt-kralev.com/%D1%82%D0%B5%D1%80%D0%B0%D0%BF%D0%B5%D0%B2%D1%82%D0%B8%D1%87%D0%BD%D0%B8-%D0%B4%D0%B5%D0%B9%D0%BD%D0%BE%D1%81%D1%82%D0%B8/'
const kralevIndividual = 'https://psihoterapevt-kralev.com/%D0%BA%D0%BE%D0%BD%D1%81%D1%83%D0%BB%D1%82%D0%B0%D1%86%D0%B8%D0%B8-%D0%B8-%D0%B8%D0%BD%D0%B4%D0%B8%D0%B2%D0%B8%D0%B4%D1%83%D0%B0%D0%BB%D0%BD%D0%B0-%D0%BF%D1%81%D0%B8%D1%85%D0%BE%D1%82%D0%B5%D1%80/'
const kotevaCouples = 'https://bkoteva.com/uslugi/semejna-terapiya-za-dvojki/'

const records = [
  {
    ...base, id: 'sofia-zhenya-spasova-kableshkov', name: 'Женя Спасова · индивидуални консултации', neighborhood: null,
    address: 'София, ул. Тодор Каблешков 53, офис 34', website: 'https://regresiatherapy.com/', phone: '+359896373634',
    booking: { kind: 'form', url: 'https://regresiatherapy.com/contacts/' },
    services: [session('Индивидуална консултация в кабинет', 46.02, 'https://regresiatherapy.com/ceni/', 'Една присъствена консултация с продължителност до 50 минути. Публикувана цена 46.02 € / 90 лв.; не пакетен план. Часът се уточнява чрез контактната форма или Viber.')],
    verification: verified('https://regresiatherapy.com/contacts/', 'Собствената услуга води чрез Запиши час към контактна форма с избор на терапия, име, телефон и детайли; предпочита се форма или Viber.'),
  },
  {
    ...base, id: 'sofia-desislava-markovska-yavorov', name: 'Десислава Марковска · Диря', neighborhood: 'Яворов',
    address: 'София, ж.к. Яворов, ул. Леонардо да Винчи 2', website: 'https://desislavamarkovska.com/', phone: '+359883312418',
    booking: { kind: 'form', url: markovskaBook },
    services: [session('Консултация на живо', 40, markovskaBook, 'Присъствена индивидуална консултация. Собственият сайт описва сесии от 60 минути. При записване през Superdoc отказ или промяна са без такса до 6 часа предварително; по-късен отказ или неявяване се заплаща.')],
    openingHours: { sourceUrl: 'https://desislavamarkovska.com/kontakti/', checkedOn, days: [1, 2, 3, 4, 5].map(weekday => ({ weekday, periods: [{ open: '09:00', close: '18:00' }] })) },
    verification: verified('https://desislavamarkovska.com/kontakti/', 'Собствените контакти съдържат записване по телефон и директна връзка към профила за онлайн запазване на час в Superdoc.'),
  },
  {
    ...base, id: 'sofia-azon-lozenets', name: 'АзОн · психологическо консултиране и психотерапия', neighborhood: 'Лозенец',
    address: 'София, кв. Лозенец, ул. Неразделни 4', website: 'https://azon.bg/', phone: '+359888356035',
    booking: { kind: 'phone', phone: '+359888356035' },
    services: [
      session('Психологическа консултация', 45, azonPrices, 'Една консултация в център АзОн; часът се уговаря предварително.', 50),
      session('Индивидуална психотерапия', 45, azonPrices, 'Една индивидуална сесия в център АзОн; часът се уговаря предварително.', 60),
      session('Терапия за двойки', 60, azonPrices, 'Една сесия за двойка в център АзОн; часът се уговаря предварително.', 75),
    ],
    verification: verified(azonPrices, 'Собственият ценоразпис има Запиши час при всяка услуга и телефони за връзка с центъра. Контактната страница бе недостъпна; не се твърди преглед на скрит календар.', 'https://azon.bg/psihoterapiya-center-azon/'),
  },
  {
    ...base, id: 'sofia-maria-genova-pirin', name: 'Мария Генова · психотерапевтичен кабинет', neighborhood: null,
    address: 'София, ул. Пирин 73, етаж 4, офис 4.5', website: 'https://mariaguenova.com/', phone: '+359896613143',
    booking: { kind: 'form', url: mariaBook },
    services: [session('Индивидуална консултация', 45, mariaBook, 'Индивидуална присъствена консултация. Часът се заявява в свързания от собствения сайт профил Superdoc; точна продължителност не е публикувана в прегледаното меню.')],
    verification: verified('https://mariaguenova.com/', 'Собствените Начало и Услуги предлагат Запиши час с директна връзка към реалния профил за резервации в Superdoc.'),
  },
  {
    ...base, id: 'sofia-petar-kralev-gurko', name: 'Петър Кралев · психотерапевтично студио', neighborhood: null,
    address: 'София, ул. Генерал Гурко 68, ет. 1, звънец Георгиеви', website: 'https://psihoterapevt-kralev.com/', phone: '+359887705582',
    booking: { kind: 'form', url: kralevBook },
    services: [
      session('Еднократна консултация', 50, kralevBook, 'Еднократна присъствена консултация; отделна от тарифата за системно провеждана терапия.', 60),
      session('Системно провеждана терапия', 45, kralevBook, 'Тарифата се отнася за системно провеждана терапия, а не за еднократна консултация.', 60),
    ],
    verification: verified('https://psihoterapevt-kralev.com/', 'Собственият сайт има Запишете час онлайн тук с директна връзка към реалния профил за резервации в Superdoc.'),
  },
  {
    ...base, id: 'sofia-room-with-heart-izgrev', name: 'Стая със сърце · консултативен кабинет', neighborhood: 'Изгрев',
    address: 'София, ж.к. Изгрев, ул. Фредерик Жолио Кюри 20', website: 'https://roomwithheart.com/', phone: '+359897609727',
    booking: { kind: 'form', url: 'https://roomwithheart.com/zapishi-chas/' },
    services: [
      session('Индивидуална консултация с родител', 25, 'https://roomwithheart.com/uslugi-i-ceni/', 'Присъствена психологическа консултация с родител. Кабинетът работи само с предварително записани часове.', 60),
      session('Детско-юношеска консултация', 30, 'https://roomwithheart.com/uslugi-i-ceni/', 'Присъствена детско-юношеска психологическа консултация. Срещата се уговаря чрез контактната форма.', 50),
    ],
    verification: verified('https://roomwithheart.com/zapishi-chas/', 'Действителната собствена страница Запишете си час съдържа адрес, телефони и форма с име, фамилия, телефон, имейл и съобщение; работи само с предварително записани часове.'),
  },
  {
    ...base, id: 'sofia-bilyana-koteva-sveta-nedelya', name: 'Биляна Котева · психолог и психотерапевт', neighborhood: null,
    address: 'София, пл. Света Неделя 16, ет. 1, каб. 14', website: 'https://bkoteva.com/', phone: '+359888904030',
    booking: { kind: 'phone', phone: '+359888904030' },
    services: [
      session('Индивидуална терапевтична сесия', 40, 'https://bkoteva.com/', 'Една индивидуална сесия. Всички консултации са с предварително записан час по телефона. Отмяна до 24 часа предварително; в противен случай сесията се заплаща.', 50),
      session('Терапевтична сесия за двойка', 50, kotevaCouples, 'Една сесия за двойка с продължителност около 60 минути. Отмяна до 24 часа предварително; в противен случай сесията се заплаща.'),
      session('Семейна терапевтична сесия', 60, 'https://bkoteva.com/', 'Една семейна сесия. Отмяна до 24 часа предварително; в противен случай сесията се заплаща.', 90),
    ],
    verification: verified('https://bkoteva.com/', 'Собственото Начало и услугата за двойки изрично посочват: всички консултации са с предварително записан час по телефона. Публикуван е същият телефон и точен кабинет.', kotevaCouples),
  },
]

const reviews = [
  {
    id: 'sofia-zhenya-spasova-kableshkov', website: 'https://regresiatherapy.com/', bookingEntry: 'https://regresiatherapy.com/contacts/', bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: ['https://regresiatherapy.com/', 'https://regresiatherapy.com/contacts/', 'https://regresiatherapy.com/uslugi/individualna-konsultaciya/', 'https://regresiatherapy.com/ceni/'],
    notes: 'Followed actual service Book to owner contact form before tariff. Name/email/phone/therapy/details fields visible; preferred Viber/form, telephone harder during sessions. Individual consult literal46.02EUR/90BGN up to50minutes officeoronline; only physical visit retained. Up-to duration not flattened to exact50. Monthly/quarter/halfyear plans and regression/dream/apparatus services excluded. Exact own address/phone; neighborhood and coordinates absent, not guessed. Root/contact/service/prices/footer checked; no weekly hours published. No qualification, clinical-outcome, absolute confidentiality or source-image claims imported. No form submitted.',
  },
  {
    id: 'sofia-desislava-markovska-yavorov', website: 'https://desislavamarkovska.com/', bookingEntry: markovskaBook, bookingReview: 'provider_booking_reviewed', checkedOn,
    reviewedUrls: ['https://desislavamarkovska.com/', 'https://desislavamarkovska.com/kontakti/', 'https://desislavamarkovska.com/konsultirane-i-terapiya/', markovskaBook],
    notes: 'Actual own Book contact route reviewed first, visible request form and explicit phone appointment instruction. Followed owner-linked Superdoc alternative; actual booking section identifies Dirya, same address/phone, physicalconsult40EUR, online40 andcouples50. Only physicalindividual retained; no made-upduration field. Own service page independently describes60minute sessions; latest direct rendering omitsFAQfee, so price source is actual provider tariff, not an older searchsnippet. Provider cancellation cutoff6hours preserved. Owncontact Mon-Fri09-18; unspecifiedweekends omitted, not markedclosed. No patient reviews, ratings, photos, claimed licences or outcomes imported.',
  },
  {
    id: 'sofia-azon-lozenets', website: 'https://azon.bg/', bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: ['https://azon.bg/', 'https://azon.bg/kontakti-center-azon/', 'https://azon.bg/psihoterapiya-center-azon/', azonPrices],
    notes: 'Followed actual Book links to contact; contact returned an access-verification interstitial, not bypassed and not claimed read. Owner service/tariff pages themselves expose ordinary named services, explicit Book buttons, contact form and two ownerphones. Phone routing selected, no hidden online menu claimed. Literal45EUR50min consultation,45EUR60minindividual,60EUR75mincouple. One centre only; two named practitioners not cloned into extra businesses and their independent sites/fees not generalized. OwnexactLozenetsNerazdelni4 and primaryphone retained. Reviewed footer/contact/service/prices for hours; no sourced weeklyhours, absent. No medicalclaims, photos or directory-derivedfields.',
  },
  {
    id: 'sofia-maria-genova-pirin', website: 'https://mariaguenova.com/', bookingEntry: mariaBook, bookingReview: 'provider_booking_reviewed', checkedOn,
    reviewedUrls: ['https://mariaguenova.com/', 'https://mariaguenova.com/uslugi/', 'https://mariaguenova.com/kontakti/', mariaBook],
    notes: 'Ownroot and services actual Book link followed first to exact owner-linked Superdoc booking menu. Menu physicalcabinetPirin73floor4office4.5 and individualconsult45EUR agree ownroot contact address/phone. Only literalindividualtariff retained; nochild/group/parent-sessionfee inference, no duration invented. Calendarplaceholder not asserted as available appointments, no booking submitted. Ownroot/contact/service/provider/footer checked for hours; none published as weeklyschedule. Qualifications omitted rather than elevate provider supervision status. No source images, patient review text, ratings or directory-only fees copied.',
  },
  {
    id: 'sofia-petar-kralev-gurko', website: 'https://psihoterapevt-kralev.com/', bookingEntry: kralevBook, bookingReview: 'provider_booking_reviewed', checkedOn,
    reviewedUrls: ['https://psihoterapevt-kralev.com/', kralevBook, kralevServices, kralevIndividual],
    notes: 'Ownroot explicit onlinebookinglink followed first; exact ownerlinked Superdoc inventory fullyread with samephone, exactSofiaGurko68floor1bellGeorgievi,60minuteconsultation and separate50EURoneoff/45EURsystematictherapy. Address source is ownerdirected actual booking profile, not generaldirectory/geocoding. Systematictherapy condition remains public, not mislabeled generalfirstvisit. Owntherapeuticactivity/individualpages confirm actualservices; familyfee50 not imported without unambiguous sessionduration/type. Ownactivitypage Hours merely says contactforappointment; no weeklyhours inferred from provider earliestslot. No photos, rating/reviews, outcome or qualification claims imported.',
  },
  {
    id: 'sofia-room-with-heart-izgrev', website: 'https://roomwithheart.com/', bookingEntry: 'https://roomwithheart.com/zapishi-chas/', bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: ['https://roomwithheart.com/', 'https://roomwithheart.com/zapishi-chas/', 'https://roomwithheart.com/uslugi-i-ceni/'],
    notes: 'Actual own Book page followed first: requestformfields,name/surname/phone/email/message,exactIzgrevJoliotCurie20,two ownphones,explicitpriorappointments. Form is request, not realtimeslots. Then read full prices page by psychology/logopedics sections; parentpsychconsult25EUR60min and childadolescentpsych30EUR50min retained. Separate logopedics30/20fees not misassigned to psychology, online25/30tariffs excluded. Primaryphone897609727 from actualbookingcontacts. No weeklyhours on ownBook/root/services/footer, omitted. No healthoutcome/absoluteconfidentiality/qualificationclaims or testimonial content copied.',
  },
  {
    id: 'sofia-bilyana-koteva-sveta-nedelya', website: 'https://bkoteva.com/', bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: ['https://bkoteva.com/', 'https://bkoteva.com/kontakti/', kotevaCouples, 'https://bkoteva.com/uslugi/individualna-terapiya/'],
    notes: 'Actualowninquirycontactentry attempted first returnedcachemiss. Read ownroot full footer and actualcouplespage, both explicitlyrequireadvancephonebooking with exactcabinetandphone. These independently expose requestform and literal40EUR50minindividual,50EURapproximately60mincouples,60EUR90minfamily; approximatecoupleduration remains text, not exactdurationfield. Cancelby24hoursorpayconditionpreserved. Individualdetailcachemissnotclaimreviewedbody; ownrootexplicitindividualinventory/tariff sufficient. Ownroot/couplesfooterhave no weeklyhours; omitted. No bankingdetails,sourceimages,testimonials,qualifications or clinicaloutcomeclaims copied.',
  },
]

export default { records, reviews }
