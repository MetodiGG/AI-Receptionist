import { publicNativeBusinessLocation } from './native-location-evidence.mjs'

export function nativeLocationReviewPage(rows, limit) {
  const page = rows.slice(0, limit)
  const unresolved = page.flatMap(row => {
    const status = publicNativeBusinessLocation(row).locationStatus
    const place = Array.isArray(row.place_link) ? row.place_link[0] : row.place_link
    const stalePlace = Boolean(place && (place.location_revision == null || String(row.location_revision) !== String(place.location_revision)))
    if (status === 'not_visit_location' || status === 'verified_sofia' && !stalePlace) return []
    return [{ id: row.id, name: row.name, slug: row.slug, address: row.address, city: row.city, status, stalePlace,
      active: row.active === true, platform_status: row.platform_status }]
  })
  return { unresolved, examined: page.length, next: rows.length > limit ? page.at(-1)?.id || null : null }
}
