import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { catalogueDetailsWithServicePhotos } from '../lib/catalogue-service-photo-keys.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { businessActivityPhotoKey } from '../lib/business-cover-photo.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { DISCOVERY_SUBCATEGORIES } from '../lib/discovery/subcategories.mjs'
import { staticDiscoveryPhotoPath } from '../lib/discovery-photo-identity.mjs'

// Audit the resolver actually used by the service menu, not just the base
// photo index. Uses the checked-in catalogue; does not read partner storage.
export function auditPublicDetailServicePhotos(records = PUBLIC_CATALOGUE, { now = Date.now(), includeGaps = false } = {}) {
  const navigation = new Set(DISCOVERY_SUBCATEGORIES.map(option => staticDiscoveryPhotoPath(option.photo)))
  const seen = new Map(), gaps = [], unsafe = [], missingProfiles = new Set()
  let profiles = 0, services = 0, withPhoto = 0
  for (const raw of records) {
    const row = approvedCatalogueRecord(raw, now)
    if (!row) continue
    profiles++
    const business = { ...row, source: 'catalogue', businessCategory: row.category, details: catalogueDetailsWithServicePhotos(row, now) }
    business.illustrativeCoverPhotoKey = businessActivityPhotoKey(business)
    const covers = new Set(businessCoverPhotoSources(business).map(staticDiscoveryPhotoPath))
    for (const service of business.details.services) {
      services++
      const photo = publicDetailServiceThumbnail(service, { business })
      if (!photo.src) {
        missingProfiles.add(row.id)
        if (includeGaps) gaps.push({ businessId: row.id, category: service.category, service: service.name })
        continue
      }
      withPhoto++
      const source = staticDiscoveryPhotoPath(photo.src)
      if (source && !seen.has(source)) seen.set(source, existsSync(new URL('../public' + source, import.meta.url)))
      if (!source || !seen.get(source) || covers.has(source) || navigation.has(source)) {
        unsafe.push({ businessId: row.id, service: service.name, src: photo.src })
      }
    }
  }
  return { profiles, services, withPhoto, missing: services - withPhoto, profilesWithGaps: missingProfiles.size, uniquePhotos: seen.size, unsafe, ...(includeGaps ? { gaps } : {}) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = auditPublicDetailServicePhotos(PUBLIC_CATALOGUE, { includeGaps: process.argv.includes('--include-gaps') })
  console.log(JSON.stringify(result, null, 2))
  if (result.unsafe.length) process.exitCode = 1
}
