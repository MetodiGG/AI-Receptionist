// Further unique Sofia premises. First-party facts only; no inferred fees or hours.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const base = { cityCode: '68134', locationKind: 'premises', coordinates: null }
const service = (name, category, amount, sourceUrl, durationMin, currency = 'EUR') => ({
  name, category, appointmentModel: 'appointment',
  price: { amount, currency, kind: 'fixed', sourceUrl, checkedOn, validUntil },
  ...(durationMin ? { durationMin, durationSourceUrl: sourceUrl, durationCheckedOn: checkedOn } : {}),
})
const hours = (sourceUrl, entries) => ({ sourceUrl, checkedOn, days: entries.map(([weekday, open, close]) => ({ weekday, periods: open ? [{ open, close }] : [] })) })
const verification = (url, excerpt, contact = url) => ({ status: 'approved', checkedOn, validUntil, booking: { url, excerpt }, contact })
const radka = 'https://nailsartbyradkamad.setmore.com/'
const barbie = 'https://barbiedreamss.setmore.com/'
const noa = 'https://noabeautylounge.com/'
const records = [
  {
    ...base, id: 'sofia-radka-mad-ovcha-kupel', name: 'Nails Art by Radka Mad', neighborhood: 'Овча купел 1',
    address: 'София, ж.к. Овча купел 1, бл. 414, вх. Е, салон за красота Жанин', category: 'nails', website: radka, phone: '+359890909092',
    booking: { kind: 'form', url: radka },
    services: [
      service('Обикновен маникюр', 'nails', 20, radka, 45),
      service('Маникюр с гел лак', 'nails', 30, radka, 90),
      service('Педикюр с гел лак', 'nails', 35, radka, 60),
    ],
    openingHours: hours(radka, [1, 2, 3, 4, 5, 6, 7].map(day => [day, '10:00', '19:30'])),
    verification: verification(radka, 'Book · Обикновен маникюр · Гел лак · Педикюр с гел лак · собствена страница за записвания на Nails Art by Radka Mad'),
  },
  {
    ...base, id: 'sofia-barbie-dreams-cherni-vrah', name: 'Barbie Dreams · Facial Bar & Nail Spa', neighborhood: null,
    address: 'София, бул. Черни връх 178А', category: 'nails', website: barbie, phone: '+359893300402',
    booking: { kind: 'form', url: barbie },
    services: [
      service('Маникюр с гел лак', 'nails', 40, barbie, 60, 'BGN'),
      service('Маникюр без лак', 'nails', 20, barbie, 40, 'BGN'),
      service('Педикюр с гел лак', 'nails', 60, barbie, 60, 'BGN'),
    ],
    openingHours: hours(barbie, [1, 2, 3, 4, 5, 6, 7].map(day => [day, '07:00', '22:00'])),
    verification: verification(barbie, 'Резервирай · Маникюр с гел лак · Маникюр без лак · Педикюр с гел лак · собствена страница за записвания'),
  },
  {
    ...base, id: 'sofia-noa-beauty-dragan-tsankov', name: 'NOĀ Beauty Lounge', neighborhood: null,
    address: 'София, ул. Драган Цанков 23', category: 'nails', website: noa, phone: '+359885102407',
    booking: { kind: 'phone', phone: '+359885102407' },
    services: [
      service('Класически маникюр без лак · Наталия или Елена', 'nails', 27, `${noa}manicure/`),
      service('Класически маникюр с лак · Наталия или Елена', 'nails', 30, `${noa}manicure/`),
      service('Маникюр с гел и гел лак · къси нокти · Наталия или Елена', 'nails', 40, `${noa}manicure/`),
    ],
    verification: verification(`${noa}ceni/`, 'Можете да запазите час онлайн или да се свържете директно с нас по телефона според услугата. Маникюр и педикюр: +359885102407', noa),
  },
]
const reviews = [
  {
    id: 'sofia-radka-mad-ovcha-kupel', website: radka, bookingEntry: radka, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [radka, `${radka}book`],
    notes: 'Primary owner-operated unique Setmore merchant website read through its fully indexed first-party text: actual named Book menu, exact premises inside Janin salon, own telephone/email and all seven weekday hours. Direct root fetch timed out; /book extension JS-only; neither is described as a completed later scheduling flow or unavailable tariff. Three ordinary cosmetic nail fees20/30/35EUR with45/90/60min retained literally. Clinical nail correction, ingrown-nail, therapeutic/medical services, outcome claims, ratings, reviews and photographs excluded. No name/domain/phone/address match in latest catalogue1153 or5native partners. No form input or reservation.',
  },
  {
    id: 'sofia-barbie-dreams-cherni-vrah', website: barbie, bookingEntry: barbie, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [barbie],
    notes: 'Read fully indexed actual owner-operated merchant website with exact Sofia premises, phone, complete daily07-22 hours and named Reserve service rows. Direct root fetch timed out; indexed primary menu supplies all imported facts, not a directory. Three ordinary nail services imported with literal40/20/60BGN fees and60/40/60min, no self-calculated EUR conversions. Strengthening rows contain conflicting size variants and were excluded; clinical/needling/laser/body procedures and free consultations excluded from this bounded nail inventory. No reviews, ratings, photographs, outcome claims or availability assertions imported. No booking made.',
  },
  {
    id: 'sofia-noa-beauty-dragan-tsankov', website: noa, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: [noa, `${noa}manicure/`, `${noa}ceni/`, `${noa}salon/`, 'https://book.noabeautylounge.com/reservations/create'],
    notes: 'Own full tariff FAQ explicitly permits phone appointments by service and publishes dedicated nail telephone; exact venue from own root. Nail detail explicitly labels Natalia/Elena tier27/30/40EUR for withoutpolish/polish/shortgel+gelpolish, independently confirmed in current general tariff. Different unnamed tier30/32/42 was not substituted. Old bottom pedicure/add-on tariff conflicts with current rows, excluded. Root independently read real browser booking notice: online reservations temporarily suspended; call or write for appointments. Phone route retained, not a form claim, and actual published own fees are not called unpublished. Salon subpage timed out; no weekly hours published in other reviewed pages, omitted. No durations or neighborhood guessed; no medical/outcome claims or Google review/photo content copied.',
  },
]
const neglige = 'https://negligemladost.setmore.com/'
const elida = 'https://elidawellnessbeautycentres.setmore.com/'
const mimi = 'https://mimisworld.setmore.com/'
records.push(
  {
    ...base, id: 'sofia-neglige-saharov', name: 'NegliGe · Андрей Сахаров', neighborhood: null,
    address: 'София, бул. Андрей Сахаров, бл. 245, вх. 2, партер', category: 'nails', website: neglige, phone: '+359889952520',
    booking: { kind: 'form', url: neglige },
    services: [
      service('Класически маникюр с CND Vinylux', 'nails', 22, neglige, 55),
      service('Класически маникюр без лак', 'nails', 20, neglige, 45),
      service('Маникюр с CND Shellac или гел лак', 'nails', 28, neglige, 90),
    ],
    openingHours: hours(neglige, [1, 2, 3, 4, 5, 6, 7].map(day => [day, '10:00', '20:00'])),
    verification: verification(neglige, 'Резервирай · Класически маникюр със CND Vinylux · Класически маникюр без лак · CND Shellac/гел лак маникюр'),
  },
  {
    ...base, id: 'sofia-elida-han-asparuh', name: 'Elida Wellness & Beauty Centre', neighborhood: null,
    address: 'София, ул. Хан Аспарух 54', category: 'nails', website: elida, phone: '+359893333070',
    booking: { kind: 'form', url: elida },
    services: [
      service('Маникюр без лак', 'nails', 16, elida, 40),
      service('Маникюр с гел лак', 'nails', 26, elida, 75),
      service('Педикюр с гел лак', 'nails', 34, elida, 80),
    ],
    openingHours: hours(elida, [...[1, 2, 3, 4, 5].map(day => [day, '09:00', '19:30']), [6, '09:30', '18:30'], [7]]),
    verification: verification(elida, 'Резервирай · Маникюр без лак · Маникюр с гел лак · Педикюр с гел лак · собствена страница за записвания'),
  },
  {
    ...base, id: 'sofia-mimis-world-chehov', name: 'Mimi’s World', neighborhood: null,
    address: 'София, ул. Антон Чехов 37', category: 'hair', website: mimi, phone: '+359877461894',
    booking: { kind: 'form', url: mimi },
    services: [
      { ...service('Плитки cornrows без екстеншъни', 'hair', 60, mimi, 60), description: 'Записването изисква потвърждение чрез съобщение.' },
      { ...service('Прически с crochet техника', 'hair', 100, mimi, 90), description: 'Цената не включва екстеншъните. Записването изисква потвърждение чрез съобщение.' },
      { ...service('Плитки cornrows с екстеншъни', 'hair', 120, mimi, 125), description: 'Публикуваната цена е за услугата; екстеншъните се заплащат отделно. Записването изисква потвърждение чрез съобщение.' },
    ],
    openingHours: hours(mimi, [...[1, 2, 3, 4, 5].map(day => [day, '09:00', '20:00']), [6, '09:30', '22:00'], [7, '10:30', '19:00']]),
    verification: verification(mimi, 'Book · Cornrows without extension · Crochet Styles · Cornrows with extension; confirmation required via message'),
  },
)
reviews.push(
  {
    id: 'sofia-neglige-saharov', website: neglige, bookingEntry: neglige, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [neglige, `${neglige}book`],
    notes: 'Read fully indexed primary owner-operated Setmore merchant page with exact AndreySaharovblock245entrance2groundfloor, own shared phone/email, complete daily10-20 hours and named Reserve service menu. Three exact ordinary nail EUR fees22/20/28 with55/45/90min retained; /book indexed menu independently confirms fees. Direct root timed out and direct /bookcachemiss, limitations explicit, no claim to later flow or slot availability. Iztok separate merchant account lacks firstparty address, held rather than cloning a second premises from directories or shared phone. Clinical/therapeutic nails and outcome claims excluded, no reviews/photos copied.',
  },
  {
    id: 'sofia-elida-han-asparuh', website: elida, bookingEntry: elida, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [elida, `${elida}book`],
    notes: 'Primary owner-operated unique Setmore merchant page fully read: exact SofiaHanAsparuh54, contact phone, complete weekdays09-19:30Saturday09:30-18:30Sundayclosed and actual Reserve menu. Three ordinary nail services16/26/34EUR40/75/80min retained literally. Facial/clinical/body service claims and prepaid packages excluded. Separate /book extension has no readable text; actual primary merchant named bookable service rows read, no availability or completed scheduling step assertion. No reviews, ratings, images or Google map/geocoding facts imported. No form data or reservations entered.',
  },
  {
    id: 'sofia-mimis-world-chehov', website: mimi, bookingEntry: mimi, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [mimi, `${mimi}book`],
    notes: 'Primary owner-operated unique Setmore merchant website fully read including exact SofiaAntonChehov37, own phone, full unusual weekly hours and explicit booking policy requiring message confirmation. Three actual fixed-fee service rows: cornrowswithout60EUR60min; crochet100EUR90min; cornrowswithextensions120EUR125min. Published extension/product exclusion preserved, not a full all-materials quote. Box/knotless prices expressly vary and Boho duration conflicts; those services excluded. Separate /bookcachemiss, no later-step/availability claims. No marketing, nationality/credential assumptions, reviews or photos imported; no message/form submitted.',
  },
)
const skalp = 'https://studioskalp.setmore.com/'
const evgenia = 'https://evgeniaangelova1.setmore.com/'
const irini = 'https://iriniholisticbeautylounge.setmore.com/'
const lau = 'https://lauspa.setmore.com/'
records.push(
  {
    ...base, id: 'sofia-skalp-emiliyan-stanev', name: 'Studio SKALP', neighborhood: 'Кръстова вада',
    address: 'София, кв. Кръстова вада, ул. Емилиян Станев 9', category: 'hair', website: skalp, phone: '+359877578772',
    booking: { kind: 'form', url: skalp },
    services: [
      service('Дамско подстригване', 'hair', 40, skalp, 30),
      service('Мъжко подстригване', 'hair', 40, skalp, 30),
      service('Сешоар · къса коса', 'hair', 25, skalp, 30),
    ],
    openingHours: hours(skalp, [[1], [2, '11:00', '19:00'], [3, '11:00', '19:00'], [4], [5, '11:00', '19:00'], [6, '11:00', '19:00'], [7, '11:00', '19:00']]),
    verification: verification(skalp, 'Book · Дамско подстригване · Мъжко подстригване · Сешоар на къса коса · собствена страница за записвания'),
  },
  {
    ...base, id: 'sofia-evgenia-angelova-kozloduy', name: 'Евгения Ангелова · козметика', neighborhood: null,
    address: 'София, ул. Козлодуй 156', category: 'beauty', website: evgenia, phone: '+359885766702',
    booking: { kind: 'form', url: evgenia },
    services: [
      { ...service('Масаж на лице по Ахабадзе', 'beauty', 25, evgenia), description: 'Записването се потвърждава едва след SMS или обаждане от студиото.' },
      { ...service('Терапия според типа кожа', 'beauty', 50, evgenia), description: 'Записването се потвърждава едва след SMS или обаждане от студиото.' },
      { ...service('Дермапланинг', 'beauty', 30, evgenia), description: 'Записването се потвърждава едва след SMS или обаждане от студиото.' },
    ],
    openingHours: hours(evgenia, [[1, '10:30', '17:00'], [2, '11:30', '17:00'], [3, '10:30', '17:00'], ...[4, 5, 6, 7].map(day => [day, '10:30', '20:00'])]),
    verification: verification(evgenia, 'Запазвате час. Получавате SMS или обаждане. Само тогава часът е потвърден.'),
  },
  {
    ...base, id: 'sofia-irini-stratiev', name: 'IRINI Holistic Beauty Lounge', neighborhood: 'Малинова долина',
    address: 'София, кв. Малинова долина, ул. Йордан Стратиев 1Г', category: 'beauty', website: irini, phone: '+359884847788',
    booking: { kind: 'form', url: irini },
    services: [
      service('IRINI Clean Skin Ritual · почистване на лице', 'beauty', 55, irini, 60),
      service('Масаж на лице Гуа Ша', 'beauty', 45, irini, 60),
      service('Оформяне на вежди', 'beauty', 8, irini, 15),
    ],
    openingHours: hours(irini, [...[1, 2, 3, 4, 5, 6].map(day => [day, '09:30', '19:30']), [7, '11:00', '17:00']]),
    verification: verification(irini, 'Резервирай · IRINI Clean Skin Ritual · Масаж Гуа Ша · Оформяне на вежди · промяна или отмяна поне 48 часа предварително'),
  },
  {
    ...base, id: 'sofia-lau-spa-karnigradska', name: 'Lau Spa Massage', neighborhood: null,
    address: 'София, ул. Карниградска 4', category: 'beauty', website: lau, phone: '+359884805500',
    booking: { kind: 'form', url: `${lau}book` },
    services: [
      service('Релаксиращ масаж без масла · 60 минути', 'beauty', 50, `${lau}book`, 60),
      service('Тайландски арома масаж · 60 минути', 'beauty', 55, `${lau}book`, 60),
      service('Масаж на лице · 30 минути', 'beauty', 35, `${lau}book`, 30),
    ],
    openingHours: hours(lau, [1, 2, 3, 4, 5, 6, 7].map(day => [day, '10:00', '20:30'])),
    verification: verification(lau, 'Book · Relaxing dry massage · Aroma Thai Massage · Face Massage · собствена страница за записвания на Lau Spa Massage'),
  },
)
reviews.push(
  {
    id: 'sofia-skalp-emiliyan-stanev', website: skalp, bookingEntry: skalp, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [skalp, `${skalp}book`],
    notes: 'Primary unique owner-operated Setmore merchant website fully read: exact KrastovaVadaEmiliyanStanev9, own phone/email, actual named Book service rows and unusual closed Monday/Thursday weekly schedule. Three ordinary hair fees40/40/25EUR30/30/30min retained, short-blowdry condition explicit. Other chemical/colour services not imported. Cancellation/refund policy read, no prepayment or slot selected. Separate /book extension has one unreadable line; no later flow completion/availability asserted. No Google reviews, ratings, photos, outcome claims or inferred coordinates imported.',
  },
  {
    id: 'sofia-evgenia-angelova-kozloduy', website: evgenia, bookingEntry: evgenia, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [evgenia, `${evgenia}book`],
    notes: 'Primary owner-operated unique Setmore merchant site fully read. Exact Kozloduy156, phone, full weekday schedule, named Book rows and manual-confirmation booking policy verified. Three ordinary cosmetic fees25/50/30EUR retained; no durations visible, none invented. Request is confirmed only after SMS/call, condition preserved in service descriptions; no automatic confirmation promise. Free first consultation is recommended not imported as standard procedure, promotional gifted peel, clinical/weight-loss/body outcome claims and packages excluded. Separate /bookcachemiss, no later scheduling step asserted. No submitted customer data, contacts or reservations.',
  },
  {
    id: 'sofia-irini-stratiev', website: irini, bookingEntry: irini, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [irini, 'https://irinidream.taplink.ws/'],
    notes: 'Read complete indexed primary unique owner-operated Setmore merchant menu, own exact MalinovaDolinaStratiev1G, phone/email, complete MonSat09:30-19:30Sunday11-17 hours and48h change policy. Three named ordinary single-visit services55EUR60mincleaning,45EUR60minguasha,8EUR15minbrow retained. Expired2025free-test promotion, six-session packages, installment amounts, needling/osteopathic/energy/medical-result claims excluded. Ownlinked Taplink has no readable lines; direct merchantroottimeout documented, all imported facts from fully indexed owner merchant page. No availability, completed reservation or copied review/photo claims. Nearby ArunaYoga has different business, phone and1Aaddress, not a duplicate1Gpremise.',
  },
  {
    id: 'sofia-lau-spa-karnigradska', website: lau, bookingEntry: `${lau}book`, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [lau, `${lau}book`, 'https://www.lauspa.bg/'],
    notes: 'Primary owner-operated unique Setmore merchant website and actual /book menu fully read, including exact Karnigradska4, phone/email, all seven10-20:30 days and named Book rows. Three ordinary single-session50/55/35EUR60/60/30min dry/aroma/face massages retained literally, not a calculation from BGN text in service titles. Clinical office-syndrome/health/energy claims, packages and payment actions excluded. Linked customwebsitecachemiss; primary merchant is independently complete. No date/time/customer/service selection, reservations, reviews, ratings or photographs imported.',
  },
)
const a3 = 'https://barbershop-a3.bg/'
for (const branch of [
  { id: 'sofia-a3-skobelev', name: 'Barbershop A3 · Скобелев', address: 'София, бул. Ген. Михаил Д. Скобелев 9', phone: '+359877531811' },
  { id: 'sofia-a3-maria-luiza', name: 'Barbershop A3 · Мария Луиза', address: 'София, бул. Княгиня Мария Луиза 28', phone: '+359879055401' },
]) {
  records.push({
    ...base, ...branch, neighborhood: null, category: 'barber', website: a3,
    booking: { kind: 'phone', phone: branch.phone },
    services: [
      service('Мъжко подстригване', 'barber', 30, `${a3}booking/`, 45, 'BGN'),
      service('Детско подстригване', 'barber', 20, `${a3}booking/`, 15, 'BGN'),
    ],
    verification: verification(`${a3}booking/`, `Запазете час: ${branch.phone}. ${branch.address}. Мъжко и детско подстригване.`),
  })
  reviews.push({
    id: branch.id, website: a3, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: [a3, `${a3}booking/`, `${a3}services-x/`, `${a3}saloni-barbershop-sofia-center/`],
    notes: `Own booking page fully read with actual step1of6 named service menu and separate exact venue/appointment phone for ${branch.address}. Retained existing explicit phone path, not a completed branch-selection flow. Only two invariant fees across both own tariff groups imported: male30BGN45min, child20BGN15min; literal BGN retained, not a calculated EUR conversion. Beard15versus20BGN conflicts across own groups, excluded. Saturday10-14 mainbody conflicts with10-19 branchfooter, so all hours omitted; no coordinates guessed. Separate salons page challenge noted, but exact address/phone published independently on root and actual booking page. No service/date/customer selected, reservation made, reviews/ratings/photos copied.`,
  })
}
const leonessa = 'https://leonessa.bg/'
const leonessaMenu = `${leonessa}uslugi/lice/`
const leonessaBooking = 'https://fashionpoint.bg/leonessa-aesthetics/bg/booking/75'
records.push({
  ...base, id: 'sofia-leonessa-despot-slav', name: 'Leonessa', neighborhood: 'Бъкстон',
  address: 'София, ж.к. Бъкстон, ул. Деспот Слав 23', category: 'beauty', website: leonessa, phone: '+359894413209',
  booking: { kind: 'form', url: leonessaBooking },
  services: [
    { ...service('Почистване и оформяне на вежди', 'beauty', 11, leonessaMenu, 25), description: 'За онлайн записване е необходима регистрация във FashionPoint.' },
    { ...service('Масаж на лице и подхранваща терапия', 'beauty', 40, leonessaMenu, 40), description: 'За онлайн записване е необходима регистрация във FashionPoint.' },
    { ...service('Хидратираща терапия Rejuvi', 'beauty', 51, leonessaMenu, 60), description: 'За онлайн записване е необходима регистрация във FashionPoint.' },
  ],
  openingHours: hours(`${leonessa}contacts/`, [1, 2, 3, 4, 5, 6, 7].map(day => [day, '09:00', '19:00'])),
  verification: verification(leonessaMenu, 'Запази час · Почистване и оформяне на вежди · Масаж на лице и подхранваща терапия · Rejuvi хидратираща терапия', `${leonessa}contacts/`),
})
reviews.push({
  id: 'sofia-leonessa-despot-slav', website: leonessa, bookingEntry: leonessaBooking, bookingReview: 'provider_booking_reviewed', checkedOn,
  reviewedUrls: [leonessa, `${leonessa}contacts/`, leonessaMenu, `${leonessa}privacy-policy/`, 'https://fashionpoint.bg/bg/embed-clinic-calendar/75', leonessaBooking, 'https://fashionpoint.bg/bg/embed-clinic-calendar/75?service_id=5834', 'https://fashionpoint.bg/bg/embed-clinic-calendar/75?service_id=4857'],
  notes: 'Own root identifies an ordinary cosmetic/beauty studio, not a human medical centre; no named doctor or separate team/about page exposed in reviewed primary navigation. Generic Guinot text saying the brand trains cosmeticians and doctors is not a staff credential, and provider embed-clinic path is not medical-scope evidence. Root independently followed real Book redirect to current FashionPoint merchant and selected FACE category: exact brow11EUR25min, face massage+nourish40EUR40min, Rejuvi hydration51EUR60min agree own separate tariff. Only these three ordinary cosmetic services retained; needle/medical protocols, free consultations and clinical outcome claims excluded. Online registration requirement preserved; no login/service/date/customer chosen or reservation submitted. Static provider text contains an unavailable-account template, but actual browser service menu rendered; no slot/current availability assertion. Exact own DespotSlav23Bukston/phone and daily09-19 contacts verified. Privacy URL cachemiss, no terms/licence claim. No reviews/photos/coordinates imported.',
})
const iberis = 'https://www.iberisbeauty.com/'
const iberisBooking = 'https://studio24.bg/9844?m='
records.push({
  ...base, id: 'sofia-iberis-yordan-trifonov', name: 'Iberis Beauty Center', neighborhood: 'Студентски комплекс',
  address: 'София, Студентски комплекс, ул. Академик Йордан Трифонов 4', category: 'beauty', website: iberis, phone: '+359889429818',
  booking: { kind: 'form', url: iberisBooking },
  services: [
    service('Комбинирано почистване на лице с ултразвукова шпатула', 'beauty', 40, iberisBooking, 100),
    service('Водно дермабразио и маска', 'beauty', 25, iberisBooking, 50),
  ],
  openingHours: hours(iberisBooking, [...[1, 2, 3, 4, 5, 6].map(day => [day, '10:00', '19:00']), [7]]),
  verification: verification(iberis, 'Запази си час чрез профила ни в платформата Studio24. Обадете се сега, за да получите повече информация и да запазите своя час!'),
})
reviews.push({
  id: 'sofia-iberis-yordan-trifonov', website: iberis, bookingEntry: iberisBooking, bookingReview: 'provider_booking_reviewed', checkedOn,
  reviewedUrls: [iberis, `${iberis}services/`, iberisBooking, 'https://studio24.bg/m/iberis-beauty-center-s9844?m%3Fm&m'],
  notes: 'Own full primary root/services pages identify an ordinary cosmetic studio and publish exact AkademikYordanTrifonov4StudentskiKompleks/0889429818 plus explicit own Studio24 Book invitation and phone booking fallback. Root independently read actual owner-linked Studio24 merchant after redirect, selected facial cleaning group with seven rows: only nonpromotional combined ultrasound cleaning40EUR100min and waterdermabrasion+mask25EUR50min retained. Actual provider address agrees own exact premise. The mask variant is not relabelled as the different owner LED combination. Diamondfrom23EUR50-90min options and all promotion/package/clinical/needle/laser/body claims excluded, no flattened duration or calculated fee. Full merchant MonSat10-19Sundayclosed schedule read; no conflicting owner hours published. Direct web provider fetch inaccessible, real browser menu read independently by root, not an unpublished tariff claim. No FDA/safety/results assertions, credentials, reviews/photos/coordinates, service/date/customer selection, login or reservation imported.',
})
export default { records, reviews }
