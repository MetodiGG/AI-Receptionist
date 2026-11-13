// Explicit source review, 2026-11-10. This is not crawler output or a price
// estimate. Keep branch, staff, size, unit and starting-price qualifications.
import reviewedIdentities from './pricing-booking-review-identities-20261110.json' with { type: 'json' }
import { PRICING_EXPANSION_REVIEWS } from './pricing-expansion-20261110.mjs'
import { NEIGHBORHOOD_20261111_REVIEWS } from './neighborhood-expansion-20261111.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS } from './neighborhood-expansion-20261113.mjs'
const checkedOn = '2026-11-10', validUntil = '2027-02-08'
const price = (amount, sourceUrl, options = {}) => ({ amount, currency: 'EUR', kind: 'fixed', sourceUrl, checkedOn, validUntil, ...options })
const service = (name, amount, sourceUrl, options = {}) => ({
  name, category: options.category || 'pets', appointmentModel: options.appointmentModel || 'appointment',
  ...(options.description ? { description: options.description } : {}),
  price: price(amount, sourceUrl, options.price),
  ...(options.minutes ? { durationMin: options.minutes, durationSourceUrl: options.durationSource || sourceUrl, durationCheckedOn: checkedOn } : {}),
})
const range = (name, low, high, sourceUrl, options = {}) => service(name, low, sourceUrl, { ...options, price: { ...options.price, kind: 'range', maximum: high } })

const mokro = 'https://www.mokronosle.com/'
const tobby = 'https://tobby.bg/ceni'
const petstop = 'https://petstopplace.com/services'
const kaya = 'https://www.kaya-grooming.com/ценоразпис'
const kayaBooking = 'https://www.kaya-grooming.com/book-online'
const cut = 'https://www.cutnchill.com/rezervirai'
const auto = 'https://autosteamclean.com/mobilna-avtomivka/'
const autoDetail = 'https://autosteamclean.com/prane-sedalki-prane-na-salon/'
const elgato = 'https://www.elgatobeauty.com/'
const kristina = 'https://kristinasungarska.bg/uslugi'
const rock = 'https://rockschool.bg/bg/info/prices'
const vaya = 'https://vayasport.bg/cenorazpis/'
const clean = 'https://cleandirect.bg/cenova-lista'
const physio = 'https://physiohome.bg/services/domashna-rehabilitatsiya/'
const physioChild = 'https://physiohome.bg/services/detska-rehabilitatsiya/'
const physioMassage = 'https://physiohome.bg/services/masazhi-u-doma/'
const physioBaby = 'https://physiohome.bg/services/bebeshki-grizhi/'
const carbox = 'https://carboxbg.com/uslugi/'
const sgumi = 'https://s-gumi.bg/'
const cocktail = 'https://nailcocktailboutique.com/uslugi-manikyur-sofia/'
const vasilena = 'https://vasilenahristova.com/zapazi-chas/'
const vasilenaPrices = 'https://vasilenahristova.com/ceni/'
const laser = 'https://laserexpert.bg/bg/ceni/'
const luxury = 'https://luxurynails.bg/услуги/'
const luxuryBooking = 'https://luxurynails.bg/запази-час/'
const skin = 'https://skindesign.bg/цени/'
const mieli = 'https://mielimassage.studio/masaji-sofia'
const marani = 'https://marani-cleaning.com/osnovno-pochistvane'
const maraniRepair = 'https://marani-cleaning.com/pochistvane-sled-remont'
const borisov = 'https://borisov-clean.com/abonamentno-pochistvane-na-domove/'
const borisovGeneral = 'https://borisov-clean.com/osnovno-pochistvane-na-domove/'
const clean2win = 'https://clean2win.com/kalkulator.html'
const fetish = 'https://fetishhairatelier.com/services/'
const newway = 'https://newwaygym.bg/prices/'
const legal = 'https://legalmasters.bg/online-uslugi/sadebni-dela/consultation/'
const noxic = 'https://noxicbeauty.com/services/manicure/'
const noxicHair = 'https://noxicbeauty.com/services/hairdresser/'
const noxicPedicure = 'https://noxicbeauty.com/aesthetic_pedicure/'
const sofiaVet = 'https://sofiavetclinic.bg/uslugi/gruuming/'
const monster = 'https://monstercleaning.com/bg/цени/'
const cityVet = 'https://www.cityclinic.vet/ценоразпис/'
const pink = 'https://pinkcormorant.com/klasove-i-ceni/'
const nirvana = 'https://nirvanabyhv.bg/'
const coatNote = 'Цената зависи от породата, размера и състоянието на козината.'
const kayaNote = 'Публикувана основна цена; при извънредно време заради хигиената е възможно увеличение до 20%.'

// Each of these 43 Sofia locations was selected in the rendered owner booking
// UI. The two gender menus were compared separately. Do not infer the male
// intimate zone at locations where that menu item is absent. Durations differ
// by branch and are deliberately not copied from a neighbouring salon.
const gpointBooking = 'https://gpoint.bg/запазване-час'
const gpointLocations = [
  ['five-corners', '5-те Кьошета'], ['borovo', 'Борово'], ['studentski-zimen-dvorets', 'Студентски град - Зимен дворец'],
  ['ovcha-kupel-nbu', 'Овча Купел - НБУ'], ['geo-milev', 'Гео Милев'], ['lyulin-10', 'Люлин 10'],
  ['mladost-1', 'Младост 1'], ['dondukov', 'Дондуков'], ['lozenets', 'Лозенец'], ['hladilnika', 'Хладилника'],
  ['suhata-reka', 'Сухата река'], ['nadezhda-5', 'Надежда 5'], ['zona-b19', 'Зона Б19'], ['mladost-4', 'Младост 4'],
  ['lyulin-7', 'Люлин 7'], ['dianabad', 'Дианабад'], ['stadion-vasil-levski', 'Стадион Васил Левски'],
  ['manastirski-iztok', 'Манастирски ливади - Изток'], ['reduta', 'Редута'], ['nadezhda-2', 'Надежда 2'],
  ['sadebna-palata', 'Съдебна палата'], ['druzhba-2', 'Дружба 2'], ['manastirski-zapad', 'Манастирски ливади - Запад'],
  ['dragalevtsi', 'Драгалевци'], ['iztok', 'Изток'], ['vma', 'Военномедицинска Академия'], ['ovcha-kupel-2', 'Овча Купел 2'],
  ['hadzhi-dimitar', 'Хаджи Димитър'], ['mladost-2', 'Младост 2'], ['sveta-troitsa', 'Света Троица'],
  ['darvenitsa', 'Дървеница'], ['banishora', 'Банишора'], ['ovcha-kupel-lyublyana', 'Овча Купел - Любляна'],
  ['lyulin-8', 'Люлин 8'], ['studentski-nikola-gabrovski', 'Студентски град - Никола Габровски'], ['vitosha', 'Витоша'],
  ['druzhba-1', 'Дружба 1'], ['mladost-3', 'Младост 3'], ['belite-brezi', 'Белите брези'],
  ['krasna-polyana', 'Красна поляна'], ['levski-g', 'Левски Г'], ['ovcha-kupel-mizia', 'Овча Купел 1 - Мизия'], ['nadezhda-1', 'Надежда 1'],
]
const gpointMaleIntimate = new Set(['five-corners', 'lozenets', 'zona-b19', 'hladilnika', 'manastirski-iztok', 'manastirski-zapad', 'suhata-reka', 'nadezhda-5', 'lyulin-10'])
const gpointWomen = [['Цяло лице', 30], ['Гърди', 24], ['1/2 корем', 24], ['Ръце', 28], ['1/2 ръце', 19], ['Мишници', 19], ['Пълен интим', 24], ['Цели крака', 45], ['Шия', 13], ['Врат', 13], ['Корем – лента', 13], ['Гръб', 32], ['Кръст', 27], ['Седалище', 24], ['Горна устна', 13], ['Брадичка', 13], ['Бакенбарди', 11], ['Скули', 11], ['Бедра', 27], ['Подбедрици', 27], ['Ареоли', 13], ['Бикини', 19], ['Уши', 13], ['Корем', 32]]
const gpointMen = [['Гръб', 54], ['Рамене', 25], ['Мишници', 22], ['Гърди', 35], ['Корем', 35], ['Кръст', 35], ['Седалище', 35], ['Ръце', 41], ['1/2 ръце', 25], ['Бедра', 49], ['Подбедрици', 41], ['Крака - бедра, подбедрици', 76], ['Шия', 17], ['Врат', 17], ['Уши', 15], ['Скули', 18], ['Цяло лице', 41]]
const gpointService = (name, amount, gender) => service(`Лазерна епилация · ${name} · ${gender}`, amount, gpointBooking, {
  category: 'beauty', price: { unit: 'процедура', validUntil: '2026-11-17' },
  description: 'Текуща цена с отстъпка, валидна САМО при онлайн записване, проверена на 10.11.2026. Условията се потвърждават при записване; не е зачеркнатата стара цена.',
})

const headBooking = 'https://head-hunters.net/rezervatsia'
const headServiceNames = ['Мъжко подстригване', 'Комбо (подстригване + оформяне на брада)', 'Бръснене на глава', 'Бръснене на глава + оформяне на брада', 'Камуфлиране на коса', 'Оформяне на брада + боядисване', 'Кралско бръснене', 'Комплексно почистване на лице', 'Баща и син', 'Оформяне на брада (мустаци)', 'Подстригване с машинка (1номер)']
// Min/max bounds are literal published choices in that branch's actual
// specialist dropdowns, not the chain-wide junior/chief teaser tariff.
const headMenus = [
  ['alabin', 6, [[23,25.5],[33,35.5],[23,25.5],[33,35.5],[23,35],[28,30.5],[20,23],[17.5,20],[43,48.5],[17.5,17.5],[17.5,17.5]]],
  ['lozenets', 8, [[20,25.5],[28,35.5],[23,25.5],[28,35.5],[23,35],[28,30.5],[20,23],null,[38,48.5],[12.5,17.5],[15,17.5]]],
  ['levski', 7, [[20,25.5],[28,35.5],[20,25.5],[28,35.5],[23,35],[25.5,30.5],[17.5,23],[20,20],[38,48.5],[12.5,17.5],[15,17.5]]],
  ['ruski-pametnik', 8, [[20,25.5],[28,35.5],[23,25.5],[28,35.5],[23,35],[25.5,30.5],[17.5,23],[17.5,20],[38,48.5],[12.5,17.5],[15,17.5]]],
  ['academy', 8, [[20,35],[28,60],[23,25.5],[28,51],[23,35],[28,35.5],[20,27],[17.5,23],[38,48.5],[12.5,28],[15,25.5]]],
  ['dondukov', 6, [[10,25.5],[12.5,35.5],[20,25.5],[12.5,35.5],[23,35],[25.5,30.5],[17.5,23],[20,20],[20,48.5],[6,17.5],[6,17.5]]],
  ['mladost', 6, [[10,23],[12.5,33],[23,23],[12.5,33],null,[25.5,28],[17.5,20],null,[20,43],[6,17.5],[6,17.5]]],
]

// Each salon's own price/contact section was read; the two academies have
// different tariffs and must never inherit the regular salon menu.
const stephanSalonHair = [
  ['ESSENTIALS с дамско подстригване и сешоар', 38], ['Мъжко подстригване', 22], ['Детско подстригване до 7 години без измиване', 21], ['ESSENTIALS със сешоар', 32],
  ['ESSENTIALS+ с дамско подстригване и сешоар', 50], ['ESSENTIALS+ със сешоар', 45], ['REGENERATE с дамско подстригване и сешоар', 57], ['REGENERATE със сешоар', 50],
  ['Molecular hair refilling+ с подстригване и сешоар', 60], ['Molecular hair refilling+ със сешоар', 54],
  ['Стайлинг с преса · добавка', 26], ['Стайлинг с маша · добавка', 31], ['Официална прическа', 60], ['Къдрене', 60], ['Мъжко къдрене', 35], ['Плитка', 10], ['Оформяне на бретон', 10],
  ['Боядисване INOA · ½ боя', 32], ['Боядисване INOA · 1 боя', 48], ['Боядисване ILLUMINA · ½ боя', 32], ['Боядисване ILLUMINA · 1 боя', 48],
  ['Боядисване KOLESTON · ½ боя', 30], ['Боядисване KOLESTON · 1 боя', 41], ['Боядисване DIA · ½ боя', 25], ['Боядисване DIA · 1 боя', 34],
  ['Боядисване COLOR TOUCH · ½ боя', 25], ['Боядисване COLOR TOUCH · 1 боя', 34], ['Боядисване American Crew · 1 доза за мъже', 25],
  ['Обезцветяване Blondor или Efassor · 20 г / 1 прах', 30], ['Обезцветяване Blondys · 1 прах', 30], ['Обезцветяване Blondys · 3 праха', 43],
  ['Кичури · ½ боя', 37], ['Кичури · 1 боя', 48], ['Балеаж · ½ доза', 37], ['Балеаж · 1 доза', 50],
  ['Матиране · без сешоар', 28], ['Матиране INOA или ILLUMINA · 1 боя', 36], ['Матиране SHINEFINITY · 1 боя', 30], ['Матиране DIA или COLOR TOUCH · 1 боя', 28], ['Гланциране · без сешоар', 28],
]
const stephanSalonNails = [['Маникюр с обикновен лак',25],['Маникюр с гел лак',32],['Френски маникюр с лак',27],['Френски маникюр с гел лак',38],['Педикюр с обикновен лак',32],['Педикюр с гел лак',38],['Френски педикюр с обикновен лак',33],['Френски педикюр с гел лак',40],['Изграждане на нокти',74],['Поддръжка на изградени нокти',50],['Маникюр без лак',22],['Педикюр без лак',30],['Сваляне на гел лак и оформяне',20],['Класически мъжки маникюр',20],['Класически мъжки педикюр',28],['Лепене на един нокът',3],['Изграждане на един нокът',7],['Хидратираща терапия за ръце',11],['Anti-Age терапия за ръце',14],['Хидратираща СПА терапия за крака',19],['Възстановяваща терапия за крака',24]]
const stephanAcademyHair = [['Дамско подстригване със стайлинг',18],['Подстригване',13],['Стайлинг със сешоар',12],['Стайлинг с преса или маша',16],['Официална прическа',25],['Боядисване INOA · 1 боя',27],['Боядисване INOA · ½ боя',17],['Боядисване ILLUMINA · 1 боя',27],['Боядисване ILLUMINA · ½ боя',17],['Боядисване KOLESTON · 1 боя',23],['Боядисване KOLESTON · ½ боя',14],['Боядисване DIA · 1 боя',20],['Боядисване DIA · ½ боя',14],['Боядисване Color Touch · 1 боя',19],['Боядисване Color Touch · ½ боя',13],['Балеаж · ½ доза',18],['Балеаж · 1 доза',28],['Матиране',19],['Гланциране',19],['Къдрене',28],['Боядисване American Crew',19],['Терапия awapuhi',29],['Поставяне на ампула',11],['Терапия Hydra Gloss и сешоар',27],['Матиране Shinefinity',20],['Емулсия System Professional',13],['Инфузия System Professional',17],['LiquidHair рефилър',22]]
const stephanAcademyNails = [['Маникюр с обикновен лак',10],['Маникюр с гел лак',13],['Френски маникюр с лак',11],['Френски маникюр с гел лак',14],['Педикюр с обикновен лак',13],['Педикюр с гел лак',18],['Френски педикюр с обикновен лак',15],['Френски педикюр с гел лак',20],['Изграждане на нокти',31],['Маникюр без лак',7],['Педикюр без лак',11],['Сваляне на гел лак и оформяне',8],['Класически мъжки маникюр',7],['Класически мъжки педикюр',11],['Лепене на един нокът',3],['Изграждане на един нокът',3],['Хидратираща терапия за ръце',11],['Anti-Age терапия за ръце',14],['Хидратираща СПА терапия за крака',19],['Възстановяваща терапия за крака',24]]
const stephanMenus = [
  ['sofia-stephan-mladost', 'mladost', stephanSalonHair, stephanSalonNails],
  ['sofia-stephan-lagera', 'lagera', stephanSalonHair, stephanSalonNails],
  ['sofia-stephan-oborishte', 'oborishte', stephanSalonHair, stephanSalonNails],
  ['sofia-stephan-iztok', 'iztok', stephanSalonHair, stephanSalonNails],
  ['sofia-stephan-borovo', 'borovo', stephanSalonHair, stephanSalonNails],
  ['sofia-stephan-academy-stephan', 'academy-stephan', stephanAcademyHair, []],
  ['sofia-stephan-nails-academy', 'stephan-nails-academy-salon', [], stephanAcademyNails],
]

const weightLabels = ['до 4 кг', '4–8 кг', '8–20 кг', '20–35 кг', 'над 35 кг']
const kayaRow = (name, amounts, minutes) => amounts.flatMap((amount, index) => amount == null ? [] : [service(`${name} · ${weightLabels[index]}`, amount, kaya, { description: kayaNote, minutes, durationSource: kayaBooking })])
const nail = (name, amount, extra = {}) => service(`${name} · Мадлена Миткова`, amount, elgato, { category: 'nails', description: 'Публикувана цена при Мадлена Миткова; тарифата при Ирина е отделна.', ...extra })
const genderRows = (rows, url, prefix = 'Лазерна епилация') => rows.flatMap(([name, women, men]) => [women == null ? null : service(`${prefix} · ${name} · жени`, women, url, { category: 'beauty', price: { unit: 'процедура' } }), men == null ? null : service(`${prefix} · ${name} · мъже`, men, url, { category: 'beauty', price: { unit: 'процедура' } })].filter(Boolean))

const initialBookingPriceReviews = [
  {
    id: 'sofia-noxic-beauty', checkedOn, website: 'https://noxicbeauty.com/', bookingEntry: 'phone',
    reviewedUrls: ['https://noxicbeauty.com/', 'https://noxicbeauty.com/запази-час/', noxic, noxicHair, noxicPedicure], bookingReview: 'phone_booking_reviewed',
    notes: 'Opened and rendered the owner booking page first: Booknetic reports no staff found. The existing published phone remains the booking channel. Prices below are the owner service-page EUR tariff, not a working online menu or known slots. Ambiguous combined French/ombre prices and unpriced services omitted; no BGN conversion.',
    services: [
      service('Класически маникюр', 15.34, noxic, { category: 'nails', description: 'Без лак.' }),
      service('Маникюр с гел лак', 28.12, noxic, { category: 'nails', description: 'С каучукова база; декорацията е отделно.' }),
      service('Гел върху естествени нокти · къси', 33.23, noxic, { category: 'nails', description: 'С гел лак, без удължаване.' }),
      service('Гел върху естествени нокти · дълги', 35.79, noxic, { category: 'nails', description: 'С гел лак, без удължаване.' }),
      service('Удължаване на един нокът', 3.58, noxic, { category: 'nails', price: { unit: 'нокът' }, description: 'До два нокътя.' }),
      service('Поправка и укрепване на счупен нокът', 1.53, noxic, { category: 'nails', price: { unit: 'нокът' } }),
      service('Сваляне на гел лак без маникюр', 7.67, noxic, { category: 'nails' }),
      service('Сваляне на гел лак с маникюр и заздравител', 15.34, noxic, { category: 'nails' }),
      service('Сваляне на гел с маникюр без лак', 23.01, noxic, { category: 'nails' }),
      service('Укрепване с акрилна пудра / поддръжка', 30.68, noxic, { category: 'nails' }),
      service('Декорация с брокат, фолио или печат', 0.77, noxic, { category: 'nails', price: { unit: 'нокът' } }),
      service('Декорация със сухи цветя или 3D стикер', 1.79, noxic, { category: 'nails', price: { unit: 'нокът' } }),
      service('Рисувана декорация · опростена', 1.53, noxic, { category: 'nails', price: { unit: 'нокът' } }),
      service('Рисувана декорация · сложна', 2.56, noxic, { category: 'nails', price: { unit: 'нокът' } }),
      service('Класически педикюр без лак', 33, noxicPedicure, { category: 'nails', minutes: 40 }),
      service('Оформяне на ноктите на краката без кожички', 10, noxicPedicure, { category: 'nails' }),
      service('Оформяне на ноктите на краката с кожички', 15, noxicPedicure, { category: 'nails' }),
      service('Изграждане на голям нокът на крака', 5, noxicPedicure, { category: 'nails', price: { unit: 'нокът' } }),
      service('Изграждане на малък нокът на крака', 2.5, noxicPedicure, { category: 'nails', price: { unit: 'нокът' } }),
      service('Сваляне на чужд гел лак · крака', 3, noxicPedicure, { category: 'nails' }),
      service('Сваляне на обикновен лак · крака', 1.5, noxicPedicure, { category: 'nails' }),
      ...[['Дамско подстригване',11.25],['Мъжко подстригване',10.23],['Детско подстригване до 7 г.',9.71],['Подстригване нула номер',8.69],['Оформяне на врат',3.58],['Оформяне на брада',3.58],['Бретон',3.58],['Измиване на коса',3.58],['Сешоар · къса коса',10.23],['Сешоар · средна коса',12.78],['Сешоар · дълга коса',15.34],['Сешоар · много дълга коса',17.9],['Оформяне на букли',20.45],['Плитка рибена кост',6.14]].map(([name, amount]) => service(name, amount, noxicHair, { category: 'hair' })),
      ...[['корени',23.01],['къса коса',23.01],['средна коса',25.56],['дълга коса',28.12],['много дълга коса',30.68]].map(([size, amount]) => service(`Боядисване с материал на салона · ${size}`, amount, noxicHair, { category: 'hair', description: 'Тарифа с материал на салона за 100 г.' })),
      ...[['къса коса',15.34],['средна коса',17.9],['дълга коса',20.45],['много дълга коса',23.01]].map(([size, amount]) => service(`Боядисване с материал на клиента · ${size}`, amount, noxicHair, { category: 'hair', description: 'Клиентът осигурява материала.' })),
    ],
  },
  {
    id: 'sofia-sofia-vet-grooming', checkedOn, website: 'https://sofiavetclinic.bg/', bookingEntry: 'phone',
    reviewedUrls: ['https://sofiavetclinic.bg/', sofiaVet], bookingReview: 'phone_booking_reviewed',
    notes: 'Owner explicitly requires advance appointments and supplies the same phone. Only literal EUR grooming prices imported. Blank dog-weight rows and the separate BGN-only package matrix remain unfilled; no conversion, sedation or medical treatment inferred.',
    services: [
      service('Подстригване на котка',31,sofiaVet,{description:'Без седация; тя не е включена в цената.'}),
      service('Подстригване на куче до 10 кг',31,sofiaVet),
      service('Подстригване на куче от 11 до 25 кг',36,sofiaVet),
      range('Къпане и сушене · котка или куче до 10 кг',16,26,sofiaVet),
      range('Къпане и сушене · куче от 11 до 30 кг',21,31,sofiaVet),
      range('Къпане и сушене · куче над 30 кг',31,41,sofiaVet),
      service('Изрязване на нокти',8,sofiaVet), service('Почистване на уши',11,sofiaVet),
      range('Оформяне на уши и лапи',8,11,sofiaVet),
    ],
  },
  {
    id: 'sofia-monster-cleaning', checkedOn, website: 'https://monstercleaning.com/', bookingEntry: 'phone',
    reviewedUrls: ['https://monstercleaning.com/', monster], bookingReview: 'phone_booking_reviewed',
    notes: 'Bulgarian owner price/booking page, October 2026 tariff, Sofia phone confirmed. Every figure is indicative and subject to an on-site quote, not a guaranteed total. No form submitted and no empty-calculator zero, UK tariff, oven quote or subscription duration invented.',
    services: [
      ...[[45,158],[70,245],[95,333],[130,455]].map(([area, amount]) => service(`Основно почистване / след наематели · до ${area} м²`,amount,monster,{category:'home_services',appointmentModel:'home_visit',price:{unit:'посещение'},description:'Ориентировъчно; след оглед.'})),
      ...[[45,207],[70,322],[95,437],[130,598]].map(([area, amount]) => service(`Почистване след ремонт · до ${area} м²`,amount,monster,{category:'home_services',appointmentModel:'home_visit',price:{kind:'from',unit:'посещение'},description:'Окончателно след оглед.'})),
      ...[[50,41],[70,52],[100,69],[150,92]].map(([area, amount]) => service(`Абонаментно почистване · до ${area} м²`,amount,monster,{category:'home_services',appointmentModel:'home_visit',price:{unit:'посещение'},description:'Ориентировъчно; честотата се уговаря.'})),
      ...[['Диван двойка',35],['Диван тройка',46],['Ъглов холен диван',69],['Ъглов кухненски диван',53],['Фотьойл',21],['Табуретка',15],['Офис стол',12],['Матрак 160×200 · едната страна',35],['Матрак 160×200 · двете страни',69],['Матрак 90×160 · едната страна',18],['Бебешки матрак · двулицев',21],['Килим до 6 м²',28],['Килим до 10 м²',46]].map(([item, amount]) => service(`Пране · ${item}`,amount,monster,{category:'home_services',appointmentModel:'home_visit',price:{unit:'бр.'},description:'Ориентировъчно; след оглед.'})),
    ],
  },
  {
    id: 'sofia-vet-city-nishava', checkedOn, website: 'https://www.cityclinic.vet/', bookingEntry: 'phone',
    reviewedUrls: ['https://www.cityclinic.vet/', 'https://www.cityclinic.vet/contacts/zapishi-chas/', cityVet, 'https://www.cityclinic.vet/en/price-list/'], bookingReview: 'phone_booking_reviewed',
    notes: 'Actual Book an appointment page instructs calling the same Nishava 46 phone. BG and EN tariffs cross-checked: consultation differs (25 vs 30), so that row is omitted. Selected examination/grooming and scaling prices agree. Medical procedures exclude IV placement and anaesthesia; no clinical advice or availability claim.',
    services: [
      service('Ветеринарен преглед',30,cityVet,{category:'other',description:'Първичен преглед; крайната цена зависи от случая.'}),
      service('Повторен ветеринарен преглед',15,cityVet,{category:'other'}),
      range('Специализиран ветеринарен преглед',40,80,cityVet,{category:'other'}),
      service('Второ ветеринарно мнение',40,cityVet,{category:'other'}),
      range('Ветеринарно посещение у дома · София',50,110,cityVet,{category:'other',appointmentModel:'home_visit'}),
      ...[[1,55],[2,65],['3–4',75]].map(([grade, amount]) => service(`Почистване на зъбен камък · степен ${grade}`,amount,cityVet,{category:'other',price:{unit:'процедура'},description:'Без венозен път и анестезия; окончателно след преглед.'})),
      range('Подстригване на котка / куче до 10 кг',35,45,cityVet),
      range('Подстригване на куче над 10 кг',45,55,cityVet,{description:'За над 20 кг има отделна тарифа.'}),
      range('Подстригване на куче над 20 кг',55,80,cityVet),
      service('Къпане, разресване и сушене до 10 кг',25,cityVet),
      range('Къпане, разресване и сушене над 10 кг',30,55,cityVet),
    ],
  },
  {
    id: 'sofia-pink-cormorant', checkedOn, website: 'https://pinkcormorant.com/', bookingEntry: pink,
    reviewedUrls: ['https://pinkcormorant.com/', pink, 'https://pinkcormorant.com/rezervacii/', 'https://pinkcormorant.com/poiskai-oferta/'], bookingReview: 'owned_booking_reviewed',
    notes: 'Followed Reserve a place to the rendered owner event booking menu, including page 2: adult clay 36, wheel 47 and platter 41 agree with the class page. No event/seat selected or paid. Private event per-person starting tariffs and two-person total are separate; Christmas promotions excluded. Package total is not a single visit.',
    services: [
      service('Клас по керамика за възрастни',36,pink,{category:'education',appointmentModel:'group_reservation',minutes:120,price:{unit:'човек'},description:'Група до 8 души.'}),
      service('Керамика и точарско колело',47,pink,{category:'education',appointmentModel:'group_reservation',minutes:180,price:{unit:'човек'},description:'Група до 6 души.'}),
      service('Керамично плато за мезенца',41,pink,{category:'education',appointmentModel:'group_reservation',minutes:150,price:{unit:'човек'},description:'Група до 8 души.'}),
      service('Пакет 4 посещения по избор',160,pink,{category:'education',appointmentModel:'group_reservation',price:{unit:'пакет'},description:'Общо за 4 посещения; валидност 3 месеца.'}),
      ...[['Моминско парти с керамика',180],['Рожден ден с керамика',180]].map(([name, minutes]) => service(name,36,'https://pinkcormorant.com/',{category:'education',appointmentModel:'group_reservation',minutes,price:{kind:'from',unit:'човек'},description:'Частна група до 12 души; след запитване.'})),
      service('Тиймбилдинг с керамика',36,'https://pinkcormorant.com/',{category:'education',appointmentModel:'group_reservation',price:{kind:'from',unit:'човек'},description:'2–3 часа; до 12 души в ателието, след запитване.'}),
      service('Керамика на колело за двойка',160,'https://pinkcormorant.com/',{category:'education',appointmentModel:'group_reservation',minutes:180,price:{unit:'двама'},description:'Обща цена за двама; частно ателие, след запитване.'}),
    ],
  },
  {
    id: 'sofia-hrisiyana-varbanska', checkedOn, website: nirvana, bookingEntry: 'https://superdoc.bg/lekar/hrisiana-varbanska',
    reviewedUrls: [nirvana, 'https://superdoc.bg/lekar/hrisiana-varbanska'], bookingReview: 'provider_booking_reviewed',
    notes: 'Expanded the public Prices section inside the actual Superdoc booking area and cross-checked all six amounts against the owner tariff below. Imported facts come from the owner, not provider reviews or photos. Adults only. No slot selected; calendar interval is not inferred session duration. Package totals remain package totals.',
    services: [
      service('Психологична консултация за възрастни',40,nirvana,{category:'other',description:'Само за възрастни.'}),
      service('Хипнотерапия за възрастни',50,nirvana,{category:'other',description:'Само за възрастни.'}),
      service('Семейна терапия',70,nirvana,{category:'other',description:'Само за възрастни.'}),
      service('Онлайн психологична консултация',40,nirvana,{category:'other',description:'Само за възрастни.'}),
      service('Пакет 5 онлайн консултации',150,nirvana,{category:'other',price:{unit:'пакет'},description:'Общо за пет консултации; само за възрастни.'}),
      service('Пакет 3 психологични консултации',90,nirvana,{category:'other',price:{unit:'пакет'},description:'Общо за три консултации; само за възрастни.'}),
    ],
  },
  ...stephanMenus.map(([id, slug, hair, nails]) => {
    const url = `https://www.stephan.bg/saloni/${slug}`, academy = slug.includes('academy')
    return { id, checkedOn, website: 'https://www.stephan.bg/', bookingEntry: 'phone',
      reviewedUrls: ['https://www.stephan.bg/', url], bookingReview: 'phone_booking_reviewed',
      notes: `Individual salon contact and complete published tariff inspected for ${slug}. Phone booking confirmed. Academy prices are separate trainee/teacher practice services, never regular salon prices. Literal EUR only, no conversion; ingredient doses and add-ons retained. Ambiguous decoration/retail-like serum rows excluded; no made-up duration.`,
      services: [[hair,'hair'],[nails,'nails']].flatMap(([rows, category]) => rows.map(([name, amount]) => service(name, amount, url, { category,
        ...(name.includes('един нокът') ? { price: { unit: 'нокът' } } : {}),
        description: `${academy ? 'Услуга в учебния салон към академията; изпълнението се уточнява при записване. ' : ''}Тарифа за този обект. ${name.includes('добавка') ? 'Добавя се към друга услуга, не е цялостно посещение. ' : ''}Посоченото количество боя или продукт е част от тарифата; не се приема неограничено количество.`,
      }))),
    }
  }),
  ...headMenus.map(([slug, staffCount, amounts]) => ({
    id: `sofia-head-hunters-${slug}`, checkedOn, website: 'https://head-hunters.net/', bookingEntry: headBooking,
    reviewedUrls: ['https://head-hunters.net/', 'https://head-hunters.net/uslugi', headBooking], bookingReview: 'owned_booking_reviewed',
    notes: `Reviewed the actual service dropdown for all ${staffCount} listed specialists in this branch (${49} specialists over seven branches). Bounds retain branch/staff variation. Static chain tariff disagrees for some services, e.g. camouflage, so booking menu takes precedence. No client data entered, slot chosen or reservation submitted.`,
    services: amounts.flatMap((bounds, index) => {
      if (!bounds) return []
      const [low, high] = bounds, options = { category: 'barber', description: 'Цена според избрания специалист в този салон; не всички специалисти предлагат всяка услуга. Точната тарифа се вижда при избора в записването.' }
      return [low === high ? service(headServiceNames[index], low, headBooking, options) : range(headServiceNames[index], low, high, headBooking, options)]
    }),
  })),
  ...gpointLocations.map(([slug, label]) => ({
    id: `sofia-gpoint-${slug}`, checkedOn, website: 'https://gpoint.bg/', bookingEntry: gpointBooking,
    reviewedUrls: ['https://gpoint.bg/', gpointBooking], bookingReview: 'owned_booking_reviewed',
    notes: `Rendered booking menu version6.10.91 reviewed specifically after selecting ${label}, Sofia, in both gender tabs. Import current bold EUR amounts only, not struck-through prices or empty basket zero. Online discounted tariffs have a seven-day review lifetime, not a claimed promotion end date. Branch-specific missing zones retained. No service/date/slot selected or reservation submitted; differing branch durations not copied.`,
    services: [...gpointWomen.map(([name, amount]) => gpointService(name, amount, 'жени')),
      ...gpointMen.map(([name, amount]) => gpointService(name, amount, 'мъже')),
      ...(gpointMaleIntimate.has(slug) ? [gpointService('Интим', 30, 'мъже')] : [])],
  })),
  {
    id: 'sofia-clean2win', checkedOn, website: 'https://clean2win.com/', bookingEntry: 'phone',
    reviewedUrls: ['https://clean2win.com/', clean2win, 'https://clean2win.com/kontakt.html'], bookingReview: 'phone_booking_reviewed',
    notes: 'Booking/contact page and explicit calculator item tariffs inspected. Do not import its zero empty total, synthesize a square-metre rate, apply frequency discounts, or treat one item as a guaranteed complete visit. Renovation window surcharge and indicative nature retained.',
    services: [
      ...[['малък прозорец до 80×100 см', 2.5], ['стандартен прозорец до 120×140 см', 4.5], ['голям прозорец до 180×140 см', 6.5], ['стъклена врата около 90×210 см', 7.5], ['френски прозорец около 120×220 см', 9], ['щори за един прозорец', 3]].map(([name, amount]) => service(`Почистване · ${name}`, amount, clean2win, { category: 'home_services', appointmentModel: 'home_visit', price: { unit: 'бр.' }, description: 'Ориентировъчна единична тарифа в калкулатора. След ремонт: +35% за прозорците; крайната оферта се потвърждава след разговор.' })),
      ...[['фотьойл', 18], ['двуместен диван', 28], ['триместен диван', 36], ['стандартен двоен матрак', 32]].map(([name, amount]) => service(`Пране на ${name}`, amount, clean2win, { category: 'home_services', appointmentModel: 'home_visit', price: { unit: 'бр.' }, description: 'Ориентировъчна цена за изделие, не крайна оферта за посещение. Детайлите се потвърждават преди часа.' })),
    ],
  },
  {
    id: 'sofia-new-way-group-training', checkedOn, website: 'https://newwaygym.bg/', bookingEntry: 'phone',
    reviewedUrls: ['https://newwaygym.bg/', newway], bookingReview: 'phone_booking_reviewed',
    notes: 'Only the explicitly listed group classes and their ordinary class pack. Ordinary gym access, sauna, fitness memberships, diets and instructor rate excluding gym admission are not appointment prices and are excluded.',
    services: [
      ...['Пилатес', 'Комбинирана гимнастика', 'Народни танци', 'Fit Body Ball', 'HIIT', 'Зумба', 'Съвременни танци за деца 7–10 г.', 'Dance Fitness', 'Йога'].map(name => service(`${name} · групово занимание`, 8, newway, { category: 'fitness', appointmentModel: 'group_reservation', price: { unit: 'посещение' } })),
      service('Пакет 8 групови занимания', 56, newway, { category: 'fitness', appointmentModel: 'group_reservation', price: { unit: 'пакет' }, description: 'Обща цена за осем групови посещения; валидност 45 дни. Не е карта за свободен достъп до фитнес.' }),
    ],
  },
  {
    id: 'sofia-fetish-hair-atelier', checkedOn, website: 'https://fetishhairatelier.com/', bookingEntry: 'phone',
    reviewedUrls: ['https://fetishhairatelier.com/', fetish, 'https://fetishhairatelier.com/contact/'], bookingReview: 'phone_booking_reviewed',
    notes: 'Followed owner services and booking/contact links. Old staging-domain booking link returned404; the catalogue keeps the already verified phone. Only explicitly printed EUR amounts, not converted BGN. Staff scopes and package totals retained; retail shampoo/serum and quote-only hair extensions excluded.',
    services: [
      ...[['Мъжко подстригване', 15.34], ['Детско подстригване', 15.34], ['Подстригване с гореща ножица', 20.46], ['Сешоар · къса коса', 20.46], ['Сешоар · средна коса', 25.57], ['Сешоар · дълга коса', 30.69], ['Дамско подстригване с измиване и сешоар · къса коса', 30.68], ['Мъжко боядисване', 25.57], ['Пробна прическа', 26], ['Плитка · 1 бр.', 5], ['Кератинова терапия', 179.04], ['Ботокс от моркови за коса', 51.14], ['Терапия с Olaplex', 40.91]].map(([name, amount]) => service(name, amount, fetish, { category: 'hair' })),
      ...[['Дамско подстригване', 15.34, 20.46], ['Дамско подстригване с измиване и сешоар · дълга коса', 40.90, 51.14], ['Сешоар и ампула', 28.12, 51.14], ['Матиране на коса', 30.68, 40.90], ['Кичури с фолио или шапка', 61.37, 102.28], ['Официална прическа', 41, 102], ['Прическа с маша', 26, 41], ['Ламиниране на коса', 51.14, 76.71], ['Студена терапия за коса', 76.71, 102.28]].map(([name, low, high]) => range(name, low, high, fetish, { category: 'hair' })),
      ...[['Маникюр', 12.78], ['Маникюр с гел лак', 20.46], ['Педикюр', 19.94], ['Педикюр с гел лак', 25.57], ['Моделиране с каучукова база', 25.57], ['Поддръжка с гел лак', 28.14], ['Изграждане с гел лак', 38.36]].map(([name, amount]) => service(`${name} · Диана Иванова`, amount, fetish, { category: 'nails' })),
      ...[['Класически маникюр', 11.25], ['Масаж на ръце', 12.78], ['Парафинова терапия на ръце', 12.78]].map(([name, amount]) => service(`${name} · Евдокия Кирилова`, amount, fetish, { category: 'nails' })),
      ...[['Поставяне на мигли', 61.37, 71.58], ['Поддръжка на мигли до един месец', 40.91, 46.02], ['Грим', 25.57, 40.91]].map(([name, low, high]) => range(`${name} · Десислава Илиева`, low, high, fetish, { category: 'beauty' })),
      ...[['Микроблейдинг', 173.77], ['Ретуш на микроблейдинг до 30–40 дни', 61.37], ['Перманентни вежди с пудра ефект', 184.11], ['Ретуш на пудра ефект', 61.37], ['Очна линия с ретуш', 230.13], ['Лазерно премахване на вежди · 1 процедура', 56.24], ['Оформяне, почистване и боядисване на вежди', 10.23], ['Карбонов пилинг · 1 процедура', 81.82]].map(([name, amount]) => service(`${name} · Десислава Илиева`, amount, fetish, { category: 'beauty' })),
      service('Лазерно премахване на вежди · 3 процедури · Десислава Илиева', 112.47, fetish, { category: 'beauty', price: { unit: 'пакет' } }),
      service('Карбонов пилинг · 3 процедури · Десислава Илиева', 179.06, fetish, { category: 'beauty', price: { unit: 'пакет' } }),
    ],
  },
  {
    id: 'sofia-legalmasters-consultation', checkedOn, website: 'https://legalmasters.bg/', bookingEntry: legal,
    reviewedUrls: ['https://legalmasters.bg/', 'https://legalmasters.bg/online-uslugi/', legal], bookingReview: 'owned_booking_reviewed',
    notes: 'Exact appointment detail URL and named service row in the same-day public audit cache reviewed after a text-browser timeout. Literal EUR50 and60 minutes agree. Other document drafting/product prices are not imported as consultations. No client facts or legal enquiry submitted.',
    services: [service('Правна консултация', 50, legal, { category: 'consulting', minutes: 60, durationSource: 'https://legalmasters.bg/online-uslugi/' })],
  },
  {
    id: 'sofia-laser-expert', checkedOn, website: 'https://laserexpert.bg/bg/', bookingEntry: 'https://laserexpert.bg/bg/kontakti/',
    reviewedUrls: ['https://laserexpert.bg/bg/', laser, 'https://laserexpert.bg/bg/kontakti/'], bookingReview: 'owned_booking_reviewed',
    notes: 'Read actual appointment request form and full ordinary zone matrix. One procedure, female/male columns kept distinct. Blank cells, discounted Genesis face/neck row and November body promotions excluded; no availability or clinical outcomes inferred.',
    services: [
      ...genderRows([
        ['Контур на чело', 20, 25], ['Между вежди', 15, 15], ['Над вежди', 15, 15], ['Скули', 15, 15], ['Нос', 15, 15], ['Бакенбарди', 15, 15],
        ['Горна устна', 15, 20], ['Брадичка', 15, 26], ['Уши', 15, 15], ['Половин шия', 15, 15], ['Шия', 20, 20], ['Врат', 25, 35],
        ['Цяло лице — 4 зони без шия', 55, 70], ['Подмишници', 20, 25], ['Рамене', 35, 55], ['Гърди', 50, 80], ['Гърди лента', 25, 30],
        ['Корем', 50, 75], ['Корем лента', 25, 35], ['Корем лента плюс', 30, 40], ['Кръст', 50, 65], ['Гръб', 90, 130], ['Цели ръце', 80, 100],
        ['Ръце от китка до лакът', 58, 70], ['Длани', 15, 20], ['Пръсти на ръце', 15, 15], ['Ареоли', 15, 20], ['Външни бикини', 30, null],
        ['Бразилски бикини и перианална област', 80, null], ['Слип', null, 70], ['Седалище', 60, 70], ['Пилонидална киста', 30, 30], ['Перианална област', 30, 30],
        ['Бедра', 150, 190], ['Подбедрици', 120, 140], ['Цели крака', 250, 280], ['Стъпала', 20, 20], ['Пръсти на краката', 15, 15],
      ], laser),
      ...[['Цяло лице', 85], ['Шия', 30], ['Деколте', 50], ['Цяло лице, шия и деколте', 130]].map(([name, amount]) => service(`Laser Genesis · ${name}`, amount, laser, { category: 'beauty', price: { unit: 'процедура' } })),
    ],
  },
  {
    id: 'sofia-luxury-nails-cherkovna', checkedOn, website: 'https://luxurynails.bg/', bookingEntry: 'https://luxurynails.bg/запази-час/',
    reviewedUrls: ['https://luxurynails.bg/', luxury, luxuryBooking], bookingReview: 'owned_booking_reviewed',
    notes: 'Rendered all five actual booking categories. The static specialist tariff conflicts with the live service menu (e.g. classical manicure 16/19 versus booking from20); static staff prices are withheld. Import only literal starting amounts and durations from booking, never the zero-value empty basket. No date or reservation submitted.',
    services: [
      ['Класически маникюр без лак', 20, 30], ['Маникюр с Luxio', 33, 60],
      ['Маникюр с апекс · къси до средно дълги нокти', 35, 75], ['Маникюр с апекс · дълги нокти', 38, 90],
      ['Поправка или лепене на счупен нокът', 3, 10], ['Сваляне на гел лак от друг салон', 6, 10], ['Японски маникюр', 21, 30],
      ['Вграден френски маникюр', 70, 165], ['Вграден френски маникюр с дизайн', 110, 210],
      ['Корекция на формата с растеж надолу · добавка', 11, 30], ['Укрепване с гел върху естествен нокът', 45, 105],
      ['Класически педикюр без лак', 34, 45], ['Педикюр с гел лак', 38, 60], ['Медицински педикюр без гел лак', 38, 60],
      ['Изграждане на къси до средно дълги нокти', 70, 150], ['Изграждане на дълги нокти', 80, 165], ['Изграждане на екстремно дълги нокти', 110, 210],
      ['Поддръжка на изградени нокти', 45, 105], ['Изграждане на 1 нокът', 6, 15], ['Сваляне на ноктопластика', 11, 15], ['Сваляне на ноктопластика и оформяне', 16, 15],
      ['Пигменти за нокти', 6, 15], ['Дълбок френски', 6.5, 15], ['Декорация на 4 нокътя', 6, 15], ['Декорация на всички нокти', 10, 15], ['Омбре', 6, 15], ['Декорация на 2 нокътя', 4, 15],
      ['Възстановяваща терапия за ръце', 11, 30], ['Възстановяваща терапия за крака', 11, 30],
    ].map(([name, amount, minutes]) => service(name, amount, luxuryBooking, { category: 'nails', price: { kind: 'from' }, minutes, description: 'Публикувана начална цена в текущото записване; крайната тарифа зависи от услугата и специалиста.' })),
  },
  {
    id: 'sofia-skin-design', checkedOn, website: 'https://skindesign.bg/', bookingEntry: 'phone',
    reviewedUrls: ['https://skindesign.bg/', skin, 'https://skindesign.bg/за-skin-design/контакти/'], bookingReview: 'phone_booking_reviewed',
    notes: 'Ordinary price matrix, contact and one-procedure versus package columns checked. Duplicate laser sections not imported twice. Only the reviewed ordinary laser, GUINOT, diagnostics, massage and Endospheres sections below; no clinical claims or estimated results.',
    services: [
      ...genderRows([
        ['Подмишници', 26, 30], ['Интим цял', 55, null], ['Външни бикини', 30, null], ['Горна устна', 10, null], ['Брадичка', 15, null], ['Горна устна и брадичка', 20, null],
        ['Цели ръце', 77, 87], ['Половини ръце', 41, 62], ['Корем', 36, 46], ['Коремна лента', 15, 20], ['Гърди', null, 87], ['Корем и гърди', null, 118],
        ['Ареоли', 20, 25], ['Гръб', 77, 120], ['Кръст', 36, 50], ['Рамене', null, 50], ['Гръб и кръст', 105, 155], ['Цели крака', 155, 190], ['Подбедрици', 77, 92],
        ['Бедра', 87, 120], ['Седалище', 40, 50], ['Врат', 20, 25], ['Шия', 15, 20], ['Скули', 15, 20], ['Вежди', 10, 10], ['Уши', 10, 10], ['Бакенбарди и бузи', 15, 20],
      ], skin, 'Лазерна епилация Soprano Titanium'),
      ...[['HYDRADERMIE Eye Logic', 41], ['HYDRADERMIE', 77], ['HYDRADERMIE Delux', 87], ['HYDRACLEAN treatment', 41], ['DETOXYGENE', 57]].map(([name, amount]) => service(`GUINOT ${name}`, amount, skin, { category: 'beauty' })),
      ...[['AURA 3D · лице и шия', 46], ['TANITA телесен анализ', 30], ['CELL-METER анализ на целулит', 36]].map(([name, amount]) => service(name, amount, skin, { category: 'beauty' })),
      service('Класически масаж на гръб', 31, skin, { category: 'beauty', minutes: 40 }),
      service('Класически масаж на цяло тяло · 60 мин', 47, skin, { category: 'beauty', minutes: 60 }),
      service('Класически масаж на цяло тяло · 90 мин', 72, skin, { category: 'beauty', minutes: 90 }),
      ...[['лице и шия', 57, 684], ['половин тяло', 92, 1104], ['стандарт', 97, 1164], ['цяло тяло', 103, 1236]].flatMap(([name, amount, total]) => [
        service(`Endospheres · ${name}`, amount, skin, { category: 'beauty', price: { unit: 'процедура' } }),
        service(`Endospheres · ${name} · 12 процедури`, total, skin, { category: 'beauty', price: { unit: 'пакет' } }),
      ]),
    ],
  },
  {
    id: 'sofia-mieli-massage', checkedOn, website: 'https://mielimassage.studio/', bookingEntry: 'phone',
    reviewedUrls: ['https://mielimassage.studio/', mieli], bookingReview: 'phone_booking_reviewed',
    notes: 'Owner service menu and booking invitation checked. These are in-studio rates at Forum Hotel, never home-visit prices. Referral discount and gift purchases excluded; all durations belong to the named service.',
    services: [['Ултразвуково почистване на лице', 45, 60], ['Mieli масаж · 60 мин', 60, 60], ['Озаряващ лифтинг', 60, 60], ['Масаж за бременни', 60, 60], ['Mieli масаж · 90 мин', 80, 90], ['Скулптуриране на лицето', 80, 90], ['Сияние и лекота — лице и тяло', 85, 90], ['Терапия с бамбук и огън', 85, 90], ['Моделиращ лимфен дренаж', 85, 90], ['Вътрешна хармония — звуков масаж', 85, 90], ['Гъвкавост и лекота', 85, 90], ['Миофасциален масаж', 90, 90], ['Mieli масаж · 120 мин', 105, 120]].map(([name, amount, minutes]) => service(name, amount, mieli, { category: 'beauty', minutes })),
  },
  {
    id: 'sofia-marani-cleaning', checkedOn, website: 'https://marani-cleaning.com/', bookingEntry: 'phone',
    reviewedUrls: ['https://marani-cleaning.com/', marani, maraniRepair], bookingReview: 'phone_booking_reviewed',
    notes: 'Reviewed appointment contact and both ordinary service pages. Published per-square-metre indicative bands retained by soil level; case-study totals (specific past apartments) are not a general tariff.',
    services: [[marani, 'Основно почистване'], [maraniRepair, 'Почистване след ремонт']].flatMap(([url, name]) => [['леко замърсяване', 1, 2], ['средно замърсяване', 3, 4], ['силно замърсяване', 5, 7]].map(([level, low, high]) => range(`${name} · ${level}`, low, high, url, { category: 'home_services', appointmentModel: 'home_visit', price: { unit: 'м²' }, description: 'Ориентировъчна тарифа за квадратен метър. Крайната оферта се определя според действителното състояние на обекта.' }))),
  },
  {
    id: 'sofia-borisov-clean', checkedOn, website: 'https://borisov-clean.com/', bookingEntry: 'phone',
    reviewedUrls: ['https://borisov-clean.com/', borisov, borisovGeneral], bookingReview: 'phone_booking_reviewed',
    notes: 'Owner appointment invitation, weekly-versus-per-visit columns and optional access/transport charges read. Published indicative prices only; no invented price for apartments above 120 square metres.',
    services: [
      service('Абонаментно почистване · 50 м² · веднъж седмично', 31, borisov, { category: 'home_services', appointmentModel: 'home_visit', price: { unit: 'посещение' }, description: 'Ориентировъчна тарифа; извън околовръстното на София има транспортна такса 1 €/км.' }),
      service('Абонаментно почистване · 50 м² · два пъти седмично', 52, borisov, { category: 'home_services', appointmentModel: 'home_visit', price: { unit: 'седмица' }, description: 'Обща ориентировъчна седмична цена за две посещения; не е цена за едно посещение.' }),
      service('Абонаментно почистване · 60–100 м² · веднъж седмично', 41, borisov, { category: 'home_services', appointmentModel: 'home_visit', price: { unit: 'посещение' }, description: 'Ориентировъчна тарифа според замърсяването.' }),
      service('Абонаментно почистване · 60–100 м² · два пъти седмично', 77, borisov, { category: 'home_services', appointmentModel: 'home_visit', price: { unit: 'седмица' }, description: 'Обща ориентировъчна седмична цена за две посещения.' }),
      range('Стандартно основно почистване', 2.60, 3, borisovGeneral, { category: 'home_services', appointmentModel: 'home_visit', price: { unit: 'м²' }, description: 'Ориентировъчна тарифа. Доплащане при паркиране в зона, липса на асансьор или адрес извън околовръстното.' }),
    ],
  },
  {
    id: 'sofia-nail-cocktail-boutique', checkedOn, website: 'https://nailcocktailboutique.com/', bookingEntry: 'phone',
    reviewedUrls: ['https://nailcocktailboutique.com/', 'https://nailcocktailboutique.com/zapazi-chas/', cocktail], bookingReview: 'phone_booking_reviewed',
    notes: 'Booking page leads to the actual services tariff. Read in the rendered public browser after text fetch was denied; no challenge bypass. Staff, additional services and duration intervals retained. Retail discounts not applied to salon services.',
    services: [
      service('Маникюр с гел лак · Елена или Инна', 35, cocktail, { category: 'nails', minutes: 90 }),
      service('Маникюр с гел лак · Виктория', 25, cocktail, { category: 'nails', minutes: 120 }),
      service('Френски маникюр с гел лак · Елена или Инна', 38, cocktail, { category: 'nails', minutes: 90 }),
      service('Френски маникюр с гел лак · Виктория', 30, cocktail, { category: 'nails', minutes: 120 }),
      service('Апаратен маникюр с гел лак', 30, cocktail, { category: 'nails', price: { kind: 'from' }, description: '90–120 минути според майсторката. Допълнителни дизайн и сваляне се заплащат отделно.' }),
      service('Класически маникюр без лак', 25, cocktail, { category: 'nails', minutes: 60 }),
      service('Мъжки маникюр', 30, cocktail, { category: 'nails', minutes: 60 }),
      service('Апаратен педикюр с гел лак · Виктория', 30, cocktail, { category: 'nails', minutes: 150 }),
      service('Апаратен педикюр без лак · Виктория', 25, cocktail, { category: 'nails', minutes: 120 }),
      service('Маникюр и педикюр · Виктория', 25, cocktail, { category: 'nails', price: { kind: 'from' }, description: 'Начална тарифа; време и крайна цена по договаряне.' }),
      range('Изграждане с гел и дизайн · Елена или Инна', 60, 100, cocktail, { category: 'nails', description: '90–180 минути, според дължина и дизайн.' }),
      range('Изграждане с гел и гел лак · Виктория', 40, 70, cocktail, { category: 'nails', description: '120–180 минути, според дължина и дизайн.' }),
      service('Поддръжка на изградени нокти · Елена', 40, cocktail, { category: 'nails', minutes: 90 }),
      range('Моделиране с гел и гел лак', 35, 45, cocktail, { category: 'nails', description: '90–120 минути според майсторката.' }),
      range('Гел върху естествен нокът', 35, 40, cocktail, { category: 'nails', description: '90–120 минути според майсторката.' }),
      range('Рисунка на ръка върху нокти', 8, 15, cocktail, { category: 'nails', description: 'Допълнение към основната услуга; 20–45 минути.' }),
      range('Декорация на нокти', 2, 6, cocktail, { category: 'nails', description: 'Допълнение към основната услуга; 10–15 минути.' }),
      service('Сваляне на гел лак', 8, cocktail, { category: 'nails', minutes: 15, description: 'Отделна допълнителна услуга при предишно покритие.' }),
      range('Сваляне на различни покрития', 10, 15, cocktail, { category: 'nails', minutes: 20 }),
      service('Сваляне на акрил', 15, cocktail, { category: 'nails', minutes: 20 }),
      range('Възстановяване на счупен нокът', 8, 20, cocktail, { category: 'nails', description: '15–40 минути, според нужната поправка.' }),
    ],
  },
  {
    id: 'sofia-vasilena-hristova', checkedOn, website: 'https://vasilenahristova.com/', bookingEntry: vasilena,
    reviewedUrls: ['https://vasilenahristova.com/', vasilena, vasilenaPrices], bookingReview: 'owned_booking_reviewed',
    notes: 'Actual booking service dropdown and linked price page both inspected. No date, client details or confirmation submitted. Event/seminar products excluded. Package prices are totals, not rates for one appointment.',
    services: [
      service('Първична психологическа консултация', 80, vasilena, { category: 'consulting', minutes: 90 }),
      service('Редовна вторична психологическа консултация', 80, vasilena, { category: 'consulting', minutes: 60 }),
      service('Задълбочена вторична психологическа консултация', 90, vasilena, { category: 'consulting', minutes: 90 }),
      service('Семейна консултация', 100, vasilena, { category: 'consulting', minutes: 90 }),
      service('Семейна констелация с фигури', 100, vasilena, { category: 'consulting', minutes: 90 }),
      service('Пакет 6 индивидуални консултации', 430, vasilenaPrices, { category: 'consulting', price: { unit: 'пакет' }, description: 'Публикувана обща цена за шест консултации, не за единична сесия.' }),
      service('Пакет 4 семейни консултации', 360, vasilenaPrices, { category: 'consulting', price: { unit: 'пакет' }, description: 'Публикувана обща цена за четири семейни или двойкови сесии.' }),
      service('Онлайн консултация', 80, vasilenaPrices, { category: 'consulting', minutes: 90 }),
      service('Астропсихологичен анализ с консултация', 70, vasilenaPrices, { category: 'consulting', description: 'Включва консултация на живо или онлайн; изготвянето е отделен срок до 7 работни дни, не продължителност на час.' }),
      service('Арт терапия с консултация', 70, vasilenaPrices, { category: 'consulting', description: 'Включва консултация на живо или онлайн; публикуваният срок за изготвяне не е продължителност на посещение.' }),
    ],
  },
  {
    id: 'sofia-kristina-sungarska', checkedOn, website: 'https://kristinasungarska.bg/', bookingEntry: 'https://kristinasungarska.bg/kontakt',
    reviewedUrls: ['https://kristinasungarska.bg/', 'https://kristinasungarska.bg/kontakt', kristina], bookingReview: 'owned_booking_reviewed',
    notes: 'Consultation request form and service prices inspected. Individual duration is a published 50–60 minute interval, not a fixed 50 minute slot. Group participation requires screening; no health or contact data submitted.',
    services: [
      service('Индивидуална психологическа консултация', 100, kristina, { category: 'consulting', price: { unit: 'сесия' }, description: 'Продължителност около 50–60 минути; часът се уточнява след заявка.' }),
      service('Групова терапия Отплаване', 30, kristina, { category: 'consulting', minutes: 120, price: { unit: 'сесия' }, description: 'Затворена група от 6 сесии; предварителен скрининг преди включване. Това е цена за една сесия, не за целия цикъл.' }),
    ],
  },
  {
    id: 'sofia-rockschool-sofia', checkedOn, website: 'https://rockschool.bg/', bookingEntry: 'https://rockschool.bg/bg/book-a-lesson',
    reviewedUrls: ['https://rockschool.bg/', 'https://rockschool.bg/bg/book-a-lesson', 'https://book.rockschool.bg/school/reservation', rock], bookingReview: 'owned_booking_reviewed',
    notes: 'Actual booking entry inspected, including linked school reservation widget. Regular teacher-dependent lesson range retained. First-lesson promotion, subscription offers, family discounts and retail/instrument rental excluded.',
    services: [
      range('Стандартен музикален урок', 18, 34, rock, { category: 'education', minutes: 55, description: 'Крайната цена зависи от избрания преподавател; уточнява се при записване.' }),
      service('Половин музикален урок', 10, rock, { category: 'education', minutes: 30 }),
      service('Репетиция в зала · 1 час', 10, rock, { category: 'education', minutes: 60 }),
      service('Репетиция в зала · 2 часа', 20, rock, { category: 'education', minutes: 120 }),
    ],
  },
  {
    id: 'sofia-vayasport', checkedOn, website: 'https://vayasport.bg/', bookingEntry: 'https://book.vayasport.bg/calendar/public',
    reviewedUrls: ['https://vayasport.bg/', vaya, 'https://book.vayasport.bg/calendar/public'], bookingReview: 'owned_booking_reviewed',
    notes: 'Owner tariff and rendered public booking subdomain inspected. Calendar displayed no events in the current week; no availability is inferred. Session packs retain total amounts and validity, never converted to a single-visit rate.',
    services: [
      service('Групов пилатес реформър · 1 посещение', 20, vaya, { category: 'fitness', appointmentModel: 'group_reservation' }),
      service('Групов пилатес реформър · пакет 4 посещения', 65, vaya, { category: 'fitness', appointmentModel: 'group_reservation', price: { unit: 'пакет' }, description: 'Обща цена за 4 посещения в рамките на месец.' }),
      service('Групов пилатес реформър · пакет 8 посещения', 115, vaya, { category: 'fitness', appointmentModel: 'group_reservation', price: { unit: 'пакет' }, description: 'Обща цена за 8 посещения в рамките на месец.' }),
      service('Групов пилатес реформър · пакет 10 посещения', 135, vaya, { category: 'fitness', appointmentModel: 'group_reservation', price: { unit: 'пакет' }, description: 'Обща цена за 10 посещения в рамките на 2 месеца.' }),
      service('Групов пилатес реформър · пакет 12 посещения', 155, vaya, { category: 'fitness', appointmentModel: 'group_reservation', price: { unit: 'пакет' }, description: 'Обща цена за 12 посещения в рамките на 2 месеца.' }),
      service('Пилатес реформър · индивидуални и по двойки', 40, vaya, { category: 'fitness', appointmentModel: 'individual_training', description: 'Публикувана обща тарифна позиция за индивидуални и по двойки; условията за двойка се уточняват при записване.' }),
    ],
  },
  {
    id: 'sofia-cleandirect', checkedOn, website: 'https://cleandirect.bg/', bookingEntry: 'phone',
    reviewedUrls: ['https://cleandirect.bg/', clean], bookingReview: 'phone_booking_reviewed',
    notes: 'Booking form is visible above the actual tariff. Minimum visit is EUR35; published per-item prices below do not waive it. Deep cleaning and washing are separate methods; sizes retained.',
    services: [
      ...[['60×120 см', 11], ['70×140 см', 11], ['90/110×200 см', 20], ['120/140×200 см', 25], ['160/180×200 см', 35], ['200×200 см', 40]].map(([size, amount]) => service(`Дълбоко почистване на матрак · ${size}`, amount, clean, { category: 'home_services', appointmentModel: 'home_visit', price: { unit: 'матрак' }, description: 'Минимална стойност на посещение 35 €. Доплащане за качване без асансьор и паркиране според условията на изпълнителя.' })),
      ...[['Пране на матрак за спалня · 120–160×200 см', 25], ['Пране на единичен матрак · 70–110×200 см', 18], ['Пране на бебешки матрак', 10], ['Пране на диван двойка', 35], ['Пране на диван тройка', 40], ['Пране на фотьойл', 25], ['Пране на стол', 9], ['Пране на табуретка', 13]].map(([name, amount]) => service(name, amount, clean, { category: 'home_services', appointmentModel: 'home_visit', description: 'Еднолицево при пране на матрак. Минимална стойност на посещение 35 €; допълнителните такси са отделни.' })),
      service('Пране на холен ъглов диван', 50, clean, { category: 'home_services', appointmentModel: 'home_visit', price: { kind: 'from' }, description: 'Начална тарифа; допълнителни такси за достъп и паркиране според условията на изпълнителя.' }),
    ],
  },
  {
    id: 'sofia-physiohome-home-rehab', checkedOn, website: 'https://physiohome.bg/', bookingEntry: 'phone',
    reviewedUrls: ['https://physiohome.bg/', physio, physioChild, physioMassage, physioBaby, 'https://physiohome.bg/contact/'], bookingReview: 'phone_booking_reviewed',
    notes: 'Home-visit scope confirmed on each owner service page. Single visits and published total package prices kept separate. Per-procedure package figures disagree slightly with package totals due to rounding; no calculated rate is imported.',
    services: [
      ...[['Домашна рехабилитация', physio], ['Детска рехабилитация', physioChild]].flatMap(([name, url]) => [
        service(`${name} · 1 процедура`, 45, url, { category: 'health', appointmentModel: 'home_visit' }),
        service(`${name} · пакет 5 процедури`, 204.52, url, { category: 'health', appointmentModel: 'home_visit', price: { unit: 'пакет' }, description: 'Публикувана обща цена за 5 посещения на адрес в София, не за единична процедура.' }),
        service(`${name} · пакет 10 процедури`, 383.47, url, { category: 'health', appointmentModel: 'home_visit', price: { unit: 'пакет' }, description: 'Публикувана обща цена за 10 посещения на адрес в София, не за единична процедура.' }),
      ]),
      ...['Спортен масаж у дома', 'Лечебен масаж у дома', 'Релаксиращ масаж у дома'].map(name => service(name, 100, physioMassage, { category: 'health', appointmentModel: 'home_visit', description: 'Включва посещението и оборудването в София. Продължителността се уточнява според вида и зоните.' })),
      ...[['Консултация за новородено у дома', 43.46], ['Обучение за къпане и преповиване', 33.23], ['Консултация за кърмене у дома', 35.79], ['Масаж за бебе у дома', 28.12]].map(([name, amount]) => service(name, amount, physioBaby, { category: 'health', appointmentModel: 'home_visit' })),
    ],
  },
  {
    id: 'sofia-carbox-studio', checkedOn, website: 'https://carboxbg.com/', bookingEntry: 'phone',
    reviewedUrls: ['https://carboxbg.com/', 'https://carboxbg.com/zapishi-chas/', carbox], bookingReview: 'phone_booking_reviewed',
    notes: 'Followed actual booking and service links. Only the owner service tariff, not the adjacent retail shop, cart or promotion banner. Literal published EUR values retained from dual-currency service rows; no conversion.',
    services: [
      ...[['Цялостно почистване на автомобилен салон', 138.04], ['Пране на текстилен салон', 76.69], ['Почистване на кожен салон', 76.69], ['Керамика за автомобилен салон', 150], ['Полиране на автомобил', 153.38], ['Пастиране на автомобил', 153.38], ['Вакса за автомобил', 51.13], ['Керамично покритие на автомобил', 153.38], ['Защитно фолио за автомобил', 1278.23], ['Цветно фолио за автомобил', 1022.58], ['Полиране на фарове и керамика', 76.70], ['Полиране на фарове и фолио', 127.80]].map(([name, amount]) => service(name, amount, carbox, { category: 'detailing', price: { kind: 'from' } })),
      service('Озониране на автомобилно купе', 25.56, carbox, { category: 'detailing', price: { kind: 'from' }, minutes: 30 }),
      service('Вътрешно почистване на автомобил', 51.13, carbox, { category: 'detailing', price: { kind: 'from' }, minutes: 30 }),
    ],
  },
  {
    id: 'sofia-s-gumi-mobile', checkedOn, website: sgumi, bookingEntry: 'phone', reviewedUrls: [sgumi], bookingReview: 'phone_booking_reviewed',
    notes: 'Per-tyre/vehicle matrix and visit fee checked. Import the unambiguous repair packages including consumables and visit only; do not present seasonal per-wheel rates as a complete vehicle bill. Wheel-size surcharge applies above 20 inches.',
    services: [
      service('Мобилен ремонт на гума · лек автомобил', 55, sgumi, { category: 'auto_repair', appointmentModel: 'home_visit', price: { unit: 'гума' }, description: 'Включени консумативи и посещение. При джанти над 20″ има доплащане 10 € за всеки следващ цол; след 20 ч. е възможна корекция.' }),
      service('Мобилен ремонт на гума · SUV, джип или бус', 60, sgumi, { category: 'auto_repair', appointmentModel: 'home_visit', price: { unit: 'гума' }, description: 'Включени консумативи и посещение. При джанти над 20″ има доплащане 10 € за всеки следващ цол; след 20 ч. е възможна корекция.' }),
    ],
  },
  {
    id: 'sofia-mokro-nosle', checkedOn, website: mokro,
    bookingEntry: 'https://easybook.bg/gruming-studio-mokro-nosle-sofiya-manastirski-livadi',
    reviewedUrls: [mokro, 'https://easybook.bg/gruming-studio-mokro-nosle-sofiya-manastirski-livadi'], bookingReview: 'provider_booking_reviewed',
    pricingDecision: 'hold_conflicting_sources',
    notes: 'Owner and rendered Easybook menu inspected. Their generic package/therapy amounts differ, so the owner-only candidates below are withheld pending confirmation, not displayed as current prices. Easybook terms restrict republication: its detailed menu, ratings and descriptions are not imported. No reservation submitted.',
    services: [
      service('Пакет Хигиена', 25, mokro, { minutes: 60, price: { kind: 'from' }, description: coatNote }),
      service('Цялостен груминг', 45, mokro, { minutes: 120, price: { kind: 'from' }, description: coatNote }),
      service('Пакет Бебе', 35, mokro, { minutes: 120, price: { kind: 'from' }, description: coatNote }),
      service('Маски при проблемна кожа', 10, mokro, { minutes: 20, price: { kind: 'from' }, description: 'Публикувана двойна валута: от 20 лв / 10 евро; не е преизчислявана.' }),
      service('NAGAYU терапия за клетъчна регенерация', 20, mokro, { minutes: 20, price: { kind: 'from' }, description: 'Публикувана двойна валута: от 40 лв / 20 евро; не е преизчислявана.' }),
    ],
  },
  {
    id: 'sofia-tobbys-grooming', checkedOn, website: 'https://tobby.bg/', bookingEntry: 'phone',
    reviewedUrls: ['https://tobby.bg/', tobby], bookingReview: 'phone_booking_reviewed',
    notes: 'Ordinary prices only. First-visit breed discounts and baby-grooming promotion excluded. Published hour/zone units retained; final care depends on coat and behaviour.',
    services: [
      service('Почистване на зъбен камък от ветеринарен лекар', 40, tobby),
      range('Обработка на сплъстена козина', 25, 30, tobby, { price: { unit: 'час' }, description: 'Публикувана часова тарифа; общата сума зависи от времето за обработка.' }),
      service('Частично подстригване', 15, tobby, { price: { unit: 'зона' } }),
      service('Поддръжка на лапи — почистване и оформяне', 20, tobby),
      service('Къпане и сушене · късокосмести до 7 кг', 20, tobby, { description: coatNote }),
      service('Къпане и сушене · дългокосмести или къдрави до 7 кг', 25, tobby, { description: coatNote }),
      service('Къпане и сушене · късокосмести над 7 кг', 30, tobby, { description: coatNote }),
      service('Къпане и сушене · дългокосмести или къдрави над 7 кг', 35, tobby, { description: coatNote }),
      service('Рязане на нокти', 8, tobby), service('Почистване на уши', 8, tobby),
      service('Обезпаразитяване с шампоан · до 7 кг', 15, tobby),
      service('Обезпаразитяване с шампоан · над 7 кг', 20, tobby),
    ],
  },
  {
    id: 'sofia-pet-stop-place', checkedOn, website: 'https://petstopplace.com/', bookingEntry: 'phone',
    reviewedUrls: ['https://petstopplace.com/', petstop, 'https://petstopplace.com/contacts'], bookingReview: 'phone_booking_reviewed',
    notes: 'Detailed services page takes precedence over the shorter homepage summary. Ranges are indicative; do not substitute a default calculator selection. Walk-in-only small procedures, shop products and promotions excluded.',
    services: [
      range('Пълен груминг за куче', 40, 120, petstop, { description: 'Ориентировъчна тарифа според порода и козина; 90–120 мин. Точната сума се потвърждава след преглед.' }),
      range('Хигиенен груминг', 30, 70, petstop, { description: 'Ориентировъчна тарифа според порода и козина; 60–90 мин.' }),
      range('Стрипинг', 55, 100, petstop, { description: 'Ориентировъчна тарифа според порода и козина; 90–150 мин.' }),
      range('Къпане и сушене', 20, 50, petstop, { description: 'Ориентировъчна тарифа според тегло и козина; 40–60 мин.' }),
      service('Груминг за котки с къпане', 50, petstop, { description: 'Ориентировъчна основна тарифа; състоянието на козината се преценява на място.' }),
      service('Подстригване на котка без къпане', 40, petstop, { description: 'Ориентировъчна основна тарифа; при сплъстена козина има доплащане.' }),
      service('Разресване на подкосъм на котка', 40, petstop, { description: 'Ориентировъчна основна тарифа; при сплъстена козина има доплащане.' }),
    ],
  },
  {
    id: 'sofia-kaya-grooming', checkedOn, website: 'https://www.kaya-grooming.com/', bookingEntry: kayaBooking,
    reviewedUrls: ['https://www.kaya-grooming.com/', kayaBooking, kaya], bookingReview: 'owned_booking_reviewed',
    notes: 'Source-reviewed in the rendered Wix Table Master tables. Blank weight cells not filled. No session-bearing iframe URLs stored. Booking page supplies separate published durations, not live availability.',
    services: [
      ...kayaRow('Цялостен груминг за късокосмести', [30, 35, 40, 45, 50], 90),
      ...kayaRow('Цялостен груминг без късокосмести и обемни козини', [35, 40, 45, 50, 60], 120),
      ...kayaRow('Цялостен груминг за обемни козини', [38, 45, 53, 70, 115], 180),
      ...kayaRow('Къпане и сушене', [25, 30, 35, 40, 60], 45),
      ...kayaRow('Стрипинг шнауцер', [null, 48, 70, 115, null], 240),
      ...kayaRow('Стрипинг грифон', [45, null, null, null, null], 240),
      ...kayaRow('Стрипинг фокстериер', [null, 48, null, null, null], 240),
      ...kayaRow('Стрипинг безпородно куче', [45, 48, 65, 115, null], 240),
      service('Почистване на уши', 5, kaya, { description: kayaNote }),
      service('Подрязване на нокти', 8, kaya, { minutes: 15, durationSource: kayaBooking, description: kayaNote }),
      ...kayaRow('Груминг за късокосмести котки', [35, 35, null, null, null]),
      ...kayaRow('Груминг за дългокосмести котки', [40, 40, null, null, null]),
    ],
  },
  {
    id: 'sofia-cut-n-chill', checkedOn, website: 'https://www.cutnchill.com/', bookingEntry: cut,
    reviewedUrls: ['https://www.cutnchill.com/', cut], bookingReview: 'owned_booking_reviewed',
    notes: 'Prices and durations read from the actual booking service list. Repeated euro presentation is one price, not two options.',
    services: [
      service('Мъжко подстригване', 20, cut, { category: 'barber', minutes: 30 }),
      service('Коса и брада', 23, cut, { category: 'barber', minutes: 60 }),
      service('Коса, брада и вежди', 25, cut, { category: 'barber', minutes: 60 }),
      service('Класическа прическа', 15, cut, { category: 'barber', minutes: 20 }),
      service('Брада', 10, cut, { category: 'barber', minutes: 15 }),
      service('Подстригване с един номер', 10, cut, { category: 'barber', minutes: 10 }),
      service('Кола маска', 8, cut, { category: 'beauty', minutes: 10 }),
      service('Кална маска', 5, cut, { category: 'beauty', minutes: 10 }),
      service('Маска за черни точки', 5, cut, { category: 'beauty', minutes: 10 }),
      service('Вежди', 5, cut, { category: 'beauty', minutes: 10 }),
      service('Пилинг маска', 5, cut, { category: 'beauty', minutes: 10 }),
    ],
  },
  {
    id: 'sofia-autosteamclean-mobile', checkedOn, website: 'https://autosteamclean.com/', bookingEntry: 'phone',
    reviewedUrls: ['https://autosteamclean.com/', auto, autoDetail, 'https://autosteamclean.com/въпроси-faq/'], bookingReview: 'phone_booking_reviewed',
    notes: 'Mobile service in southern Sofia only. Vehicle class and package retained. Possible transport fee is not included. Ambiguous "от 35–40" jeep tariff not imported.',
    services: [
      range('Мобилно комплексно почистване вътре/вън · лек автомобил или SUV', 30, 35, auto, { category: 'car_wash', appointmentModel: 'home_visit', description: 'Мобилна услуга в Южна София; възможна транспортна такса за по-далечни райони.' }),
      range('Пакет Чиста кола · лек автомобил или SUV', 70, 90, auto, { category: 'car_wash', appointmentModel: 'home_visit' }),
      range('Пакет Чиста кола · джип', 80, 100, auto, { category: 'car_wash', appointmentModel: 'home_visit' }),
      service('Пакет Чист интериор · лек автомобил или SUV', 50, auto, { category: 'car_wash', appointmentModel: 'home_visit' }),
      service('Пакет Чист интериор · джип', 60, auto, { category: 'car_wash', appointmentModel: 'home_visit' }),
      service('Детайлно почистване и пране на автомобилен салон', 100, autoDetail, { category: 'detailing', appointmentModel: 'home_visit', price: { kind: 'from' }, description: 'Начална тарифа; крайната цена зависи от размер, замърсяване и специфика на автомобила.' }),
    ],
  },
  {
    id: 'sofia-el-gato', checkedOn, website: elgato, bookingEntry: 'phone',
    reviewedUrls: [elgato], bookingReview: 'phone_booking_reviewed',
    notes: 'Nail and brow prices explicitly belong to Madlena Mitkova, not Irina. Linked Studio24 tariff for Irina was inaccessible and is not imported. Massage section is separate. Unpriced combined pigmentation omitted.',
    services: [
      nail('Обикновен маникюр', 18), nail('Маникюр с обикновен лак', 20), nail('Френски маникюр с обикновен лак', 18),
      nail('Обикновен лак с оформяне', 13), nail('Смяна на гел лак без почистване на кожички', 25),
      nail('Маникюр с гел лак', 28), nail('Френски маникюр с гел лак', 30),
      nail('Изграждане с хартиена платформа', 42), nail('Гел върху естествен нокът', 25), nail('Поддръжка с твърд гел', 25),
      nail('Декорация', 1, { price: { kind: 'range', maximum: 3 } }), nail('Пигмент', 1, { price: { unit: 'нокът' } }),
      nail('Лепене на счупен нокът', 2), nail('Изграждане на 1 нокът', 5), nail('Лепене на типс', 3, { price: { unit: 'нокът' } }),
      nail('Изграждане с типсове без лак', 30), nail('Обикновен педикюр', 26), nail('Педикюр с обикновен лак', 28),
      nail('Педикюр с гел лак', 35), nail('Френски педикюр с гел лак', 37),
      nail('Смяна на гел лак на крака без почистване на кожи', 25), nail('Медицински педикюр', 35),
      nail('Обработка на впит нокът', 5, { price: { unit: 'нокът' } }), nail('Обработка на мазол', 3, { price: { unit: 'бр.' } }),
      nail('Обработка на гъбичен нокът', 2, { price: { unit: 'нокът' } }), nail('Изрязване на нокти', 8),
      nail('Парафинова терапия', 14), nail('Маникюр и парафинова терапия', 19), nail('Маска за крака', 7),
      nail('Масаж на ходила — 5 мин на крак', 10), nail('Масаж на ръце', 8, { minutes: 5 }),
      nail('Маникюр с руска техника', 30), nail('Педикюр с руска техника', 33),
      nail('Изграждане с горни форми · къси', 40), nail('Изграждане с горни форми · средни', 41), nail('Изграждане с горни форми · дълги', 47),
      nail('Поддръжка на изградени нокти', 35),
      nail('Микропигментация на вежди с ретуш', 160, { category: 'beauty' }), nail('Микроблейдинг с ретуш', 150, { category: 'beauty' }),
      service('Класически масаж — цяло тяло · 60 мин', 35, elgato, { category: 'beauty', minutes: 60 }),
      service('Класически масаж — цяло тяло · 90 мин', 45, elgato, { category: 'beauty', minutes: 90 }),
      service('Частичен масаж', 20, elgato, { category: 'beauty', minutes: 30 }),
      service('Арома масаж — цяло тяло', 30, elgato, { category: 'beauty', minutes: 60 }),
      service('Антицелулитен масаж', 30, elgato, { category: 'beauty', minutes: 40 }),
      service('Лимфодренажен масаж — една зона', 20, elgato, { category: 'beauty', minutes: 30 }),
      service('Лечебен масаж — една зона', 20, elgato, { category: 'beauty', minutes: 30 }),
    ],
  },
]
// A later explicit review of the same inventory replaces the earlier receipt,
// not the legacy baseline. Keep this deterministic and reject duplicates within
// the expansion itself in the gate/tests; never silently merge conflicting fees.
const expandedReviewIds = new Set(PRICING_EXPANSION_REVIEWS.map(review => review.id))
const historicalBookingPriceReviews = [
  ...initialBookingPriceReviews.filter(review => !expandedReviewIds.has(review.id)),
  ...PRICING_EXPANSION_REVIEWS,
].map(review => ({ ...review, inventoryIdentity: reviewedIdentities[review.id] }))
export const BOOKING_PRICE_REVIEWS = [...historicalBookingPriceReviews, ...NEIGHBORHOOD_20261111_REVIEWS, ...NEIGHBORHOOD_20261113_REVIEWS]

// New neighborhood records already carry their reviewed complete inventories.
// Do not feed their deliberately unpriced services into the price-only patcher.
export const BOOKING_REVIEWED_PRICING = historicalBookingPriceReviews.filter(row => row.pricingDecision !== 'hold_conflicting_sources').map(({ id, services }) => ({ id, services }))
