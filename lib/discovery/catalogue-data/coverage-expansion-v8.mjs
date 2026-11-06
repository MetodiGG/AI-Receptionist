// Individually reviewed first-party appointment/contact pages, 2026-11-06.
// Clinics are one record per premises, never one per doctor/department.
// Medical and veterinary appointments use the existing Other category; they
// are not falsely classified as physiotherapy or pet grooming.
import { reviewed } from './reviewed-record.mjs'
const daily = (weekdays, open, close) => weekdays.map(weekday => ({ weekday, periods: [{ open, close }] }))
const hours = (days, sourceUrl) => ({ days, sourceUrl, checkedOn: '2026-11-06' })

export default [
  reviewed({ id: 'mk-barber-studio', name: 'MK Barber Studio', category: 'barber', address: 'София, ж.к. Сердика, бл. 18А', neighborhood: 'Сердика', website: 'https://mkbarberstudio.setmore.com/', phone: '+359894954820',
    services: ['Мъжко подстригване', 'Оформяне на брада'], bookingUrl: 'https://mkbarberstudio.setmore.com/', excerpt: 'онлайн система за резервации',
    openingHours: hours(daily([1, 2, 3, 4, 5, 6, 7], '10:00', '20:00'), 'https://mkbarberstudio.setmore.com/') }),
  reviewed({ id: 'magic-studio-nails', name: 'Magic Studio · Magic Brows & Nails', category: 'nails', address: 'София, Студентски град, ул. Професор Христо Вакарелски, бл. 10, вх. В', neighborhood: 'Студентски град', website: 'https://magicstudio.bg/',
    services: ['Маникюр', 'Педикюр', { name: 'Микроблейдинг', category: 'beauty' }], bookingUrl: 'https://magicstudio.bg/booking', evidenceUrl: 'https://magicstudio.bg/contact/', excerpt: 'Запазване на час през сайта' }),
  ...[
    { id: 'pozitano', name: 'Позитано', address: 'ул. Позитано 10', phone: '+359879826370', services: ['Медицински преглед с предварително записване'] },
    { id: 'za-zhenata', name: 'За жената', address: 'бул. Христо Ботев 10', phone: '+359879826376', services: ['Медицински преглед за жени с предварително записване'] },
    { id: 'krasno-selo', name: 'Красно село', address: 'кв. Красно село, ул. Балканджи Йово 32, вх. А', neighborhood: 'Красно село', phone: '+359879826220', services: ['Медицински преглед с предварително записване'] },
  ].map(branch => reviewed({ ...branch, id: `lora-${branch.id}`, name: `МЦ ЛОРА · ${branch.name}`, category: 'other', address: `София, ${branch.address}`, website: 'https://loramed.com/',
    evidenceUrl: 'https://loramed.com/контакти/', excerpt: 'За да запишете час' })),
  ...[
    { id: 'hipodruma', name: 'Хиподрума', address: 'ж.к. Хиподрума, ул. Найден Геров 2, ет. 2, каб. 229', neighborhood: 'Хиподрума' },
    { id: 'evlogi-georgievi', name: 'Евлоги и Христо Георгиеви', address: 'бул. Евлоги и Христо Георгиеви 108, ет. 1, каб. 110' },
    { id: 'strelbishte', name: 'Стрелбище', address: 'ж.к. Стрелбище, на гърба на бл. 16', neighborhood: 'Стрелбище' },
  ].map(branch => reviewed({ ...branch, id: `detsko-psihichno-zdrave-${branch.id}`, name: `Детско психично здраве · ${branch.name}`, category: 'other', address: `София, ${branch.address}`, website: 'https://detskopsihichnozdrave.org/', phone: '+359888666493',
    services: ['Консултация с детски психиатър', 'Консултация с психолог'], evidenceUrl: 'https://detskopsihichnozdrave.org/index.html', excerpt: 'Обадете се за записване на час' })),
  reviewed({ id: 'park-clinic', name: 'PARK CLINIC', category: 'other', address: 'София, бул. Черни връх 14', website: 'https://parkclinic.bg/', phone: '+359889950200',
    services: ['Преглед при уролог', 'Преглед при детски уролог', 'Преглед при ортопед', 'Преглед при кардиолог'], bookingUrl: 'https://superdoc.bg/klinika/mc-park-clinic', evidenceUrl: 'https://parkclinic.bg/kontakti', excerpt: 'Изберете лекар и удобен час онлайн.',
    openingHours: hours([...daily([1, 2, 3, 4, 5], '09:00', '19:30'), { weekday: 6, periods: [] }, { weekday: 7, periods: [] }], 'https://parkclinic.bg/kontakti') }),
  reviewed({ id: 'dentix-zahari-simov', name: 'Dentix · д-р Захари Симов', category: 'other', address: 'София, ул. Св. Св. Кирил и Методий 42А', website: 'https://dentix.bg/', phone: '+359885359520',
    services: ['Възстановяваща стоматология', 'Естетична стоматология'], evidenceUrl: 'https://dentix.bg/contact/', excerpt: 'Запишете час',
    // Saturday is by arrangement, not a fabricated fixed period or closed day.
    openingHours: hours(daily([1, 2, 3, 4, 5], '09:00', '18:00'), 'https://dentix.bg/contact/') }),
  ...[
    { id: 'benkovski', name: 'Бенковски', address: 'ул. Георги Бенковски 49', phone: '+359876888020' },
    { id: 'vitosha', name: 'Витоша', address: 'ул. Борис Арсов 1', phone: '+359876862888' },
    { id: 'yug', name: 'Юг', address: 'ул. Околовръстен път 10В', phone: '+359877052022' },
  ].map(branch => reviewed({ ...branch, id: `osem-dental-${branch.id}`, name: `О.СЕМ · ${branch.name}`, category: 'other', address: `София, ${branch.address}`, website: 'https://osemdental.com/',
    services: ['Стоматологичен преглед', 'Почистване на зъбен камък'], evidenceUrl: 'https://osemdental.com/zapazvane-na-chas/', excerpt: 'Запазете час по телефона' })),
  reviewed({ id: 'dr-stetson-dental', name: 'Dr Stetson’s Dental Care', category: 'other', address: 'София, ул. Кракра 1, ап. 3', website: 'https://drstetsondentalcare.com/bg/', phone: '+359877250439',
    services: ['Стоматологичен преглед за възрастни', 'Лечение на кариес', 'Кореново лечение', 'Професионална орална хигиена'], excerpt: 'прием с предварително записване' }),
  reviewed({ id: 'vet-patrol', name: 'Ветеринарна клиника Vet Patrol', category: 'other', address: 'София, ул. Гео Милев 22', website: 'https://vetpatrol.bg/', phone: '+359877698771',
    services: ['Ветеринарен преглед'], evidenceUrl: 'https://vetpatrol.bg/?page_id=75', excerpt: 'Клиниката работи с предварително записани часове.',
    openingHours: hours([...daily([1, 2, 3, 4, 5], '09:00', '19:00'), ...daily([6], '10:00', '17:00'), { weekday: 7, periods: [] }], 'https://vetpatrol.bg/?page_id=75') }),
  reviewed({ id: 'vet-city-nishava', name: 'Ветеринарна клиника Сити', category: 'other', address: 'София, кв. Бели брези, ул. Нишава 46', neighborhood: 'Бели брези', website: 'https://www.cityclinic.vet/', phone: '+359878455323',
    services: ['Ветеринарен преглед'], excerpt: 'Запишете час',
    openingHours: hours([...daily([1, 2, 3, 4, 5], '09:30', '19:00'), ...daily([6, 7], '10:00', '17:30')], 'https://www.cityclinic.vet/') }),
  reviewed({ id: 'vet-vyara-nadezhda-lyubov', name: 'Ветеринарна клиника Вяра, Надежда и Любов', category: 'other', address: 'София, Люлин 5, ул. 502 срещу бл. 521', neighborhood: 'Люлин 5', website: 'https://vnl-vet.com/', phone: '+359884197686',
    services: ['Ветеринарен преглед'], excerpt: 'след предварително записан час',
    openingHours: hours(daily([1, 2, 3, 4, 5, 6, 7], '08:30', '20:30'), 'https://vnl-vet.com/') }),
  reviewed({ id: 'mvc-bulgaria', name: 'Многопрофилна ветеринарна клиника България', category: 'other', address: 'София, кв. Горна баня, ул. Лилия 8', neighborhood: 'Горна баня', website: 'https://www.mvcbulgaria.com/', phone: '+359887778030',
    services: ['Ветеринарен преглед'], bookingUrl: 'https://www.mvcbulgaria.com/appoinment', evidenceUrl: 'https://www.mvcbulgaria.com/appoinment', excerpt: 'Запиши час',
    openingHours: hours([...daily([1, 2, 3, 4, 5], '09:00', '19:00'), ...daily([6, 7], '10:00', '18:00')], 'https://www.mvcbulgaria.com/appoinment') }),
  reviewed({ id: 'yoyo-vet', name: 'Ветеринарна клиника Йо Йо Вет', category: 'other', address: 'София, ж.к. Люлин 4, бл. 408, вх. А, от задната страна откъм парка', neighborhood: 'Люлин 4', website: 'https://yoyovet.com/', phone: '+359878329918',
    services: ['Ветеринарен преглед'], excerpt: 'Обадете ни се, за да запишете час!',
    openingHours: hours([...daily([1, 2, 3, 4, 5], '10:00', '19:00'), ...daily([6], '10:00', '15:00'), { weekday: 7, periods: [] }], 'https://yoyovet.com/') }),
  reviewed({ id: 'vet-mei', name: 'Ветеринарна клиника МЕЙ', category: 'other', address: 'София, ж.к. Хиподрума, ул. Найден Геров 4', neighborhood: 'Хиподрума', website: 'https://vetmei.com/', phone: '+359888615426',
    services: ['Ветеринарен преглед'], bookingUrl: 'https://vetmei.com/index.php?main_page=appointment', evidenceUrl: 'https://vetmei.com/index.php?main_page=appointment', contactUrl: 'https://vetmei.com/index.php?main_page=contact_us', excerpt: 'Записване на час за преглед',
    openingHours: hours([...daily([1, 2, 3, 4, 5], '09:00', '19:00'), ...daily([6], '10:00', '15:00'), { weekday: 7, periods: [] }], 'https://vetmei.com/index.php?main_page=contact_us') }),
]
