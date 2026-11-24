import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { businessAddress, findCity } from '../lib/business-location.mjs'
import { resolveBusinessDestination } from '../lib/business-directions.mjs'
import { reviewedBusinessDestination } from '../lib/business-directions-reviewed.mjs'
import { coordinatePair, SOFIA_CITY_CODE } from '../lib/sofia-location-scope.mjs'
import { sofiaSettlementPointConflict } from '../lib/sofia-settlement-boundaries.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'

// Read-only operator inventory. The only optional network access is a single
// GET of the existing public partner directory; this script never geocodes.
export const PUBLIC_PARTNER_DIRECTORY = 'https://www.gorez.co/api/public/businesses'
export const REPORTED_SLIVNITSA_ADDRESS = 'бул. Сливница 178Е, София'
const POINT_STATUSES = ['verified_sofia', 'unverified', 'conflict', 'missing', 'outside_sofia', 'not_visit_location']
const text = value => typeof value === 'string' ? value : null
const scalar = value => typeof value === 'number' && Number.isFinite(value) || typeof value === 'string' ? value : null
const asObject = value => value && typeof value === 'object' && !Array.isArray(value)
const clean = value => text(value)?.normalize('NFC').replace(/\s+/gu, ' ').trim() || ''
const strictKey = value => clean(value).toLocaleLowerCase('bg')
const suffixKey = value => strictKey(value).replace(/\s/gu, '')
const validTimestamp = value => Boolean(text(value) && Number.isFinite(Date.parse(value)))

// Reading helpers for the audit, not a geocoder or a source of validation.
// Preserve suffix script and complete number strings; leave unparsed values
// null rather than turning a nearby block, office, or landmark into a road.
const streetPattern = /(?:^|[,;\s])(?<type>бул(?:евард)?\.?|ул(?:ица)?\.?|boulevard|blvd\.?|street)\s*[„“"«]?(?<street>[^,;]+?)\s*[„“"»]?\s*(?:№\s*|\s+)(?<number>[0-9]+(?:\s*\p{L})?(?:\s*[-/–—]\s*[0-9]+(?:\s*\p{L})?)?)(?=\s*(?:$|[,;.)]|ет\.?\s|бл\.?\s|вх\.?\s|магазин\s|ап\.?\s))/iu
const detailPattern = (value, pattern) => value.match(pattern)?.[1]?.trim() ?? null
export function auditPostalComponents(originalAddress) {
  const source = clean(originalAddress), groups = source.match(streetPattern)?.groups
  return {
    streetType: groups ? /^(?:бул|boulevard|blvd)/iu.test(groups.type) ? 'boulevard' : 'street' : null,
    streetName: groups?.street.trim() ?? null,
    buildingNumber: groups?.number.trim() ?? null,
    block: detailPattern(source, /(?:^|[,;\s])(?:бл\.?|блок|block)\s*([\d]+(?:\s*\p{L})?)(?=\s*(?:$|[,;.)]))/iu),
    entrance: detailPattern(source, /(?:^|[,;\s])(?:вх\.?|вход|entrance)\s*([\p{L}\d]+)(?=\s*(?:$|[,;.)]))/iu),
    unit: detailPattern(source, /(?:^|[,;\s])(?:ап\.?|офис|магазин|unit)\s*([\d]+(?:\s*\p{L})?)(?=\s*(?:$|[,;.)]))/iu),
    floor: detailPattern(source, /(?:^|[,;\s])(?:ет\.?|етаж|floor)\s*(-?\d+)(?=\s*(?:$|[,;.)]))/iu),
  }
}

const reviewPriority = Object.freeze({ conflict: 0, missing: 1, unverified: 2, outside_sofia: 3 })

function proposalFor(record) {
  switch (record.locationStatus) {
    case 'outside_sofia': return 'Exclude from Sofia discovery; preserve the source record, partnership and direct booking.'
    case 'conflict': return 'Use address-copy only. Review exact branch, current address, point and provider identifier; clear stale evidence under a revision check.'
    case 'missing': return 'Confirm the customer-visit address or explicitly mark no public visit location. Do not invent a point.'
    case 'unverified': return 'Use address-copy only. Collect an exact Sofia street/house or owner-reviewed branch destination.'
    case 'not_visit_location': return 'No customer directions or pin; keep the service-area/online listing as applicable.'
    default: return null
  }
}

function projectedNativeRow(row, snapshotScope) {
  if (snapshotScope === 'all_native_businesses') {
    return {
      ...row,
      source: 'gorez',
      locationAddress: text(row.address),
      address: businessAddress(row),
      locationKind: text(row.location_kind),
    }
  }
  // The public endpoint already formats city + neighbourhood + address.
  // It is not the original owner-supplied text and we cannot undo that join.
  return { ...row, source: 'gorez', locationKind: text(row.locationKind) ??
    (row.locationStatus === 'not_visit_location' ? 'service_area' : null) }
}

function pointForNative(row) {
  const source = row.registration_source, profile = coordinatePair(row.coordinates)
  const point = coordinatePair(source)
  // This export carries booleans evaluated from the source-bound address key
  // revision and raw profile values in one read-only database snapshot. A legacy V1
  // cache row, loose DTO pin, or place link cannot grant the same evidence.
  if (source?.match_version !== 2 || source.address_key_matches !== true || source.profile_point_matches !== true ||
      source.location_revision_matches !== true ||
      !point || !profile || point.latitude !== profile.latitude || point.longitude !== profile.longitude ||
      !/^https:\/\/www\.openstreetmap\.org\/(?:node|way|relation)\/[1-9]\d{0,19}$/u.test(source.source_url || '') ||
      source.licence !== 'ODbL-1.0' || source.attribution !== '© OpenStreetMap contributors' || !validTimestamp(source.checked_at)) return null
  return { ...point, sourceUrl: source.source_url, checkedAt: source.checked_at }
}

function toAuditRecord(input, { source, snapshotScope, now }) {
  if (!asObject(input) || !clean(input.id) || !clean(input.name)) throw new TypeError('Invalid or unidentified venue in location inventory')
  const isStatic = source === 'catalogue'
  const row = isStatic ? { ...input, city: findCity(input.cityCode)?.name || null, source } : projectedNativeRow(input, snapshotScope)
  const cityCode = text(row.cityCode || row.city_ekatte)
  const originalAddress = isStatic || snapshotScope === 'all_native_businesses' ? text(input.address) : null
  const coordinateSource = isStatic ? catalogueBoundCoordinates(input) : pointForNative(row)
  const destination = resolveBusinessDestination(row, { verifiedCoordinates: coordinateSource, pointConflict: sofiaSettlementPointConflict })
  if (!POINT_STATUSES.includes(destination.status)) throw new Error('Unknown shared destination status')
  const manual = reviewedBusinessDestination(row)
  const website = isStatic ? text(input.website) : null
  const publication = isStatic ? {
    state: approvedCatalogueRecord(input, now) ? 'published' : 'not_currently_eligible',
    sourceStatus: input.verification?.status || null,
  } : {
    state: snapshotScope === 'public_native_directory' || input.active === true && input.platform_status === 'enabled'
      ? 'published' : 'not_published',
    sourceStatus: text(input.platform_status),
  }
  const record = {
    id: input.id, name: input.name, source, branchId: input.id, slug: text(input.slug),
    partnership: isStatic ? (input.gorezBusinessId ? 'linked_native_record' : 'independent_catalogue') : 'native_gorez_record',
    publication, applicationStatus: text(input.application_status),
    cityCode, city: row.city ?? findCity(cityCode)?.name ?? null,
    country: findCity(cityCode) ? 'BG' : null, district: text(input.district ?? manual?.postalDistrict), neighborhood: text(row.neighborhood),
    locationKind: text(row.locationKind) ?? 'not_explicit',
    originalAddress, normalizedDisplayAddress: clean(row.address) || null,
    applicationAddress: text(input.application_address),
    ...auditPostalComponents(originalAddress || row.address),
    coordinates: row.coordinates ? { latitude: scalar(row.coordinates.latitude), longitude: scalar(row.coordinates.longitude) } : null,
    placeIdentifier: text(input.place_id || input.placeId || manual?.placeId),
    placeProvider: input.place_id || input.placeId || manual?.placeId ? 'google_maps' : null,
    placeReviewedAt: text(input.place_verified_at),
    placeUsedInDirections: Boolean(destination.placeId),
    coordinateBasis: manual?.postalAddressId ? 'municipal_address_point' : text(row.coordinates?.method) ?? (coordinateSource ? 'address_bound_registration_lookup' : null),
    currentDirectionsDestination: destination.href ?? null,
    provider: destination.provider ?? null,
    navigationCoordinates: coordinatePair(destination.coordinates),
    locationStatus: destination.status, reason: destination.reason ?? null,
    evidenceSource: destination.sourceUrl || text(coordinateSource?.source || coordinateSource?.sourceUrl) || null,
    branchEvidenceSource: text(manual?.branchSourceUrl) ?? website,
    evidenceCheckedOn: manual?.checkedOn ?? coordinateSource?.checkedOn ?? coordinateSource?.checkedAt ?? null,
    postalAddressId: manual?.postalAddressId ?? coordinateSource?.addressId ?? null,
    partnerPublicationRevision: scalar(input.platform_revision), contentRevision: scalar(input.content_revision),
    locationRevision: scalar(input.location_revision),
    registrationBinding: input.registration_source ? {
      addressKeyMatches: input.registration_source.address_key_matches === true,
      profilePointMatches: input.registration_source.profile_point_matches === true,
      locationRevisionMatches: input.registration_source.location_revision_matches === true,
      matchVersion: scalar(input.registration_source.match_version),
    } : null,
    proposedCorrection: null,
  }
  record.proposedCorrection = proposalFor(record)
  return record
}

function countsFor(rows) {
  return Object.fromEntries(POINT_STATUSES.map(status => [status, rows.filter(row => row.locationStatus === status).length]))
}

function compactReview(record) {
  const { id, name, source, slug, cityCode, normalizedDisplayAddress, publication, locationStatus, reason,
    coordinates, placeIdentifier, evidenceSource, proposedCorrection } = record
  return { id, name, source, slug, cityCode, address: normalizedDisplayAddress, publication: publication.state,
    locationStatus, reason, coordinates, placeIdentifier, evidenceSource, next: proposedCorrection }
}

export function auditSofiaLocations(catalogue, { nativeSnapshot = null, now = Date.now() } = {}) {
  if (!Array.isArray(catalogue)) throw new TypeError('Expected all static catalogue records, not a viewport/page')
  if (nativeSnapshot && (!asObject(nativeSnapshot) || nativeSnapshot.schemaVersion !== 1 ||
      !['public_native_directory', 'all_native_businesses'].includes(nativeSnapshot.scope) ||
      !Array.isArray(nativeSnapshot.businesses) || !validTimestamp(nativeSnapshot.capturedAt))) throw new TypeError('Invalid native location snapshot')
  const records = [
    ...catalogue.map(row => toAuditRecord(row, { source: 'catalogue', now })),
    ...(nativeSnapshot?.businesses ?? []).map(row => toAuditRecord(row, { source: 'native', now, snapshotScope: nativeSnapshot.scope })),
  ]
  if (new Set(records.map(row => `${row.source}:${row.id}`)).size !== records.length) throw new Error('Audit input contains duplicate branch IDs')
  const reviewed = records.filter(row => row.locationStatus in reviewPriority).sort((a, b) =>
    reviewPriority[a.locationStatus] - reviewPriority[b.locationStatus] || Number(b.publication.state === 'published') - Number(a.publication.state === 'published') || a.id.localeCompare(b.id))
  const byType = ['catalogue', 'native'].map(source => {
    const matches = records.filter(row => row.source === source)
    return [source, {
      examined: matches.length, published: matches.filter(row => row.publication.state === 'published').length,
      ...countsFor(matches), awaiting_review: matches.filter(row => ['unverified', 'conflict', 'missing'].includes(row.locationStatus)).length,
      publishedAwaitingReview: matches.filter(row => row.publication.state === 'published' && ['unverified', 'conflict', 'missing'].includes(row.locationStatus)).length,
    }]
  })
  const slivnitsaCandidates = records.filter(row => row.cityCode === SOFIA_CITY_CODE && row.streetType === 'boulevard' &&
    ['сливница', 'slivnitsa'].includes(strictKey(row.streetName)) && /^178(?:\s*[еe])?$/iu.test(row.buildingNumber || ''))
    .map(({ id, name, source, originalAddress, normalizedDisplayAddress, buildingNumber }) => ({ id, name, source, originalAddress, normalizedDisplayAddress, buildingNumber }))
  return {
    schemaVersion: 1,
    evaluatedAt: new Date(now).toISOString(),
    scope: {
      static: 'all local Sofia and regional catalogue source records (including non-published records)',
      native: nativeSnapshot?.scope ?? 'not_accessed',
      nativeCapturedAt: nativeSnapshot?.capturedAt ?? null,
    },
    totals: {
      examined: records.length, ...countsFor(records),
      awaiting_review: records.filter(row => ['unverified', 'conflict', 'missing'].includes(row.locationStatus)).length,
      appliedByAudit: 0,
    },
    bySource: Object.fromEntries(byType),
    reportedCase: {
      originalAddress: REPORTED_SLIVNITSA_ADDRESS,
      status: 'needs_branch_identification',
      candidates: slivnitsaCandidates,
      exactCyrillicSuffixIds: slivnitsaCandidates.filter(row => suffixKey(row.buildingNumber) === '178е').map(row => row.id),
      latinSuffixCandidateIds: slivnitsaCandidates.filter(row => suffixKey(row.buildingNumber) === '178e').map(row => row.id),
      warning: 'Do not reinterpret 178E or 178 as a verified equivalent of 178Е. Address and branch need separate evidence.',
    },
    limitations: [
      'A passing location means that existing reviewed evidence permits the shared navigation action; it is not a new door survey.',
      'Public native snapshots exclude pending/archived/disabled rows and contain no registration provenance or place links.',
      'Native coordinates without exact reviewed evidence are not verified by this inventory.',
      'Directions in this report describe the audited version; they are not a production browser capture.',
      'The audit does not geocode, update records, or alter partnership, scope or publication status.',
    ],
    review: reviewed,
    records,
  }
}

export async function fetchPublicNativeLocationSnapshot(fetcher = globalThis.fetch) {
  const response = await fetcher(PUBLIC_PARTNER_DIRECTORY, { signal: AbortSignal.timeout(12_000), redirect: 'error' })
  if (!response.ok) throw new Error(`Public directory returned HTTP ${response.status}; no native results assumed`)
  const body = await response.json()
  if (!Array.isArray(body.businesses)) throw new TypeError('Unexpected public directory response')
  const businesses = body.businesses.map(({ id, name, slug, address, city_ekatte, city, neighborhood, coordinates, locationKind,
    locationStatus, locationBinding, locationVerified }) =>
    ({ id, name, slug, address, city_ekatte, city, neighborhood, coordinates, locationKind,
      locationStatus: POINT_STATUSES.includes(locationStatus) ? locationStatus : undefined,
      locationBinding: text(locationBinding) || undefined,
      locationVerified: typeof locationVerified === 'boolean' ? locationVerified : undefined }))
  return { schemaVersion: 1, scope: 'public_native_directory', capturedAt: new Date().toISOString(), businesses }
}

export async function main(args = process.argv.slice(2)) {
  const { values } = parseArgs({ args, options: {
    json: { type: 'boolean' }, review: { type: 'boolean' }, native: { type: 'string' },
    'public-directory': { type: 'boolean' }, 'as-of': { type: 'string' }, help: { type: 'boolean' },
  } })
  if (values.help) {
    process.stdout.write('Usage: node scripts/audit-sofia-location-integrity.mjs [--json | --review] [--native private-export.json | --public-directory] [--as-of ISO timestamp]\n')
    return
  }
  if (values.native && values['public-directory']) throw new TypeError('Use only one native snapshot source')
  if (values.json && values.review) throw new TypeError('Use --json or --review, not both')
  const now = values['as-of'] ? Date.parse(values['as-of']) : Date.now()
  if (!Number.isFinite(now)) throw new TypeError('Use a valid --as-of date')
  const [{ RAW_SOFIA_CATALOGUE }, { REGIONAL_CATALOGUE }] = await Promise.all([
    import('../lib/discovery/sofia-catalogue.mjs'), import('../lib/discovery/public-catalogue.mjs'),
  ])
  const native = values.native ? JSON.parse(await readFile(values.native, 'utf8'))
    : values['public-directory'] ? await fetchPublicNativeLocationSnapshot() : null
  const { records, review, ...summary } = auditSofiaLocations([...RAW_SOFIA_CATALOGUE, ...REGIONAL_CATALOGUE], { nativeSnapshot: native, now })
  process.stdout.write(JSON.stringify(values.json ? { ...summary, review, records }
    : values.review ? { ...summary, review: review.map(compactReview) } : summary, null, 2) + '\n')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
