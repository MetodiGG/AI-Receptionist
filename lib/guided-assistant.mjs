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

function formatMoney(value, currency = 'EUR') {
  return new Intl.NumberFormat('bg-BG', {
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

function formatServices(business) {
  if (!business.services.length) return 'В момента няма активни услуги за онлайн записване.'

  const lines = business.services.map((service) => (
    `• ${service.name} — ${service.duration_min} мин., ${formatMoney(service.price, service.currency)}`
  ))
  return `Предлагаме:\n${lines.join('\n')}\n\nМога да те преведа и през резервацията стъпка по стъпка.`
}

function formatWorkingHours(business) {
  const lines = DAY_NAMES.flatMap(([weekday, label]) => {
    const ranges = [...new Set(
      business.workingHours
        .filter((item) => item.weekday === weekday)
        .map((item) => `${item.open_time.slice(0, 5)}–${item.close_time.slice(0, 5)}`),
    )]
    return ranges.length ? [`${label}: ${ranges.join(', ')}`] : []
  })

  if (!lines.length) return 'Работното време все още не е публикувано. Свържи се директно с бизнеса за повече информация.'
  return `Работно време:\n${lines.join('\n')}\n\nСвободните часове се проверяват в реално време при резервация.`
}

function formatContact(business) {
  const details = [
    business.address ? `Адрес: ${business.address}` : null,
    business.phone ? `Телефон: ${business.phone}` : null,
  ].filter(Boolean)

  return details.length
    ? details.join('\n')
    : 'Данните за контакт все още не са публикувани.'
}

export function buildGuidedReply(business, topic) {
  switch (topic) {
    case 'booking':
      if (!business.services.length) return 'В момента няма активни услуги за онлайн записване. Свържи се директно с бизнеса за съдействие.'
      if (!business.staff.length) return 'В момента няма активен специалист за онлайн записване. Свържи се директно с бизнеса за съдействие.'
      return 'Разбира се. Първо избери услугата, за която искаш да запазиш час.'
    case 'services':
      return formatServices(business)
    case 'hours':
      return formatWorkingHours(business)
    case 'contact':
      return formatContact(business)
    case 'cancellation':
      return `Можеш да отмениш резервацията от личния линк за управление. Отказът е възможен до ${Number(business.cancellation_notice_hours || 0)} часа преди часа.`
    case 'rules':
      return business.bot_instructions?.trim()
        ? business.bot_instructions.trim()
        : 'Няма публикувани допълнителни правила. При специален въпрос се свържи директно с бизнеса.'
    default:
      return 'Мога да помогна с резервация, услуги и цени, работно време, адрес или отказване на час. Избери тема от бутоните по-долу.'
  }
}

export function describeDate(date, zone = 'Europe/Sofia') {
  return DateTime.fromISO(date, { zone }).setLocale('bg').toFormat('cccc, d LLLL')
}
