import { PARTNER_CATEGORY_KEYS } from './partner-leads.mjs'

const object = value => value && typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value)) ? value : {}
const blank = value => value == null || (typeof value === 'string' && !value.trim())
const suppliedText = value => typeof value === 'string' && !blank(value)

export const emptyOnboardingService = () => ({ name: '', price: '', duration_min: '' })

// Even zero or an invalid nonempty draft value is an edit: a lookup must not
// silently overwrite something the owner has already entered.
export function hasServiceDraftEdits(services) {
  return Array.isArray(services) && services.some(service => {
    const row = object(service)
    return ['name', 'price', 'duration_min'].some(key => !blank(row[key]))
  })
}

// A public directory match is not an ownership claim. Copy only these public
// fields into a NEW editable draft; the caller generates a fresh page slug.
export function mergeCatalogueBusiness(current, source) {
  const existing = object(current), selected = object(source), result = { ...existing }
  if (suppliedText(selected.name)) result.name = selected.name
  for (const [key, alias] of [['phone'], ['address'], ['city_ekatte', 'cityCode'], ['neighborhood'], ['website_url', 'website']]) {
    const value = suppliedText(selected[key]) ? selected[key] : alias ? selected[alias] : undefined
    if (blank(existing[key]) && suppliedText(value)) result[key] = value
  }
  if (existing.industry === 'other' && PARTNER_CATEGORY_KEYS.includes(selected.industry)) result.industry = selected.industry
  return result
}

const publicFillFields = ['phone', 'address', 'city_ekatte', 'neighborhood', 'website_url', 'industry']

// Keep import provenance with the business state, so rapid selections cannot
// erase manual edits or carry an untouched address from the previous venue.
export function selectCatalogueBusinessDraft(state, source) {
  const current = object(state), retained = { ...object(current.business) }
  for (const field of publicFillFields) {
    if (Object.hasOwn(object(current.importedFields), field) && retained[field] === current.importedFields[field]) retained[field] = field === 'industry' ? 'other' : ''
  }
  const business = mergeCatalogueBusiness(retained, source), importedFields = {}
  for (const field of publicFillFields) {
    if ((blank(retained[field]) || field === 'industry' && retained[field] === 'other') && !blank(business[field]) && business[field] !== retained[field]) importedFields[field] = business[field]
  }
  return { business, importedFields }
}

export function editOnboardingBusinessDraft(state, patch) {
  const current = object(state), values = object(patch)
  return {
    business: { ...object(current.business), ...values },
    importedFields: Object.fromEntries(Object.entries(object(current.importedFields)).filter(([field]) => !Object.hasOwn(values, field))),
  }
}

const decimal = value => {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const text = typeof value === 'string' ? value : String(value)
  if (!/^[0-9]+(?:\.[0-9]+)?$/.test(text.trim())) return null
  const number = Number(text)
  return Number.isFinite(number) ? { text, number } : null
}

function importedPrice(row, hint) {
  // Raw catalogue price objects must never become one fixed EUR amount.
  // A scalar DTO still cannot override a disclosed currency/from/range/unit.
  if (hint?.requiresPriceConfirmation === true) return ''
  for (const key of ['currency', 'priceCurrency', 'price_currency']) {
    if (!blank(row[key]) && row[key] !== 'EUR') return ''
  }
  for (const key of ['kind', 'priceKind', 'price_kind']) {
    if (!blank(row[key]) && row[key] !== 'fixed') return ''
  }
  if (['unit', 'priceUnit', 'price_unit', 'description'].some(key => !blank(row[key]))) return ''
  const value = decimal(row.price)
  if (!value || value.number < 0 || value.number > 999999.99 || (value.text.trim().split('.')[1]?.length || 0) > 2) return ''
  return value.text
}

function importedDuration(value) {
  const parsed = decimal(value)
  return parsed && Number.isInteger(parsed.number) && parsed.number >= 5 && parsed.number <= 1440 ? parsed.text : ''
}

function importedHint(value) {
  const source = object(value), hint = {}
  for (const [key, maximum] of [['priceLabel', 500], ['description', 2000]]) {
    if (typeof source[key] === 'string') {
      if (source[key].length <= maximum) hint[key] = source[key]
      // Never silently cut a price qualification into an apparently full one.
      else hint.requiresPriceConfirmation = true
    }
  }
  if (typeof source.requiresPriceConfirmation === 'boolean') hint.requiresPriceConfirmation ||= source.requiresPriceConfirmation
  return Object.keys(hint).length ? hint : null
}

// indexes is optional; an explicit array/Set selects rows in original order.
// No name/row limit is hidden here: overlong names or >40 selections must be
// visible for the owner to resolve, rather than silently cut or discarded.
export function normalizeImportedServices(services, indexes) {
  if (!Array.isArray(services)) return []
  const selected = indexes === undefined ? null : new Set(
    (Array.isArray(indexes) || indexes instanceof Set ? [...indexes] : []).filter(Number.isInteger)
  )
  return services.flatMap((service, index) => {
    if (selected && !selected.has(index)) return []
    const row = object(service)
    const catalogueHint = importedHint(row.catalogueHint)
    return [{
      name: typeof row.name === 'string' ? row.name : '',
      price: importedPrice(row, catalogueHint),
      duration_min: importedDuration(row.duration_min),
      catalogueHint,
    }]
  })
}

// Validation remains authoritative on the server. Preserve entered values,
// including invalid nonblank ones, but never send UI/source/identity metadata.
export function servicesForApplication(services) {
  if (!Array.isArray(services)) return []
  return services.map(service => {
    const row = object(service)
    return { name: row.name ?? '', price: blank(row.price) ? null : row.price, duration_min: blank(row.duration_min) ? null : row.duration_min }
  })
}
