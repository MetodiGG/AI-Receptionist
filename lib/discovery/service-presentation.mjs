import { publicProse, serviceDisplayName, serviceDisplayUnit } from '../locale/public-content.mjs'
import { bgnToEuroDisplayAmount } from '../currency-display.mjs'

// Presentation only: never change source descriptions, price units, amounts,
// validity, review dates, or the pricing-review fingerprints. Unknown wording
// stays visible so a new qualification cannot accidentally be discarded.
const gpointAudit = /Текуща цена с отстъпка, валидна САМО при онлайн записване, проверена на \d{2}\.\d{2}\.\d{4}\. Условията се потвърждават при записване; не е зачеркнатата стара цена\.?/iu
const menuAudit = /^Меню за посочения салон; вариантът и специалистът се потвърждават при записване\.?$/iu
const branchAudit = /^Тарифа само за посочения обект; при записване уточнете правилния салон\.?$/iu
const variantAudit = /^Тарифа за този обект според услугата и специалиста\. Точният вариант се уточнява при записване\.?$/iu
const oldCurrencyAudit = [
  /Публикувано в лева; тарифата и валутата се потвърждават при записване\.?/giu,
  /Сумата е публикувана в лева, без преизчисляване\. Потвърдете актуалната тарифа и валута при записване\.?/giu,
  /Публикувано в лева; потвърдете тарифата и валутата при записване\.?/giu,
  /Сайтът все още публикува тарифата в BGN; потвърди актуалната цена и валута при записване\. Няма извършена конверсия в EUR\.?/giu,
]

const text = value => typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : ''
const hasPublishedAmount = service => {
  const value = service?.price
  const amount = value && typeof value === 'object' ? value.amount : value
  return (typeof amount === 'number' || typeof amount === 'string' && amount.trim() !== '') && Number.isFinite(Number(amount)) && Number(amount) >= 0
}

export function serviceSourcePresentation(service, locale = 'bg') {
  let description = text(service?.description)
  const conditions = [], en = locale === 'en'
  const currency = service?.price && typeof service.price === 'object' ? service.price.currency : service?.currency
  if (currency === 'BGN' && hasPublishedAmount(service)) {
    // Replace only the known old audit narration, never arbitrary prices or
    // substantive qualifications in source prose. Stored descriptions stay raw.
    for (const pattern of oldCurrencyAudit) description = text(description.replace(pattern, ''))
    conditions.push(en ? 'Converted to EUR at the fixed rate' : 'Преизчислено в евро по фиксирания курс')
  }
  if (!description) return { description: '', conditions }

  // The original G Point paragraph mixes the actual online-only condition
  // with review/audit narration. Retain that condition, not the narration.
  if (gpointAudit.test(description)) {
    description = text(description.replace(gpointAudit, ''))
    if (hasPublishedAmount(service)) conditions.push(en ? 'Online-only discount' : 'Отстъпка само онлайн')
  }

  if (menuAudit.test(description) || variantAudit.test(description)) {
    description = ''
    conditions.push(en ? 'Varies by option and specialist' : 'Според варианта и специалиста')
  } else if (branchAudit.test(description)) {
    description = ''
    conditions.push(en ? "This branch's tariff" : 'Тарифа за този обект')
  }

  return { description, conditions }
}

export function servicePresentation(service, locale = 'bg', { displayedTariff = null } = {}) {
  const result = serviceSourcePresentation(service, locale)
  const description = publicProse(result.description, locale, service?.presentationEn?.description)
  return { ...result, description: displayedTariff ? omitRestatedTariff(description, service, displayedTariff, locale) : description }
}

const fold = value => value.normalize('NFC').toLowerCase().trim().replace(/\s+/gu, ' ')
const minuteWord = /^(?:мин|минута|минути|минутен|минутна|минутно|минутни|min|mins|minute|minutes)$/u
const words = value => (fold(value).match(/[\p{L}\p{N}]+/gu) || []).map(word => minuteWord.test(word) ? 'minute' : word)
const digits = /^\d+$/u
const durationQualifier = /^(?:от|до|поне|минимум|максимум|между|над|под|около|приблизително|или|up|to|from|at|least|most|minimum|maximum|between|over|under|around|about|or)$/u

function saysDuration(label, duration) {
  const terms = words(label)
  const seen = []
  for (let index = 1; index < terms.length; index++) {
    if (terms[index] !== 'minute' || !digits.test(terms[index - 1])) continue
    const qualifier = terms[index - 2] || ''
    // A range, approximate amount or price ceiling is not the same promise
    // as the exact independently sourced duration.
    if (digits.test(qualifier) || durationQualifier.test(qualifier)) return false
    seen.push(Number(terms[index - 1]))
  }
  return seen.length > 0 && seen.every(value => value === duration)
}

const restatedPriceWithDuration = {
  bg: /(^|[.!?]\s+)Публикувана цена (\d+(?:[.,]\d{1,2})?) (?:€|EUR)\s*\/\s*(\d+(?:[.,]\d{1,2})?) (?:лв\.?|BGN) за (\d+) (?:минути|минута|мин\.?)(?:;\s+(\p{L})|[.!?](?=\s|$)|$)/giu,
  en: /(^|[.!?]\s+)Published price (\d+(?:[.,]\d{1,2})?) (?:€|EUR)\s*\/\s*(\d+(?:[.,]\d{1,2})?) (?:BGN|levs?|leva) for (\d+) (?:minutes?|mins?\.?)(?:;\s+(\p{L})|[.!?](?=\s|$)|$)/giu,
}
const decimal = value => Number(value.replace(',', '.'))

function omitRestatedTariff(description, service, { name, unit, durationMin }, locale) {
  if (!description || !hasPublishedAmount(service)) return description
  const source = service.price && typeof service.price === 'object'
    ? service.price : { amount: service.price, currency: service.currency, kind: service.priceKind }
  if ((source.kind && source.kind !== 'fixed') || !['EUR', 'BGN'].includes(source.currency)) return description
  const publishedAmount = Number(source.amount)
  const displayedEuro = source.currency === 'BGN' ? bgnToEuroDisplayAmount(publishedAmount) : publishedAmount
  // Only remove an independent, explicitly restated published tariff when the
  // two amounts are equivalent and the same duration is already in the tile.
  // Leave any unmatched text (e.g. extra fees, limits or different currencies)
  // alone, and keep an exclusion/condition after the semicolon intact.
  const rule = locale === 'en' ? restatedPriceWithDuration.en : restatedPriceWithDuration.bg
  return text(description.replace(rule, (phrase, boundary, euro, leva, minutes, next) => {
    const sameTime = Number(minutes) === durationMin || [name, unit].some(label => label && saysDuration(label, Number(minutes)))
    if (!sameTime || decimal(euro) !== displayedEuro || bgnToEuroDisplayAmount(decimal(leva)) !== displayedEuro
      || (source.currency === 'BGN' && decimal(leva) !== publishedAmount)) return phrase
    return boundary + (next ? next.toLocaleUpperCase(locale) : '')
  }))
}

function samePrivateSession(title, basis) {
  const match = /^(индивидуалн[аое]|индивидуален|private|individual) (практика|тренировка|урок|занимание|сесия|practice|training|lesson|session)(?: (\d+) minute)?$/u.exec(basis.join(' '))
  if (!match || title[0] !== match[1] || !title.slice(1).includes(match[2])) return false
  return !match[3] || saysDuration(title.join(' '), Number(match[3]))
}

function compactDisplayedUnit(unit, name, locale) {
  if (!unit) return ''
  const title = fold(name), basis = fold(unit), titleWords = words(name), basisWords = words(unit)
  if (basisWords.length && basisWords.join(' ') === titleWords.join(' ')) return ''
  const durationOnly = /^(\d+) minute$/u.exec(basisWords.join(' '))
  if ((durationOnly && saysDuration(name, Number(durationOnly[1]))) || samePrivateSession(titleWords, basisWords)) return ''
  if (locale === 'en') {
    const pass = /^(pass for [1-9]\d* training sessions) within ([1-9]\d*) (months?)$/u.exec(basis)
    if (pass && title.split(/\s+[—–-]\s+/u).at(-1) === pass[1]) return `Valid for ${pass[2]} ${pass[3]}`
    if (/^(?:one|single) individual visit for (?:1|one) person$/u.test(basis)
      && /^individual .*\s·\s(?:1|one) person$/u.test(title)) return ''
  } else {
    const pass = /^(карта за [1-9]\d* тренировки) в рамките на ([1-9]\d*) (месец[а]?)$/u.exec(basis)
    if (pass && title.split(/\s+[—–-]\s+/u).at(-1) === pass[1]) return `Валидна ${pass[2]} ${pass[3]}`
    if (/^едно индивидуално посещение за (?:1|един) човек$/u.test(basis)
      && /^индивидуалн[аоия] .*\s·\s(?:1|един) човек$/u.test(title)) return ''
  }
  return unit
}

// View only: source titles, prices, durations and review evidence remain
// untouched. A different billing unit or a qualifier is never abbreviated
// just because it contains one of the same words.
export function serviceDisplayFacts(service, locale = 'bg') {
  const name = serviceDisplayName(service, locale)
  const rawUnit = serviceDisplayUnit(service, 'bg')
  const rawName = serviceDisplayName(service, 'bg')
  const localizedUnit = serviceDisplayUnit(service, locale)
  const hasPrice = hasPublishedAmount(service)
  const unit = hasPrice && compactDisplayedUnit(rawUnit, rawName, 'bg')
    ? compactDisplayedUnit(localizedUnit, name, locale) : ''
  const duration = Number(service?.durationMin ?? service?.duration_min) || 0
  const durationMin = duration > 0 && ![rawName, name, unit].some(label => saysDuration(label, duration)) ? duration : 0
  return { name, unit, durationMin }
}
