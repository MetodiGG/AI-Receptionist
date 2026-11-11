import { z } from 'zod'
import { CATEGORY_IDS } from './categories.mjs'
import { safeBookingUrl } from '../booking-mode.mjs'
import { CATALOGUE_MAX_RECORDS } from './catalogue-limits.mjs'
export { CATALOGUE_MAX_RECORDS } from './catalogue-limits.mjs'

export const CATALOGUE_REVIEW_DAYS = 90
// The owner's 2026-11-11 catalogue scope excludes general human clinics.
// Keep their reviewed source and pricing history intact: this is publication
// eligibility, not deletion or a rewrite of the verified service inventories.
// Dental practices, psychology/psychiatry, labs and veterinary care are not
// inferred to be excluded from their names or the word "clinic" alone.
export const EXCLUDED_GENERAL_CLINIC_IDS = Object.freeze([
  'sofia-balance-clinic',
  'sofia-park-clinic',
  'sofia-poliklinikata-lyulin',
  'sofia-health-master-clinic-ralevitsa',
  'sofia-lyves-clinic-flora',
  'sofia-medconvex-lavski-rid',
  'sofia-arthromedica',
  'sofia-sportmed',
  'sofia-serkan-uzun-ortopedia',
  'sofia-avitsena-rehabilitation',
  'sofia-lora-pozitano',
  'sofia-lora-za-zhenata',
  'sofia-lora-krasno-selo',
  // Additional own-source scope audit: hospital/medical-centre services and
  // medical aesthetics, not the permitted dentistry/mental-health exception.
  'sofia-vita-base-one',
  'sofia-vita-base-two',
  'sofia-q-life-kinezitherapy',
  'sofia-nikolay-chudotvorets-rehab',
  'sofia-haelan-bulgaria-rehab',
  'sofia-haelan-mladost-rehab',
  'sofia-serkan-uzun-lyulin',
  'sofia-kerimov-derma-aesthetic-sofia',
  'sofia-omni-iztok',
  'sofia-omni-druzhba',
])
const excludedGeneralClinics = new Set(EXCLUDED_GENERAL_CLINIC_IDS)
// Only rows parsed and recursively frozen by validateCatalogue are trusted
// here. A caller freezing an arbitrary root object cannot bypass validation.
// This avoids reparsing the entire static inventory on every search while
// dates/status are still checked on every request. Dynamic rows stay untrusted.
const validatedImmutableRows = new WeakSet()
function immutable(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) immutable(child)
    Object.freeze(value)
  }
  return value
}
const https = z.string().max(2048).refine(value => Boolean(safeBookingUrl(value)), 'Use a public, direct HTTPS URL')
const day = z.iso.date()
const evidence = z.object({ url: https, excerpt: z.string().trim().min(8).max(180) }).strict()
const price = z.object({ amount: z.number().finite().min(0).max(1000000), currency: z.enum(['EUR', 'BGN']), kind: z.enum(['fixed', 'from', 'range']),
  maximum: z.number().finite().min(0).max(1000000).optional(), unit: z.string().trim().min(1).max(100).optional(),
  sourceUrl: https, checkedOn: day, validUntil: day.optional(),
}).strict().superRefine((value, ctx) => {
  if (value.kind === 'range' ? value.maximum == null || value.maximum < value.amount : value.maximum != null) ctx.addIssue({ code: 'custom', path: ['maximum'], message: 'Only a published range may carry a maximum, not an estimated one' })
  if (value.validUntil && value.validUntil < value.checkedOn) ctx.addIssue({ code: 'custom', path: ['validUntil'], message: 'An expired price must not be newly verified' })
})
const clock = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
const period = z.object({ open: clock, close: clock }).strict().refine(value => value.open < value.close)
const hours = z.object({ days: z.array(z.object({ weekday: z.number().int().min(1).max(7), periods: z.array(period).max(2), byAppointment: z.literal(true).optional() }).strict().refine(day => !day.byAppointment || day.periods.length === 0)).min(1).max(7)
  .refine(days => new Set(days.map(item => item.weekday)).size === days.length && days.every(item => item.periods.every((value, index) => !index || value.open >= item.periods[index - 1].close))), sourceUrl: https, checkedOn: day }).strict()
const pointFields = { latitude: z.number().min(42.45).max(42.9), longitude: z.number().min(23.1).max(23.65), source: https }
const point = z.discriminatedUnion('method', [
  z.object({ ...pointFields, method: z.literal('first_party_coordinates') }).strict(),
  z.object({ ...pointFields, source: z.string().regex(/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/), method: z.literal('verified_address_geocode'),
    sourceAddress: z.string().min(5).max(240), checkedOn: day, licence: z.literal('ODbL-1.0'), attribution: z.literal('© OpenStreetMap contributors') }).strict(),
])
const phone = z.string().regex(/^\+359\d{8,9}$/)
const category = z.enum(CATEGORY_IDS)
// A phone/homepage does NOT qualify a listing. A reviewer must record an
// explicit first-party invitation to book the named service and recheck it.
export const catalogueRecordSchema = z.object({
  id: z.string().regex(/^sofia-[a-z0-9-]{3,80}$/), name: z.string().trim().min(2).max(160),
  cityCode: z.literal('68134'), neighborhood: z.string().trim().min(2).max(120).nullable(),
  address: z.string().trim().min(5).max(240).nullable(), locationKind: z.enum(['premises', 'service_area']), coordinates: point.nullable(),
  category, website: https, phone: phone.nullable(),
  services: z.array(z.object({ name: z.string().trim().min(3).max(200), category,
    description: z.string().trim().min(3).max(300).optional(), price: price.optional(),
    appointmentModel: z.enum(['appointment', 'individual_training', 'group_reservation', 'home_visit', 'booked_lab_visit']),
    durationMin: z.number().int().min(1).max(1440).optional(), durationSourceUrl: https.optional(), durationCheckedOn: day.optional(),
  }).strict().refine(service => !service.durationMin || (service.durationSourceUrl && service.durationCheckedOn), 'A published duration needs its source and verification date')).min(1).max(500),
  openingHours: hours.optional(),
  booking: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('form'), url: https }).strict(),
    z.object({ kind: z.literal('phone'), phone }).strict(),
  ]),
  verification: z.object({ status: z.enum(['approved', 'draft', 'rejected']), checkedOn: day, validUntil: day,
    booking: evidence, contact: https,
  }).strict(),
  // Explicit manually verified identity only; names never establish membership.
  gorezBusinessId: z.uuid().optional(),
  photo: z.object({ src: z.string().regex(/^\/catalogue-media\/[a-z0-9-]+\.webp$/), alt: z.string().trim().min(3).max(160),
    rights: z.object({ basis: z.enum(['owner_permission', 'original', 'license']), reference: z.string().trim().min(5).max(160) }).strict(),
  }).strict().optional(),
  // No Google payloads, ratings, reviews, cached photos, guessed hours/prices.
}).strict().superRefine((row, ctx) => {
  const issue = (path, message) => ctx.addIssue({ code: 'custom', path, message })
  if (row.locationKind === 'service_area' && row.coordinates) issue(['coordinates'], 'A service area is not a precise business location')
  if (row.locationKind === 'premises' && !row.address) issue(['address'], 'Premises require a sourced street address')
  if (row.coordinates?.method === 'verified_address_geocode' && row.coordinates.sourceAddress !== row.address) issue(['coordinates'], 'Changed street addresses require another point review')
  if (row.booking.kind === 'phone' && row.booking.phone !== row.phone) issue(['booking'], 'Phone booking must use the published business contact')
  const days = (Date.parse(row.verification.validUntil) - Date.parse(row.verification.checkedOn)) / 86400000
  if (days <= 0 || days > CATALOGUE_REVIEW_DAYS) issue(['verification', 'validUntil'], 'Recheck within 90 days')
  for (const [index, service] of row.services.entries()) {
    if (service.category === 'car_wash' && /самообслуж|self[ -]?service|self[ -]?serve/iu.test(service.name)) issue(['services', index], 'Self-service washes are not appointment services')
    if (service.category === 'fitness' && /достъп до фитнес|фитнес карта|gym (?:entry|access)|day pass|open gym/iu.test(service.name)) issue(['services', index], 'Gym admission is not a reserved session')
    if (service.category === 'home_services' && /магазин|хипермаркет|hardware store|retail/iu.test(service.name)) issue(['services', index], 'A retail visit is not a scheduled home service')
    if (service.category === 'fitness' && !['individual_training', 'group_reservation'].includes(service.appointmentModel)) issue(['services', index], 'Only reserved sport sessions, not ordinary gym admission')
    if (service.category === 'home_services' && service.appointmentModel !== 'home_visit') issue(['services', index], 'Only scheduled home services, not retail or walk-in consultation')
    if (/лаборатор|изследван|laborator|blood test/iu.test(service.name) && service.appointmentModel !== 'booked_lab_visit') issue(['services', index], 'A lab service needs evidence of appointments at this exact location')
  }
})

export function approvedCatalogueRecord(raw, now = Date.now()) {
  let row = raw
  if (!validatedImmutableRows.has(raw)) {
    const parsed = catalogueRecordSchema.safeParse(raw)
    if (!parsed.success) return null
    row = parsed.data
  }
  const today = new Date(now).toISOString().slice(0, 10)
  if (excludedGeneralClinics.has(row.id)) return null
  if (row.verification.status !== 'approved' || row.verification.checkedOn > today || row.verification.validUntil < today) return null
  return row
}

export function validateCatalogue(records) {
  // Fail before per-record parsing for oversized input, including sparse
  // arrays. This keeps a bad import from allocating thousands of Zod errors.
  if (Array.isArray(records) && records.length > CATALOGUE_MAX_RECORDS) throw Error(`Catalogue exceeds ${CATALOGUE_MAX_RECORDS} records`)
  const seen = new Set(), destinations = new Set()
  return z.array(catalogueRecordSchema).max(CATALOGUE_MAX_RECORDS).parse(records).map(row => {
    if (seen.has(row.id)) throw new Error(`Duplicate catalogue ID: ${row.id}`)
    seen.add(row.id)
    const destination = `${row.booking.kind}:${row.booking.url || row.booking.phone}:${row.address || 'service_area'}`
    if (destinations.has(destination)) throw new Error(`Duplicate business/contact at the same location: ${row.id}`)
    destinations.add(destination)
    immutable(row)
    validatedImmutableRows.add(row)
    return row
  })
}
