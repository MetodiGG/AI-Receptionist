import { access } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord, validateCatalogue, EXCLUDED_GENERAL_CLINIC_IDS } from '../lib/discovery/catalogue-policy.mjs'
import { categoryById } from '../lib/discovery/categories.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'

export function cataloguePointCounts(records) {
  return {
    firstParty: records.filter(row => row.coordinates?.method === 'first_party_coordinates').length,
    reviewedOsm: records.filter(row => row.coordinates?.method === 'verified_address_geocode').length,
    officialSofia: records.filter(row => row.coordinates?.method === 'verified_official_address').length,
  }
}

// Offline only: no Google, crawling, source uploads, personal contacts or DB.
export function cataloguePublicationState(records, now = Date.now()) {
  // Intentionally excluded records still pass the complete source schema.
  // A malformed source must not be hidden by the publication exclusion.
  const rows = validateCatalogue(records)
  const current = rows.filter(row => approvedCatalogueRecord(row, now))
  const excludedIds = new Set(EXCLUDED_GENERAL_CLINIC_IDS)
  const excluded = rows.filter(row => excludedIds.has(row.id))
  const recheck = rows.filter(row => row.verification.status === 'approved' &&
    !excludedIds.has(row.id) && !approvedCatalogueRecord(row, now))
  // The offline intake gate remains limited to 5,000 candidates per batch;
  // validate a larger local inventory in bounded chunks, retaining previous
  // chunks as duplicate evidence. Public search pagination is unchanged.
  for (let offset = 0; offset < current.length; offset += 5000) {
    const audit = auditCatalogueBatch(current.slice(0, offset), current.slice(offset, offset + 5000), now)
    if (audit.pending.length || audit.rejected.length) throw Error(`Catalogue review failed: ${JSON.stringify({ pending: audit.pending, rejected: audit.rejected })}`)
  }
  return { rows, current, excluded, recheck }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { rows, current, excluded, recheck } = cataloguePublicationState(SOFIA_CATALOGUE)
  for (const row of rows) if (row.photo) {
    await access(fileURLToPath(new URL(`../public${row.photo.src}`, import.meta.url)))
  }
  const points = cataloguePointCounts(current)
  console.log(`Sofia catalogue: ${rows.length} records; ${current.length} currently approved; ${excluded.length} intentionally excluded by owner scope; ${points.firstParty} first-party points; ${points.reviewedOsm} reviewed OSM address points; ${points.officialSofia} reviewed official Sofia address points (CC BY 4.0).`)
  console.log(`${new Set(current.map(row => new URL(row.website).hostname.replace(/^www\./, ''))).size} official website domains; ${current.filter(row => row.booking.kind === 'form').length} booking flows; ${current.filter(row => row.booking.kind === 'phone').length} appointment phone actions; ${current.filter(row => row.locationKind === 'service_area').length} service-area providers.`)
  console.log('Service coverage (a multi-service business can appear in more than one category):')
  const byCategory = new Map()
  for (const row of current) for (const category of new Set(row.services.map(service => service.category))) {
    byCategory.set(category, (byCategory.get(category) || 0) + 1)
  }
  for (const [id, count] of byCategory) console.log(`${categoryById(id).bg}: ${count}`)
  if (recheck.length) {
    console.error(`Review required before publication: ${recheck.map(row => row.id).join(', ')}`)
    process.exitCode = 1
  }
}
