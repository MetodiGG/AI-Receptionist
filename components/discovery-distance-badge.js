import { Icon } from './icon'
import { businessLocationBadge, distanceBadge } from '../lib/discovery/distance-origin.mjs'

export function DiscoveryDistanceBadge({ origin, destination, locale = 'bg', fallbackKm = null, business = null }) {
  const badge = distanceBadge(origin, destination, locale)
  const fallback = !origin && Number.isFinite(fallbackKm) && fallbackKm >= 0
  const location = !badge && !fallback ? businessLocationBadge(business, locale) : null
  if (!badge && !fallback && !location) return null
  return <span className="home-distance-badge" data-kind={location?.kind || 'distance'} title={badge?.title || location?.title} aria-label={location ? location.title : undefined}>
    <Icon name="pin"/><span className="home-location-label">{badge?.value || (fallback ? `${new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'bg-BG', { maximumFractionDigits: 1 }).format(fallbackKm)} km` : location.value)}</span>
    {badge?.suffix && <span className="home-distance-reference">{badge.suffix}</span>}
  </span>
}
