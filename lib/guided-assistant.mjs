import { DateTime } from 'luxon'

const DAY_NAMES = [
  [1, 'Понеделник'],
  [2, 'Вторник'],
  [3, 'Сряда'],
  [4, 'Четвъртък'],
  [5, 'Петък'],
  [6, 'Събота'],
  [7, 'Неделя'],
]

const DAY_NAMES_EN = [
  [1, 'Monday'], [2, 'Tuesday'], [3, 'Wednesday'], [4, 'Thursday'], [5, 'Friday'], [6, 'Saturday'], [7, 'Sunday'],
]

function formatMoney(value, currency = 'EUR', locale = 'bg') {
  return new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'bg-BG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value || 0))
}

export function getEligibleStaff(business, serviceId) {
  const mappedStaffIds = business.staffServices
    .filter((item) => item.service_id === serviceId)
    .map((item) => item.staff_id)

  return mappedStaffIds.length
    ? business.staff.filter((person) => mappedStaffIds.includes(person.id))
    : business.staff
}

export function detectGuidedTopic(message) {
  const normalized = String(message || '').toLocaleLowerCase('bg-BG')

  if (/отказ|отмен|анулир|промен|cancel/.test(normalized)) return 'cancellation'
  if (/резерв|запис|свобод|час|appointment|book/.test(normalized)) return 'booking'
  if (/цен|услуг|подстриг|маникюр|процедур|price|service/.test(normalized)) return 'services'
  if (/работ|отвор|затвор|график|кога|hours/.test(normalized)) return 'hours'
  if (/адрес|къде|телефон|контакт|локац|address|phone/.test(normalized)) return 'contact'
  if (/правил|закъс|инструк|услов|policy/.test(normalized)) return 'rules'
  return 'help'
}

function formatServices(business, locale) {
  if (!business.services.length) return locale === 'en' ? 'There are currently no active services available for online booking.' : 'В момента няма активни услуги за онлайн записване.'

  const lines = business.services.map((service) => (
    `• ${service.name} — ${service.duration_min} ${locale === 'en' ? 'min' : 'мин.'}, ${formatMoney(service.price, service.currency, locale)}`
  ))
  return locale === 'en' ? `Services:\n${lines.join('\n')}\n\nI can also guide you through booking step by step.` : `Предлагаме:\n${lines.join('\n')}\n\nМога да те преведа и през резервацията стъпка по стъпка.`
}

function formatWorkingHours(business, locale) {
  const lines = (locale === 'en' ? DAY_NAMES_EN : DAY_NAMES).flatMap(([weekday, label]) => {
    const ranges = [...new Set(
      business.workingHours
        .filter((item) => item.weekday === weekday)
        .map((item) => `${item.open_time.slice(0, 5)}–${item.close_time.slice(0, 5)}`),
    )]
    return ranges.length ? [`${label}: ${ranges.join(', ')}`] : []
  })

  if (!lines.length) return locale === 'en' ? 'Business hours have not been published yet. Contact the business directly for more information.' : 'Работното време все още не е публикувано. Свържи се директно с бизнеса за повече информация.'
  return locale === 'en' ? `Business hours:\n${lines.join('\n')}\n\nAvailable times are checked live during booking.` : `Работно време:\n${lines.join('\n')}\n\nСвободните часове се проверяват в реално време при резервация.`
}

function formatContact(business, locale) {
  const details = [
    business.address ? `${locale === 'en' ? 'Address' : 'Адрес'}: ${business.address}` : null,
    business.phone ? `${locale === 'en' ? 'Phone' : 'Телефон'}: ${business.phone}` : null,
  ].filter(Boolean)

  return details.length
    ? details.join('\n')
    : locale === 'en' ? 'Contact details have not been published yet.' : 'Данните за контакт все още не са публикувани.'
}

export function buildGuidedReply(business, topic, locale = 'bg') {
  switch (topic) {
    case 'booking':
      if (!business.services.length) return locale === 'en' ? 'There are currently no active services available for online booking. Contact the business directly.' : 'В момента няма активни услуги за онлайн записване. Свържи се директно с бизнеса за съдействие.'
      if (!business.staff.length) return locale === 'en' ? 'There is currently no active specialist available for online booking. Contact the business directly.' : 'В момента няма активен специалист за онлайн записване. Свържи се директно с бизнеса за съдействие.'
      return locale === 'en' ? 'Of course. First choose the service you would like to book.' : 'Разбира се. Първо избери услугата, за която искаш да запазиш час.'
    case 'services':
      return formatServices(business, locale)
    case 'hours':
      return formatWorkingHours(business, locale)
    case 'contact':
      return formatContact(business, locale)
    case 'cancellation':
      return locale === 'en' ? `You can cancel using your personal management link, up to ${Number(business.cancellation_notice_hours || 0)} hours before the appointment.` : `Можеш да отмениш резервацията от личния линк за управление. Отказът е възможен до ${Number(business.cancellation_notice_hours || 0)} часа преди часа.`
    case 'rules':
      return business.bot_instructions?.trim()
        ? business.bot_instructions.trim()
        : locale === 'en' ? 'No additional rules are published. For a special request, contact the business directly.' : 'Няма публикувани допълнителни правила. При специален въпрос се свържи директно с бизнеса.'
    default:
      return locale === 'en' ? 'I can help with booking, services and prices, business hours, contact details or cancellations. Choose a topic below.' : 'Мога да помогна с резервация, услуги и цени, работно време, адрес или отказване на час. Избери тема от бутоните по-долу.'
  }
}

export function describeDate(date, zone = 'Europe/Sofia', locale = 'bg') {
  return DateTime.fromISO(date, { zone }).setLocale(locale).toFormat('cccc, d LLLL')
}
