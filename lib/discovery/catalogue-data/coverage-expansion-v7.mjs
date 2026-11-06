// Reserved sessions/appointments verified on the owners' public pages.
// Unknown addresses/points, package prices and indicative medical prices are
// deliberately not converted into facts about an individual appointment.
import { reviewed } from './reviewed-record.mjs'
const daily = (weekdays, open, close) => weekdays.map(weekday => ({ weekday, periods: [{ open, close }] }))
const hours = (days, sourceUrl) => ({ days, sourceUrl, checkedOn: '2026-11-06' })
const price = (amount, sourceUrl) => ({ amount, sourceUrl, currency: 'EUR', kind: 'fixed', checkedOn: '2026-11-06' })
const point = (latitude, longitude, source) => ({ latitude, longitude, source, method: 'first_party_coordinates' })

export default [
  reviewed({ id: 'physiolab', name: 'PhysioLab · Пламен Василев', category: 'health', address: 'София, Младост 1, на гърба на бл. 509', neighborhood: 'Младост 1', website: 'https://physiolab.bg/',
    phone: '+359889809224', services: ['Кинезитерапия', 'Физиотерапия', 'Рехабилитация'], bookingUrl: 'https://superdoc.bg/lekar/plamen-vasilev', evidenceUrl: 'https://physiolab.bg/kontakti', excerpt: 'Запазете час в Superdoc' }),
  reviewed({ id: 'bodyflow', name: 'BodyFlow', category: 'health', address: 'София, ул. Тодор Бурмов 2А', website: 'https://www.bodyflow.bg/', phone: '+359885888018',
    services: ['Кинезитерапия', { name: 'Авторски масаж (30+30) · 60 минути', price: price(55, 'https://www.bodyflow.bg/book-online') }, { name: 'Рефлексотерапия на ходила и длани · 30 минути', price: price(34, 'https://www.bodyflow.bg/book-online') }],
    bookingUrl: 'https://www.bodyflow.bg/book-online', evidenceUrl: 'https://www.bodyflow.bg/book-online', excerpt: 'Заявка за резервация' }),
  reviewed({ id: 'physio-health-sofia', name: 'Physio Health · София', category: 'health', address: 'София, ул. Димчо Дебелянов 14, бл. 84, вх. Б, ап. 15',
    website: 'https://physiohealth.bg/', phone: '+359898711707', services: ['Кинезитерапия', 'Рехабилитация след операции'], evidenceUrl: 'https://physiohealth.bg/rehabilitastiya/kineziterapiya/', excerpt: 'ЗАПАЗИ НА 0898 711 707' }),
  reviewed({ id: 'yan-physio-borovo', name: 'Yan Physio · Борово', category: 'health', address: 'София, кв. Борово, ул. Солун 59Б', neighborhood: 'Борово',
    website: 'https://yanphysio.com/', phone: '+359895692746', services: ['Кинезитерапия', 'Лечебен масаж', 'Мануална терапия'], excerpt: 'Запази час' }),
  reviewed({ id: 'yan-physio-stranski', name: 'Yan Physio · Иван Странски', category: 'health', address: 'София, ул. Проф. д-р Иван Странски 61',
    website: 'https://yanphysio.com/', phone: '+359895692746', services: ['Кинезитерапия', 'Лечебен масаж', 'Мануална терапия'], excerpt: 'Запази час' }),
  // Two different premises, not extra listings for the party rooms within them.
  reviewed({ id: 'escapeway-crystal-skull', name: 'Escape Way · Кристалният череп', category: 'other', address: 'София, ул. Княз Борис 104, партер', neighborhood: 'Център',
    website: 'https://escapeway.bg/', phone: '+359882321222', services: ['Ескейп стая Кристалният череп'], evidenceUrl: 'https://escapeway.bg/rooms/crystal-skull/book', excerpt: 'ЗАПАЗИ ЧАС',
    openingHours: hours(daily([1, 2, 3, 4, 5, 6, 7], '10:00', '22:00'), 'https://escapeway.bg/') }),
  reviewed({ id: 'escapeway-black-pearl', name: 'Escape Way · Черната перла', category: 'other', address: 'София, ул. Солунска 45, в двора на кооперацията', neighborhood: 'Център',
    website: 'https://escapeway.bg/', phone: '+359882321222', services: ['Ескейп стая Черната перла'], excerpt: 'Резервирай сега',
    openingHours: hours(daily([1, 2, 3, 4, 5, 6, 7], '10:00', '22:00'), 'https://escapeway.bg/') }),
  reviewed({ id: 'horror-house', name: 'Horror House', category: 'other', address: 'София, ул. Бачо Киро 5', website: 'https://horrorhouse.bg/',
    phone: '+359888658008', services: ['Ескейп игра в къща на ужасите'], bookingUrl: 'https://horrorhouse.bg/reserve-now/', excerpt: 'Резервирай сега' }),
  reviewed({ id: 'game-castle-simeonovo', name: 'Game Castle · Симеоново', category: 'other', address: 'София, Симеоново, бул. Симеоновско шосе при ул. Буйновско ждрело, спирка Шумако', neighborhood: 'Симеоново',
    website: 'https://gamecastlebg.com/', phone: '+359882081895', services: ['Ескейп игра Колекционерът', 'Приключенска игра Vitosha Forest Quest'], bookingUrl: 'https://gamecastlebg.com/bg/reservations', evidenceUrl: 'https://gamecastlebg.com/bg/reservations', contactUrl: 'https://gamecastlebg.com/bg/contact', excerpt: 'За резервация',
    coordinates: point(42.601408, 23.350354, 'https://gamecastlebg.com/bg/contact') }),
  reviewed({ id: 'game-castle-centre', name: 'Game Castle · Цар Самуил', category: 'other', address: 'София, ул. Цар Самуил 50, Squid Game на ет. 4', neighborhood: 'Център',
    website: 'https://gamecastlebg.com/', phone: '+359882081895', services: ['Ескейп игра Magic School', 'Ескейп игра Squid Game'], bookingUrl: 'https://gamecastlebg.com/bg/reservations', evidenceUrl: 'https://gamecastlebg.com/bg/reservations', contactUrl: 'https://gamecastlebg.com/bg/contact', excerpt: 'За резервация',
    coordinates: point(42.696986, 23.317842, 'https://gamecastlebg.com/bg/contact') }),
  reviewed({ id: 'onspot', name: 'OnSpot · професионално почистване', category: 'home_services', address: null, serviceArea: true,
    website: 'https://www.onspot.bg/', phone: '+359878574649', services: ['Основно почистване на домове', 'Изпиране на мека мебел'], model: 'home_visit', evidenceUrl: 'https://www.onspot.bg/kontakti.html', excerpt: 'РЕЗЕРВИРАЙ ПОЧИСТВАНЕ' }),
  reviewed({ id: 'nasko-car', name: 'Наско-Кар ЕООД', category: 'auto_repair', address: 'София, ж.к. Красна поляна 3, ул. Добротич 1', neighborhood: 'Красна поляна 3',
    website: 'https://nasocarservice.com/', phone: '+359895534529', services: ['Автосервиз и ремонт на автомобили'], excerpt: 'Запазете час за посещение',
    openingHours: hours(daily([1, 2, 3, 4, 5], '08:00', '18:00'), 'https://nasocarservice.com/') }),
  reviewed({ id: 'body-lab-pilates', name: 'The Body Lab', category: 'fitness', address: 'София, кв. Манастирски ливади, ул. Флора 65', neighborhood: 'Манастирски ливади',
    website: 'https://thebodylab.bg/', phone: '+359885426996', services: ['Индивидуална тренировка по пилатес реформър'], model: 'individual_training', excerpt: 'Резервирай своето място' }),
  // Conflicting introductory prices on the owner page: do not import a price.
  reviewed({ id: 'flowhaven-pilates', name: 'FlowHaven Pilates', category: 'fitness', address: 'София, ж.к. Овча купел 2, ул. Пиер дьо Ронсар 12', neighborhood: 'Овча купел 2',
    website: 'https://flowhavenpilates.com/', phone: '+359878444944', services: ['Групова тренировка по пилатес реформър'], model: 'group_reservation', excerpt: 'Запазете своя час',
    openingHours: hours([...daily([1, 2, 3, 4, 5], '08:00', '20:00'), ...daily([6, 7], '09:00', '16:00')], 'https://flowhavenpilates.com/') }),
  reviewed({ id: 'tonic-pilates', name: 'Tonic Pilates', category: 'fitness', address: 'София, кв. Манастирски ливади, ул. Боян Петров 11', neighborhood: 'Манастирски ливади',
    website: 'https://tonicpilates.bg/', phone: '+359899931233', services: [{ name: 'Групова тренировка по пилатес реформър · единично посещение', appointmentModel: 'group_reservation', price: price(19, 'https://tonicpilates.bg/') }, { name: 'Индивидуална тренировка по пилатес реформър · единично посещение', price: price(31, 'https://tonicpilates.bg/') }],
    model: 'individual_training', excerpt: 'Запази час онлайн', openingHours: hours(daily([1, 2, 3, 4, 5, 6, 7], '07:00', '21:00'), 'https://tonicpilates.bg/') }),
  reviewed({ id: 'pilates-club-boyana', name: 'The Pilates Club', category: 'fitness', address: 'София, кв. Бояна, ул. Ралевица 14А', neighborhood: 'Бояна',
    website: 'https://thepilatesclub.bg/', phone: '+359887384744', services: ['Групова тренировка по пилатес'], model: 'group_reservation', excerpt: 'Запази час' }),
  reviewed({ id: 'sofia-pilates-studio', name: 'Sofia Pilates Studio', category: 'fitness', address: 'София, бул. Джеймс Баучер 76А, Hill Tower',
    website: 'https://sofiapilates.com/', phone: '+359876030303', services: [{ name: 'Индивидуална тренировка по пилатес · единично посещение', price: price(36, 'https://sofiapilates.com/pricing') }, { name: 'Групова тренировка по пилатес · единично посещение', appointmentModel: 'group_reservation', price: price(23, 'https://sofiapilates.com/pricing') }],
    model: 'individual_training', evidenceUrl: 'https://sofiapilates.com/contact', excerpt: 'Ако желаете директно да си запишете час', openingHours: hours([...daily([1, 2, 3, 4, 5], '09:00', '19:30'), ...daily([6], '11:00', '17:00'), { weekday: 7, periods: [] }], 'https://sofiapilates.com/contact') }),
  // One Sofia premises. The alternate footer address and Plovdiv venue are
  // not invented as further Sofia branches; only private lessons are listed.
  reviewed({ id: 'dance-station-ndk', name: 'Dance Station · НДК', category: 'fitness', address: 'София, пл. България 1, НДК, вход под терасата на клуб Перото',
    website: 'https://dancestation.bg/', phone: '+359888960466', services: [{ name: 'Индивидуален урок по танци за възрастни · 60 минути', price: price(45, 'https://dancestation.bg/uslugi/individiualni-urotsi-po-tantsi/') }], model: 'individual_training',
    evidenceUrl: 'https://dancestation.bg/uslugi/individiualni-urotsi-po-tantsi/', contactUrl: 'https://dancestation.bg/kontakti/', excerpt: 'за да уточните всички детайли' }),
]
