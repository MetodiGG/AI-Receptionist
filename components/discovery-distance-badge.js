import { Icon } from './icon'
import { distanceBadge } from '../lib/discovery/distance-origin.mjs'

export function DiscoveryDistanceBadge({ origin, destination, locale = 'bg', fallbackKm = null }) {
  const badge = distanceBadge(origin, destination, locale)
  const fallback = !origin && Number.isFinite(fallbackKm) && fallbackKm >= 0
  if (!badge && !fallback) return null
  return <span className="home-distance-badge" title={badge?.title}>
    <Icon name="pin"/><span>{badge?.value || `${new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'bg-BG', { maximumFractionDigits: 1 }).format(fallbackKm)} km`}</span>
    {badge?.suffix && <span className="home-distance-reference">{badge.suffix}</span>}
  </span>
}
