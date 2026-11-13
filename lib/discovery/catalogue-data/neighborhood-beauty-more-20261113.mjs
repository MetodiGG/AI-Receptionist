// Additional distinct Sofia premises. First-party facts reviewed 2026-11-13.
// No inferred coordinates, fees, session lengths or weekly opening days.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const base = { cityCode: '68134', locationKind: 'premises', coordinates: null }
const service = (name, category, amount, sourceUrl, extra = {}) => ({
  name, category, appointmentModel: 'appointment',
  ...(amount == null ? {} : { price: { amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn, validUntil } }),
  ...extra,
})
const hours = (sourceUrl, entries) => ({ sourceUrl, checkedOn, days: entries.map(([weekday, open, close]) => ({ weekday, periods: open ? [{ open, close }] : [] })) })
const verification = (url, excerpt, contact = url) => ({ status: 'approved', checkedOn, validUntil, booking: { url, excerpt }, contact })
const radi = 'https://radilove-hair.com/'
const kristy = 'https://www.kristysbeautyzone.com/'
const kristyHair = `${kristy}uslugi/frizor`
const kristyContact = `${kristy}kontakti`
const house = 'https://houseofbeautysofia.com/'
const houseSpa = `${house}spa-i-masazhi/`
const rb = 'https://rbstyle.bg/'

const records = [
  {
    ...base, id: 'sofia-radi-love-lozenets', name: 'Radi Love', neighborhood: 'Лозенец',
    address: 'София, ж.к. Лозенец, ул. Момин Кладенец 7', category: 'hair', website: radi, phone: '+359889010911',
    booking: { kind: 'phone', phone: '+359889010911' },
    services: [
      service('Дамско подстригване, измиване и изсушаване · къса коса', 'hair', 28, radi),
      service('Мъжко подстригване, измиване и сешоар · къса коса', 'hair', 25, radi),
      service('Мъжко подстригване с машинка и измиване · къса коса', 'barber', 16, radi),
    ],
    openingHours: hours(radi, [...[1, 2, 3, 4, 5].map(day => [day, '10:00', '20:00']), [6, '10:00', '18:00'], [7]]),
    verification: verification(radi, 'Само с предварително записани часове. Можете да запазите своя час по телефон или чрез онлайн формата за контакт.'),
  },
  {
    ...base, id: 'sofia-kristys-beauty-zone-zlatarski', name: 'Kristy’s Beauty Zone', neighborhood: null,
    address: 'София, ул. Проф. Георги Златарски 37, офисната част на сградата', category: 'hair', website: kristy, phone: '+359885757170',
    booking: { kind: 'phone', phone: '+359885757170' },
    services: [
      service('Дамско подстригване и подсушаване · къса коса', 'hair', 17.89, kristyHair, { description: 'Включва измиване и подсушаване; не включва прав сешоар или оформяне с извити краища.' }),
      service('Мъжко подстригване', 'hair', 15.34, kristyHair, { description: 'Включва измиване преди и след подстригването и изсушаване със сешоар.' }),
      service('Прав сешоар · къса коса', 'hair', 12.78, kristyHair, { description: 'Включва измиване, балсам, маска, оформяне с четка и сешоар и стилизиращи продукти.' }),
    ],
    openingHours: hours(kristyContact, [...[1, 2, 3, 4, 5, 6].map(day => [day, '10:00', '20:00']), [7, '11:00', '18:00']]),
    verification: verification(kristyContact, 'Телефон на салона за записване на час: +359 885 75 71 70'),
  },
  {
    ...base, id: 'sofia-house-of-beauty-persenk', name: 'House of Beauty Sofia', neighborhood: null,
    address: 'София, ул. Персенк 31', category: 'beauty', website: house, phone: '+359892366466',
    booking: { kind: 'phone', phone: '+359892366466' },
    services: [
      service('Антистрес масаж · 60 минути', 'beauty', 65, houseSpa, { durationMin: 60, durationSourceUrl: houseSpa, durationCheckedOn: checkedOn }),
      service('Дълбокотъканен масаж · 60 минути', 'beauty', 70, houseSpa, { durationMin: 60, durationSourceUrl: houseSpa, durationCheckedOn: checkedOn }),
      service('Фитнес масаж · 60 минути', 'beauty', 65, houseSpa, { durationMin: 60, durationSourceUrl: houseSpa, durationCheckedOn: checkedOn }),
    ],
    openingHours: hours(house, [1, 2, 3, 4, 5, 6].map(day => [day, '10:00', '19:00'])),
    verification: verification(house, 'За записване на час: +359892366466'),
  },
  {
    ...base, id: 'sofia-rb-style-karavelov', name: 'RB Style', neighborhood: null,
    address: 'София, ул. Любен Каравелов 74', category: 'hair', website: rb, phone: '+359878510030',
    booking: { kind: 'phone', phone: '+359878510030' },
    services: [
      service('Мъжко подстригване', 'hair'),
      service('Сешоар', 'hair'),
      service('Боядисване на коса', 'hair'),
      { ...service('Удължаване на мигли косъм по косъм · първоначално поставяне', 'beauty', 80, `${rb}udalzhavane-na-migli/`), price: { amount: 80, currency: 'BGN', kind: 'fixed', sourceUrl: `${rb}udalzhavane-na-migli/`, checkedOn, validUntil } },
    ],
    openingHours: hours(rb, [...[1, 2, 3, 4, 5, 6].map(day => [day, '10:00', '20:00']), [7]]),
    verification: verification(rb, 'Запази час. София, ул. Любен Каравелов 74. Тел.: 02/4275888; моб.: 0878/510030.'),
  },
]

const reviews = [
  {
    id: 'sofia-radi-love-lozenets', website: radi, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: [radi, `${radi}uslugi-frizior-sofia-center-radi-love-maistor/`, `${radi}kontakti-maistor-frizior-center-sofia/`],
    notes: 'Own homepage explicitly requires prior appointments and FAQ allows booking by telephone or contact form. Contact subpage presents a verification challenge; homepage independently supplies exact premises, telephone, weekdays10-20, Saturday10-18 and Sundayclosed. Own current homepage tariff reviewed: only explicitly labeled short-hair variants28/25/16EUR imported, not a conversion of the separately printed BGN figures. No inferred durations or marketing superlatives. No form submission, paid provider, review/photo import or geocoding.',
  },
  {
    id: 'sofia-kristys-beauty-zone-zlatarski', website: kristy, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: [kristy, `${kristy}nachalo`, kristyContact, kristyHair],
    notes: 'Own contacts explicitly label the phone for appointment booking and identify the actual office-part premises. Own homepage says published BGN fees unchanged since2025 and supplies its own EUR amounts. Three exact ordinary hair-service EUR fees retained literally, including short-hair qualifications and included/excluded finishing. No self-calculated conversion, invented duration or promotional price. Full contact opening days read; no neighborhood inferred from postcode. No bookings or messages sent.',
  },
  {
    id: 'sofia-house-of-beauty-persenk', website: house, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: [house, houseSpa, 'https://www.fresha.com/bg/a/house-of-beauty-sofia-sofiya-ulica-persenk-31-zrb3pctv/booking?allOffer=true'],
    notes: 'Own footer expressly offers phone appointments at this exact Sofia premises. Actual linked Fresha target opened but JS text exposes no menu; phone booking is the independently verified route, not a claim that provider menu was reviewed. Own SPA service page independently publishes exact60min single-session massage prices65/70/65EUR. Medical/recovery/energy/outcome claims, extras and packages excluded. Own footer publishes Monday-Saturday10-19; Sunday is not stated and is omitted, not guessed closed. No personal data or reservations entered.',
  },
  {
    id: 'sofia-rb-style-karavelov', website: rb, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: [rb, `${rb}tsenorazpis/`, `${rb}mazhko-podstrigvane/`, `${rb}seshoar/`, `${rb}boyadisvane/`, `${rb}damsko-podstrigvane/`, `${rb}udalzhavane-na-migli/`],
    notes: 'Own site contact footer explicitly invites appointment booking and root supplies mobile and landline. Current actual premises is LyubenKaravelov74; TsarAsen36 is stated only as historical opening address, not a branch. General price page is empty but detailed lash service publishes80BGN initial application; retained literal currency, no conversion. Hair-service detail pages/root navigation establish three real services but their fees remain absent; partial published lash tariff is not a not_publicly_listed declaration. Female haircut page challenge not bypassed. Hours Monday-Saturday10-20 and Sundayclosed from own footer. Initial lash duration is up to2h, so no fixed duration inferred.',
  },
]

const arette = 'https://arette.bg/'
const aretteBook = 'https://book.arette.bg/reservations/start?site=1'
const beautinity = 'https://beautinity.bg/'
const beautinityBook = 'https://book.beautinity.bg/reservations/start?site=1'
const trend = 'https://trendbytedi.com/'
const trendServices = `${trend}services/`
const vital = 'https://www.vitalsunstudio.com/'
const vitalContact = `${vital}kontakti/`
const vitalPrice = `${vital}ceni/`
const kinesi = 'https://kinesijoy.com/'
const timedService = (name, category, amount, sourceUrl, minutes, extra = {}) => service(name, category, amount, sourceUrl, { durationMin: minutes, durationSourceUrl: sourceUrl, durationCheckedOn: checkedOn, ...extra })

records.push(
  {
    ...base, id: 'sofia-arette-arsenalski', name: 'Arette Beauty Studio', neighborhood: null,
    address: 'София, бул. Арсеналски 15', category: 'hair', website: arette, phone: '+359879040449',
    booking: { kind: 'form', url: aretteBook },
    services: [
      timedService('Дамско подстригване с прав сешоар · къса коса', 'hair', 25, aretteBook, 90),
      timedService('Мъжко подстригване с измиване · къса класическа коса', 'hair', 15, aretteBook, 30),
      timedService('Прав сешоар · къса коса', 'hair', 20, aretteBook, 40),
      timedService('Маникюр с гел лак · къси нокти', 'nails', 33, aretteBook, 60),
      timedService('Педикюр с гел лак', 'nails', 40, aretteBook, 60),
    ],
    openingHours: hours(`${arette}kontakti/`, [1, 2, 3, 4, 5, 6, 7].map(day => [day, '10:00', '20:00'])),
    verification: verification(arette, 'Запази час · собствена система за резервации; София, бул. Арсеналски 15', `${arette}kontakti/`),
  },
  {
    ...base, id: 'sofia-beautinity-borovo', name: 'Studio Beautinity', neighborhood: 'Борово',
    address: 'София, кв. Борово, ул. Пирински проход 47Б', category: 'beauty', website: beautinity, phone: '+359895041214',
    booking: { kind: 'form', url: beautinityBook },
    services: [
      service('Комбинирано ръчно почистване на лице с дермабразио', 'beauty', 41, beautinityBook),
      service('Комбинирано почистване с дермабразио и ампула витамини Fusion', 'beauty', 52, beautinityBook),
      service('Почистване на гръб', 'beauty', 41, beautinityBook),
    ],
    openingHours: hours(beautinity, [1, 2, 3, 4, 5, 6, 7].map(day => [day, '08:30', '20:00'])),
    verification: verification(beautinity, 'Резервирай онлайн · Запази час · почистване на лице и комбинирано почистване с микродермабразио'),
  },
  {
    ...base, id: 'sofia-trend-tedi-tsar-kaloyan', name: 'TREND Hair Boutique Studio', neighborhood: 'Център',
    address: 'София, ул. Цар Калоян 8, мецанин, сградата на бившия централен Кореком', category: 'hair', website: trend, phone: '+359888599590',
    booking: { kind: 'phone', phone: '+359888599590' },
    services: [
      timedService('Дамско подстригване · Standard грижа', 'hair', 17.9, trendServices, 45, { description: 'Цените могат да варират според собствените условия на студиото.' }),
      timedService('Подстригване и сешоар Standard · средна коса M', 'hair', 31.7, trendServices, 90, { description: 'Цените могат да варират според собствените условия на студиото.' }),
      timedService('Сешоар Standard · средна коса M', 'hair', 16.87, trendServices, 50, { description: 'Цените могат да варират според собствените условия на студиото.' }),
    ],
    openingHours: hours(`${trend}contact/`, [[1, '09:00', '19:30'], [2], [3, '09:00', '19:30'], [4], [5, '09:00', '19:30'], [6, '09:00', '19:00'], [7, '09:00', '19:00']]),
    verification: verification(`${trend}contact/`, 'Запазете час онлайн · 0888 599 590 · Резервирай в Studio24'),
  },
  {
    ...base, id: 'sofia-vital-sun-pozitano', name: 'Vital Sun Centre', neighborhood: null,
    address: 'София, ул. Позитано 7, ет. 1', category: 'beauty', website: vital, phone: '+359887002136',
    booking: { kind: 'phone', phone: '+359887002136' },
    services: [
      service('Релаксиращ SPA масаж на цяло тяло', 'beauty', 40.9, vitalPrice),
      service('Релаксиращ SPA масаж на гръб Gernetic', 'beauty', 20.45, vitalPrice),
      service('Кола маска · подмишници · жени', 'beauty', 7.67, vitalPrice),
      service('Кола маска · цели крака · жени', 'beauty', 20.45, vitalPrice),
    ],
    openingHours: hours(vitalContact, [[1], ...[2, 3, 4, 5, 6].map(day => [day, '09:00', '20:00']), [7]]),
    verification: verification(vitalContact, 'Ние работим с предварително записан час. Моля, запишете своя час за терапия, процедура или консултация ПО ТЕЛЕФОНА!'),
  },
  {
    ...base, id: 'sofia-kinesi-joy-stambolov', name: 'Kinesi Joy', neighborhood: null,
    address: 'София, бул. Стефан Стамболов 6, Бизнес сграда Евони, ет. 1', category: 'nails', website: kinesi, phone: '+359888504532',
    booking: { kind: 'form', url: `${kinesi}contact-us/` },
    services: [
      timedService('Класически маникюр с обикновен лак', 'nails', 29, `${kinesi}tsenorazpis/`, 60),
      timedService('Класически маникюр без лак', 'nails', 25, `${kinesi}tsenorazpis/`, 40),
      timedService('Маникюр с гел лак', 'nails', 32, `${kinesi}tsenorazpis/`, 90),
    ],
    verification: verification(`${kinesi}manikyur-i-pedikyur/`, 'Резервирайте своят час още днес · връзка към собствена контактна форма', `${kinesi}contact-us/`),
  },
)

reviews.push(
  {
    id: 'sofia-arette-arsenalski', website: arette, bookingEntry: aretteBook, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [arette, `${arette}friziorstvo/`, `${arette}kontakti/`, `${arette}cenorazpis/`, aretteBook],
    notes: 'Root independently read real browser-rendered Fitsys menu, hair20services and nails variants. Five exact ordinary single-service variants with literal EUR fees and durations retained. Own contact/root confirms venue Arsenalski15 and daily10-20; legal registered Samokovskosho se2L is not a branch. Voucher late-arrival terms were not generalized to all ordinary appointments. No date/time/customer selection or submission.',
  },
  {
    id: 'sofia-beautinity-borovo', website: beautinity, bookingEntry: beautinityBook, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [beautinity, `${beautinity}contact/`, beautinityBook],
    notes: 'Own root confirms Borovo exact address, phone, daily08:30-20 and facial inventory. Contact subpage timed out on recheck; root independently confirms facts. Integrator read actual Fitsys menu for specialist Mirela, facial/back-cleaning group7: three literal single-visit fees41/52/41EUR retained; package205EUR excluded. No duration was visible, none invented. No service/date/customer chosen or reservation submitted.',
  },
  {
    id: 'sofia-trend-tedi-tsar-kaloyan', website: trend, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: [trend, `${trend}contact/`, trendServices],
    notes: 'Read complete own tariff with named fixed variants and exact durations; retained three bounded Standard variants, not category minimums, add-ons or consultation deposits. Own indexed contact page explicitly offers appointment contact beside phone and supplies exact venue/days/hours; direct contact fetch cachemiss documented, not a tariff-absence claim. Own tariff warns fees may vary. Google reviews, product claims and inferred coordinates excluded.',
  },
  {
    id: 'sofia-vital-sun-pozitano', website: vital, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: [vital, vitalContact, vitalPrice, `${vital}pochistvane-i-specifichna-grija/`],
    notes: 'Own contact expressly requests phone appointments; exact address, phone and Tue-Sat09-20 with Monday/Sundayclosed read. Full own current EUR tariff distinguishes ordinary single visits from prepaid packages. Four simple SPA/wax services retained; no package reduction, medical claims or inferred durations. Separate facial detail failedcache; its services not imported.',
  },
  {
    id: 'sofia-kinesi-joy-stambolov', website: kinesi, bookingEntry: `${kinesi}contact-us/`, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [kinesi, `${kinesi}manikyur-i-pedikyur/`, `${kinesi}contact-us/`, `${kinesi}tsenorazpis/`, 'https://studio24.bg/kinesi-joy-premium-center-s11396?m=&m='],
    notes: 'Own manicure page explicitly routes appointment requests to actual own contact form; fields inspected without filling/submission. Alternative Studio24 target cachemiss; not marked provider-reviewed. Own full current EUR tariff confirms three ordinary cosmetic manicure services and exact durations. Clinical podology, infection, diagnostic and treatment services/claims excluded. Exact premises from owner contacts; no published weekly hours on reviewed own pages, no hours inferred.',
  },
)

const ea = 'https://eabeautybox.com/'
const eaPrices = `${ea}%D1%86%D0%B5%D0%BD%D0%B8/`
const life = 'https://lifehairdesign.bg/'
const lifeBook = 'https://www.fresha.com/bg/a/life-hair-design-by-ivan-sofia-ulitsa-neofit-rilski-51-k4577ch5'
records.push(
  {
    ...base, id: 'sofia-ea-beauty-box-slavovitsa', name: 'EA Beauty Box', neighborhood: null,
    address: 'София, ул. Славовица 41', category: 'hair', website: ea, phone: '+359888010744',
    booking: { kind: 'phone', phone: '+359888010744' },
    services: [
      service('Дамско подстригване със сешоар', 'hair', 50, eaPrices),
      service('Мъжко подстригване със стайлинг', 'hair', 20, eaPrices),
      service('Маникюр с гел лак', 'nails', 35, eaPrices),
      service('Педикюр с гел лак', 'nails', 40, eaPrices),
    ],
    verification: verification(eaPrices, 'Ако имате въпроси относно някоя услуга или искате да запишете час, не се колебайте да се свържете с нас!', `${ea}contact/`),
  },
  {
    ...base, id: 'sofia-life-hair-design-neofit', name: 'Life Hair Design by Ivan Ivanov', neighborhood: null,
    address: 'София, ул. Неофит Рилски 51', category: 'hair', website: life, phone: '+359877242006',
    booking: { kind: 'form', url: lifeBook },
    services: [
      { ...timedService('Дамско подстригване', 'hair', 35, lifeBook, 60), price: { amount: 35, currency: 'EUR', kind: 'from', sourceUrl: lifeBook, checkedOn, validUntil } },
      { ...timedService('Мъжко подстригване', 'hair', 20, lifeBook, 30), price: { amount: 20, currency: 'EUR', kind: 'from', sourceUrl: lifeBook, checkedOn, validUntil } },
      { ...timedService('Боядисване на корени и сешоар', 'hair', 50, lifeBook, 100), price: { amount: 50, currency: 'EUR', kind: 'from', sourceUrl: lifeBook, checkedOn, validUntil } },
    ],
    openingHours: hours(`${life}index-bg.html`, [[1], [2, '09:00', '18:00'], [3, '11:00', '18:00'], [4, '09:00', '18:00'], [5, '11:00', '18:00'], [6, '08:30', '17:00'], [7]]),
    verification: verification(`${life}index-bg.html`, 'РЕЗЕРВИРАЙ · собствена връзка към Life Hair Design by Ivan във Fresha'),
  },
)
reviews.push(
  {
    id: 'sofia-ea-beauty-box-slavovitsa', website: ea, bookingEntry: 'phone', bookingReview: 'phone_booking_reviewed', checkedOn,
    reviewedUrls: [ea, `${ea}contact/`, eaPrices, `${ea}%D1%83%D1%81%D0%BB%D1%83%D0%B3%D0%B8/`],
    notes: 'Own tariff expressly invites service appointment requests; own contact supplies one exact Sofia premises and phone. Four literal single-service EUR fees retained; combination discounts and product/add-on prices excluded. Own services subpage cachemiss, but full actual named tariff accessible. No weekly opening hours published in reviewed owner pages, so none inferred from directory. One premises only, not duplicated directory aliases.',
  },
  {
    id: 'sofia-life-hair-design-neofit', website: life, bookingEntry: lifeBook, bookingReview: 'provider_booking_reviewed', checkedOn,
    reviewedUrls: [life, `${life}index-bg.html`, lifeBook, `${lifeBook}/booking?entryPoint=venue_see_all_services`],
    notes: 'Followed own actual Book link to matching Fresha profile. Actual service menu exposes35EURfrom women60min,20EURfrom men30min,50EURfrom roots+blowdry100min; preserved from. Full-menu extensioncachemiss but three visible named bookable rows read. Own Bulgarian root confirms exact premises and unusual weekday hours; thirdpartyhours ignored. Parchevich denotes same corner, no second streetnumber or branch invented. No ratings, testimonials, copied photos or clinical/outcome claims imported.',
  },
)

const blessed = 'https://www.blessed-bg.com/'
const blessedBook = `${blessed}booking-calendar/%D0%BF%D0%BE%D0%B4%D1%81%D1%82%D1%80%D0%B8%D0%B3%D0%B2%D0%B0%D0%BD%D0%B5`
records.push({
  ...base, id: 'sofia-blessed-barber-botev', name: 'Blessed Barber Studio', neighborhood: null,
  address: 'София, бул. Христо Ботев 65', category: 'barber', website: blessed, phone: '+359877167335',
  booking: { kind: 'form', url: blessedBook },
  services: [
    timedService('Подстригване с измиване', 'barber', 25, blessed, 60),
    timedService('Оформяне на брада', 'barber', 20, blessed, 30),
    timedService('Подстригване и оформяне на брада', 'barber', 35, blessed, 60),
  ],
  openingHours: hours(blessed, [...[1, 2, 3, 4, 5].map(day => [day, '10:00', '20:00']), [6, '10:00', '18:00'], [7]]),
  verification: verification(blessedBook, 'Планирайте услугата си (+ измиване на коса). Проверете наличността и резервирайте датата и часа, които Ви устройват.', blessed),
})
reviews.push({
  id: 'sofia-blessed-barber-botev', website: blessed, bookingEntry: blessedBook, bookingReview: 'owned_booking_reviewed', checkedOn,
  reviewedUrls: [blessed, blessedBook, `${blessed}booking-calendar/%D0%BE%D1%84%D0%BE%D1%80%D0%BC%D1%8F%D0%BD%D0%B5-%D0%BD%D0%B0-%D0%B1%D1%80%D0%B0%D0%B4%D0%B0`, `${blessed}%D0%BE%D0%B1%D1%89%D0%B8-%D1%83%D1%81%D0%BB%D0%BE%D0%B2%D0%B8%D1%8F`],
  notes: 'Own actual named haircut/beard booking calendar pages read; explicit booking instructions and same premises/contact shown. Own main menu independently publishes three exact25/20/35EUR fees with60/30/60min; haircut calendar confirms wash included. No availability asserted or form submitted. Own terms identify Blest93 and cancellation by previousday; old generic BGN currency clause does not change literal EUR menu facts. Erroneous HeadHunters hyperlink in legal template not treated as another premises or owner relationship. No testimonials/photos imported.',
})

const evima = 'https://evima-studio.com/'
const evimaPrices = `${evima}cenorazpis/frizyorski-uslugi-ceni.html`
const evimaBook = 'https://studio24.bg/m/97'
const vanessa = 'https://vanessalaserstudio.com/'
const vanessaBook = 'https://book.vanessalaserstudio.com/reservations/start?site=2'
const prison = 'https://prisonbound.setmore.com/'
records.push(
  {
    ...base, id: 'sofia-evima-knyaz-boris', name: 'Евима Студио и Академия', neighborhood: null,
    address: 'София, ул. Княз Борис I 78', category: 'hair', website: evima, phone: '+359879086676',
    booking: { kind: 'form', url: evimaBook },
    services: [
      timedService('Дамско подстригване и сешоар · експерт стилист', 'hair', 45, evimaBook, 60),
      { ...service('Мъжко подстригване · експерт стилист', 'hair', 26, evimaBook), price: { amount: 26, currency: 'EUR', kind: 'from', sourceUrl: evimaBook, checkedOn, validUntil } },
      timedService('Официална прическа · експерт стилист', 'hair', 100, evimaBook, 90),
    ],
    openingHours: hours(`${evima}kontakti/`, [...[1, 2, 3, 4, 5].map(day => [day, '09:00', '19:00']), [6, '09:00', '17:00'], [7]]),
    verification: verification(`${evima}kontakti/`, 'Запази час · собствена връзка към Studio24 за Евима Студио и Академия'),
  },
  {
    ...base, id: 'sofia-vanessa-laser-haydushka-gora', name: 'Vanessa Laser Studio', neighborhood: null,
    address: 'София, ул. Хайдушка гора 87', category: 'beauty', website: vanessa, phone: '+359888463665',
    booking: { kind: 'form', url: vanessaBook },
    services: [timedService('Лазерна епилация · подмишници · жени', 'beauty', 17.9, vanessaBook, 25)],
    openingHours: hours(`${vanessa}contacts/`, [1, 2, 3, 4, 5, 6, 7].map(day => [day, '09:00', '20:00'])),
    verification: verification(`${vanessa}contacts/`, 'Запиши си час · собствена връзка към онлайн резервации; ул. Хайдушка гора 87, София'),
  },
  {
    ...base, id: 'sofia-prison-bound-gurko', name: 'Prison Bound Barbershop', neighborhood: null,
    address: 'София, ул. Ген. Гурко 38', category: 'barber', website: prison, phone: '+359893023915',
    booking: { kind: 'form', url: prison },
    services: [
      timedService('Мъжко подстригване', 'barber', 25, prison, 60),
      timedService('Оформяне на брада', 'barber', 20, prison, 60),
      timedService('Подстригване и оформяне на брада', 'barber', 35, prison, 90),
    ],
    openingHours: hours(prison, [[1], ...[2, 3, 4, 5, 6].map(day => [day, '14:00', '22:00']), [7]]),
    verification: verification(prison, 'Book · Hair/Коса · Beard/Брада · Combo/Комбо · собствена страница за записвания на Prison Bound Barbershop'),
  },
)
reviews.push(
  {
    id: 'sofia-evima-knyaz-boris', website: evima, bookingEntry: evimaBook, bookingReview: 'provider_booking_reviewed', checkedOn,
    reviewedUrls: [evima, `${evima}kontakti/`, evimaPrices, evimaBook, 'https://studio24.bg/m/evima-studio-i-akademiya-s97?m%3Fm&m'],
    notes: 'Root independently read actual current Studio24 expert-stylist menu at matching KnyazBorisI78. Exact expert women45EUR60min, menfrom26EUR and formal100EUR90min match the separately labeled own expert tariff45/26/100; ordinary stylist36/20 and trainee20/12 are different tiers, not substituted. Men30-45min is variable, so no fixed duration imported. Own full weekly hours verified. No service/date/customer chosen or booking submitted.',
  },
  {
    id: 'sofia-vanessa-laser-haydushka-gora', website: vanessa, bookingEntry: vanessaBook, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [vanessa, `${vanessa}prices/`, `${vanessa}contacts/`, 'https://studio24.bg/m/p7574/', vanessaBook],
    notes: 'Root independently read actual own Fitsys women-laser group12. Only women underarm17.90EUR25min retained from actual current menu, compatible with the separately published35BGN women-underarm row; fee is literal published EUR, not a calculated conversion. Other old-price-page variants conflict materially with the current menu, including wholelegs175BGN versus40.90EUR and upperlip25BGN versus13EUR: those variants held, not called unpublished or silently imported. Own exact venue, phone and daily09-20 verified. No efficacy, safety, clinical-result or treatment claims copied; no booking submitted.',
  },
  {
    id: 'sofia-prison-bound-gurko', website: prison, bookingEntry: prison, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [prison, `${prison}book`],
    notes: 'Unique owner-operated Setmore merchant subdomain is the primary business website, not a directory discovery page. Actual merchant page publishes three named Book rows with literal25/20/35EUR and60/60/90min, own contact, exact premises and full weekly hours. Separate /book extension is JS-only; no claim to have inspected availability or completed the scheduling steps. Primary merchant menu is the booking entry. Ordinary hair/beard scope only; bar, piercing, ratings, reviews and gallery/photo material excluded. Domain, phone and name checked against1081catalogue records and local native-partner evidence; no match. No form input, reservation or messages.',
  },
)

const mudi = 'https://barbershopmudi.wixsite.com/my-site'
const mudiBook = 'https://www.fresha.com/a/the-barbershop-mudi-sofia-sofia-center-ulitsa-stefan-karadzha-12-rqqym6zb'
const crew = 'https://crewbarbershop.setmore.com/'
const top = 'https://topbarbers.setmore.com/'
const cube = 'https://cubebarbers.setmore.com/'
const fine = 'https://finelinesofia.setmore.com/'
records.push(
  {
    ...base, id: 'sofia-mudi-stefan-karadzha', name: 'The Barbershop Mudi', neighborhood: null,
    address: 'София, ул. Стефан Караджа 12', category: 'barber', website: mudi, phone: '+359878506473',
    booking: { kind: 'form', url: mudiBook },
    services: [timedService('Подстригване при Муди', 'barber', 20, mudiBook, 30)],
    verification: verification(mudi, 'Book now · собствена връзка към онлайн записвания за The Barbershop Mudi'),
  },
  {
    ...base, id: 'sofia-crew-barbershop-slavovitsa', name: 'Crew Barbershop', neighborhood: null,
    address: 'София, ул. Славовица 51Е', category: 'barber', website: crew, phone: '+359878779672',
    booking: { kind: 'form', url: `${crew}book` },
    services: [
      service('Подстригване · Petar или Dimitar', 'barber', 14, crew),
      service('Подстригване и оформяне на брада · Petar или Dimitar', 'barber', 18, crew),
      service('Оформяне на брада · Petar или Dimitar', 'barber', 10, crew),
    ],
    openingHours: hours(crew, [...[1, 2, 3, 4, 5].map(day => [day, '10:00', '20:00']), [6, '10:00', '18:00'], [7]]),
    verification: verification(crew, 'Book · Подстригване/Haircut · Подстригване и оформяне на брада · собствено меню за записвания'),
  },
  {
    ...base, id: 'sofia-top-barbers-hristo-danov', name: 'TOP BARBERS', neighborhood: 'Студентски град',
    address: 'София, Студентски град, ул. Проф. Христо Данов 21', category: 'barber', website: top, phone: '+359886959559',
    booking: { kind: 'form', url: top },
    services: [
      timedService('Подстригване · Иво Табаков', 'barber', 19, top, 45),
      timedService('Подстригване и оформяне на брада · Иво Табаков', 'barber', 26, top, 60),
      timedService('Оформяне на брада · Иво Табаков', 'barber', 14, top, 30),
    ],
    openingHours: hours(top, [...[1, 2, 3, 4, 5].map(day => [day, '10:00', '20:00']), [6, '10:00', '18:00'], [7]]),
    verification: verification(top, 'Book · Подстригване / Haircut · Подстригване и оформяне на брада / Combo · собствена страница за записвания'),
  },
  {
    ...base, id: 'sofia-cubebarbers-dimitar-dobrev', name: 'Cubebarbers Sofia', neighborhood: null,
    address: 'София, ул. Проф. д-р Димитър Добрев 6', category: 'barber', website: cube, phone: '+359887083837',
    booking: { kind: 'form', url: cube },
    services: [
      timedService('Подстригване · Антон Ангелов', 'barber', 17, cube, 45),
      timedService('Подстригване и оформяне на брада · Антон Ангелов', 'barber', 23, cube, 60),
      timedService('Оформяне на брада · Антон Ангелов', 'barber', 13, cube, 30),
    ],
    openingHours: hours(cube, [...[1, 2, 3, 4, 5].map(day => [day, '10:00', '20:00']), [6, '10:00', '18:00'], [7]]),
    verification: verification(cube, 'Book · Подстригване/ Haircut · Оформяне на брада/ Beard trim · собствена страница за записвания'),
  },
  {
    ...base, id: 'sofia-fine-line-rakovski', name: 'Fine Line Barbershop', neighborhood: null,
    address: 'София, ул. Георги С. Раковски 182', category: 'barber', website: fine, phone: null,
    booking: { kind: 'form', url: fine },
    services: [
      timedService('Подстригване · средна коса', 'barber', 30, fine, 60),
      timedService('Подстригване · дълга коса', 'barber', 45, fine, 90),
      timedService('Оформяне на брада', 'barber', 16, fine, 30),
    ],
    openingHours: hours(fine, [...[1, 2, 3, 4, 5].map(day => [day, '09:00', '18:00']), [6], [7]]),
    verification: verification(fine, 'Book · Haircut Medium · Haircut Long · Beard Trim · собствена страница за записвания и контакт finelinesofia@gmail.com'),
  },
)
reviews.push(
  {
    id: 'sofia-mudi-stefan-karadzha', website: mudi, bookingEntry: mudiBook, bookingReview: 'provider_booking_reviewed', checkedOn,
    reviewedUrls: [mudi, `${mudi}/book-online`, 'https://bg.fresha.com/book-now/the-barbershop-mudi-b4lay3wr/all-offer?pId=519661', mudiBook, 'https://www.fresha.com/bg/a/the-barbershop-mudi-sofia-sofia-center-ulitsa-stefan-karadzha-12-rqqym6zb', `${mudiBook}/booking?entryPoint=venue_see_all_services`],
    notes: 'Followed actual own Book target; legacy bg.fresha route cachemiss but exact current canonical merchant profile fully readable and matches own StefanKaradzha12 identity. Only specific named Mudi haircut20EUR30min imported, identical in current English and Bulgarian views and without discount marker. Other English rows show Saveup to20percent; excluded promotional fees and generic older own senior/barber BGN tariff. Own weekday10-20/weekend schedules conflict with canonical current10-19/weekend10-18, so no openingHours imported. Extended booking menu cachemiss; actual named Book row read. No availability, reviews, photos or team-quality claims copied.',
  },
  {
    id: 'sofia-crew-barbershop-slavovitsa', website: crew, bookingEntry: `${crew}book`, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [crew, `${crew}book`, `${crew}book?products=s989042e1124e46120cecadcfa46ca5a96e2df41d&step=staff&type=service`],
    notes: 'Primary owner-operated unique Setmore merchant site publishes actual service menu, exact premises/contact and full weekly hours. Actual /book service list independently read and agrees with root. Three explicit Petar-or-Dimitar tier fees14/18/10EUR retained, not unrestricted category minima; no durations are shown, none invented. Stefan rows labeled Free excluded because status/conditions unclear. Individual next staff-step fetch cachemiss; no claim about slot availability or completed flow. Google-sourced reviews, ratings and images are not imported. Neighborhood not inferred from a review or postcode.',
  },
  {
    id: 'sofia-top-barbers-hristo-danov', website: top, bookingEntry: top, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [top, `${top}book`],
    notes: 'Primary owner-operated unique Setmore merchant site supplies own named Book service rows, exact StudentskiGrad premises/contact and complete weekly hours. Retained three explicit IvoTabakov tier services19/26/14EUR45/60/30min; different practitioner prices never merged or presented as universal. Separate /book extension exposes only JS; actual primary merchant Book rows are readable, no availability or later flow completion asserted. No Google-sourced logo/review/photo, rating or testimonial data imported. No personal data entered or bookings submitted.',
  },
  {
    id: 'sofia-cubebarbers-dimitar-dobrev', website: cube, bookingEntry: cube, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [cube, `${cube}book`],
    notes: 'Primary owner-operated unique Setmore merchant site publishes actual named Book rows, exact premises, phone and full weekly hours. Retained only explicit AntonAngelov tier haircut17EUR45min,combo23EUR60min andbeard13EUR30min. Other similarly named practitioner AntonHristov and Nikolaos have different tiers, not merged. Separate /book target cachemiss; no availability or completed scheduling step claim. Ratings, Google-sourced reviews and gallery/photos excluded. Neighborhood and coordinates not inferred; no customer or appointment data entered.',
  },
  {
    id: 'sofia-fine-line-rakovski', website: fine, bookingEntry: fine, bookingReview: 'owned_booking_reviewed', checkedOn,
    reviewedUrls: [fine],
    notes: 'Primary owner-operated unique Setmore merchant site is the own appointment website. Actual menu publishes named Book rows, three exact fees30/45/16EUR and60/90/30min for mediumhair/longhair/beard, full weekday09-18 with weekendsclosed, exact Rakovski182 and contactemail. No phone is published and none fabricated or imported from directories; actual owned form-entry booking route used. No bookings, date/time/customer selection, review/photo copying or availability claims. Baseline1081 and current native partner identities checked; no same address/name/domain match.',
  },
)

export default { records, reviews }
