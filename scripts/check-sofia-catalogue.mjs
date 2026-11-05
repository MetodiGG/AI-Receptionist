import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { categoryById } from '../lib/discovery/categories.mjs'

// Offline only: no Google, crawling, source uploads, personal contacts or DB.
const rows = validateCatalogue(SOFIA_CATALOGUE)
const current = rows.filter(row => approvedCatalogueRecord(row))
for (const row of rows) if (row.photo) {
  await access(fileURLToPath(new URL(`../public${row.photo.src}`, import.meta.url)))
}
console.log(`Sofia catalogue: ${rows.length} records; ${current.length} currently approved; ${current.filter(row => row.coordinates).length} first-party location points.`)
console.log(`${new Set(current.map(row => new URL(row.website).hostname.replace(/^www\./, ''))).size} official website domains; ${current.filter(row => row.booking.kind === 'form').length} booking flows; ${current.filter(row => row.booking.kind === 'phone').length} appointment phone actions; ${current.filter(row => row.locationKind === 'service_area').length} service-area providers.`)
console.log('Service coverage (a multi-service business can appear in more than one category):')
const byCategory = new Map()
for (const row of current) for (const category of new Set(row.services.map(service => service.category))) {
  byCategory.set(category, (byCategory.get(category) || 0) + 1)
}
for (const [id, count] of byCategory) console.log(`${categoryById(id).bg}: ${count}`)
const recheck = rows.filter(row => row.verification.status === 'approved' && !approvedCatalogueRecord(row))
if (recheck.length) {
  console.error(`Review required before publication: ${recheck.map(row => row.id).join(', ')}`)
  process.exitCode = 1
}
