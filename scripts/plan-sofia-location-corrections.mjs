import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { coordinatePair, possibleSofiaPoint, sofiaBusinessLocality, SOFIA_CITY_CODE } from '../lib/sofia-location-scope.mjs'
import { sofiaSettlementPointConflict } from '../lib/sofia-settlement-boundaries.mjs'

// Produces a revision-bound before/after plan. It cannot write to the database
// or admit an unreviewed geocode. A reviewer must independently check evidence.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
const revision = value => /^[0-9]+$/u.test(String(value ?? '')) ? String(value) : null
const nullableText = value => typeof value === 'string' ? value : null
const pointSnapshot = value => value === null || value === undefined ? null : {
  latitude: ['string', 'number'].includes(typeof value.latitude) ? value.latitude : null,
  longitude: ['string', 'number'].includes(typeof value.longitude) ? value.longitude : null,
}
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right)
const branchFields = row => ({
  city_ekatte: nullableText(row.city_ekatte), city: nullableText(row.city), neighborhood: nullableText(row.neighborhood),
  address: nullableText(row.address), coordinates: pointSnapshot(row.coordinates), place_id: nullableText(row.place_id),
})
const evidenceSnapshot = row => ({
  location_revision: revision(row.location_revision),
  place_verified_at: nullableText(row.place_verified_at),
  place_location_revision: revision(row.place_location_revision),
  registration_source: !row.registration_source ? null : {
    coordinates: pointSnapshot(row.registration_source),
    source_url: nullableText(row.registration_source.source_url),
    checked_at: nullableText(row.registration_source.checked_at),
    licence: nullableText(row.registration_source.licence),
    attribution: nullableText(row.registration_source.attribution),
    match_version: revision(row.registration_source.match_version),
    address_key_matches: row.registration_source.address_key_matches === true,
    profile_point_matches: row.registration_source.profile_point_matches === true,
    location_revision_matches: row.registration_source.location_revision_matches === true,
  },
})
const validDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
function evidenceUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && url.hostname.includes('.') ? url.href : null
  } catch { return null }
}

function decisionAfter(input) {
  const after = branchFields(input.after || {}), proof = input.evidence
  if (after.city_ekatte !== SOFIA_CITY_CODE || sofiaBusinessLocality(after) !== 'sofia' ||
      !after.address?.trim() || after.address.length > 240 || after.place_id !== null ||
      !['postal_address', 'owner_branch_entrance', 'remove_conflicting_point'].includes(proof?.kind) ||
      !validDay(proof.checkedOn) || !evidenceUrl(proof.sourceUrl) || typeof proof.reason !== 'string' || !proof.reason.trim() ||
      proof.businessId !== input.id || proof.originalAddress !== after.address) {
    throw new TypeError('Each decision needs a branch-specific reviewed Sofia address, evidence date/reason/HTTPS URL, and no carried-over place ID')
  }
  if (proof.kind === 'remove_conflicting_point') {
    if (after.coordinates !== null) throw new TypeError('Removal requires a null point')
  } else if (!possibleSofiaPoint(after.coordinates) || sofiaSettlementPointConflict(coordinatePair(after.coordinates)) ||
      !equal(coordinatePair(after.coordinates), coordinatePair(proof.coordinates))) {
    throw new TypeError('The proposed point must match the reviewed branch/postal evidence')
  }
  return after
}

export function planSofiaLocationCorrections(exported, decisions) {
  if (exported?.schemaVersion !== 1 || exported?.scope !== 'all_native_businesses' || !Array.isArray(exported.businesses) ||
      !Array.isArray(decisions)) throw new TypeError('Use the authorized, complete native read-only export and a decision array')
  const inventory = new Map(exported.businesses.map(row => [row.id, row]))
  if (inventory.size !== exported.businesses.length || new Set(decisions.map(row => row.id)).size !== decisions.length)
    throw new TypeError('Each business must occur once per branch in the current snapshot and decisions')
  const reports = decisions.map(input => {
    if (!uuid.test(input?.id || '') || !input.before || !revision(input.expectedContentRevision))
      throw new TypeError('Each decision needs a branch ID, expected content revision, and exact before values')
    const current = inventory.get(input.id), before = branchFields(input.before), beforeEvidence = evidenceSnapshot(input.before), after = decisionAfter(input)
    let status = 'missing'
    if (current) {
      if (equal(branchFields(current), after)) status = 'already_applied'
      else if (equal(branchFields(current), before) && equal(evidenceSnapshot(current), beforeEvidence) &&
          revision(current.content_revision) === revision(input.expectedContentRevision)) status = 'ready_for_authorized_review'
      else status = 'stale'
    }
    return {
      id: input.id, status, currentContentRevision: revision(current?.content_revision), before, beforeEvidence, after,
      expectedContentRevision: String(input.expectedContentRevision),
      evidence: { kind: input.evidence.kind, sourceUrl: evidenceUrl(input.evidence.sourceUrl),
        checkedOn: input.evidence.checkedOn, reason: input.evidence.reason },
      rollback: { requireExactCurrentLocation: after, restore: before, requirePostApplyContentRevision: true,
        requireUnchangedPostApplyEvidence: true,
        restoreVerificationAutomatically: false },
    }
  })
  return { schemaVersion: 1, dryRun: true, affectedIfApproved: reports.filter(row => row.status === 'ready_for_authorized_review').length,
    alreadyApplied: reports.filter(row => row.status === 'already_applied').length,
    missingOrStale: reports.filter(row => ['missing', 'stale'].includes(row.status)).length, reports }
}

export async function main(args = process.argv.slice(2)) {
  const { values } = parseArgs({ args, options: { snapshot: { type: 'string' }, decisions: { type: 'string' }, help: { type: 'boolean' } } })
  if (values.help) {
    process.stdout.write('Usage: node scripts/plan-sofia-location-corrections.mjs --snapshot private-db-export.json --decisions reviewed-decisions.json\nRead-only dry run; no apply option.\n')
    return
  }
  if (!values.snapshot || !values.decisions) throw new TypeError('Provide both --snapshot and --decisions')
  const [snapshot, decisions] = await Promise.all([readFile(values.snapshot, 'utf8'), readFile(values.decisions, 'utf8')])
  process.stdout.write(JSON.stringify(planSofiaLocationCorrections(JSON.parse(snapshot), JSON.parse(decisions)), null, 2) + '\n')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
