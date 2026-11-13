import { normalizeSearchText } from './categories.mjs'
import { transliterate } from '../business-location.mjs'
import { SERVICE_LEXICON } from './service-lexicon.mjs'

const generic = new Set('софия софиа център студио салон клиника кабинет академия бизнес услуги услуга красота бръснарница фризьор маникюр педикюр терапия консултация медицински дентален дентална за на и в the a and sofia centre center studio salon clinic office academy business services service beauty barber barbershop shop hair nails medical dental'.split(' '))
const nameKey = value => normalizeSearchText(transliterate(value)).replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const genericKeys = new Set([...generic].map(nameKey))
const serviceKeys = new Set(SERVICE_LEXICON.flatMap(row => row.aliases.map(nameKey)))

// A short brand such as "IN Beauty" is not a useful partial-name query, but
// an EXACT existing public name still identifies a business. Never broaden
// ordinary service/category searches or accept a partial two-letter brand.
export function exactBusinessNameQuery(value) {
  const key = nameKey(value)
  return key.length >= 3 && key.length <= 140 && !serviceKeys.has(key) && key.split(' ').some(word => !genericKeys.has(word)) ? key : null
}

// Strict word/phrase matching against actual public names, not fuzzy service
// inference. "Clinic" or a fragment such as "Денте" is not a business identity.
export function businessNameQuery(value) {
  const key = nameKey(value)
  if (key.length < 3 || key.length > 140 || serviceKeys.has(key) || !key.split(' ').some(word => word.length >= 3 && !genericKeys.has(word))) return null
  return key
}
export function businessNameMatches(name, query) {
  const fullName = nameKey(name)
  if (exactBusinessNameQuery(query) === fullName) return true
  const key = businessNameQuery(query)
  if (!key) return false
  if (` ${fullName} `.includes(` ${key} `)) return true
  // Two or more identifying words may omit a generic descriptor, e.g.
  // "Algorithmics Питагор" for "Algorithmics · Академия Питагор".
  // Preserve their exact contiguous order after stripping only generic words:
  // not fuzzy fragments, arbitrary missing name words or a one-word shortcut.
  const meaningful = value => value.split(' ').filter(word => !genericKeys.has(word))
  const words = meaningful(key)
  return words.length >= 2 && new Set(words).size >= 2 &&
    ` ${meaningful(fullName).join(' ')} `.includes(` ${words.join(' ')} `)
}
