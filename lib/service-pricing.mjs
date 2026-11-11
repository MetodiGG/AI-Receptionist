import { z } from 'zod'

const amount = z.preprocess(value => typeof value === 'number' || typeof value === 'string' && value.trim() !== '' ? value : NaN, z.coerce.number().finite().min(0).max(999999.99).multipleOf(.01))
export const servicePriceDetailsSchema = z.object({
  kind: z.enum(['fixed', 'from', 'range']).optional(),
  maximum: z.preprocess(value => value === '' || value == null ? undefined : value, amount.optional()),
  unit: z.string().trim().max(100).optional(),
}).strict()
const legacyPriceDetailsSchema = z.object({ kind:z.enum(['fixed','from','range']).optional(),maximum:z.number().finite().min(0).optional(),unit:z.string().max(100).optional() }).strict()
export const servicePricingFields = {
  currency: z.enum(['EUR', 'BGN']).default('EUR'),
  description: z.string().trim().max(2000).default(''),
  price_details: servicePriceDetailsSchema.default({}),
}
export function refineServicePricing(service, context) {
  const details = service.price_details || {}, kind = details.kind || 'fixed'
  if (kind === 'range' && (service.price == null || details.maximum == null || details.maximum < service.price)) context.addIssue({ code: 'custom', path: ['price_details', 'maximum'], message: 'PRICE_RANGE_REQUIRED' })
  if (kind !== 'range' && details.maximum != null) context.addIssue({ code: 'custom', path: ['price_details', 'maximum'], message: 'PRICE_MAXIMUM_ONLY_FOR_RANGE' })
  if (kind === 'from' && service.price == null) context.addIssue({ code: 'custom', path: ['price'], message: 'PRICE_REQUIRED' })
}
export const applicationServiceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  price: z.preprocess(value => value == null || typeof value === 'string' && value.trim() === '' ? null : value, amount.nullable()),
  duration_min: z.preprocess(value => value === '' || value == null ? null : value, z.coerce.number().int().min(5).max(1440).nullable()),
  ...servicePricingFields,
}).strict().superRefine(refineServicePricing)
// Existing edited records may use another valid currency. Never relabel them
// as EUR merely because new Sofia catalogue imports use EUR/BGN.
export const editableServiceSchema = applicationServiceSchema.safeExtend({ currency:z.string().regex(/^[A-Z]{3}$/).default('EUR') })

// The scalar is a literal published base amount, NOT an automatic fixed quote.
// Preserve the qualification in every display. Malformed supplied metadata
// fails closed instead of presenting its lower bound as a fixed price.
export function withServicePricing(input) {
  const service = input && typeof input === 'object' ? input : {}
  const raw = service.price
  const price = (typeof raw === 'number' || typeof raw === 'string' && raw.trim() !== '') && Number.isFinite(Number(raw)) && Number(raw) >= 0 ? Number(raw) : null
  const currency = service.currency || 'EUR'
  const details = service.price_details
  const supplied = details != null && (typeof details !== 'object' || Array.isArray(details) || Object.keys(details).length > 0)
  const candidate = supplied ? details : {
    ...(service.priceKind ? { kind: service.priceKind } : {}),
    ...(service.priceMaximum != null ? { maximum: service.priceMaximum } : {}),
    ...(service.priceUnit ? { unit: service.priceUnit } : {}),
  }
  // Existing public catalogue/camelCase formatters accept larger non-DB
  // ranges. Preserve those labels; the storage schema stays bounded above.
  const parsed = (supplied ? servicePriceDetailsSchema : legacyPriceDetailsSchema).safeParse(candidate)
  const valid = parsed.success && /^[A-Z]{3}$/.test(currency)
    && ((parsed.data.kind || 'fixed') === 'range' ? price != null && parsed.data.maximum != null && parsed.data.maximum >= price : parsed.data.maximum == null)
  if (!valid) return { ...service, price: null, currency, priceKind: 'fixed', priceMaximum: null, priceUnit: '' }
  return { ...service, price, currency, priceKind: parsed.data.kind || 'fixed', priceMaximum: parsed.data.maximum ?? null, priceUnit: parsed.data.unit || '' }
}

// Changing kind explicitly removes an incompatible maximum. Changing the base
// amount does NOT silently turn a range/from/unit tariff into a fixed one.
export function editServicePriceDetails(service, patch) {
  const details = { ...(service.price_details || {}), ...patch }
  if (details.kind !== 'range') delete details.maximum
  return details
}
