// UI-only disclosure: retain the original text verbatim. The conservative
// condition flag controls how the disclosure is labelled, not which facts are
// retained. It is not a price/eligibility parser or source rewrite.
const SHORT_DESCRIPTION = 180
const boundary = terms => new RegExp('(?:^|[^\\p{L}\\p{N}])(?:' + terms + ')(?=$|[^\\p{L}\\p{N}])', 'iu')
const criticalWords = boundary([
  'не', 'без', 'само', 'освен', 'при', 'според', 'ако', 'преди', 'след', 'до', 'над', 'между',
  'not', 'no', 'without', 'only', 'unless', 'except', 'if', 'before', 'after', 'until', 'per',
  'must', 'mandatory', 'compulsory', 'cannot', 'minimum', 'maximum', 'subject', 'depending',
  'from', 'total', 'single', 'entire', 'overall', 'own', 'bring', 'customer', 'client',
  'евро', 'лева', 'EUR', 'BGN', 'euros?', 'levs?',
  'жени', 'жените', 'мъже', 'мъжете', 'момичета', 'момчета',
  'date', 'time', 'address', 'scope', 'budget', 'labour', 'labor',
].join('|'))
const criticalTerms = [
  /цен[аиоу]|тариф|такс|сум[аиъ]|плащ|запла|допла|отстъп|безплат|промоц|депозит|капаро|ДДС|материал|консуматив|резервн|части|продукт|разход|транспорт|достав|отделн|предплат|абонамент|пакет|валид|изтич|срок|включ|изключ|огранич|услови|потвър|записв|резерв[аи]|предварител|уговор|договар|уточн|ориентир|окончател|крайн|началн|миним|максим|посещен|сеанс|учебн|астрономичес|мину|час[аоъ]|специалист|стилист|фризьор|филиал|обект|салон|дете|деца|учен|възраст|пълнолет|непълнолет|бременн|медицин|клиник|диагноз|диагност|лечен|противопоказ|неподход|неприем|невъзмож|непред|сутрин|следобед|вечер|уикенд|делнич|събот|недел|празни[кц]/iu,
  /\b(?:fees?|costs?|pay|paid|payable|VAT|tax|taxes|staff)\b|price|pricing|tariff|charge|payment|discount|deposit|material|consumable|spare part|product|expense|travel|transport|separat|additional|prepay|subscription|membership|package|valid|expir|cancell|resched|includ|exclud|confirm|appointment|booking|reservation|availability|unavailable|advance|pre-arrang|prearrang|quote|quotation|estimat|indicativ|final|starting|visit|session|lesson|minute|hour|specialist|stylist|branch|premises|adult|child|minor|pregnan|medical|clinic|diagnos|treatment plan|contraindicat|unsuitable|ineligible|weekday|weekend|holiday|morning|afternoon|evening|n['’]t/iu,
  /съобраз|състояни|пациент|замърся|диапазон|собствен|клиент|осигур|задълж|изискв|необход|отказ|анулир|съглас|поверител|портфолио|mild|moderate|heavy|soiling|contaminat|condition|patient|requir|confidential|privacy|portfolio|supplied|provided|obligation|according|varies|vary|hair length|\b(?:rates?|women|men|ladies|boys|girls)\b/iu,
  /pollution|ready[- ]made|prepared|existing connections|connections|\b(?:short|medium[- ]length|shoulder[- ]length|longer)\b.*\bhair\b/iu,
]
const isCritical = value => /\p{N}|[€$£%]/u.test(value) || criticalWords.test(value) || criticalTerms.some(pattern => pattern.test(value))

export function serviceDescriptionDisclosure(description, { foldConditions = false } = {}) {
  if (typeof description !== 'string' || !description.trim()) return { visible: [], more: '', hasConditions: false }
  const source = description.trim()
  if (source.length <= SHORT_DESCRIPTION && !foldConditions) return { visible: [source], more: '', hasConditions: false }
  const hasConditions = isCritical(source)
  if (source.length <= SHORT_DESCRIPTION && !hasConditions) return { visible: [source], more: '', hasConditions: false }
  return { visible: [], more: source, hasConditions }
}
