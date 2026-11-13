import { Icon } from './icon'
import { businessLocationBadge, distanceBadge } from '../lib/discovery/distance-origin.mjs'

export function DiscoveryDistanceBadge({ origin, destination, locale = 'bg', business = null }) {
  const badge = distanceBadge(origin, destination, locale)
  // A cached numeric distance without its actual origin is not evidence.
  const location = !badge ? businessLocationBadge(business, locale) : null
  if (!badge && !location) return null
  return <span className="home-distance-badge" data-kind={location?.kind || 'distance'} title={badge?.title || location?.title} aria-label={badge ? `${badge.value} ${badge.suffix} — ${badge.title}` : location?.title}>
    <Icon name="pin"/><span className="home-location-label">{badge?.value || location.value}</span>
    {badge?.suffix && <span className="home-distance-reference">{badge.suffix}</span>}
  </span>
}
