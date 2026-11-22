import { BULGARIAN_CITIES, transliterate } from '../business-location.mjs'

// Lightweight selectors, also used by clients: never import the dictionary.
const cyrillic = /[а-яѝ]/iu
const text = value => typeof value === 'string' ? value : ''
export const ENGLISH_TRANSLATION_PENDING = 'English translation pending — switch to Bulgarian to read the original.'

export function englishPresentationText(source, translated, { service = false } = {}) {
  const raw = text(source), en = text(translated)
  if (!raw) return ''
  if (en.trim() && !cyrillic.test(en)) return en
  if (!cyrillic.test(raw)) return raw
  return service ? 'Service · English translation pending' : ENGLISH_TRANSLATION_PENDING
}

export function serviceDisplayName(service, locale = 'bg') {
  return locale === 'en' ? englishPresentationText(service?.name, service?.presentationEn?.name, { service: true }) : text(service?.name)
}

export function serviceDisplayUnit(service, locale = 'bg') {
  const raw = text(service?.priceUnit ?? service?.price_details?.unit ?? service?.price?.unit)
  return locale === 'en' ? englishPresentationText(raw, service?.presentationEn?.unit) : raw
}

export function publicProse(source, locale = 'bg', translated = '') {
  if (source && typeof source === 'object') return locale === 'en'
    ? englishPresentationText(source.bg || source.en, source.en && !cyrillic.test(source.en) ? source.en : translated) : text(source.bg || source.en)
  return locale === 'en' ? englishPresentationText(source, translated) : text(source)
}

// Transliteration is for postal proper names only, never service translation.
export function postalDisplay(value, locale = 'bg') {
  if (locale !== 'en') return text(value)
  const raw = text(value), city = BULGARIAN_CITIES.find(item => raw === item.name || raw.startsWith(item.name + ','))
  return transliterate((city ? city.nameEn + raw.slice(city.name.length) : raw).replace(/(^|[\s,])(ул\.?|улица)(?=\s)/giu, '$1St.')
    .replace(/(^|[\s,])(бул\.?|булевард)(?=\s)/giu, '$1Blvd.')
    .replace(/(^|[\s,])(ж\.?к\.?|кв\.?|квартал)(?=\s)/giu, '$1District')
    .replace(/(^|[\s,])(бл\.?|блок)(?=\s)/giu, '$1Block')
    .replace(/(^|[\s,])(вх\.?|вход)(?=\s)/giu, '$1Entrance')
    .replace(/(^|[\s,])(ет\.?|етаж)(?=\s)/giu, '$1Floor')
    .replace(/(^|[\s,])(ап\.?|апартамент)(?=\s)/giu, '$1Apartment'))
}

export function businessDisplayAddress(business, locale = 'bg') {
  return locale === 'en' && business?.presentationEn?.address ? business.presentationEn.address : postalDisplay(business?.address, locale)
}
