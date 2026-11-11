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

export function servicePresentation(service, locale = 'bg') {
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
