// More independent first-party venues. Unknown precise points stay unknown.
import { reviewed } from './reviewed-record.mjs'
const daily = (weekdays, open, close) => weekdays.map(weekday => ({ weekday, periods: [{ open, close }] }))
const hours = (days, sourceUrl) => ({ days, sourceUrl, checkedOn: '2026-11-06' })
const price = (amount, sourceUrl) => ({ amount, sourceUrl, currency: 'EUR', kind: 'fixed', checkedOn: '2026-11-06' })

export default [
  // SPACE A1 and B2 are rooms at one address, not two business records.
  reviewed({ id: 'areab19', name: 'AreaB19 Creative Spaces', category: 'other', address: 'София, ул. Архитект Петко Момчилов 2А', website: 'https://areab19.com/',
    phone: '+359894555432', services: [{ name: 'Фотостудио под наем · SPACE A1 · 1 час', price: price(40, 'https://areab19.com/spacea1') }, 'Фотостудио под наем · SPACE B2'],
    excerpt: 'Само с предварителна резервация.', openingHours: hours(daily([1, 2, 3, 4, 5, 6, 7], '08:00', '23:00'), 'https://areab19.com/') }),
  reviewed({ id: 'art-club-diplomat', name: 'Art Club Diplomat', category: 'other', address: 'София, бул. Цар Освободител 6', neighborhood: 'Център',
    website: 'https://diplomat.gallery/', phone: '+359878787657', services: ['Студио за фотосесии под наем'], evidenceUrl: 'https://diplomat.gallery/myasto-za-sabitiya-sofia/photo-sessions/', excerpt: 'Как да резервирате пространство за фотосесия' }),
  reviewed({ id: 'fotosmagoria', name: 'Fotosmagoria Studio', category: 'other', address: 'София, бул. Александър Стамболийски 26, ет. 6',
    website: 'https://fotosmagoria.com/', phone: '+359888821193', services: ['Студийна фотосесия'], evidenceUrl: 'https://fotosmagoria.com/contact-us/', excerpt: 'Студиото работи с предварително записан час.' }),
  reviewed({ id: '6trak-studio', name: '6trak Studio', category: 'other', address: 'София, ж.к. Ботунец, ул. Здравец 5', neighborhood: 'Ботунец',
    website: 'https://6trak.bg/', phone: '+359887644578', services: ['Коледна фотосесия'], excerpt: 'Запази час' }),
  reviewed({ id: 'elena-gyoshkova-logoped', name: 'Елена Гьошкова · логопед', category: 'other', address: 'София, ж.к. Младост 1, бл. 37, партер, офис 3', neighborhood: 'Младост 1',
    website: 'https://logoped-bg.com/', phone: '+359888767272', services: ['Логопедична консултация'], excerpt: 'Запазете своя час за консултация с логопед' }),
  reviewed({ id: 'petya-zhelezova-logoped', name: 'Петя Железова · логопед', category: 'other', address: 'София, ул. Царичина 1',
    website: 'https://www.petyazhelezova.bg/', phone: '+359899140742', services: ['Логопедична консултация'], excerpt: 'Запази консултация' }),
  reviewed({ id: 'maria-petricheva-centre', name: 'Мария Петричева · Център', category: 'other', address: 'София, ул. Петър Парчевич 1', neighborhood: 'Център',
    website: 'https://psiholog-bg.com/', phone: '+359877524645', services: ['Психологична консултация за деца и възрастни'], evidenceUrl: 'https://psiholog-bg.com/за-контакти/', excerpt: 'се провеждат след запазване на час' }),
  reviewed({ id: 'maria-petricheva-lyulin', name: 'Мария Петричева · Люлин 9', category: 'other', address: 'София, ж.к. Люлин 9, бл. 964, Логопедичен център Радостина Аврамова', neighborhood: 'Люлин 9',
    website: 'https://psiholog-bg.com/', phone: '+359877524645', services: ['Психологична консултация за деца и възрастни'], evidenceUrl: 'https://psiholog-bg.com/за-контакти/', excerpt: 'се провеждат след запазване на час' }),
  reviewed({ id: 'account-em', name: 'Счетоводна кантора Account EM', category: 'consulting', address: 'София, кв. Симеоново, бул. Симеоновско шосе 217, читалище Отец Паисий, ет. 2', neighborhood: 'Симеоново',
    website: 'https://account-em.com/', phone: '+359887445112', services: ['Счетоводна и финансова консултация'], bookingUrl: 'https://account-em.com/kontakti/', evidenceUrl: 'https://account-em.com/yslygi/', excerpt: 'Запазете час' }),
  reviewed({ id: 'arnica-accounting', name: 'Счетоводна къща Арника', category: 'consulting', address: 'София, ж.к. Дружба 2, бл. 304, партер до вх. А', neighborhood: 'Дружба 2',
    website: 'https://arnica.bg/', phone: '+359894380179', services: ['Счетоводна консултация'], evidenceUrl: 'https://arnica.bg/uslugi/', excerpt: 'Може да запазите вашият час като ни се обадите по телефона' }),
  reviewed({ id: 'diamond-beauty-care', name: 'Diamond Beauty Care', category: 'nails', address: 'София, ж.к. Младост 1, ул. Методи Андонов 105Б', neighborhood: 'Младост 1',
    website: 'https://diamondbeautybymz.com/', phone: '+359878442896', services: ['Маникюр с гел лак', { name: 'Педикюр с гел лак без маска', description: 'Продължителност: 90 минути.', price: price(35, 'https://diamondbeautybymz.com/') }], excerpt: 'работим само с предварително записване',
    openingHours: hours([{ weekday: 1, periods: [] }, ...daily([2, 3, 4, 5, 6], '10:00', '19:00'), { weekday: 7, periods: [] }], 'https://diamondbeautybymz.com/') }),
  reviewed({ id: 'ivon-reduta-one', name: 'Студио Ивон · Редута 1', category: 'beauty', address: 'София, кв. Редута, ул. Велчо Атанасов 40', neighborhood: 'Редута',
    website: 'https://studioivon.bg/', phone: '+359878405806', services: ['Козметична процедура', { name: 'Маникюр и педикюр', category: 'nails' }], excerpt: 'Запазете вашият час онлайн' }),
  reviewed({ id: 'ivon-reduta-two', name: 'Студио Ивон · Редута 2', category: 'beauty', address: 'София, кв. Редута, ул. Юндола 3', neighborhood: 'Редута',
    website: 'https://studioivon.bg/', phone: '+359878266670', services: ['Козметична процедура', { name: 'Маникюр и педикюр', category: 'nails' }], excerpt: 'Запазете вашият час онлайн' }),
  reviewed({ id: 'nokutche-sofia', name: 'Нокътче · София', category: 'nails', address: 'София, ул. Нишава 52', website: 'https://nokutche.company.site/',
    phone: '+359884847369', services: ['Маникюр', 'Педикюр'], excerpt: 'Запиши час за София' }),
]
