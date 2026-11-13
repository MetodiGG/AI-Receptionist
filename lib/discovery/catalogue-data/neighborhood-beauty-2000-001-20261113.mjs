// Manually reviewed beauty intake only. No identities, photos or shared imports.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const base = { cityCode: '68134', neighborhood: null, locationKind: 'premises', coordinates: null }
const service = (name, category, amount, sourceUrl, minutes, description) => ({ name, category, appointmentModel: 'appointment', price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn, validUntil }, ...(minutes ? { durationMin: minutes, durationSourceUrl: sourceUrl, durationCheckedOn: checkedOn } : {}), ...(description ? { description } : {}) })
const hours = (sourceUrl, entries) => ({ sourceUrl, checkedOn, days: entries.map(([weekday, open, close]) => ({ weekday, periods: open ? [{ open, close }] : [] })) })
const verification = (url, excerpt, contact = url) => ({ status: 'approved', checkedOn, validUntil, booking: { url, excerpt }, contact })
const artista = 'https://artistastudio.setmore.com/'
const newlook = 'https://book.heygoldie.com/Newlook-Barbershop'
const sii = 'https://www.notino.bg/saloni/sii-bello/'
const innova = 'https://www.notino.bg/saloni/innova-beauty/'
const security = 'https://www.nailssecurity.com/'
const securityPrices = `${security}pricing`
const securityBook = 'https://n833990.alteg.io/company/778774/personal/menu?o='
const angels = 'https://www.notino.bg/saloni/the-secrets-of-the-angels/'
const sibova = 'https://sibova-nails-studio.easyweek.io/'
const sibovaBook = 'https://booking.easyweek.io/sibova-nails'
const hub = 'https://beautyhub35.com/'
const hubBook = 'https://studio24.bg/studios/iframe/WTanUNyNCmZsMSDj'
const studioM = 'https://studiompremium.com/'
const beautySi = 'https://www.notino.bg/saloni/beauty-studio-si/'
const nailBar = 'https://www.notino.bg/saloni/nail-bar_2/'
const atelieto = 'https://www.notino.bg/saloni/atelieto/'
const hairClub = 'https://www.notino.bg/saloni/hair-beauty-club-and-laser/'
const hn = 'https://www.notino.bg/saloni/hn-studio/'
const cave = 'https://berbernitza.setmore.com/'
const gs = 'https://www.notino.bg/saloni/gs-studio-and-academy/'
const catzilla = 'https://www.notino.bg/saloni/catzilla/'
const mb = 'https://www.notino.bg/saloni/mb-beauty/'
const anigma = 'https://www.notino.bg/saloni/anigma-beauty/'
const feeling = 'https://www.notino.bg/saloni/hair-feeling-salon/'
const records = [
  {
    ...base, id: 'sofia-artista-visarion-belinski', name: 'Artista Barber & Beauty Studio', address: 'София, ул. Висарион Белински 8', category: 'barber', website: artista, phone: '+359877744323',
    booking: { kind: 'form', url: `${artista}book` },
    services: [
      service('Мъжко подстригване — Barber', 'barber', 10, `${artista}book`, 45, 'Тарифа Barber, не Top Barber.'),
      service('Коса и брада — Barber', 'barber', 15, `${artista}book`, 60, 'Тарифа Barber, не Top Barber.'),
      service('Оформяне на брада — Barber', 'barber', 8, `${artista}book`, 30, 'Тарифа Barber, не Top Barber.'),
    ],
    openingHours: hours(artista, [[1], ...[2, 3, 4, 5, 6].map(day => [day, '10:00', '20:00']), [7]]),
    verification: verification(artista, 'Резервирай · собствена страница Artista Barber & Beauty Studio; Висарион Белински 8, София; +359877744323.'),
  },
  {
    ...base, id: 'sofia-newlook-parchevich22a', name: 'Newlook Barbershop', address: 'София, ул. Петър Парчевич 22А', category: 'barber', website: newlook, phone: null,
    booking: { kind: 'form', url: `${newlook}/checkout` },
    services: [
      service('Fade, buzz cut или taper fade', 'barber', 20, `${newlook}/checkout`, 30),
      service('Подстригване и оформяне на брада', 'barber', 28, `${newlook}/checkout`, 30),
      service('Оформяне на брада', 'barber', 15, `${newlook}/checkout`, 15),
    ],
    openingHours: hours(newlook, [...[1, 2, 3, 4, 5, 6].map(day => [day, '10:00', '20:00']), [7, '11:00', '18:00']]),
    verification: verification(newlook, 'Book now · собствена Newlook Barbershop страница за записване; Петър Парчевич 22А, София; услуги в Select services.'),
  },
  {
    ...base, id: 'sofia-sii-bello-tsar-ivan', name: 'Sii Bello', address: 'София, ул. Цар Иван Александър 145В', category: 'hair', website: sii, phone: '+359889477470',
    booking: { kind: 'phone', phone: '+359889477470' },
    services: [
      service('Сешоар', 'hair', 10.23, sii, 60),
      service('Мъжко подстригване', 'barber', 10.23, sii, 30),
      service('Оформяне на брада', 'barber', 5.11, sii, 15),
    ],
    verification: verification(sii, 'Резервация по телефон — онлайн записването за фризьорство и бръснарски услуги не е възможно; обадете се за час. +359889477470.'),
  },
  {
    ...base, id: 'sofia-innova-beauty-morava', name: 'INNOVA Beauty', address: 'София, ул. Българска морава 12', category: 'nails', website: innova, phone: '+359876334979',
    booking: { kind: 'phone', phone: '+359876334979' },
    services: [
      service('Маникюр с гел лак', 'nails', 25, innova, 60),
      service('Педикюр без накисване', 'nails', 25, innova, 90),
      service('Spa педикюр', 'nails', 35, innova, 90),
    ],
    verification: verification(innova, 'Маникюр и педикюр — резервация по телефон; онлайн записването за тези услуги не е възможно. +359876334979.'),
  },
  {
    ...base, id: 'sofia-nails-security-darwin', name: 'Nails Security', neighborhood: 'Изток', address: 'София, кв. Изток, ул. Чарлз Дарвин 14Б', category: 'nails', website: security, phone: '+359877333461',
    booking: { kind: 'form', url: securityBook },
    services: [
      service('Маникюр с гел лак — Top master', 'nails', 35, securityBook, 120, 'Тарифа Top master; включва укрепване и поправка на два нокътя.'),
      service('Маникюр с гел лак — Pro master', 'nails', 40, securityBook, 90, 'Тарифа Pro master; включва укрепване и поправка на два нокътя.'),
      service('Японски маникюр без покритие — Top или Pro master', 'nails', 30, securityBook, 60, 'Тарифа Top или Pro master; маникюр без покритие и японска терапия.'),
    ],
    verification: verification(`${security}terms`, 'Записване онлайн през собствената система, по телефон или Instagram; Чарлз Дарвин14Б, Изток, София;+359877333461.'),
  },
  {
    ...base, id: 'sofia-secrets-angels-hadzhikonstanginov', name: 'The Secrets of the Angels', address: 'София, ул. Йордан Хаджиконстангинов 88', category: 'nails', website: angels, phone: '+359888768687',
    booking: { kind: 'phone', phone: '+359888768687' },
    services: [
      service('Маникюр с гел лак', 'nails', 15.34, angels, 150),
      service('Сух педикюр без лакиране', 'nails', 10.23, angels, 30),
      service('Мокър педикюр без лакиране', 'nails', 12.78, angels, 30),
    ],
    verification: verification(angels, 'Маникюр и педикюр — резервация по телефон; обадете се на салона, за да запазите час. +359888768687.'),
  },
  {
    ...base, id: 'sofia-sibova-nails-cherni-vrah75', name: 'Sibova Nails Studio', address: 'София, бул. Черни връх 75', category: 'nails', website: sibova, phone: '+359895083390',
    booking: { kind: 'form', url: sibovaBook },
    services: [service('Маникюр с гел лак', 'nails', 46, sibovaBook, 90), service('Класически маникюр без покритие', 'nails', 30, sibovaBook, 60), service('Японски маникюр', 'nails', 36, sibovaBook, 60)],
    openingHours: hours(sibova, [1, 2, 3, 4, 5, 6, 7].map(day => [day, '09:00', '20:00'])),
    verification: verification(sibova, 'Book now, reserve, and schedule an appointment with Sibova Nails Studio; Черни връх75, София;+359895083390.'),
  },
  {
    ...base, id: 'sofia-beauty-hub35-poligona', name: 'Beauty Hub 35', neighborhood: 'Полигона', address: 'София, кв. Полигона, бл. 35', category: 'hair', website: hub, phone: '+359898942474',
    booking: { kind: 'form', url: hubBook },
    services: [
      service('Дамско подстригване и стайлинг със сешоар — къса коса', 'hair', 25, `${hub}uslugi`, null, 'Тарифа за къса коса. Публикуваните продължителности се разминават; уточнете при записване.'),
      service('Дамско подстригване и стайлинг със сешоар — средна или дълга коса', 'hair', 35, `${hub}uslugi`, 60),
      service('Мъжко подстригване', 'barber', 20, `${hub}uslugi`, 30),
    ],
    verification: verification(`${hub}rezervaciya`, 'Запазете час · собствена страница и календар Beauty Hub35; гр.София, кв.Полигона, бл.35;+359898942474.', hub),
  },
  {
    ...base, id: 'sofia-studio-m-haytov1', name: 'Studio M · Изток', neighborhood: 'Изток', address: 'София, кв. Изток, ул. Николай Хайтов 1', category: 'nails', website: studioM, phone: '+359885145949',
    booking: { kind: 'phone', phone: '+359885145949' },
    services: [
      { ...service('Маникюр с гел лак', 'nails', 48, `${studioM}services/`), price: { amount: 48, currency: 'BGN', kind: 'fixed', sourceUrl: `${studioM}services/`, checkedOn, validUntil } },
      { ...service('Маникюр с обикновен лак', 'nails', 38, `${studioM}services/`), price: { amount: 38, currency: 'BGN', kind: 'fixed', sourceUrl: `${studioM}services/`, checkedOn, validUntil } },
      { ...service('Мъжки маникюр', 'nails', 30, `${studioM}services/`), price: { amount: 30, currency: 'BGN', kind: 'fixed', sourceUrl: `${studioM}services/`, checkedOn, validUntil } },
    ],
    verification: verification(studioM, 'Запази си час — actual owner CTA tel:+359885145949; ул.Николай Хайтов1, Изток, София.', `${studioM}contact/`),
  },
  {
    ...base, id: 'sofia-beauty-studio-si-belchev50', name: 'Beauty Studio Si · Христо Белчев', address: 'София, ул. Христо Белчев 50', category: 'hair', website: beautySi, phone: '+359889201940',
    booking: { kind: 'phone', phone: '+359889201940' },
    services: [service('Подстригване и стайлинг със сешоар', 'hair', 25.56, beautySi, 75)],
    verification: verification(beautySi, 'Дамско фризьорство — резервация по телефон; онлайн записването за тази категория не е възможно. +359889201940.'),
  },
  {
    ...base, id: 'sofia-nail-bar-slaveykov1a', name: 'NAIL BAR · Славейков', address: 'София, пл. Петко Р. Славейков 1А', category: 'nails', website: nailBar, phone: '+359876616816',
    booking: { kind: 'phone', phone: '+359876616816' },
    services: [service('Мъжки маникюр', 'nails', 13.80, nailBar, 45), { ...service('Маникюр с гел лак', 'nails', 42.95, nailBar, 120), price: { amount: 42.95, maximum: 48.06, currency: 'EUR', kind: 'range', sourceUrl: nailBar, checkedOn, validUntil } }],
    verification: verification(nailBar, 'Маникюр и педикюр — резервация по телефон; обадете се за час, онлайн записването е недостъпно. +359876616816.'),
  },
  {
    ...base, id: 'sofia-atelieto-tri-ushi6a', name: 'ATELIE’to', address: 'София, ул. Три уши 6А', category: 'beauty', website: atelieto, phone: '+359876949362',
    booking: { kind: 'phone', phone: '+359876949362' },
    services: [service('Вечерен грим', 'beauty', 27.61, atelieto, 90), service('Ежедневен грим', 'beauty', 21.47, atelieto, 75)],
    verification: verification(atelieto, 'Козметични услуги — резервация по телефон; онлайн записването за тази категория не е възможно. +359876949362.'),
  },
  {
    ...base, id: 'sofia-hair-beauty-club-mladost378', name: 'Hair Beauty Club & Laser', neighborhood: 'Младост 3', address: 'София, ж.к. Младост 3, бл. 378', category: 'hair', website: hairClub, phone: '+359885808970',
    booking: { kind: 'phone', phone: '+359885808970' },
    services: [service('Боядисване на корени със сешоар', 'hair', 40.90, hairClub, 90), service('Полуперманентно боядисване със сешоар', 'hair', 38.35, hairClub, 60), service('Мъжко подстригване с измиване', 'barber', 9.20, hairClub, 20)],
    verification: verification(hairClub, 'Дамско и мъжко фризьорство — резервация по телефон; обадете се на салона за час. +359885808970.'),
  },
  {
    ...base, id: 'sofia-hn-studio-balgarska-legiya2b', name: 'HN Studio', address: 'София, ул. Българска легия 2Б', category: 'nails', website: hn, phone: '+359877077096',
    booking: { kind: 'phone', phone: '+359877077096' },
    services: [service('Апаратен маникюр с гел лак', 'nails', 27.09, hn, 90), service('Маникюр с обикновен лак', 'nails', 15.34, hn, 60), service('Мъжки маникюр', 'nails', 15.33, hn, 45)],
    verification: verification(hn, 'Маникюр и педикюр — резервация по телефон; онлайн записването не е възможно. +359877077096.'),
  },
  {
    ...base, id: 'sofia-mens-cave-kipriyan44', name: 'Men’s Cave · Берберница', address: 'София, ул. Св. Киприян 44', category: 'barber', website: cave, phone: '+359895559077',
    booking: { kind: 'form', url: `${cave}book` },
    services: [service('Мъжко подстригване — Цецо', 'barber', 26, `${cave}book`, 45), service('Оформяне на брада — Цецо', 'barber', 17, `${cave}book`, 30), service('Подстригване и оформяне на брада — Цецо', 'barber', 40, `${cave}book`, 75)],
    openingHours: hours(cave, [...[1, 2, 3, 4, 5].map(day => [day, '09:00', '19:00']), [6, '10:00', '18:00'], [7]]),
    verification: verification(cave, 'Резервирай · Men’s Cave Берберница; Св.Киприян44, София;+359895559077; собствено меню за записване.'),
  },
  {
    ...base, id: 'sofia-gs-studio-gotse-delchev116', name: 'GS Studio & Academy', address: 'София, бул. Гоце Делчев 116', category: 'hair', website: gs, phone: '+359877900100',
    booking: { kind: 'phone', phone: '+359877900100' },
    services: [{ ...service('Дамско подстригване', 'hair', 15.34, gs, 60), price: { amount: 15.34, maximum: 20.45, currency: 'EUR', kind: 'range', sourceUrl: gs, checkedOn, validUntil } }, service('Комбинирано почистване на лице', 'beauty', 35.79, gs, 60, 'Ръчно и апаратно козметично почистване.'), service('Оформяне на вежди', 'beauty', 5.11, gs, 10)],
    verification: verification(gs, 'Фризьорство и козметични услуги — резервация по телефон, обадете се на салона за час. +359877900100.'),
  },
  {
    ...base, id: 'sofia-catzilla-gotse-delchev100', name: 'CatZilla · масажно студио', address: 'София, бул. Гоце Делчев 100, бл. 22, до вх. Д, партер от задната страна', category: 'beauty', website: catzilla, phone: '+359888010087',
    booking: { kind: 'phone', phone: '+359888010087' },
    services: [service('Релаксиращ масаж на лице и глава', 'beauty', 23.01, catzilla, 30), { ...service('Релаксиращ масаж на цяло тяло', 'beauty', 28.12, catzilla, null, 'Публикувана продължителност 50–70 минути; точният вариант се уточнява при записване.'), price: { amount: 28.12, maximum: 38.35, currency: 'EUR', kind: 'range', sourceUrl: catzilla, checkedOn, validUntil } }],
    verification: verification(catzilla, 'Релаксиращи масажи — резервация по телефон; обадете се на салона за час. +359888010087.'),
  },
  {
    ...base, id: 'sofia-mb-beauty-mladost482', name: 'MB Beauty', neighborhood: 'Младост 4', address: 'София, ж.к. Младост 4, бл. 482', category: 'nails', website: mb, phone: '+359879883231',
    booking: { kind: 'phone', phone: '+359879883231' },
    services: [service('Маникюр с гел лак', 'nails', 16.36, mb, 90, 'Включва сваляне на стар лак или гел лак, оформяне и почистване на кутикулите.'), service('Маникюр с обикновен лак', 'nails', 12.78, mb, 60), service('Мъжки маникюр', 'nails', 10.23, mb, 40)],
    verification: verification(mb, 'Маникюр и педикюр — резервация по телефон; онлайн записването не е възможно. +359879883231.'),
  },
  {
    ...base, id: 'sofia-anigma-atanas-hranov131v', name: 'ANIGMA Beauty', address: 'София, ул. Атанас Хранов 131В', category: 'beauty', website: anigma, phone: '+359876197909',
    booking: { kind: 'phone', phone: '+359876197909' },
    services: [service('Оформяне на вежди с конец', 'beauty', 13, anigma, 30), service('Ламиниране и боядисване на вежди', 'beauty', 42, anigma, 75), service('Ламиниране и боядисване на мигли', 'beauty', 35.79, anigma, 75)],
    verification: verification(anigma, 'Козметични услуги — резервация по телефон; обадете се на салона за час. +359876197909.'),
  },
  {
    ...base, id: 'sofia-hair-feeling-megapark', name: 'Hair Feeling Salon', address: 'София, бул. Цариградско шосе 115Г, сграда Мегапарк, ниво 0', category: 'hair', website: feeling, phone: '+359877442868',
    booking: { kind: 'phone', phone: '+359877442868' },
    services: [service('Дамско подстригване с измиване и сешоар', 'hair', 28.12, feeling, 60), service('Мъжко подстригване с измиване и стайлинг', 'barber', 15.34, feeling, 30), service('Оформяне на коса с маша', 'hair', 28.12, feeling, 60)],
    verification: verification(feeling, 'Дамско и мъжко фризьорство — резервация по телефон; обадете се за час. +359877442868.'),
  },
]
const reviews = [
  {
    id: records[0].id, website: artista, checkedOn, bookingEntry: `${artista}book`, bookingReview: 'owned_booking_reviewed', reviewedUrls: [artista, `${artista}book`],
    notes: 'Manually followed the actual Book link to the full public service-selection menu, then reviewed complete merchant services, own contact/address, weekly hours and booking-policy entry. Owner-operated unique branded calendar, not a generic directory export. Barber tier10EUR45min/15EUR60min/8EUR30min is consistent in both root and actual booking menu. Top Barber rows contain conflicting main/description amounts16vs15.34,21vs20.45,11vs10.23EUR and are deliberately excluded, not called unpublished. Exact Sofia street/house and published phone verified; closed Monday/Sunday and Tue-Sat10-20 are literal. No guessed quarter/coordinates. Domain/phone/premises checked against1238raw catalogue and all available2000 intake modules. No review/photo text copied, service/date/customer entry, call or reservation.',
  },
  {
    id: records[1].id, website: newlook, checkedOn, bookingEntry: `${newlook}/checkout`, bookingReview: 'owned_booking_reviewed', reviewedUrls: [newlook, `${newlook}/checkout`, 'https://www.notino.bg/saloni/new-look-barber-shop/'],
    notes: 'Owner-operated unique Goldie merchant website and actual Book checkout both read fully through ordinary public HTTP200, no API or submission. Current root and current actual checkout agree20/28/15EUR with30/30/15min. Web-reader checkout cache is over one year old with35/50/25BGN, so the live owner HTML was explicitly re-read; cached and older Notino10.23-12.78/7.67EUR variants are not imported or presented as current owner fees. Exact Parchevich22A/Sofia and full weekly schedule are on the live owner root. No readable own telephone exposed; left null rather than borrowing an older third-party contact. No generic provider footer hours, efficacy claims, ratings, reviews or photos copied. Exact domain/premises/name dedupe against1238raw and all available2000 intake modules. No Book service/date/person selected or reservation submitted.',
  },
  {
    id: records[2].id, website: sii, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [sii],
    notes: 'Manually reviewed the named salon merchant storefront, not a directory summary: actual hair and barber sections explicitly disable online reservations and instruct phone appointment booking. Then read exact service menu, salon About, salon contact/address and lower footer. Three ordinary literalEUR rows10.23/10.23/5.11 with60/30/15min only. Fade variants have30-40min and are not flattened. Two published contacts belong to this one venue; first number retained, no staff clone. No independent own domain discovered. Business-specific complete weekly hours are not rendered; live-open snippets and Notino retail Mon-Fri09-17 footer are NOT salon hours. Linked pricePDF button exposes no URL to web reader; direct HTTP403 respected without further requests/API or an unpublished claim. Published selected service-menu prices remain the explicit source; no claim of complete PDF review. Exact domain/phone/premises deduped1238+2000 intakes. No prose, reviews, ratings, photos, maps or booking copied/submitted.',
  },
  {
    id: records[3].id, website: innova, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [innova],
    notes: 'Actual named merchant manicure/pedicure section explicitly has phone-only booking and unavailable online reservation notice; this is the chosen route for these nail services, not a claim that every other salon category has no online booking. Read service menu, salon contact/address/About and footer; exact25/25/35EUR with60/90/90min. Range30-35EUR strengthening/French and unrelated online hair/laser/clinical procedures excluded. No independent owner domain discovered. Exact Sofia BulgarskaMorava12 and merchant phone0876334979 confirmed and checked1238+all2000 intake records. No weekly hours published in readable business block, no live-status or retail support-hour inference. Direct public HTTP403 respected; web reader supplies named public merchant menu, no API/retry/bulkexport. No unpriced receipt or complete freshness guarantee. No ratings, reviews, photos, marketing prose or booking actions.',
  },
  {
    id: records[4].id, website: security, checkedOn, bookingEntry: securityBook, bookingReview: 'provider_booking_reviewed', reviewedUrls: [security, securityBook, securityPrices, `${security}terms`],
    notes: 'Root independently clicked actual owner Book Now into Alteg merchant778774, then Select services after declining optional cookies; rendered exact current nail service tiers and durations, no customer/date/service submission. Independently read full indexed own Services&Pricing and terms after booking: gel Top35EUR/Pro40EUR, Japanese Top/Pro30EUR match actual menu. Duration120/90/60min comes only from actual menu. Junior tiers and retail press-on products excluded. Exact CharlesDarwin14B/Iz tok/Sofia and0877333461 corroborated on own pricing/terms. Flexible10-20 has no weekdays; no weekly hours inferred. Terms: confirmations required; up-to2h cancellation window, none presented as general availability. Copyright notice respected: only minimal factual translated service labels, literal prices, contact and durations retained; no expressive prose, images, designs, guarantees, ratings or reviews reused. Domain/phone/premises deduped1238+all2000 intakes. No coordinate or booking.',
  },
  {
    id: records[5].id, website: angels, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [angels],
    notes: 'Reviewed actual named merchant phone-only reservation notice first, then full ordinary nail menu, salon About/contact and lower footer. Literal15.34EUR150min gel manicure,10.23EUR30min dry pedicure without polish,12.78EUR30min wet pedicure without polish. Other foot/gel variants, add-ons, wide extension ranges and marketing/clinical claims not imported. Own named merchant phone0888768687 and street/number88 confirmed; road spelling Хаджиконстангинов retained literally from merchant rather than silently correcting or geocoding. A different existing photographer at similarly spelled street88 is not this salon: distinct name/phone/website; no staff clone. No full weeklyhours rendered and no provider retail-support Mon-Fri09-17 or transient closure banner used as business hours. PricePDF button has no readable public URL, no complete PDF review claim or unpublished receipt. No rating/review/photo/prose copying, call or booking.',
  },
  {
    id: records[6].id, website: sibova, checkedOn, bookingEntry: sibovaBook, bookingReview: 'owned_booking_reviewed', reviewedUrls: [sibova, sibovaBook],
    notes: 'Reviewed owner-operated branded EasyWeek merchant website, then followed actual BookNow to merchant sibova-nails. Root independently rendered the actual JS service menu and exact CherniVrah75: gelmanicure46EUR90min, classicuncoated30EUR60min, Japanese36EUR60min. Named public menu, not directory summary or provider bulkdata. Root only viewed service menu/disabled Next; no customer, date or reservation. Full owner root/contact/FAQ and all seven09-20 weekday hours read independently; phone0895083390 matches. Staff are one salon, not separate businesses. No independent own domain discovered. No result/sterilization/medical claims, merchant ratings/reviews/photos or expressive prose retained. Full domain/phone/address dedupe1238+all2000intakes. Coordinates and quarter absent, not inferred.',
  },
  {
    id: records[7].id, website: hub, checkedOn, bookingEntry: hubBook, bookingReview: 'provider_booking_reviewed', reviewedUrls: [hub, `${hub}rezervaciya`, hubBook, `${hub}uslugi`, `${hub}kontakti`, 'https://studio24.bg/beauty-hub-35-s8108/v139'],
    notes: 'Followed actual owner Book route through own reservation page into linked Studio24 iframe; root independently rendered real merchant hair menu after webreader403. Current25EURshort/35EURmediumlong women haircut+blowdry and20EURmen agree full owner service tariff. Short women duration conflicts: owner60min vs actual30min, so omitted and conflict disclosed; mediumlong60min andmen30min agree. Other length/extension fees not flattened. Exact SofiaPoligona block35 and own0898942474 confirmed. Own current TueSat10:30-20/MonSunclosed conflicts with indexed Studio24 merchant8108 Mon10-19/TueSat10:30-20/Sun10:30-19; all weekly hours withheld, not reconciled by guess. Contactwebreader cachemiss disclosed; exact contact repeats own root/booking footer. No online slot/customer/service/date selected or booking submitted. No quarter clone, map coordinate, review or photo copying. Dedupe1238+all2000intakes.',
  },
  {
    id: records[8].id, website: studioM, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [studioM, `${studioM}services/`, `${studioM}contact/`, 'https://www.notino.bg/saloni/studio-m_8/'],
    notes: 'Actual owner Book CTA resolved in live public HTML200 to tel:+359885145949, not an unreviewed calendar. Then complete own Services&Prices table and Contact read; exact Haytov1/Iz tok/Sofia and telephone match named merchant storefront. Prior root-only research lacked contact page; now owner exact address independently found and reviewed. Literal48/38/30BGN ordinary nail prices retained, no EUR conversion or provider-duration borrowing. No published own weeklyhours or naildurations, omitted. Hair tariffs have density-dependent caveat and are not imported; retail products, clinical-looking treatments and marketing claims excluded. No Booked-plugin script treated as a separate active calendar, no forms/calls. Dedupe1238/all2000+publicnativepartnerphones, no match. No reviews, photos, maps or expressive prose copied.',
  },
  {
    id: records[9].id, website: beautySi, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [beautySi],
    notes: 'Actual named merchant women-hair category explicitly publishes phone-only booking and online-unavailable notice; reviewed complete relevant service menu plus salon About, exact HristoBelchev50 contact and footer. One explicitly titled haircut+blowdry25.56EUR75min retained; ambiguous generic haircut/template description and other category calendars are not mixed. No independent own domain found. The similarly named Studio24 Si nail specialist at another venue is not assumed a branch, address move or this business, and supplies no fields. No full weeklyhours rendered; no provider-retail09-17 support or transient open-status inference. DedupeownmerchantURL/phone/address1238+all2000intakes/nativepublicbusinessphones; no match. No marketing prose, reviews, photos, map facts or booking action.',
  },
  {
    id: records[10].id, website: nailBar, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [nailBar],
    notes: 'Actual named merchant nail category publishes phone appointment path and unavailable online booking. Read full nail menu and salon contact/About/footer. Selected literal male manicure13.80EUR45min and gelmanicure published range42.95-48.06EUR120min; not a starting fixed amount or length guess. Ordinary-polish40-50min range not flattened. Exact Slaveykov1A/Sofia and0876616816 merchant phone confirmed; salon is one business, not each team member. No independent own domain or complete weeklyhours rendered. Linked PDF button does not expose URL; no complete PDF or unpublished-tariff claim. Generic provider retail support/footer hours, ratings, reviews, photos, marketing prose excluded. Dedupe1238+all2000intakes/nativephoneinventory, no match. No calls or booking.',
  },
  {
    id: records[11].id, website: atelieto, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [atelieto],
    notes: 'Actual named merchant cosmetic/makeup section explicitly gives phone appointment booking and unavailable online reservation notice. Read full selected makeup menu, About/contact and footer; literal27.61EUR90min evening and21.47EUR75min day makeup. Nail services use another online route and are not imported or assumed reviewed. Exact TriUshi6A/Sofia and0876949362 confirmed. No independent own domain found. No complete weeklyhours rendered; transient opening snippet and provider retail09-17 support are not salon hours. Webreader cache is two months old, within review window, no claim of live slot availability or complete PDF review. Dedupe1238+all available2000 intake records and native public phones. No medical claims, copied marketing prose, reviews, ratings, photos, maps, calls or booking.',
  },
  {
    id: records[12].id, website: hairClub, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [hairClub],
    notes: 'Actual named merchant women and men hair sections explicitly offer phone booking with online-unavailable notices. Then reviewed full relevant hair menu, salon About, exact Mladost3 block378 contact and footer. Ordinary rootscolor+blow40.90EUR90min, semipermanentcolor+blow38.35EUR60min, men haircut+wash9.20EUR20min only; fullcolor and blowdry ranges not flattened. Published About describes beauty salon; no medical/laser procedures imported. Own phone0885808970 verified. Do not borrow an entrance number from a separate directory. No complete weeklyhours rendered, no transient open-status or provider retail-hour inference. Exactmerchant/phone/premises dedupe1238+all2000intakes/native public phones. No staff clones, coordinates, expressive prose, ratings, reviews, photos, call or booking.',
  },
  {
    id: records[13].id, website: hn, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [hn],
    notes: 'Read actual named merchant phone-only nail appointment notice, then full selected nail menu, About/contact and business footer. Literal machine manicure with oldgel removal/newgel27.09EUR90min, normalpolish15.34EUR60min andmen15.33EUR45min; male amount not rounded up to the different normalpolish amount. Exact BulgarskaLegiya2B/Sofia and0877077096 confirmed. Published team represents one salon, not separate businesses. No independent own domain found. No full weeklyhours shown; provider support-line closure banner and retail09-17 hours are not salon facts. Source indexed two weeks ago, no live availability claim. Dedupe1238+all available2000intakes/native public phones. No clinical claims, marketing prose, reviews, ratings, photos, map coordinates, calls or booking actions.',
  },
  {
    id: records[14].id, website: cave, checkedOn, bookingEntry: `${cave}book`, bookingReview: 'owned_booking_reviewed', reviewedUrls: [cave, `${cave}book`],
    notes: 'Followed actual Book link first; webreader book cache empty, so actual public book HTML read directly HTTP200, visible full service-selection menu matches current merchant root. No API, form, service/date/customer selection or booking. Three literal Ceco staff-tier rows26EUR45min haircut,17EUR30min beard,40EUR75min combo only; cheaper Kiril/Kristiana fees not blended or cloned as businesses. Exact owner SvKipriyan44/Sofia and0895559077; complete own MonFri09-19/Sat10-18/Sunclosed schedule. No independent own domain; merchant identifies itself as own website. Existing GPoint laser business at same street44 has different identity/domain/scope, not this branded three-barber venue; no GPoint fields or unverified building/entrance borrowed. Domain/phone/name/premises checked1238+all2000 intake/native snapshot. No merchant prose, reviews, photos, maps or coordinates retained.',
  },
  {
    id: records[15].id, website: gs, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [gs],
    notes: 'Read actual named merchant hair and cosmetic phone-only appointment notices first, then full service menu, About/contact and lower footer. Exact women haircut published range15.34-20.45EUR60min retained as range; ordinary combined manual/apparatus facialclean35.79EUR60min andbrowshape5.11EUR10min. Hairlength variable time ranges not flattened; no clinical/acne efficacy claims or courses imported. Exact GotseDelchev116/Sofia and0877900100 verified; landmark HYPO/KRIT building corroborates exact venue but quarter not inferred from boulevard name. No independent own domain found. No complete weeklyhours visible, no temporary-open or provider-support09-17 inference. Dedupe1238+all2000intakes/native public phones, no match. Minimal factual labels/amounts only; no expressive prose, reviews, photos, maps, call or booking actions.',
  },
  {
    id: records[16].id, website: catzilla, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [catzilla],
    notes: 'Actual named merchant massage category explicitly phone-only appointment booking; read relevant full menu, About, precise rear-groundfloor/block22/nearentranceD contact and footer. About identifies massage studio focused on relaxation; only ordinary relaxation face+head23.01EUR30min andwholebody28.12-38.35EURrange selected. Wholebody duration50-70min remains public qualification, no scalar duration invented. Therapeutic/physiotherapy/equipment/lipolysis claims and services excluded. Exact own0888010087 verified. Existing BodySilk laser venue same street100/block22 has different business/domain/phone/scope; no identity or fields borrowed. No independent own domain or full weeklyhours found; provider retail09-17 and transient open banners not salon schedule. Dedupe1238+all2000intakes/native public phones. No reviews, ratings, photos, maps, marketing prose or booking.',
  },
  {
    id: records[17].id, website: mb, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [mb],
    notes: 'Actual named merchant nail category explicitly phone-only appointment booking. Read full relevant nail menu plus About/contact and footer. Selected ordinary gel16.36EUR90min includingoldpolishremoval, normalpolish12.78EUR60min andmen10.23EUR40min. Pedicure variable60-90min,extensions/addons,therapeuticfeet/orthonyxia andlaser not imported. Exact Mladost4 block482/Sofia and0879883231 confirmed. About only says open weekends, not exact hours; no weeklyhours inferred from open-status or provider retail09-17 footer. PDF opening control has no exposed URL in webreader, no complete PDF or unpublished tariff claim. No independent own domain found. Merchant current public page read today; dedupe1238+all2000intakes/nativephones, no match. No prose, ratings, reviews, photos, maps, calls or booking.',
  },
  {
    id: records[18].id, website: anigma, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [anigma],
    notes: 'Actual named merchant cosmetic category explicitly phone-only appointment booking, then full relevant menu/About/contact/footer reviewed. Exact AtanasHranov131V/Sofia and0876197909 verified. Ordinary threadbrow13EUR30min,browlamination+dye42EUR75min,lashlamination+dye35.79EUR75min retained. Other similarly titled combination ranges, lashvariant ranges, expiredOctober2026congress,training andneedle/PMU excluded. About describes independent branded lash/brow business, not separate staff listings. No independent own domain found or full weeklyhours rendered; no transient open-status/provider retail-hour inference. Dedupe1238+all2000intakes/nativephoneinventory, no match. Only minimal factual labels/fees/durations/contact; no efficacy claims, marketing prose, reviews, photos, maps, call or booking.',
  },
  {
    id: records[19].id, website: feeling, checkedOn, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', reviewedUrls: [feeling],
    notes: 'Actual named merchant women/men hair sections explicitly publish phone appointment booking and online-unavailable notices; then complete relevant menu, About, precise Megapark level0/115G contact and footer reviewed. Women haircut includeswash+blow28.12EUR60min,men includeswash+style15.34EUR30min,curlingironstyle28.12EUR60min. Color prices are individually calculated and wide durations/ranges, so not imported as fixed. Exact0877442868 verified; no independent own domain found. Nearby existing ThaiSpa at TheMall115 is not this different operator at Megapark115G; no address or identity borrowed. No full weeklyhours rendered, no provider-retail09-17 or transient open-status inference. Dedupe1238+all2000intakes/nativephones. No staff clones, marketing prose, reviews, photos, maps, calls or booking actions.',
  },
]
export default { records, reviews }
