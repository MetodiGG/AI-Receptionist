import { normalizeSearchText, hasTerm } from './categories.mjs'

// Search vocabulary only, NOT imported listings, GoRez partners, prices,
// appointment inventories or assumed booking links for these organisations.
export const LABORATORY_BRANDS = [
  { name: 'Genica', aliases: ['genica', 'геника'] },
  { name: 'Synevo', aliases: ['synevo', 'синево'] },
  { name: 'Cibalab', aliases: ['cibalab', 'цибалаб', 'циба лаб'] },
  { name: 'Ramus', aliases: ['ramus', 'рамус'] },
]
export const LABORATORY_TERMS = ['лаборатор', 'кръвни изследвания', 'изследване на кръв', 'вземане на кръв', 'medical lab', 'medical laboratory', 'clinical laboratory', 'blood test', 'blood draw']
const brandMatch = (text, alias) => new RegExp(`(?:^|[^\\p{L}\\p{N}])${alias}(?=$|[^\\p{L}\\p{N}])`, 'u').test(text)
export function laboratorySearchService(value) {
  const text = normalizeSearchText(value), brands = LABORATORY_BRANDS.filter(row => row.aliases.some(alias => brandMatch(text, alias)))
  if (!brands.length && !LABORATORY_TERMS.some(term => hasTerm(text, term))) return null
  // A category + explicitly requested brand is enough. Never send symptoms,
  // test results, patient identifiers or free-form clinical narratives.
  return { service: ['медицинска лаборатория', ...brands.map(row => row.name)].join(' '), type: 'medical_lab' }
}
export function laboratoryShortcuts(locale = 'bg') {
  return [{ id: 'all-labs', label: locale === 'en' ? 'Medical laboratories' : 'Лаборатории за изследвания', query: locale === 'en' ? 'medical laboratory' : 'медицинска лаборатория' }, ...LABORATORY_BRANDS.map(row => ({ id: row.name.toLowerCase(), label: row.name, query: `${locale === 'en' ? 'medical laboratory' : 'медицинска лаборатория'} ${row.name}` }))]
}

export function laboratoryServiceEvidence(service, businessName, requestedService) {
  if (!laboratorySearchService(requestedService)) return null
  const requested = normalizeSearchText(requestedService), name = normalizeSearchText(businessName)
  const brands = LABORATORY_BRANDS.filter(row => row.aliases.some(alias => brandMatch(requested, alias)))
  if (brands.some(row => !row.aliases.some(alias => brandMatch(name, alias)))) return false
  const text = `${service.name || ''} ${service.category || ''} ${service.description || ''}`
  return ['лаборатор', 'кръв', 'урина', 'микробиолог', 'биохим', 'хематолог', 'blood test', 'blood draw', 'urine test', 'laboratory', 'pcr'].some(term => hasTerm(text, term))
}
