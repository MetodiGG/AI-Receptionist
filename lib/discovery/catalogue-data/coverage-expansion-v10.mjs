// Checked public owner appointment/contact facts, not a ratings/photo import.
// Bookings remain requests or external actions, never verified GoRez slots.
import { reviewed } from './reviewed-record.mjs'
const daily = (weekdays, open, close) => weekdays.map(weekday => ({ weekday, periods: [{ open, close }] }))
const hours = (days, sourceUrl) => ({ days, sourceUrl, checkedOn: '2026-11-06' })

export default [
  reviewed({ id: 'the-barber-shop-iztok', name: 'The Barber Shop Sofia', category: 'barber', address: 'София, кв. Изток, ул. Николай Хайтов 2', neighborhood: 'Изток', website: 'https://thebarbershop.bg/', phone: '+359882820331',
    services: ['Мъжко подстригване', 'Оформяне на брада', 'Класическо мокро бръснене'], bookingUrl: 'https://book.thebarbershop.bg/reservations/start?site=1', evidenceUrl: 'https://thebarbershop.bg/kontakti/', excerpt: 'Запазете час',
    openingHours: hours(daily([1, 2, 3, 4, 5, 6, 7], '10:00', '20:00'), 'https://thebarbershop.bg/kontakti/') }),
  reviewed({ id: 'auto-kotevi', name: 'Auto Kotevi', category: 'detailing', address: 'София, ж.к. Овча купел 1, бул. Овча купел 63', neighborhood: 'Овча купел 1', website: 'https://autokotevi.bg/', phone: '+359894669093',
    services: ['Автодетайлинг', 'Полиране на фарове', 'PPF защитно фолио'], evidenceUrl: 'https://autokotevi.bg/istorii/detailing-toyota-corolla-sofia/', contactUrl: 'https://autokotevi.bg/contact-us/', excerpt: 'Запишете си час за детайлинг',
    openingHours: hours([...daily([1, 2, 3, 4, 5, 6], '09:00', '19:00'), { weekday: 7, periods: [] }], 'https://autokotevi.bg/contact-us/') }),
  reviewed({ id: 'thinkinkneedle', name: 'ThinkINK NEEDle Tattoo Studio', category: 'other', address: 'София, ж.к. Надежда 1, бл. 153, вх. В, откъм ул. Сава Филаретов', neighborhood: 'Надежда 1', website: 'https://thinkinkneedle.com/', phone: '+359887433809',
    services: ['Консултация за татуировка', 'Авторска татуировка'], excerpt: 'Студиото работи САМО с предварително записани часове',
    openingHours: hours(daily([1, 2, 3, 4, 5, 6], '10:30', '17:30'), 'https://thinkinkneedle.com/') }),
  reviewed({ id: 'centerside-tattoo', name: 'CenterSide Tattoo', category: 'other', address: 'София, ул. Генерал Паренсов 17', website: 'https://www.centersidetattoo.com/',
    services: ['Авторска татуировка', 'Консултация за татуировка'], bookingUrl: 'https://www.centersidetattoo.com/', excerpt: 'SUBMIT PRE-BOOKING' }),
  reviewed({ id: 'photofactory', name: 'Photofactory · Цветелина Михайлова', category: 'other', address: 'София, ул. Йордан Хаджиконстантинов 88', website: 'https://photofactory.bg/', phone: '+359878516114',
    services: ['Портретна фотосесия', 'Студийна фотосесия', 'Семейна фотосесия', 'Корпоративна фотосесия'], excerpt: 'Само с предварително запазен час' }),
  reviewed({ id: 'renita-kostadinova-photography', name: 'Renita Kostadinova Photography', category: 'other', address: 'София, ж.к. Дружба 1, бл. 195, до вх. Д', neighborhood: 'Дружба 1', website: 'https://renitaphotography.setmore.com/', phone: '+359898623006',
    services: ['Портретна фотосесия', 'Детска и семейна фотосесия', 'Фотосесия за бебета'], bookingUrl: 'https://renitaphotography.setmore.com/', excerpt: 'Запазвайки час за фотосесия',
    openingHours: hours(daily([1, 2, 3, 4, 5, 6, 7], '10:00', '20:30'), 'https://renitaphotography.setmore.com/') }),
  reviewed({ id: 'dr-smily', name: 'Дентална клиника Dr. Smily', category: 'other', address: 'София, ж.к. Люлин, ул. 601-ва, бл. 608, вх. Б', website: 'https://dr-smily.com/', phone: '+359888877674',
    services: ['Стоматологичен преглед', 'Почистване на зъби'], excerpt: 'Запишете час' }),
  reviewed({ id: 'elirka-dent', name: 'Elirka Dent', category: 'other', address: 'София, ж.к. Люлин 8, бул. Царица Йоанна 70', neighborhood: 'Люлин 8', website: 'https://elirka.com/', phone: '+359886599273',
    services: ['Стоматологична консултация'], excerpt: 'запишете своя час за консултация',
    openingHours: hours([...daily([1, 2, 3, 4], '14:00', '20:00'), ...daily([5], '09:00', '14:00'), { weekday: 6, periods: [], byAppointment: true }, { weekday: 7, periods: [], byAppointment: true }], 'https://elirka.com/') }),
  reviewed({ id: 'poliklinikata-lyulin', name: 'МЦ Поликлиниката', category: 'other', address: 'София, ж.к. Люлин 10, бл. 144, партер', neighborhood: 'Люлин 10', website: 'https://www.poliklinikata.bg/', phone: '+359888538055',
    services: ['Преглед при ортопед', 'Преглед при дерматолог', 'Консултация с детски психолог', 'УНГ преглед'], evidenceUrl: 'https://www.poliklinikata.bg/bg/aktualno-1_p177.html', excerpt: 'да си запишете час предварително по телефона' }),
  // Both dentists share this premises; they are not extra business records.
  reviewed({ id: 'deckoff-dental', name: 'Deckoff Dental', category: 'other', address: 'София, ул. Владайска 41', website: 'https://www.deckoff-dental.com/', phone: '+359895795735',
    services: ['Ортодонтска консултация', 'Стоматологичен преглед'], evidenceUrl: 'https://www.deckoff-dental.com/dentalna-klinika-sofia-telefon/', excerpt: 'Прием само с предварително записан час' }),
  reviewed({ id: 'ds-dent-orlov-most', name: 'D.S. Dent · Орлов мост', category: 'other', address: 'София, Орлов мост, бул. Евлоги и Христо Георгиеви 46', website: 'https://www.dsdent.com/', phone: '+359885776778',
    services: ['Стоматологичен преглед'], evidenceUrl: 'https://www.dsdent.com/about-us-2/contact/', excerpt: 'Запазете Час за Преглед',
    openingHours: hours([...daily([1, 2, 3, 4, 5], '09:00', '19:00'), ...daily([6], '09:00', '14:00'), { weekday: 7, periods: [] }], 'https://www.dsdent.com/about-us-2/contact/') }),
  reviewed({ id: 'new-dental-solutions', name: 'New Dental Solutions', category: 'other', address: 'София, ж.к. Надежда 3, ул. Кумановски бой 7, бл. 321, партер', neighborhood: 'Надежда 3', website: 'https://www.newdental.bg/', phone: '+359898493900',
    services: ['Стоматологичен преглед'], evidenceUrl: 'https://www.newdental.bg/kontakti/', excerpt: 'Запиши си час',
    openingHours: hours([...daily([1, 2, 3, 4, 5], '08:30', '20:30'), ...daily([6, 7], '09:00', '19:00')], 'https://www.newdental.bg/kontakti/') }),
  reviewed({ id: 'all-dental-lagera', name: 'All Dental', category: 'other', address: 'София, ж.к. Лагера, ул. Каварна 9', neighborhood: 'Лагера', website: 'https://alldental.bg/', phone: '+359877178018',
    services: ['Стоматологичен преглед'], evidenceUrl: 'https://alldental.bg/контакти/', excerpt: 'Записване на час и контакти',
    openingHours: hours([...daily([1, 2, 3, 4, 5], '08:30', '20:00'), { weekday: 6, periods: [], byAppointment: true }, { weekday: 7, periods: [], byAppointment: true }], 'https://alldental.bg/контакти/') }),
  reviewed({ id: 'smile-care', name: 'Smile Care', category: 'other', address: 'София, ж.к. Стрелбище, ул. Твърдишки проход 19', neighborhood: 'Стрелбище', website: 'https://smilecare.bg/', phone: '+359898538747',
    services: ['Стоматологичен преглед'], evidenceUrl: 'https://smilecare.bg/kontakti/', excerpt: 'запишете час за преглед и лечение' }),
]
