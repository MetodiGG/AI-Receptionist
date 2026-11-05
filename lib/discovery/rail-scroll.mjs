const finite = value => Number.isFinite(value) ? value : 0
export function railScrollState({ scrollLeft = 0, scrollWidth = 0, clientWidth = 0 } = {}) {
  const max = Math.max(0, finite(scrollWidth) - finite(clientWidth)), left = Math.min(max, Math.max(0, finite(scrollLeft)))
  return { left, max, start: left <= 2, end: max - left <= 2 }
}
export function railScrollTarget(metrics, direction) {
  const { left, max } = railScrollState(metrics)
  return Math.min(max, Math.max(0, left + (direction < 0 ? -1 : 1) * Math.max(0, finite(metrics.clientWidth)) * .8))
}

// Public API: currently rendered Place IDs, not shadow-DOM card contents.
// Failed/duplicate/unknown IDs must not reserve empty carousel width.
export function renderedGooglePlaceIds(widget, requestedIds = []) {
  if (!Array.isArray(widget?.places)) return null
  const allowed = new Set(requestedIds)
  return [...new Set(widget.places.map(place => place?.id).filter(id => allowed.has(id)))].slice(0, 15)
}
