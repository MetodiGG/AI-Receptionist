import { PARTNER_CATEGORY_KEYS } from './partner-leads.mjs'
import { servicePriceDetailsSchema } from './service-pricing.mjs'

const object = value => value && typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value)) ? value : {}
const blank = value => value == null || (typeof value === 'string' && !value.trim())
const suppliedText = value => typeof value === 'string' && !blank(value)

export const emptyOnboardingService = () => ({ name: '', price: '', duration_min: '' })

// Even zero or an invalid nonempty draft value is an edit: a lookup must not
// silently overwrite something the owner has already entered.
export function hasServiceDraftEdits(services) {
  return Array.isArray(services) && services.some(service => {
    const row = object(service)
    return ['name', 'price', 'duration_min', 'description'].some(key => !blank(row[key]))
      || !blank(row.currency) && row.currency !== 'EUR'
      || row.price_details != null && (typeof row.price_details !== 'object' || Array.isArray(row.price_details) || Object.keys(row.price_details).length > 0)
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

function importedPrice(row, pricing) {
  // Price objects are not parsed as scalar numbers. Currency, range and units
  // travel separately, so filling the amount never turns them into fixed EUR.
  if (!pricing.valid) return ''
  const value = decimal(row.price)
  if (!value || value.number < 0 || value.number > 999999.99 || (value.text.trim().split('.')[1]?.length || 0) > 2) return ''
  if (pricing.details.kind === 'range' && (pricing.details.maximum == null || pricing.details.maximum < value.number)) return ''
  return value.text
}

function importedPricing(row, hint) {
  const currency = row.currency ?? row.priceCurrency ?? row.price_currency ?? 'EUR'
  const rawHint = object(row.catalogueHint)
  const description = typeof row.description === 'string' ? row.description : typeof rawHint.description === 'string' ? rawHint.description : hint?.description || ''
  const kind = row.kind ?? row.priceKind ?? row.price_kind
  const maximum = row.maximum ?? row.priceMaximum ?? row.price_maximum
  const unit = row.unit ?? row.priceUnit ?? row.price_unit
  const source = row.price_details ?? { ...(kind ? { kind } : {}), ...(maximum != null ? { maximum } : {}), ...(unit ? { unit } : {}) }
  const parsed = servicePriceDetailsSchema.safeParse(source)
  const details = parsed.success ? parsed.data : {}
  return { currency: ['EUR', 'BGN'].includes(currency) ? currency : 'EUR', description, details,
    valid: parsed.success && ['EUR', 'BGN'].includes(currency) && description.length <= 2000 && (details.kind === 'range' || details.maximum == null) }
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
    }
  }
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
    const pricing = importedPricing(row, catalogueHint)
    return [{
      name: typeof row.name === 'string' ? row.name : '',
      price: importedPrice(row, pricing),
      duration_min: importedDuration(row.duration_min),
      currency: pricing.currency, description: pricing.description, price_details: pricing.details,
      catalogueHint,
    }]
  })
}

// Validation remains authoritative on the server. Preserve entered values,
// including invalid nonblank ones. Price meaning/conditions are real service
// data, unlike catalogue hints, source identities or ownership claims.
export function servicesForApplication(services) {
  if (!Array.isArray(services)) return []
  return services.map(service => {
    const row = object(service)
    const details = object(row.price_details)
    return { name: row.name ?? '', price: blank(row.price) ? null : row.price, duration_min: blank(row.duration_min) ? null : row.duration_min,
      ...(Object.hasOwn(row, 'currency') ? { currency: row.currency } : {}),
      ...(Object.hasOwn(row, 'description') ? { description: row.description } : {}),
      ...(Object.hasOwn(row, 'price_details') ? { price_details: row.price_details && !Array.isArray(row.price_details) && object(row.price_details) === row.price_details
        ? Object.fromEntries(['kind', 'maximum', 'unit'].filter(key => Object.hasOwn(details, key)).map(key => [key, details[key]])) : row.price_details } : {}) }
  })
}
