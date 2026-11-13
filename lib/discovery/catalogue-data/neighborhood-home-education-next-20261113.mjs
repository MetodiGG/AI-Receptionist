// Isolated owner-source intake, 2026-11-13. No shared imports or inventory fingerprints.
const checkedOn = '2026-11-13'
const validUntil = '2027-02-11'
const price = (amount, unit, sourceUrl, extra = {}) => ({ amount, currency: 'EUR', kind: 'fixed', unit, sourceUrl, checkedOn, ...extra })
const service = (category, name, description, facts = {}) => ({ category, appointmentModel: category === 'home_services' ? 'home_visit' : 'appointment', name, description, ...facts })
const duration = (durationMin, durationSourceUrl) => ({ durationMin, durationSourceUrl, durationCheckedOn: checkedOn })
const hours = (sourceUrl, days) => ({ sourceUrl, checkedOn, days: days.map(([weekday, ...pairs]) => ({ weekday, periods: pairs.map(([open, close]) => ({ open, close })) })) })
const records = [], reviews = []
function add(facts, evidence) {
  const { bookingUrl, contactUrl, excerpt, reviewedUrls, notes, priceSearchNotes, serviceUrls } = evidence
  const row = { cityCode: '68134', neighborhood: null, address: null, locationKind: 'premises', coordinates: null, ...facts,
    booking: facts.booking || { kind: 'phone', phone: facts.phone },
    verification: { status: 'approved', checkedOn, validUntil, booking: { url: bookingUrl, excerpt }, contact: contactUrl } }
  records.push(row)
  const review = { id: row.id, checkedOn, website: row.website,
    bookingEntry: row.booking.kind === 'phone' ? 'phone' : row.booking.url,
    bookingReview: row.booking.kind === 'phone' ? 'phone_booking_reviewed' : 'owned_booking_reviewed', reviewedUrls, notes }
  if (priceSearchNotes) Object.assign(review, { pricingDecision: 'not_publicly_listed', priceSearch: { outcome: 'not_published', bookingUrl, serviceUrls, notes: priceSearchNotes } })
  reviews.push(review)
}

add({
  id: 'sofia-caviar-couture-sinanishko7', name: 'Caviar Couture · индивидуални проби и модна консултация',
  neighborhood: 'Манастирски ливади', address: 'София, ул. Синанишко езеро 7', category: 'other',
  website: 'https://www.caviar-couture.com/', phone: '+359878400301',
  services: [service('other', 'Лична проба на рокли с модна консултация', 'Предварително запазена индивидуална проба с консултант; без ограничение за броя пробвани рокли. Онлайн календарът приема предпочитан час, който се потвърждава допълнително, ако е свободен. Цената е за пробата, не за закупуване или изработка на рокля.', {
    ...duration(60, 'https://caviarhautecouture.setmore.com/'), price: price(0, 'проба и консултация · 1 час', 'https://www.caviar-couture.com/') })]
}, {
  bookingUrl: 'https://www.caviar-couture.com/', contactUrl: 'https://www.caviar-couture.com/',
  excerpt: 'За запазване на час можете да се свържете с нас на 0878 400 301',
  reviewedUrls: ['https://www.caviar-couture.com/', 'https://caviarhautecouture.setmore.com/'],
  notes: 'Followed actual owner-linked Setmore booking entry and its named free one-hour fitting menu, then owner FAQ with explicit telephone reservations, free fittings and exact showroom street. Request calendar explicitly does not represent real availability. Deep slot URL returned cache miss, so record uses the separately explicit phone booking route. Owner showroom ends 19:00 but provider hours end 18:00; conflicting hours omitted. Retail garment prices are excluded.'
})

add({
  id: 'sofia-one-bulgarian-rose-parchevich39', name: 'One Bulgarian Rose · дегустация и представяне',
  neighborhood: 'Център', address: 'София, ул. Петър Парчевич 39, магазин 1', category: 'other',
  website: 'https://onebulgarianrose.com/', phone: '+359889428287',
  services: [service('other', 'Bulgarian Rose experience & degustation', 'Предварително запазено представяне и дегустация на английски език, до 12 участници. Включва запознаване с българската роза, аромати и розов чай или напитка. Плаща се при пристигане; не е подходящо при сериозни алергии. Не е покупка на козметичен продукт.', {
    ...duration(40, 'https://onebulgarianrose.com/rose-products-testing/'), price: price(16, 'участие в 40-минутна дегустация', 'https://onebulgarianrose.com/rose-products-testing/') })]
}, {
  bookingUrl: 'https://onebulgarianrose.com/rose-products-testing/', contactUrl: 'https://onebulgarianrose.setmore.com/',
  excerpt: 'Contact us and book a testing today!',
  reviewedUrls: ['https://onebulgarianrose.com/', 'https://onebulgarianrose.com/rose-products-testing/', 'https://onebulgarianrose.setmore.com/'],
  notes: 'Actual Book Now leads to named merchant Setmore class menu with matching 40 minutes and EUR16, phone and exact shop address. Deep class slot URL was unavailable to the web reader; a separate owner instruction explicitly invites contact to book a testing, so telephone route is recorded, not an unreviewed availability promise. Own service page specifies English, up to twelve participants, arrival payment and allergy restriction. Summer-only start time and generic shop opening hours are not imported as year-round class hours. No reviews or photos copied.'
})

add({
  id: 'sofia-izgrev-lessons-buxton40', name: 'Център Изгрев · индивидуални уроци', neighborhood: 'Бъкстон',
  address: 'София, ж.к. Бъкстон, бул. Братя Бъкстон 40', category: 'education', website: 'https://izgrev.netlify.app/', phone: '+359882642103',
  services: [service('education', 'Индивидуален урок по математика', 'Подготовка за ученици до 12. клас. Конкретният учител, продължителност, график и такса се уточняват при записване.'),
    service('education', 'Индивидуален урок по английски език', 'Индивидуално обучение след предварително записване. Конкретният график, продължителност и такса се уточняват с центъра.')]
}, {
  bookingUrl: 'https://izgrev.netlify.app/', contactUrl: 'https://izgrev.netlify.app/', excerpt: 'ЗАПИСВАНЕ на тел.: 0882 642 103 или 0888 100 098',
  reviewedUrls: ['https://izgrev.netlify.app/'], serviceUrls: ['https://izgrev.netlify.app/'],
  priceSearchNotes: 'Fully read the public one-page enrolment, individual mathematics/English services and contact/footer. Numeric summer-daycare fees are published but no individual-lesson tariff, duration or package price appears. Those unrelated childcare fees are not substituted for teaching prices.',
  notes: 'Owner one-page site contains explicit telephone enrolment, individual English and mathematics lessons up to grade12 and exact Buxton street. This row is only booked teaching, not summer childcare admission. Mon–Fri08:00–18:30 describes the childcare centre and is not claimed as the private lesson schedule. No additional price or booking page is linked for these lessons.'
})

add({
  id: 'sofia-ima-koi-furniture-home-visits', name: 'Има Кой! · сглобяване на мебели', locationKind: 'service_area', category: 'home_services',
  website: 'https://ima-koi.bg/', phone: '+359890424243',
  services: [service('home_services', 'Сглобяване на двукрилен гардероб с панти', 'Ориентировъчен диапазон. Точната крайна цена се потвърждава предварително според модела, размера и сложността след снимка или линк. Мебелните пакети трябва да са в помещението за монтаж; закрепване към стена се уточнява отделно.', {
    price: price(55, 'гардероб · двукрилен с панти', 'https://ima-koi.bg/', { kind: 'range', maximum: 65 }) }),
    service('home_services', 'Сглобяване на двойно легло без повдигащ механизъм', 'Ориентировъчен диапазон; окончателната цена се потвърждава преди посещението според конкретния модел. Пакетите трябва да са в помещението за монтаж. Денят и часът се уговарят предварително.', {
      price: price(45, 'двойно легло без повдигащ механизъм', 'https://ima-koi.bg/', { kind: 'range', maximum: 65 }) })],
  openingHours: hours('https://ima-koi.bg/', [1,2,3,4,5,6,7].map(day => [day, ['09:00','21:00']]))
}, {
  bookingUrl: 'https://ima-koi.bg/', contactUrl: 'https://ima-koi.bg/', excerpt: 'Получаваш точен час за посещението', reviewedUrls: ['https://ima-koi.bg/'],
  notes: 'Reviewed actual on-page quote request first: furniture link/photo followed by callback and agreed visit. Explicit telephone booking and home-visit day/time steps are present. Public HTTP owner HTML was read because web extraction failed; current live range55–65 and45–65 overrides older indexed snippets, not a guessed conversion. FAQ explicitly says work daily09–21. Only one Sofia service-area row; no office/centroid invented and no sample project times imported as durations.'
})

add({
  id: 'sofia-refurnish-furniture-home-visits', name: 'Re-furnish · монтаж и ремонт на мебели', locationKind: 'service_area', category: 'home_services',
  website: 'https://remontnamebeli.com/montaj_na_mebeli.html', phone: '+359988332080',
  services: [service('home_services', 'Сглобяване на легло или спалня', 'Само труд; ДДС и материали не са включени. Отделно се заплаща транспорт/посещение 12,79 €. Денят и часът се записват предварително; изпратете описание или снимка.', {
    price: price(43.46, 'легло/спалня · само труд', 'https://remontnamebeli.com/montaj_na_mebeli.html') }),
    service('home_services', 'Сглобяване на мебелен модул или гардероб', 'Ставка за модул, само труд. Не включва ДДС и материали; транспорт/посещение 12,79 € отделно. Моделът и посещението се уточняват предварително.', {
      price: price(31.70, 'модул · само труд', 'https://remontnamebeli.com/montaj_na_mebeli.html') })]
}, {
  bookingUrl: 'https://remontnamebeli.com/montaj_na_mebeli.html', contactUrl: 'https://remontnamebeli.com/montaj_na_mebeli.html', excerpt: 'трябва да запишете ден и час за посещение',
  reviewedUrls: ['https://remontnamebeli.com/montaj_na_mebeli.html'],
  notes: 'Named owner furniture-assembly service includes explicit Viber/telephone appointment instructions, exact ordinary fees and separate transport/labour/VAT exclusions. Imported two internally consistent dual-currency rows only. Upper kitchen-cabinet row has inconsistent BGN/EUR and is held out, not converted. Partial street without house number is not a public premises address: one Sofia home-visit record. Fragmented Mon/Fri footer labels do not establish a reliable service-week schedule; hours omitted.'
})

add({
  id: 'sofia-vik-maistor-bg-home-visits', name: 'ВиК Майстор БГ · посещения на адрес', locationKind: 'service_area', category: 'home_services',
  website: 'https://vik-maistor.bg/', phone: '+359885239614',
  services: [service('home_services', 'Отпушване на мивка в кухня или баня', 'Начална ориентировъчна цена. Точната сума се определя след диагностика според запушването, достъпа и необходимия метод и се съобщава преди работа. Посещение след уговорка.', {
    price: price(45, 'мивка', 'https://vik-maistor.bg/ceni/', { kind: 'from' }) }),
    service('home_services', 'Отпушване на тоалетна', 'Начална ориентировъчна цена; крайната е след диагностика според запушването, достъпа и необходимия метод. Плановите ремонти се насрочват в работни дни; аварийната линия 24/7 не гарантира незабавен свободен час.', {
      price: price(55, 'тоалетна', 'https://vik-maistor.bg/ceni/', { kind: 'from' }) })]
}, {
  bookingUrl: 'https://vik-maistor.bg/', contactUrl: 'https://vik-maistor.bg/kontakti/', excerpt: 'За планови ремонти обикновено насрочваме час в работни дни.',
  reviewedUrls: ['https://vik-maistor.bg/', 'https://vik-maistor.bg/kontakti/', 'https://vik-maistor.bg/ceni/'],
  notes: 'Followed owner quote/contact entry and read actual phone workflow, service menu and price conditions. Homepage explicitly distinguishes scheduled weekday planned repairs from24/7 emergencies. One provider across all Sofia; generic Krasna Polyana footer is not imported as a premises. Emergency24/7 cannot be encoded as ordinary appointment hours without conflating the two. Two literal from prices only; no diagnosis/arrival duration guessed.'
})

const belContact = 'https://shkolabel.org/контакти/'
add({
  id: 'sofia-shkola-bel-tri-ushi1', name: 'Школа БЕЛ · индивидуална подготовка', neighborhood: 'Център',
  address: 'София, ул. Три уши 1', category: 'education', website: 'https://shkolabel.org/', phone: '+359887276036',
  services: [7,12].map(grade => service('education', `Индивидуална подготовка по БЕЛ за ${grade}. клас`, 'Цена за учебен час от 40 минути, не за цяло посещение. Препоръчват се поне два учебни часа на среща; действителната продължителност се договаря. Предплащане по банка на пакет от 10 учебни часа или друга предварително уговорена схема; двустранно споразумение.', {
    price: price(27, 'учебен час · 40 минути', grade === 7 ? 'https://shkolabel.org/individual7kl/' : 'https://shkolabel.org/individual12/') }))
}, {
  bookingUrl: 'https://shkolabel.org/individual12/', contactUrl: belContact, excerpt: 'Новите курсисти се записват от своите родители/попечители в офиса на школата или чрез дистанционна форма за контакт (телефон, имейл).',
  reviewedUrls: ['https://shkolabel.org/', belContact, 'https://shkolabel.org/individual7kl/', 'https://shkolabel.org/individual12/'],
  notes: 'Actual homepage enrol entry opens contact form with individual-preparation option; both grade-specific service/fee pages explicitly permit phone enrolment. Contact page publishes TriUshi1, not an inferred map coordinate. Each page separately states27EUR per40-minute academic hour, ten-hour advance package/agreed alternative, and mutually agreed visit length. Recommended80minutes is NOT fixed duration. No weekly teaching schedule published.'
})

add({
  id: 'sofia-atelie33a-james-bourchier33a', name: 'Ателие 33А · рисуване за възрастни', neighborhood: 'Лозенец',
  address: 'София, кв. Лозенец, бул. Джеймс Баучер 33А', category: 'education', website: 'https://atelie33.wordpress.com/', phone: '+359899284832',
  services: [service('education', 'Курс по рисуване за възрастни', 'За любители на изкуствата, с предварително записване. Съботна група 14:30–17:30. Материалите се осигуряват от курсистите; таксата се уточнява с школата.')],
  openingHours: hours('https://atelie33.wordpress.com/', [[6,['14:30','17:30']]])
}, {
  bookingUrl: 'https://atelie33.wordpress.com/', contactUrl: 'https://atelie33.wordpress.com/', excerpt: 'КУРСОВЕ ЗА ВЪЗРАСТНИ с предварително записване на телефон 0899 28 48 32',
  reviewedUrls: ['https://atelie33.wordpress.com/'], serviceUrls: ['https://atelie33.wordpress.com/'],
  priceSearchNotes: 'Fully read the owner-hosted public school page: adult course description, explicit telephone reservation, full address, adult Saturday14:30–17:30 schedule and participant-supplied materials. There is no numeric course fee or linked tariff/booking menu on this page.',
  notes: 'Owner WordPress page is both actual telephone enrolment and service description. Imported only explicitly prebooked adult course; published Tuesday–Thursday and earlier Saturday school periods are not mixed into this one-service schedule. Variable two-or-three-hour general visits do not establish a universal fixed lesson duration; duration field absent. Numeric prices genuinely not listed on the reviewed public page.'
})

const yanaWebsite = 'https://urociporisuvane.eu/'
const yanaGroups = 'https://urociporisuvane.eu/групи/'
const yanaPrices = 'https://urociporisuvane.eu/цени/'
const yanaContact = 'https://urociporisuvane.eu/контакт/'
for (const branch of [
  { id: 'sofia-yana-kazakova-trepetlika12', name: 'Рисувай с Яна · Мечталище', neighborhood: null, address: 'София, ул. Трепетлика 12, читалище Мечталище', description: 'Две съботни групи: 1–3 клас 13:00–15:00 и 4–6 клас 15:15–17:15; максимум 10 деца в група, с предварително записване.', days: [[6,['13:00','15:00'],['15:15','17:15']]] },
  { id: 'sofia-yana-kazakova-soho-iskar4', name: 'Рисувай с Яна · SOHO', neighborhood: 'Център', address: 'София, ул. Искър 4, SOHO', description: 'Смесена група за деца 1–6 клас в четвъртък 18:00–20:00; максимум 10 деца, с предварително записване.', days: [[4,['18:00','20:00']]] }
]) add({
  id: branch.id, name: branch.name, neighborhood: branch.neighborhood, address: branch.address, category: 'education', website: yanaWebsite, phone: '+359885794057',
  services: [service('education', 'Групов урок по рисуване за деца · единично посещение', `${branch.description} Публикуваната цена е за единично посещение, не за четириседмичния пакет.`, { ...duration(120, yanaPrices), price: price(25, 'единично посещение · 2 астрономически часа', yanaPrices) })],
  openingHours: hours(yanaGroups, branch.days)
}, {
  bookingUrl: yanaGroups, contactUrl: yanaContact, excerpt: 'Предварително записване.', reviewedUrls: [yanaWebsite,yanaGroups,yanaPrices,yanaContact],
  notes: `Owner groups page separately identifies this actual teaching venue (${branch.address}), grade range, maximum group size and advance enrolment. Own website footer publishes booking phone and advance-registration requirement. Public HTTP was used after reader cache misses for groups/prices/contact; full pages were accessible. Ordinary25EUR two-hour single visit imported, not voucher,15EUR trial or85EUR attendance-bound package. Private home lesson venue and address are not published or inferred. No customer form submitted.`
})

const royanaChildren = 'https://www.royana-bg.com/рисуване-за-деца/'
const royanaContact = 'https://www.royana-bg.com/контакти/'
add({
  id: 'sofia-royana-art-tsar-samuil22', name: 'Арт клуб Рояна', neighborhood: 'Център', address: 'София, ул. Цар Самуил 22',
  category: 'education', website: 'https://www.royana-bg.com/', phone: '+359888843644',
  services: [service('education', 'Рисуване, приложни техники и керамика за деца 6–8 години', 'Съботна група 11:00–12:30, с предварително записване по телефона. Цена за единично занимание; плащане по банков път или в брой. Не включва отделната неделна тарифа при работа с маслени бои.', {
    ...duration(90, royanaChildren), price: price(15, 'единично занимание', royanaChildren) })],
  openingHours: hours(royanaChildren, [[6,['11:00','12:30']]])
}, {
  bookingUrl: royanaChildren, contactUrl: royanaContact, excerpt: 'записванията са отворени, обадете ни се!',
  reviewedUrls: ['https://www.royana-bg.com/',royanaChildren,royanaContact,'https://www.royana-bg.com/рисуване-за-възрастни/'],
  notes: 'Read real telephone enrolment within specific children service page before the dedicated contact and ordinary single-visit tariff. Selected only explicit Saturday6–8year group11–12:30, not every child/adult opening hour.15EUR ordinary single visit differs from25EUR Sunday oils,55EUR four-lesson card and seasonal workshop/deposit; those are not substituted. Conflicting adult/teen Sunday durations do not affect imported Saturday group. No images, ratings or map points copied.'
})

const prestigeWebsite = 'https://www.prestige.bg/'
const prestigeCourse = 'https://www.prestige.bg/angliiski-1-3-klas'
const prestigeBooking = 'https://www.prestige.bg/zapisvane-deca-angliiski'
const prestigeContact = 'https://www.prestige.bg/contacts'
for (const branch of [
  ['sofia-prestige-motopista-vaccarini7a','Мотописта','София, кв. Мотописта, ул. Риккардо Ваккарини 7А, вход откъм ул. Славовица'],
  ['sofia-prestige-dondukov57g','Паметник Левски','София, бул. Княз Александър Дондуков 57Г, партер, вход от бул. Васил Левски'],
  ['sofia-prestige-mladost-malinov51','Младост','София, бул. Александър Малинов 51, Метро Сити, ет. 2'],
  ['sofia-prestige-lyulin160','Люлин 10','София, ж.к. Люлин 10, бл. 160, ет. 1 над партер'],
  ['sofia-prestige-vazrazhdane-bl2','Зона Б-5','София, Зона Б-5, бл. 2, до вход А']
]) add({
  id: branch[0], name: `Езикова школа ПРЕСТИЖ · ${branch[1]}`, neighborhood: ['Паметник Левски','Младост'].includes(branch[1]) ? null : branch[1], address: branch[2],
  category: 'education', website: prestigeWebsite, phone: '+359896650196', booking: { kind: 'form', url: prestigeBooking },
  services: [service('education', 'Групов английски език за ученици 1–3 клас · годишно обучение', 'Такса за цялата учебна 2026/27 година, не за посещение. Диапазонът зависи от основанията за отстъпки; учебният комплект 55 € е отделно. Една или две вноски; втората до 31.01.2027. Нивото и точният график се потвърждават при записване.', {
    price: price(780, 'учебна 2026/27 година', prestigeCourse, { kind: 'range', maximum: 890 }) })]
}, {
  bookingUrl: prestigeBooking, contactUrl: prestigeContact, excerpt: 'Ние ще се свържем с вас, за да уточним подробностите за тестуване и график.',
  reviewedUrls: [prestigeWebsite,prestigeBooking,prestigeCourse,prestigeContact,'https://www.prestige.bg/za-shkolata?tab=mprestige'],
  notes: `Actual enrolment form explicitly offers ${branch[1]} as teaching-base selection; contact page separately confirms actual classes and this precise venue. Same named1–3grade programme page presents its2026/27 tuition range780–890EUR and explicitly lists these teaching bases; no unrelated branch or staff tariff inferred.55EUR book set separate. Price is whole annual programme, not per meeting. Source has inconsistent generic60/80-minute prose, so duration omitted. Administrative/test hours not teaching hours; weekly availability not invented. Existing Manastirski/Borovo/Buxton records excluded.`
})

const ewaWebsite = 'https://englishworldacademy.com/'
const ewaBooking = 'https://englishworldacademy.com/записване/'
const ewaService = 'https://englishworldacademy.com/индивидуално-обучение/'
const ewaContact = 'https://englishworldacademy.com/контакти/'
for (const branch of [
  ['sofia-english-world-tsar-shishman43','Цар Шишман','София, ул. Цар Шишман 43'],
  ['sofia-english-world-slavyanska9','Славянска','София, ул. Славянска 9']
]) add({
  id: branch[0], name: `English World Academy · ${branch[1]}`, neighborhood: 'Център', address: branch[2], category: 'education', website: ewaWebsite, phone: '+359876982997',
  booking: { kind: 'form', url: ewaBooking },
  services: [service('education', 'Индивидуални уроци по английски език', 'Ставка за академичен час; минимален курс 10 академични часа. Началото задължително се предхожда от безплатно интервю-консултация за ниво и индивидуален график. Консултацията и записването са в офиса на ул. Цар Шишман 43.', {
    price: price(20.45, 'академичен час · минимум 10 часа за курс', ewaService) })]
}, {
  bookingUrl: ewaBooking, contactUrl: ewaContact, excerpt: 'Запиши се за интервю - консултация', reviewedUrls: [ewaWebsite,ewaBooking,ewaService,ewaContact],
  notes: `Read actual free interview appointment form with preferred consultation time, then individual tuition tariff and contact/footer. The individual service explicitly permits choosing between BOTH teaching offices (${branch[2]}); separate contact confirms both addresses and centralizes interview/enrolment at TsarShishman43. Ordinary20.45EUR per academic hour with ten-hour course minimum retained; not the price of an entire course. Academic-hour minutes and weekly teaching hours are not specified, so none inferred. No submission, calendar availability or third office claimed.`
})

const eliteWebsite = 'https://fotovideoelite.com/foto-studio-sofia/'
const eliteService = 'https://fotovideoelite.com/detski-i-semeini-fotosesii/'
add({
  id: 'sofia-fotovideo-elite-dimitar-tsolov9', name: 'Студио Фото Видео Елит · София', neighborhood: 'Витоша',
  address: 'София, кв. Витоша, ул. Димитър Цолов 9, бл. 9', category: 'other', website: eliteWebsite, phone: '+359878790122',
  services: [service('other', 'Детска фотосесия · Мини · 5 кадъра', 'Пакет в студио с 5 обработени кадъра, 5 разпечатани снимки 10×15 см и персонална онлайн галерия, до 5 членове на семейството. Заснемане до 1 час; конкретният свободен час се уточнява предварително по телефона.', {
    price: price(39, 'студиен пакет · 5 обработени кадъра', eliteService) })]
}, {
  bookingUrl: eliteService, contactUrl: 'https://fotovideoelite.com/kontakti/', excerpt: 'За въпроси и уточняване на свободен час се свържете с нас на 0878 790 122.',
  reviewedUrls: [eliteWebsite,eliteService,'https://fotovideoelite.com/kontakti/','https://fotovideoelite.com/koledni-fotosesii-sofia-2026/'],
  notes: 'Followed actual service enquiry/booking contact and read the named Sofia-studio programme, dedicated family/child package menu and contact. This exact menu independently repeats the Sofia booking phone, so no Plovdiv branch tariff inferred.39EUR is whole five-image/print package, not individual print or shop admission. Maximum one hour is not fixed duration. Christmas menu reviewed but no seasonal offer imported. Contact has no weekly studio/appointment schedule; no hours guessed and no maps opened.'
})

const photoboxWebsite = 'https://www.photobox.bg/'
const photoboxService = 'https://www.photobox.bg/fotograf-novorodeni-sofia'
const photoboxContact = 'https://www.photobox.bg/kontakti'
add({
  id: 'sofia-photobox-sevdalina-georgi-yolov15', name: 'PhotoBox by Sevdalina · София',
  address: 'София, ул. Проф. Георги Йолов 15', category: 'other', website: photoboxWebsite, phone: '+359877541911',
  booking: { kind: 'form', url: photoboxContact },
  services: [service('other', 'Фотосесия на новородено · Малки моменти', 'Пакет с 10 избрани снимки, 10 принта 10×15 см и 1 принт 15×21 см; повито бебе и семейни пози. Препоръчва се запазване на термин преди раждането; точната дата се уточнява след него. Най-подходящи са първите 5–14 дни; възможностите след това се обсъждат.', {
    ...duration(90, photoboxService), price: price(350, 'пакет · 10 снимки и включени принтове', photoboxService) })]
}, {
  bookingUrl: photoboxContact, contactUrl: photoboxContact, excerpt: 'Изпрати ми запитване:',
  reviewedUrls: [photoboxWebsite,photoboxContact,photoboxService],
  notes: 'Actual Save Photoshoot entry opens owner enquiry form with city, service and birth-term inputs. Separate Sofia newborn service page confirms350EUR SmallMoments, ninety minutes, ten images/prints and scheduling around birth; not the Ruse price guessed from a chain-wide page. Contact explicitly lists a separate Sofia studio atGeorgiYolov15; only that actual venue imported. Generic weekday09–16 follows both city blocks and cannot safely be assigned to Sofia visits, so omitted. No guide-download newsletter signup submitted; Instagram embeds/photos ignored.'
})

const svetoveWebsite = 'https://svetove.bg/'
const svetovePrices = 'https://svetove.bg/pages-8-ceni'
add({
  id: 'sofia-svetove-tsar-boris287', name: 'Учебен център Светове · пиано за деца',
  address: 'София, бул. Цар Борис III 287, локално платно в посока центъра', category: 'education', website: svetoveWebsite, phone: '+359878100975',
  services: [service('education', 'Индивидуален урок по пиано за деца 4,5–7 години', 'Целогодишно записване; обикновена такса за един 30-минутен учебен час. Начинът и периодът на плащане се уточняват по телефона. Намалената ставка за второ дете или комбинирано обучение не е приложена към тази цена.', {
    ...duration(30, svetovePrices), price: price(18, 'учебен час по пиано · 30 минути', svetovePrices) })]
}, {
  bookingUrl: svetovePrices, contactUrl: 'https://svetove.bg/contacts', excerpt: 'Записването е целогодишно. Повече информация за начина (и периода) на плащане, на посочения телефон: 0878/100 975.',
  reviewedUrls: [svetoveWebsite,svetovePrices,'https://svetove.bg/pages-3-piano','https://svetove.bg/pages-4-usloviia','https://svetove.bg/contacts'],
  notes: 'Owner piano-price section itself is the year-round telephone enrolment entry and gives18EUR/30minutes; owner contact separately confirmsTsarBorisIII287. Ordinary rate imported, not conditional16EUR sibling/combined rate. Discovery merchant profile elsewhere carried an older15.34EUR figure; only current own-site tariff is used, no third-party fee copied. Own Conditions link is an accessible coming-soon placeholder, not hidden pricing. No lesson-week hours published on price/service/contact/footer. Piano age range4.5–7 is explicit owner header, not inferred from general language-course ages.'
})

const mnogoznaykoWebsite = 'https://mnogoznayko.bg/'
const mnogoznaykoService = 'https://mnogoznayko.bg/urotsi/individualni-urotsi/individualni-urotsi/'
add({
  id: 'sofia-mnogoznayko-dimitar-petkov72g', name: 'Учебен център Многознайко · Димитър Петков',
  address: 'София, ул. Димитър Петков 72Г, ет. 1, ап. 5', category: 'education', website: mnogoznaykoWebsite, phone: '+359895400145',
  services: [service('education', 'Индивидуални уроци · пакет 4 астрономически часа', 'Абонамент за 4 астрономически часа, до 30 дни, с включено ДДС; за ученици 6–18 години. БЕЛ, математика, английски, руски или италиански. Пакетът допуска комбинирани предмети или две деца от едно семейство. Графикът се договаря и записването се потвърждава от екипа.', {
    price: price(139.27, 'пакет · 4 астрономически часа, до 30 дни', mnogoznaykoService) })]
}, {
  bookingUrl: mnogoznaykoService, contactUrl: 'https://mnogoznayko.bg/kontakt/', excerpt: 'Попълнете формуляр или се обадете по телефон.',
  reviewedUrls: [mnogoznaykoWebsite,'https://mnogoznayko.bg/urotsi/proben-urok/',mnogoznaykoService,'https://mnogoznayko.bg/tseni/','https://mnogoznayko.bg/za-nas/tsentar/','https://mnogoznayko.bg/kontakt/','https://mnogoznayko.bg/obshti-usloviya'],
  notes: 'Actual enrolment form and explicit phone booking reviewed before individual-lesson inventory and dedicated tariff. Imported only central teaching venue independently confirmed by location/contact and exact service footer; Mladost/OvchaKupel are not cloned.139.27EUR is the whole4-astronomical-hour subscription valid up to30days, not per visit; the page explicitly permits multiple subjects/two siblings. Different academic-hour packs and generic trial-page single rates are not equated. Terms require team callback confirmation and protect confirmed fees; no copied media/creative text or customer submission. No weekly lesson hours published.'
})

export default { records, reviews }
