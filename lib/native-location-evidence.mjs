import { businessAddress } from './business-location.mjs'
import { publicBusinessLocation } from './business-directions.mjs'
import { sofiaSettlementPointConflict } from './sofia-settlement-boundaries.mjs'
import { nonVisitLocationKind, noPublicVisit } from './sofia-location-scope.mjs'

const OSM_SOURCE = /^https:\/\/www\.openstreetmap\.org\/(?:node|way|relation)\/[1-9]\d{0,19}$/u
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
const EVIDENCE_FIELDS = 'id,address,city,city_ekatte,neighborhood,location_kind:public_profile->>location_kind,location_revision,location_source:registration_location_sources(latitude,longitude,source_url,licence,attribution,match_version,location_revision)'
const sameSnapshot = (a, b) => a.address === b.address && a.city_ekatte === b.city_ekatte &&
  a.city === b.city && a.neighborhood === b.neighborhood && nonVisitLocationKind(a) === nonVisitLocationKind(b)
const rawPoint = row => row.public_profile || row

export function nativeVerifiedCoordinates(row) {
  if (noPublicVisit(row)) return null
  const refs = Array.isArray(row.location_source) ? row.location_source : [row.location_source]
  const point = rawPoint(row)
  const revision = row.location_revision
  if (revision == null || !/^\d+$/u.test(String(revision)) || refs.length !== 1) return null
  const ref = refs[0]
  return ref?.match_version === 2 && ref.location_revision != null && String(ref.location_revision) === String(revision) &&
    point.latitude === ref.latitude && point.longitude === ref.longitude &&
    ref.licence === 'ODbL-1.0' && ref.attribution === '© OpenStreetMap contributors' && OSM_SOURCE.test(ref.source_url)
    ? { latitude: ref.latitude, longitude: ref.longitude, sourceUrl: ref.source_url } : null
}

export function publicNativeBusinessLocation(row) {
  const location = publicBusinessLocation({ ...row, source: 'gorez', address: row.locationAddress ? row.address : businessAddress(row), locationAddress: row.locationAddress || row.address },
    nativeVerifiedCoordinates(row), sofiaSettlementPointConflict)
  return location.locationStatus === 'not_visit_location'
    ? { ...location, locationKind: nonVisitLocationKind(row) || 'service_area', address: null } : location
}

// Read after the primary result. During a rolling migration or a location-
// source outage, booking/profile text still works and only navigation fails
// closed. An evidence read racing an edit cannot attach to another address.
export async function attachNativeLocationEvidence(db, rows) {
  const ids = [...new Set(rows.filter(row => uuid.test(row.id || '') && !noPublicVisit(row) && rawPoint(row).latitude != null &&
    rawPoint(row).longitude != null).map(row => row.id))]
  if (!ids.length) return rows
  try {
    const byId = new Map()
    for (let offset = 0; offset < ids.length; offset += 100) {
      const { data, error } = await db.from('businesses').select(EVIDENCE_FIELDS)
        .in('id', ids.slice(offset, offset + 100)).eq('active', true).eq('platform_status', 'enabled')
      if (error) return rows
      for (const value of data || []) byId.set(value.id, value)
    }
    return rows.map(row => {
      const value = byId.get(row.id)
      if (value && noPublicVisit(value)) return { ...row, location_kind: nonVisitLocationKind(value), location_source: null }
      return value && sameSnapshot(row.locationAddress ? { ...row, address: row.locationAddress } : row, value) ? { ...row, location_revision: value.location_revision,
        location_source: value.location_source } : row
    })
  } catch { return rows }
}
