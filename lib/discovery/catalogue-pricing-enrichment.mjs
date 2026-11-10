import { catalogueRecordSchema } from './catalogue-policy.mjs'
import { normalizeSearchText } from './categories.mjs'

// Reviewed first-party catalogue facts only. Never import this offline helper
// into a database mutation route or apply it to owner-managed GoRez records.
export function enrichCataloguePricing(records, updates) {
  const originals = new Map(records.map(row => [row.id, row])), patches = new Map()
  for (const update of updates) {
    const original = originals.get(update.id)
    if (!original || patches.has(update.id) || original.source === 'gorez' || original.ownerManaged || !update.services?.length) throw Error(`Invalid catalogue pricing update: ${update.id}`)
    const serviceMap = new Map(original.services.map(service => [normalizeSearchText(service.name), service]))
    const incoming = new Set()
    for (const service of update.services) {
      const key = normalizeSearchText(service.name)
      if (!key || incoming.has(key) || !service.price) throw Error(`Missing price or duplicate reviewed service: ${update.id}:${key}`)
      incoming.add(key)
      const current = serviceMap.get(key)
      // Descriptions, categories, appointment evidence and branch identity are
      // retained for an existing service. New services require explicit fields.
      serviceMap.set(key, current ? { ...current, price: service.price, ...(service.durationMin ? { durationMin: service.durationMin, durationSourceUrl: service.durationSourceUrl, durationCheckedOn: service.durationCheckedOn } : {}) } : service)
    }
    const merged = { ...original, services: [...serviceMap.values()] }
    const parsed = catalogueRecordSchema.safeParse(merged)
    if (!parsed.success) throw Error(`Invalid reviewed menu: ${update.id}: ${parsed.error.issues.map(issue => issue.path.join('.')).join(',')}`)
    patches.set(update.id, merged)
  }
  return records.map(row => patches.get(row.id) || row)
}
