import { z } from 'zod'
import { DateTime } from 'luxon'
import { BULGARIAN_CITIES, findCity, NEIGHBOURHOODS, transliterate } from '../business-location.mjs'
import { CATEGORY_IDS, DISCOVERY_CATEGORIES, categoryById, hasTerm, normalizeSearchText } from './categories.mjs'

const nullableText = max => z.string().trim().max(max).nullable()
const clock = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable()
export const discoveryRequestSchema = z.object({
  query: z.string().trim().min(2).max(300), locale: z.enum(['bg', 'en']).default('bg'),
  category: z.enum(CATEGORY_IDS).optional(), cityCode: z.string().regex(/^\d{5}$/).refine(code => Boolean(findCity(code))).optional(),
  neighborhood: z.string().trim().max(120).optional(), radiusKm: z.number().int().min(1).max(25).default(5),
  coordinates: z.object({ latitude: z.number().min(41).max(44.5), longitude: z.number().min(22).max(29), consent: z.literal(true) }).strict().optional(),
}).strict().refine(value => !value.neighborhood || Boolean(value.cityCode), { message: 'Choose a city first' })

export const extractedIntentSchema = z.object({
  category: z.enum(CATEGORY_IDS).nullable(), service: nullableText(100), city: nullableText(100), neighborhood: nullableText(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), timeFrom: clock, timeTo: clock,
  budget: z.object({ max: z.number().positive().max(100000), currency: z.enum(['EUR', 'BGN']) }).strict().nullable(),
  requirements: z.array(z.string().trim().min(1).max(80)).max(5),
}).strict()

const weekdayWords = [['понеделник', 'monday'], ['вторник', 'tuesday'], ['сряда', 'wednesday'], ['четвъртък', 'thursday'], ['петък', 'friday'], ['събота', 'saturday'], ['неделя', 'sunday']]
const boundaryMatch = (text, word) => new RegExp(`(?:^|[^\\p{L}\\p{N}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}\\p{N}])`, 'u').test(text)
const citiesByNameLength = [...BULGARIAN_CITIES].sort((a, b) => b.name.length - a.name.length)
function citiesIn(text) {
  const matches = citiesByNameLength.filter(city => boundaryMatch(text, normalizeSearchText(city.name)) || boundaryMatch(text, normalizeSearchText(city.nameEn)))
  // Avoid treating "Загорци" as a second place inside a longer matched name.
  return matches.filter(city => !matches.some(other => other !== city && normalizeSearchText(other.name).includes(normalizeSearchText(city.name))))
}
export function neighborhoodChoices(cityCode) {
  const rows = [...(NEIGHBOURHOODS[cityCode] || [])]
  if (cityCode === '68134') rows.push('Младост', 'Люлин', 'Надежда', 'Дружба')
  return [...new Set(rows)].sort((a, b) => a.localeCompare(b, 'bg'))
}
function neighborhoodIn(text, cityCode) {
  return neighborhoodChoices(cityCode).sort((a, b) => b.length - a.length).find(value => boundaryMatch(text, normalizeSearchText(value)) || boundaryMatch(text, normalizeSearchText(transliterate(value)))) || null
}
export function parseIntent(input, now = DateTime.now()) {
  const text = normalizeSearchText(input.query), today = now.setZone('Europe/Sofia').startOf('day')
  let categories = DISCOVERY_CATEGORIES.filter(item => item.terms.some(term => hasTerm(text, term)))
  if (categories.some(item => item.id === 'pets')) categories = categories.filter(item => !['hair', 'barber'].includes(item.id))
  if (categories.some(item => item.id === 'barber')) categories = categories.filter(item => item.id !== 'hair')
  const cities = citiesIn(text), city = input.cityCode ? findCity(input.cityCode) : cities.length === 1 ? cities[0] : null
  const category = input.category || (categories.length === 1 ? categories[0].id : null)
  let date = null, invalidDate = false, invalidTime = false, timeFrom = null, timeTo = null
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/), numeric = text.match(/\b(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?\b(?!\s*(?:евро|eur|€|лв|bgn))/u)
  if (iso) date = iso[1]
  else if (numeric) date = `${numeric[3] || today.year}-${numeric[2].padStart(2, '0')}-${numeric[1].padStart(2, '0')}`
  else if (/вдругиден|day after tomorrow/.test(text)) date = today.plus({ days: 2 }).toISODate()
  else if (/утре|tomorrow/.test(text)) date = today.plus({ days: 1 }).toISODate()
  else if (boundaryMatch(text, 'днес') || boundaryMatch(text, 'today')) date = today.toISODate()
  else {
    const matchedDays = weekdayWords.map((words, index) => words.some(word => boundaryMatch(text, word)) ? index : -1).filter(index => index >= 0)
    const dayIndex = matchedDays[0] ?? -1
    invalidDate ||= matchedDays.length > 1
    if (dayIndex >= 0) {
      let offset = (dayIndex + 1 - today.weekday + 7) % 7
      if (/следващ|next/.test(text) && offset === 0) offset = 7
      date = today.plus({ days: offset }).toISODate()
    }
  }
  if (date) { const parsed = DateTime.fromISO(date, { zone: 'Europe/Sofia' }); invalidDate ||= !parsed.isValid || parsed < today || parsed > today.plus({ days: 90 }) }
  const formatClock = (hour, minute = '00', period) => {
    let h = Number(hour); if (period === 'pm' && h < 12) h += 12; if (period === 'am' && h === 12) h = 0
    return h < 24 && Number(minute) < 60 ? `${String(h).padStart(2, '0')}:${minute.padStart(2, '0')}` : null
  }
  for (const [pattern, field] of [[/(?:след|after|от|from)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/u, 'from'], [/(?:преди|before|до|until)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/u, 'to']]) {
    const match = text.match(pattern)
    if (match && !/^(?:\s*(?:евро|eur|€|лв|bgn))/.test(text.slice(match.index + match[0].length))) {
      const value = formatClock(match[1], match[2], match[3]); invalidTime ||= value === null
      if (field === 'from') timeFrom = value; else timeTo = value
    }
  }
  const exact = text.match(/(?:в|at)\s+(\d{1,2}):(\d{2})\s*(am|pm)?/u)
  if (exact && !timeFrom && !timeTo) { timeFrom = timeTo = formatClock(exact[1], exact[2], exact[3]); invalidTime ||= timeFrom === null }
  const requirements = []
  if (/след работа|after work/.test(text) && !timeFrom) { timeFrom = '17:00'; requirements.push('after_work_17') }
  else if (/сутрин|morning/.test(text)) { timeFrom ||= '06:00'; timeTo ||= '12:00' }
  else if (/вечер|evening/.test(text)) { timeFrom ||= '17:00'; timeTo ||= '23:59' }
  if (/карта|card payment/.test(text)) requirements.push('card')
  if (/инвалид|wheelchair|достъпна среда/.test(text)) requirements.push('wheelchair')
  if (/добър|добра|най-добр|best|good|top rated/.test(text)) requirements.push('quality')
  const budgetMatch = text.match(/(?:до|under|up to|budget|max)\s*(\d+(?:[.,]\d{1,2})?)\s*(евро|eur|€|лв\.?|bgn)/u)
  const budget = budgetMatch ? { max: Number(budgetMatch[1].replace(',', '.')), currency: /лв|bgn/.test(budgetMatch[2]) ? 'BGN' : 'EUR' } : null
  const specific = ['barber', 'hair', 'nails', 'beauty'].includes(category) ? ['брада', 'beard', 'маникюр', 'педикюр', 'manicure', 'pedicure', 'боядисване'].find(term => hasTerm(text, term)) : null
  const service = specific || categoryById(category)?.terms.filter(term => hasTerm(text, term)).sort((a, b) => b.length - a.length)[0] || (input.category === 'other' ? input.query.slice(0, 100) : null)
  const intent = extractedIntentSchema.parse({ category, service, city: city?.name || null, neighborhood: input.neighborhood || neighborhoodIn(text, city?.code), date, timeFrom, timeTo, budget, requirements })
  return finalizeIntent(intent, input, { invalidDate, invalidTime, ambiguousCategory: !input.category && categories.length > 1, ambiguousCity: !input.cityCode && cities.length > 1 }, now)
}

export function finalizeIntent(extracted, input, issues = {}, now = DateTime.now()) {
  const intent = extractedIntentSchema.parse(extracted), city = input.cityCode ? findCity(input.cityCode) : citiesIn(normalizeSearchText(intent.city || ''))[0]
  const today = now.setZone('Europe/Sofia').startOf('day')
  if (intent.date) { const date = DateTime.fromISO(intent.date, { zone: 'Europe/Sofia' }); issues.invalidDate ||= !date.isValid || date < today || date > today.plus({ days: 90 }) }
  let clarification = null
  const en = input.locale === 'en'
  if (issues.ambiguousCategory || !intent.category) clarification = { field: 'category', message: en ? 'Which service are you looking for? Choose a category below.' : 'Каква услуга търсиш? Избери категория отдолу.' }
  else if (issues.ambiguousCity || (!city && !input.coordinates)) clarification = { field: 'city', message: en ? 'Which Bulgarian city or town should I search in?' : 'В кое населено място в България да потърся?' }
  else if (issues.invalidDate) clarification = { field: 'date', message: en ? 'Which date in the next 90 days works for you?' : 'Коя дата в следващите 90 дни ти е удобна?' }
  else if ((intent.timeFrom || intent.timeTo) && !intent.date) clarification = { field: 'date', message: en ? 'For which date should I check these times?' : 'За коя дата да проверя тези часове?' }
  else if (issues.invalidTime || (intent.timeFrom && intent.timeTo && intent.timeFrom > intent.timeTo)) clarification = { field: 'time', message: en ? 'What valid time range within one day works for you?' : 'Кой валиден часови диапазон в рамките на един ден ти е удобен?' }
  return { ...intent, category: input.category || intent.category, cityCode: city?.code || null, city: city?.name || null, neighborhood: input.neighborhood || intent.neighborhood, radiusKm: input.radiusKm, coordinates: input.coordinates ? { latitude: input.coordinates.latitude, longitude: input.coordinates.longitude } : null, clarification }
}
