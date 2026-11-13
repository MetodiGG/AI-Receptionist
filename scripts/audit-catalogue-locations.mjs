import { parseArgs } from 'node:util'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../lib/discovery/official-sofia-address-source.mjs'

// Read-only, local source-metadata audit. No geocoding, provider calls,
// visitor/device locations, production reads, source changes or file writes.
// Default CLI output is a summary; --json adds allowlisted public venue rows.
const SOFIA_BOUNDS = Object.freeze({ south: 42.45, north: 42.9, west: 23.1, east: 23.65 })
const finitePoint = point => point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
const inBounds = point => Boolean(finitePoint(point) && point.latitude >= SOFIA_BOUNDS.south && point.latitude <= SOFIA_BOUNDS.north && point.longitude >= SOFIA_BOUNDS.west && point.longitude <= SOFIA_BOUNDS.east)
const text = value => typeof value === 'string' ? value : null
const osmSource = value => /^https:\/\/www\.openstreetmap\.org\/(?:node|way|relation)\/[1-9]\d*$/.test(value || '')
const validDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
const sameSourcePoint = (a, b) => a && b && ['latitude', 'longitude', 'method', 'source', 'sourceAddress', 'checkedOn', 'licence', 'attribution', 'addressId', 'sourceCityCode', 'sourceNeighborhood', 'sourceWebsite'].every(field => a[field] === b[field])

// Without the production binding resolver, only explicit exact-address
// metadata is assessable. A missing legacy snapshot never becomes approval.
function explicitlyBoundPoint(row) {
  const point = row?.coordinates
  return row?.locationKind === 'premises' && text(row.address)?.trim() && inBounds(point) && point.sourceAddress === row.address ? point : null
}

export function auditCatalogueLocations(rows, { boundCoordinates = explicitlyBoundPoint } = {}) {
  if (!Array.isArray(rows) || typeof boundCoordinates !== 'function') throw new TypeError('Expected source rows and a local coordinate binding resolver')
  const counts = {
    total: rows.length, premises: 0, serviceArea: 0, unknownLocationKind: 0,
    rawLocated: 0, rawUnlocated: 0, usableLocated: 0, heldCoordinates: 0,
    finiteNumericPoints: 0, invalidNumericPoints: 0, inSofiaBounds: 0, outsideSofiaBounds: 0,
    serviceAreasWithCoordinates: 0, firstPartyPublished: 0, firstPartyExplicitAddressBound: 0,
    firstPartyLegacySnapshotBound: 0, firstPartyUnbound: 0,
    osmAddressCheckedMetadata: 0, osmAddressBindingMismatches: 0,
    officialAddressPoints: 0, officialAddressCheckedMetadata: 0, officialAddressBindingMismatches: 0,
    officialContextBindingMismatches: 0, officialSourceMetadataIncomplete: 0, unknownCoordinateMethod: 0,
  }
  const methods = {}, sources = new Map(), categories = new Map(), evidenceClasses = new Map(), issues = [], records = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') throw new TypeError('Expected public catalogue source objects')
    const point = row.coordinates, hasPoint = point !== null && point !== undefined
    const codes = [], add = code => { if (!codes.includes(code)) codes.push(code) }
    if (row.locationKind === 'premises') {
      counts.premises++
      if (!text(row.address)?.trim()) add('premises_address_missing')
    } else if (row.locationKind === 'service_area') counts.serviceArea++
    else { counts.unknownLocationKind++; add('unknown_location_kind') }
    const resolved = boundCoordinates(row)
    let binding = 'no_coordinates', usable = false
    if (hasPoint) {
      counts.rawLocated++
      const method = text(point.method) || 'unknown'
      methods[method] = (methods[method] || 0) + 1
      if (finitePoint(point)) {
        counts.finiteNumericPoints++
        if (inBounds(point)) counts.inSofiaBounds++
        else { counts.outsideSofiaBounds++; add('outside_sofia_bounds') }
      } else { counts.invalidNumericPoints++; add('invalid_coordinate_types') }
      const source = text(point.source)
      if (source) sources.set(source, (sources.get(source) || 0) + 1)
      else add('coordinate_source_missing')
      if (row.locationKind === 'service_area') {
        counts.serviceAreasWithCoordinates++
        add('service_area_has_coordinates')
      }
      const resolvedMatches = inBounds(resolved) && sameSourcePoint(point, resolved)
      if (point.method === 'first_party_coordinates') {
        counts.firstPartyPublished++
        if (point.sourceAddress !== undefined && point.sourceAddress !== row.address) {
          binding = 'address_mismatch'; add('first_party_source_address_mismatch')
        } else if (resolvedMatches && text(row.address)?.trim() && point.sourceAddress === row.address) {
          binding = 'explicit_address'; counts.firstPartyExplicitAddressBound++
        } else if (resolvedMatches && text(row.address)?.trim() && point.sourceAddress === undefined) {
          binding = 'legacy_snapshot'; counts.firstPartyLegacySnapshotBound++
        } else binding = 'unbound'
        if (!['explicit_address', 'legacy_snapshot'].includes(binding)) {
          counts.firstPartyUnbound++; add('first_party_point_unbound')
        }
      } else if (point.method === 'verified_address_geocode') {
        const addressBound = Boolean(text(row.address) && point.sourceAddress === row.address)
        if (!addressBound) { counts.osmAddressBindingMismatches++; add('osm_source_address_mismatch') }
        const provenance = osmSource(source) && point.licence === 'ODbL-1.0' && point.attribution === '© OpenStreetMap contributors' && validDay(point.checkedOn)
        if (!provenance) add('osm_source_metadata_incomplete')
        binding = addressBound && provenance && resolvedMatches ? 'osm_exact_address_metadata' : 'unbound'
        if (binding === 'osm_exact_address_metadata') counts.osmAddressCheckedMetadata++
      } else if (point.method === 'verified_official_address') {
        counts.officialAddressPoints++
        const addressBound = Boolean(text(row.address)?.trim() && point.sourceAddress === row.address)
        if (!addressBound) { counts.officialAddressBindingMismatches++; add('official_source_address_mismatch') }
        const quarterValid = point.sourceNeighborhood === null || typeof point.sourceNeighborhood === 'string' && point.sourceNeighborhood.trim().length >= 2 && point.sourceNeighborhood.length <= 120
        const contextBound = point.sourceCityCode === '68134' && point.sourceCityCode === row.cityCode && quarterValid && point.sourceNeighborhood === row.neighborhood &&
          Boolean(text(point.sourceWebsite)?.trim()) && point.sourceWebsite === row.website
        if (!contextBound) { counts.officialContextBindingMismatches++; add('official_source_context_mismatch') }
        const provenance = source === OFFICIAL_SOFIA_SOURCE_URL && point.licence === 'CC-BY-4.0' && point.attribution === OFFICIAL_SOFIA_ATTRIBUTION &&
          typeof point.addressId === 'string' && /^[1-9]\d*$/.test(point.addressId) && validDay(point.checkedOn)
        if (!provenance) { counts.officialSourceMetadataIncomplete++; add('official_source_metadata_incomplete') }
        binding = addressBound && contextBound && provenance && resolvedMatches ? 'official_exact_address_metadata' : 'unbound'
        if (binding === 'official_exact_address_metadata') counts.officialAddressCheckedMetadata++
      } else {
        counts.unknownCoordinateMethod++; binding = 'unknown_method'; add('unknown_coordinate_method')
      }
      if (resolved && !sameSourcePoint(point, resolved)) add('binding_resolver_changed_source_point')
      usable = row.locationKind === 'premises' && Boolean(text(row.address)?.trim()) && inBounds(point) && inBounds(resolved) && sameSourcePoint(point, resolved) &&
        ['explicit_address', 'legacy_snapshot', 'osm_exact_address_metadata', 'official_exact_address_metadata'].includes(binding)
      if (usable) counts.usableLocated++
      else { counts.heldCoordinates++; if (!codes.length) add('coordinate_not_usable') }
    } else {
      counts.rawUnlocated++
      if (resolved) add('binding_resolver_created_point')
    }
    const record = {
      id: text(row.id), name: text(row.name), cityCode: text(row.cityCode), neighborhood: text(row.neighborhood),
      address: text(row.address), locationKind: text(row.locationKind), category: text(row.category),
      coordinates: hasPoint ? {
        latitude: Number.isFinite(point.latitude) ? point.latitude : null,
        longitude: Number.isFinite(point.longitude) ? point.longitude : null,
        method: text(point.method), source: text(point.source), sourceAddress: text(point.sourceAddress), checkedOn: text(point.checkedOn),
        ...(point.method === 'verified_official_address' ? { addressId: text(point.addressId), sourceCityCode: text(point.sourceCityCode),
          sourceNeighborhood: text(point.sourceNeighborhood), sourceWebsite: text(point.sourceWebsite), licence: text(point.licence), attribution: text(point.attribution) } : {}),
      } : null,
      coordinateBinding: binding, usableForDistance: usable,
      evidenceClass: point?.method === 'first_party_coordinates' ? 'owner_published_not_independently_address_checked'
        : binding === 'osm_exact_address_metadata' ? 'independently_address_checked_source_metadata'
          : binding === 'official_exact_address_metadata' ? 'official_municipal_address_checked_source_metadata' : 'unknown',
      spatialAccuracyVerifiedByThisAudit: false,
      issues: codes,
    }
    records.push(record)
    evidenceClasses.set(record.evidenceClass, (evidenceClasses.get(record.evidenceClass) || 0) + 1)
    const category = record.category || 'unknown'
    if (!categories.has(category)) categories.set(category, { total: 0, rawLocated: 0, rawUnlocated: 0, usableLocated: 0, heldCoordinates: 0, firstPartyPublished: 0, osmAddressCheckedMetadata: 0, officialAddressCheckedMetadata: 0 })
    const categoryCounts = categories.get(category)
    categoryCounts.total++
    categoryCounts[hasPoint ? 'rawLocated' : 'rawUnlocated']++
    if (usable) categoryCounts.usableLocated++
    else if (hasPoint) categoryCounts.heldCoordinates++
    if (point?.method === 'first_party_coordinates') categoryCounts.firstPartyPublished++
    if (binding === 'osm_exact_address_metadata') categoryCounts.osmAddressCheckedMetadata++
    if (binding === 'official_exact_address_metadata') categoryCounts.officialAddressCheckedMetadata++
    if (codes.length) issues.push({ id: record.id, codes })
  }
  return {
    schemaVersion: 1, scope: 'all local catalogue source rows, before coordinate binding; no publication/date filtering',
    bounds: SOFIA_BOUNDS, counts, coordinateMethods: methods, coordinateSourceCount: sources.size,
    coordinateEvidenceClasses: Object.fromEntries(evidenceClasses), byBusinessCategory: Object.fromEntries(categories),
    coordinateSources: [...sources].map(([source, count]) => ({ source, count })).sort((a, b) => a.source.localeCompare(b.source)),
    limitations: [
      'Owner-published coordinates and exact address/snapshot binding do not establish geographic accuracy.',
      'OSM address-checked counts describe existing source metadata, not a new independent location verification.',
      'Official municipal address points are exact bound postal-address metadata, not verified business entrances or a new spatial survey.',
      'This audit performs no network, map, geocoding or visitor-location lookup and never creates or corrects a point.',
    ],
    spatialAccuracyVerifiedByThisAudit: false, issues, records,
  }
}

export async function main(args = process.argv.slice(2)) {
  const { values } = parseArgs({ args, options: { json: { type: 'boolean', default: false }, help: { type: 'boolean', default: false } } })
  if (values.help) {
    process.stdout.write('Usage: node scripts/audit-catalogue-locations.mjs [--json]\nRead-only local audit. --json includes only allowlisted public venue/source fields.\n')
    return
  }
  const [{ RAW_SOFIA_CATALOGUE }, { catalogueBoundCoordinates }] = await Promise.all([
    import('../lib/discovery/sofia-catalogue.mjs'), import('../lib/discovery/catalogue-coordinate-binding.mjs'),
  ])
  const report = auditCatalogueLocations(RAW_SOFIA_CATALOGUE, { boundCoordinates: catalogueBoundCoordinates })
  const { records, coordinateSources, ...summary } = report
  process.stdout.write(JSON.stringify(values.json ? report : summary, null, 2) + '\n')
  if (report.issues.length) process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
