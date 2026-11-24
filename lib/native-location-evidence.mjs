import { businessAddress } from './business-location.mjs'
import { publicBusinessLocation } from './business-directions.mjs'
import { sofiaSettlementPointConflict } from './sofia-settlement-boundaries.mjs'
import { nonVisitLocationKind } from './sofia-location-scope.mjs'

const OSM_SOURCE = /^https:\/\/www\.openstreetmap\.org\/(?:node|way|relation)\/[1-9]\d{0,19}$/u
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
const LOCATION_FIELDS = 'id,address,city,city_ekatte,neighborhood,latitude:public_profile->latitude,longitude:public_profile->longitude,location_kind:public_profile->>location_kind,location_revision,location_source:registration_location_sources(latitude,longitude,source_url,licence,attribution,match_version,location_revision)'
const validRevision = value => (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) ||
  (typeof value === 'string' && /^\d{1,19}$/u.test(value))
const cityCode = row => row.cityCode || row.city_ekatte || ''
const visitPoint = row => row.coordinates || row.public_profile || row

export function nativeVerifiedCoordinates(row) {
  if (!row || nonVisitLocationKind(row)) return null
  const refs = Array.isArray(row.location_source) ? row.location_source : [row.location_source]
  const source = refs[0], revision = row.location_revision
  if (refs.length !== 1 || source?.match_version !== 2 || !validRevision(revision) ||
      !validRevision(source.location_revision) || String(revision) !== String(source.location_revision)) return null
  if (!Number.isFinite(row.latitude) || !Number.isFinite(row.longitude) ||
      row.latitude !== source.latitude || row.longitude !== source.longitude ||
      source.licence !== 'ODbL-1.0' || source.attribution !== '© OpenStreetMap contributors' ||
      !OSM_SOURCE.test(source.source_url || '')) return null
  return { latitude: row.latitude, longitude: row.longitude, sourceUrl: source.source_url }
}

// Read public proof separately, for only the already-visible results. No
// change to booking reads or search ranking; no evidence fields leave here.
// If the optional read fails, profiles/menus still render and loose points
// are never promoted to verified navigation.
export async function attachNativeLocationEvidence(db, rows, { addressIsDisplay = true } = {}) {
  const native = row => (!row.source || row.source === 'gorez') && UUID.test(row.id || '')
  const ids = [...new Set(rows.filter(native).map(row => row.id))]
  if (!ids.length) return rows
  const byId = new Map()
  try {
    for (let offset = 0; offset < ids.length; offset += 100) {
      const { data, error } = await db.from('businesses').select(LOCATION_FIELDS)
        .in('id', ids.slice(offset, offset + 100)).eq('active', true).eq('platform_status', 'enabled')
      if (error) break
      for (const row of data || []) byId.set(row.id, row)
    }
  } catch { /* A directions-only read must not fail the parent request. */ }

  return rows.map(row => {
    if (!native(row)) return row
    const source = byId.get(row.id)
    const address = addressIsDisplay ? row.address : businessAddress(row)
    const locationKind = nonVisitLocationKind(row) || nonVisitLocationKind(source)
    const view = { ...row, source: 'gorez', address, locationKind }
    // Compare the branch's exact displayed address and locality as well as
    // both points. A source read racing a move cannot attach an old result
    // or borrow the new location for an already-rendered previous address.
    const sameAddress = source && address === businessAddress(source) && cityCode(row) === cityCode(source) &&
      row.city === source.city && row.neighborhood === source.neighborhood
    if (source && !sameAddress && !locationKind) {
      return { ...row, navigationLocation: { coordinates: null, locationVerified: false, locationStatus: 'conflict', locationBinding: null } }
    }
    const point = visitPoint(row)
    const verified = sameAddress && !locationKind && point.latitude === source.latitude && point.longitude === source.longitude
      ? nativeVerifiedCoordinates(source) : null
    return { ...row, navigationLocation: publicBusinessLocation(view, verified, sofiaSettlementPointConflict) }
  })
}
