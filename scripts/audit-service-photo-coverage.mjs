import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { currentPublishedFact } from '../lib/discovery/business-details.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { categoryById } from '../lib/discovery/categories.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const counters = () => ({ total: 0, photo: 0, missing: 0 })
const counts = () => ({ services: counters(), priceBearing: counters(), paid: counters() })
const add = (count, photo) => { count.total++; count[photo ? 'photo' : 'missing']++ }
const hasPhoto = thumbnail => Boolean(thumbnail?.src &&
  (thumbnail.type === 'photo' || thumbnail.kind === 'photo' || thumbnail.kind === 'business'))
const priority = (a, b) => b.paid.missing - a.paid.missing ||
  b.priceBearing.missing - a.priceBearing.missing || b.services.missing - a.services.missing
const bgOrder = (a, b) => a.localeCompare(b, 'bg') || (a < b ? -1 : a > b ? 1 : 0)

// Local report only. It measures what the shared thumbnail resolver will show,
// never the presence of a business gallery, an object illustration or an icon.
export function auditServicePhotoCoverage(records = SOFIA_CATALOGUE, { now = Date.now(), resolveThumbnail = serviceThumbnail } = {}) {
  const totals = counts(), categories = new Map()
  let approvedBusinesses = 0
  for (const record of records) {
    const business = approvedCatalogueRecord(record, now)
    if (!business) continue
    approvedBusinesses++
    for (const service of business.services) {
      const category = categoryById(service.category)
      if (!categories.has(category.id)) categories.set(category.id, { category: category.id, label: category.bg, ...counts(), missing: new Map() })
      const group = categories.get(category.id)
      const photo = hasPhoto(resolveThumbnail(service, { business }))
      const priceBearing = currentPublishedFact(service.price, now)
      // A published zero price belongs in priceBearing, but only prices that
      // can exceed zero (including an explicit range) belong in paid.
      const paid = priceBearing && (service.price.maximum ?? service.price.amount) > 0
      for (const target of [totals, group]) {
        add(target.services, photo)
        if (priceBearing) add(target.priceBearing, photo)
        if (paid) add(target.paid, photo)
      }
      if (!photo) {
        if (!group.missing.has(service.name)) group.missing.set(service.name, { name: service.name, ...counts(), listings: [] })
        const item = group.missing.get(service.name)
        add(item.services, false)
        if (priceBearing) add(item.priceBearing, false)
        if (paid) add(item.paid, false)
        item.listings.push({ businessId: business.id, businessName: business.name, priceBearing, paid })
      }
    }
  }
  return {
    checkedAt: new Date(now).toISOString(), approvedBusinesses, totals,
    complete: totals.services.total > 0 && totals.services.missing === 0,
    categories: [...categories.values()].sort((a, b) => priority(a, b) || bgOrder(a.category, b.category)).map(group => ({
      ...group, missing: [...group.missing.values()].sort((a, b) => priority(a, b) || bgOrder(a.name, b.name)).map(item => ({
        ...item, listings: item.listings.sort((a, b) => Number(b.paid) - Number(a.paid) || Number(b.priceBearing) - Number(a.priceBearing) || bgOrder(a.businessId, b.businessId)),
      })),
    })),
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { values } = parseArgs({ options: { 'as-of': { type: 'string' }, 'require-complete': { type: 'boolean' } } })
  const day = values['as-of']
  const now = day === undefined ? Date.now() : Date.parse(`${day}T00:00:00Z`)
  if (day !== undefined && (!Number.isFinite(now) || new Date(now).toISOString().slice(0, 10) !== day)) {
    throw new Error('--as-of must be a valid UTC date (YYYY-MM-DD)')
  }
  const report = auditServicePhotoCoverage(SOFIA_CATALOGUE, { now })
  console.log(JSON.stringify(report, null, 2))
  if (values['require-complete'] && !report.complete) process.exitCode = 1
}
