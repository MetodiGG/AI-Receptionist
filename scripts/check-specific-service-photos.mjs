import { auditServicePhotoAssets } from './audit-service-photo-coverage.mjs'
import { auditSpecificServicePhotoProvenance } from './verify-specific-service-photo-provenance.mjs'
import { auditPartnerServicePhotos } from './audit-partner-service-photos.mjs'

// Release gate: a file existing is insufficient. Every published catalogue
// service must resolve to a real, compressed, non-neutral service photograph.
const report = await auditServicePhotoAssets()
const provenance = await auditSpecificServicePhotoProvenance()
const partners = await auditPartnerServicePhotos()
console.log(JSON.stringify({ approvedBusinesses: report.approvedBusinesses, services: report.totals.services.total,
  specific: report.photoMatches.exact + report.photoMatches.activity, neutral: report.photoMatches.neutral,
  missing: report.totals.services.missing, invalidAssets: report.assets.invalid, specificComplete: report.specificComplete,
  reviewedNewPhotos: provenance.checked, provenanceComplete: provenance.complete, provenanceIssues: provenance.issues.slice(0, 10),
  partners }, null, 2))
if (!report.specificComplete || !provenance.complete || !partners.complete) {
  console.error('Publication blocked: map remaining services to reviewed activity-specific photos and verify every local asset. Neutral workspaces do not satisfy this gate.')
  process.exitCode = 1
}
