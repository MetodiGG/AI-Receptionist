import { hasTerm, normalizeSearchText } from './categories.mjs'
import { transliterate } from '../business-location.mjs'

// Reviewed service vocabulary, not business facts or a new public taxonomy.
// Longer phrases beat broad words (facial cleaning != household cleaning).
// Unsupported specialist domains use the existing Other service category and
// exact text discovery; a hospital/shop is never evidence of that specialty.
const entry = (category, service, aliases) => ({ category, service, aliases: [service, ...aliases] })
export const SERVICE_LEXICON = [
  entry('barber', 'барбершоп', ['барбър', 'бръснар', 'бръснарница', 'barber', 'barbershop']),
  entry('barber', 'оформяне на брада', ['брада', 'beard trim', 'бръснене']),
  entry('hair', 'фризьор', ['фризьор', 'фризьорски салон', 'hairdresser', 'hair salon', 'frizior', 'frizyor']),
  entry('hair', 'подстригване', ['подстриг', 'haircut']),
  entry('hair', 'боядисване на коса', ['боядисване', 'омбре', 'балеаж', 'hair coloring', 'hair colouring']),
  entry('nails', 'маникюр', ['маникюр', 'manicure', 'nails', 'nail salon', 'manikur', 'mannikur']),
  entry('nails', 'педикюр', ['педикюр', 'pedicure']),
  entry('nails', 'гел лак', ['гел лак', 'gel polish']),
  entry('nails', 'ноктопластика', ['ноктопластика', 'изграждане на нокти', 'nail extensions']),
  entry('beauty', 'почистване на лице', ['почистване на лице', 'facial cleansing']),
  entry('beauty', 'ламиниране на вежди', ['ламиниране на вежди', 'brow lamination']),
  entry('beauty', 'миглопластика', ['миглопластика', 'lash extensions']),
  entry('beauty', 'козметик', ['козметик', 'козметичка', 'beautician']),
  entry('beauty', 'лазерна епилация', ['лазерна епилация', 'laser hair removal']),
  entry('beauty', 'епилация', ['епилация', 'waxing']),
  entry('beauty', 'професионален грим', ['гримьор', 'грим', 'makeup']),
  entry('car_wash', 'автомивка', ['автомив', 'car wash', 'измиване на автомобил', 'измиване на кола']),
  entry('detailing', 'автодетайлинг', ['автодетайлинг', 'детайлинг', 'полиране', 'detailing']),
  entry('auto_repair', 'автосервиз', ['автосервиз', 'авторемонт', 'auto repair', 'car repair', 'garage']),
  entry('auto_repair', 'смяна на масло', ['смяна на масло', 'oil change']),
  entry('auto_repair', 'смяна на гуми', ['смяна на гуми', 'гуми', 'tyre', 'tire']),
  entry('auto_repair', 'автодиагностика', ['автодиагностика', 'диагностика на', 'car diagnostics']),
  entry('auto_repair', 'ремонт на климатик на кола', ['климатик на кола', 'автоклиматик', 'car ac repair']),
  entry('auto_repair', 'тенекеджия', ['тенекеджия', 'тенекеджийски', 'bodywork']),
  entry('auto_repair', 'ремонт на спирачки', ['спирачки', 'brake repair']),
  ...['пилатес', 'йога', 'тенис', 'падел', 'футболно игрище', 'танци', 'плуване', 'бокс'].map((service, index) => entry('fitness', service, [['pilates', 'реформър', 'репормер'], ['yoga'], ['tennis'], ['padel'], ['football pitch'], ['dance', 'салса'], ['swimming'], ['boxing']][index])),
  entry('fitness', 'персонален треньор', ['персонален треньор', 'личен треньор', 'personal trainer', 'тренировка']),
  entry('fitness', 'спортни занимания', ['спорт', 'фитнес', 'sports', 'fitness']),
  entry('education', 'уроци по английски', ['английски', 'english teacher', 'ielts']),
  entry('education', 'уроци по математика', ['математика', 'math tutor', 'mathematics']),
  entry('education', 'уроци по немски', ['немски', 'german lessons']),
  entry('education', 'уроци по китара', ['китара', 'guitar lessons']),
  entry('education', 'уроци по пиано', ['пиано', 'piano lessons']),
  entry('education', 'шофьорски курсове', ['шофьорски курсове', 'driving school']),
  entry('education', 'уроци по рисуване', ['рисуване', 'art lessons']),
  entry('education', 'подготовка за матура по БЕЛ', ['матура', 'БЕЛ']),
  entry('education', 'уроци', ['урок', 'уроци', 'учител', 'обучение', 'tutor', 'lesson']),
  entry('health', 'физиотерапия', ['физиотерап', 'physiotherapy', 'physiotherapist']),
  entry('health', 'рехабилитация', ['рехабилит', 'rehabilitation']),
  ...['невролог', 'дерматолог', 'зъболекар', 'кардиолог', 'психолог', 'логопед', 'ортопед', 'масаж', 'сауна', 'ароматерапия', 'рефлексотерапия'].map((service, index) => entry('other', service, [['neurologist'], ['dermatologist'], ['dentist'], ['cardiologist'], ['psychologist'], ['speech therapist'], ['orthopedist'], ['massage', 'масажж'], ['sauna'], ['aromatherapy'], ['reflexology']][index])),
  entry('other', 'офталмолог', ['офталмолог', 'очен лекар', 'ophthalmologist']),
  entry('beauty', 'спа процедури за лице', ['спа процедури за лице', 'spa facial']),
  entry('pets', 'груминг', ['груминг', 'грумър', 'подстригване на куче', 'кучешки груминг', 'котешки груминг', 'pet grooming', 'grooming']),
  entry('other', 'ветеринар', ['ветеринар', 'veterinarian', 'ветеринарен кабинет', 'почистване на зъби на куче']),
  entry('other', 'хотел за кучета', ['хотел за кучета', 'pet boarding']),
  entry('other', 'треньор за кучета', ['треньор за кучета', 'dog training']),
  entry('home_services', 'почистване на апартамент', ['почистване на апартамент', 'почисти апартамента', 'домашна помощница', 'cleaning', 'почистване']),
  entry('home_services', 'пране на диван', ['пране на диван', 'upholstery cleaning']),
  entry('home_services', 'електротехник', ['електротехник', 'electrician']),
  entry('home_services', 'водопроводчик', ['водопроводчик', 'plumber']),
  entry('home_services', 'монтаж на климатик', ['монтаж на климатик', 'air conditioning installation']),
  entry('home_services', 'преместване на мебели', ['преместване на мебели', 'movers']),
  entry('home_services', 'ремонт на бойлер', ['бойлер', 'water heater']),
  entry('home_services', 'градинар', ['градинар', 'gardener']),
  entry('home_services', 'ключар', ['ключар', 'locksmith']),
  entry('consulting', 'счетоводител', ['счетовод', 'accountant']),
  entry('consulting', 'адвокат', ['адвокат', 'юридическа', 'lawyer']),
  entry('consulting', 'консултация с архитект', ['архитект', 'architect']),
  entry('consulting', 'консултация', ['консулт', 'consultant', 'consulting']),
  entry('other', 'фотограф', ['фотограф', 'фотосесия', 'photographer']),
  entry('other', 'студио под наем', ['студио за снимки', 'музикално студио', 'зала за събитие']),
]

export function normalizeDiscoveryLanguage(value) {
  return normalizeSearchText(value)
    .replace(/\b(?:sofiq|sofia)\b/gu, 'софия').replace(/\b(?:mlados|mladost)\b/gu, 'младост')
    .replace(/\bavtoserviz\b/gu, 'автосервиз').replace(/(?:^|\s)(?:utre|utре)(?=\s|$)/gu, ' утре')
    .replace(/маникур/gu, 'маникюр').replace(/репормер/gu, 'реформър')
}
export function identifySearchService(query, category) {
  const text = normalizeDiscoveryLanguage(query)
  const matches = SERVICE_LEXICON.flatMap(item => item.aliases.flatMap(alias => {
    const forms = [alias, transliterate(alias)]
    const matched = forms.find(form => text.includes(normalizeSearchText(form)) && hasTerm(text, form))
    const end = matched ? text.indexOf(normalizeSearchText(matched)) + matched.length : -1
    const wholeWord = end >= 0 && !/\p{L}/u.test(text[end] || '')
    return matched ? [{ ...item, matched, score: matched.length + (wholeWord ? 10 : 0) }] : []
  })).sort((a, b) => b.score - a.score)
  return category ? matches.find(item => item.category === category) || null : matches[0] || null
}

// Canonical spelling + the user's additional service details, not scheduling
// or geographic prose. This keeps e.g. pediatric neurology / curly hair narrow.
export function serviceSearchPhrase(text, match, { city, neighborhood } = {}) {
  let value = normalizeDiscoveryLanguage(text)
  // A clinician's specialty is enough for discovery. Do not forward a user's
  // symptom narrative, contact details or account data in the provider query.
  if (match && ['невролог', 'дерматолог', 'зъболекар', 'офталмолог', 'кардиолог', 'психолог', 'логопед', 'ортопед'].includes(match.service)) {
    return [/(?:детски|детско|дете|деца)/u.test(value) ? 'детски' : '', match.service, /онлайн|online/u.test(value) ? 'онлайн' : ''].filter(Boolean).join(' ')
  }
  // Canonicalise spelling/translation, never replace a Cyrillic stem inside
  // another word ("консултант" must not become "консултацияант"). Preserve
  // meaningful extra words: IELTS, cat grooming, pediatric, reformer, etc.
  if (match && /[a-z]|масажж/u.test(match.matched)) value = value.replace(normalizeSearchText(match.matched), match.service)
  for (const place of [neighborhood, city].filter(Boolean)) value = value.replaceAll(normalizeSearchText(place), '')
  return value
    .replace(/https?:\/\/\S+|\S+@\S+|\+?\d[\d ()-]{7,}\d/giu, '')
    .replace(/(?:до|under|up to)\s*\d+(?:[.,]\d+)?\s*(?:евро|eur|€|лв|bgn)/gu, '')
    .replace(/(?:за\s+)?(?:след|in)\s+\d+\s*(?:седмици|седмица|weeks?)/gu, '')
    .replace(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\.\d{1,2}(?:\.\d{4})?\b/gu, '')
    .replace(/(?:след|преди|от|до|в|after|before|from|until|at)\s+\d{1,2}(?::\d{2})?\s*(?:ч\.?|am|pm)?/gu, '')
    .replace(/(?:на|до|within)\s*\d+\s*(?:км|km)/gu, '')
    .replace(/днес|утре|вдругиден|вчера|след работа|тази вечер|тази събота|сега|следващия?\s+\p{L}+|today|tomorrow|after work|near me|близо до мен|около мен|наблизо|от мен|из цяла/gu, '')
    .replace(/понеделник|вторник|сряда|четвъртък|петък|събота|неделя|сутрин|вечер|morning|evening/gu, '')
    .replace(/^(?:(?:търся|намери|искам|добър|добра|най-добрия|ми|някой|да|си|запиша|a|find|me|good)\s+)+/gu, '')
    .replace(/[,.]+/gu, ' ').replace(/\s+/gu, ' ').trim().replace(/\s+(?:за|в|във|на|v|in|от|всеки)$/u, '').trim().slice(0, 100) || match?.service || null
}

export function serviceHasEvidence(text, service) {
  const match = identifySearchService(service)
  if (!match) return hasTerm(text, service)
  if (!match.aliases.some(alias => hasTerm(text, alias)) && !hasTerm(text, match.service)) return false
  // An explicit speciality needs published evidence as well as the broad service.
  for (const qualifier of ['детски', 'детско', 'деца', 'бременни', 'къдрава', 'начинаещи', 'реформър', 'омбре', 'сватба', 'self service', 'пудел', 'котешки']) {
    if (hasTerm(service, qualifier) && !hasTerm(text, qualifier)) return false
  }
  return true
}

export function isGenericSearchService(service, category) {
  const generic = {
    barber: ['барбершоп', 'барбър', 'бръснар', 'barber', 'barbershop'],
    hair: ['фризьор', 'hair', 'hairdresser', 'hair salon'],
    nails: ['nails', 'nail salon'], beauty: ['красота', 'козметик', 'beauty'],
    auto_repair: ['автосервиз', 'auto repair'], car_wash: ['автомивка', 'car wash'],
    fitness: ['спорт', 'спортни занимания', 'спортни занимания и тренировки', 'sports'],
    education: ['уроци', 'lessons'], home_services: ['за дома', 'home services'],
    consulting: ['консултации', 'consulting'], health: ['терапии', 'therapies'],
  }
  return generic[category]?.includes(normalizeSearchText(service)) || false
}
