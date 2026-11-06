// First-party appointment evidence, not a scraped maps/booking-directory export.
// Do not turn departments, employees or mobile services into extra premises.
import { reviewed } from './reviewed-record.mjs'
const daily = (weekdays, open, close) => weekdays.map(weekday => ({ weekday, periods: [{ open, close }] }))
const hours = (days, sourceUrl) => ({ days, sourceUrl, checkedOn: '2026-11-06' })
const price = (amount, sourceUrl) => ({ amount, sourceUrl, currency: 'EUR', kind: 'fixed', checkedOn: '2026-11-06' })

export default [
  reviewed({ id: 'studio-vnd', name: 'Studio VND', category: 'barber', address: 'София, кв. Манастирски ливади, ул. Пирин 56', neighborhood: 'Манастирски ливади',
    website: 'https://studiovnd.com/', phone: '+359886367013', services: ['Мъжко подстригване', 'Оформяне на брада', { name: 'Оформяне на вежди с конец', category: 'beauty' }],
    bookingUrl: 'https://studiovnd.com/booking', excerpt: 'Работим с предварително записани часове', openingHours: hours([...daily([1, 2, 3, 4, 5, 6], '10:00', '19:00'), { weekday: 7, periods: [] }], 'https://studiovnd.com/') }),
  reviewed({ id: 'blades-studio', name: 'The Blades Studio', category: 'barber', address: 'София, бул. Генерал Скобелев 77Б', website: 'https://studioblades.com/',
    phone: '+35924444493', services: ['Мъжко подстригване', 'Оформяне на брада'], excerpt: 'Запази час онлайн', openingHours: hours(daily([1, 2, 3, 4, 5, 6, 7], '09:00', '20:30'), 'https://studioblades.com/') }),
  // The owner's embedded Studio24 page refused automated access. Keep the
  // owner's actual appointment phone; do not guess a working calendar URL.
  reviewed({ id: 'narra-beauty', name: 'Narra Beauty', category: 'nails', address: 'София, ж.к. Лозенец, бул. Свети Наум 9', neighborhood: 'Лозенец',
    website: 'https://narra.bg/', phone: '+359878983023', services: [{ name: 'Класически маникюр', price: price(18, 'https://narra.bg/') }, { name: 'Класически педикюр', price: price(25, 'https://narra.bg/') }, 'Ноктопластика'],
    excerpt: 'Избери удобен ден и час', openingHours: hours(daily([1, 2, 3, 4, 5, 6, 7], '09:00', '21:00'), 'https://narra.bg/') }),
  reviewed({ id: 'studio-sunday', name: 'Студио SunDay', category: 'nails', address: 'София, ж.к. Младост 1А, бл. 560', neighborhood: 'Младост 1А',
    website: 'https://nailstudiosunday.com/', services: ['Маникюр', 'Педикюр', 'Ноктопластика'], bookingUrl: 'https://www.fresha.com/a/studio-sunday-sofiya-mladost-1a-560-huggc2iv/all-offer?menu=true&share=true&pId=2775107', excerpt: 'Запази час' }),
  reviewed({ id: 'skin-design', name: 'Skin Design', category: 'beauty', address: 'София, ул. Люлин Планина 17, партер', website: 'https://skindesign.bg/',
    phone: '+359879888852', services: ['Лазерна епилация'], contactUrl: 'https://skindesign.bg/за-skin-design/контакти/', excerpt: 'Запишете час' }),
  // Individual classes, never ordinary gym admission or equipment shopping.
  reviewed({ id: 'gr-pilates', name: 'GR Pilates Reformer', category: 'fitness', address: 'София, ж.к. Люлин 9, ул. Тодор Влайков 27', neighborhood: 'Люлин 9',
    website: 'https://gr-pilates.com/', phone: '+359889332309', services: [{ name: 'Индивидуална тренировка по пилатес реформър · единично посещение', description: 'Продължителност: 50 минути.', price: price(36, 'https://gr-pilates.com/') }],
    model: 'individual_training', excerpt: 'Запиши час' }),
  reviewed({ id: 'instyle-seven', name: 'InStyle 7', category: 'fitness', address: 'София, кв. Витоша, ул. Ангел Каралийчев 29А', neighborhood: 'Витоша', website: 'https://instylebg.com/',
    phone: '+359886177768', services: ['Индивидуална тренировка по пилатес реформър'], model: 'individual_training', excerpt: 'Запиши си час за тренировка на Пилатес Реформър',
    openingHours: hours([...daily([1, 2, 3, 4, 5], '09:00', '20:00'), ...daily([6], '10:00', '16:00'), { weekday: 7, periods: [] }], 'https://instylebg.com/') }),
  reviewed({ id: 'lidia-manova', name: 'Адвокат и медиатор Лидия Манова', category: 'consulting', address: 'София, ул. Незабравка 25, Парк-хотел Москва, ет. 2, офис 203',
    website: 'https://lidiamanova.com/', phone: '+359887306905', services: ['Правна консултация с адвокат', 'Консултация за медиация'], evidenceUrl: 'https://lidiamanova.com/kontakti/', excerpt: 'Запазете час за среща с мен' }),
  // Only GTP is explicitly offered with appointments; do not assume the
  // co-located car wash, café or sports hall accepts reservations too.
  reviewed({ id: 'arena-isaev-gtp', name: 'ГТП Арена Исаев', category: 'auto_repair', address: 'София, ж.к. Младост 3, ул. Инж. Георги Белов 18А', neighborhood: 'Младост 3',
    website: 'https://arenaisaev.com/', phone: '+359888447478', services: ['Годишен технически преглед', 'Първоначален преглед на газова уредба'], excerpt: 'С предварително запазен час',
    openingHours: hours(daily([1, 2, 3, 4, 5, 6, 7], '08:00', '20:00'), 'https://arenaisaev.com/') }),
  // The NIFTY appointment is explicitly limited to this Sofia branch. Never
  // replicate it to every walk-in collection point or advertise live slots.
  reviewed({ id: 'genica-ami-bue', name: 'Лаборатория Геника · Централна регистратура', category: 'other', address: 'София, ул. Ами Буе 84',
    website: 'https://www.genica.bg/', phone: '+359897912488', services: ['Лабораторно изследване NIFTY Pro с предварително записване'], model: 'booked_lab_visit',
    bookingUrl: 'https://web.genica.bg/public/appointment', evidenceUrl: 'https://www.genica.bg/test/nifty-pro', contactUrl: 'https://www.genica.bg/kontakti', excerpt: 'единствено в Централната лаборатория' }),
  // A mobile service is one provider, not a fabricated office in each quarter.
  // Transport/handling fees are NOT the price of the requested blood tests.
  reviewed({ id: 'ramus-home-visits', name: 'Лаборатория Рамус · домашни посещения', category: 'other', address: null, serviceArea: true,
    website: 'https://ramuslab.com/', phone: '+35929023610', services: ['Лабораторно вземане на проба при домашно посещение в София'], model: 'booked_lab_visit',
    bookingUrl: 'https://ramuslab.com/домашни-посещения/', evidenceUrl: 'https://ramuslab.com/домашни-посещения/', excerpt: 'заявки за домашни посещения се правят един или два дни' }),
  reviewed({ id: 'synevo-home-visits', name: 'Лаборатория Синево · домашни посещения', category: 'other', address: null, serviceArea: true,
    website: 'https://www.synevo.bg/', phone: '+35924747272', services: ['Лабораторни изследвания при домашно посещение в София'], model: 'booked_lab_visit',
    evidenceUrl: 'https://www.synevo.bg/usluga-domashni-poseshteniya/', excerpt: 'за записване на час' }),
  // The first-party notice says the online home-visit form is unavailable.
  // Use the published booking phone instead of the broken external form.
  reviewed({ id: 'cibalab-home-visits', name: 'Лаборатория Цибалаб · домашни посещения', category: 'other', address: null, serviceArea: true,
    website: 'https://www.cibalab.com/', phone: '+35970011242', services: ['Лабораторни изследвания при домашно посещение в София'], model: 'booked_lab_visit',
    evidenceUrl: 'https://cibalab.com/wp/домашни-посещения/', excerpt: 'Може да заявите на националния ни телефон' }),
]
