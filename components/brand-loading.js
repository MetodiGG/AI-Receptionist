import { BrandMark } from './brand-logo'

// Shared, CSS-only indicator: no timer, extra request or artificial delay.
// Keep the loading state announced even when its visible wording is removed.
export function BrandLoading({ locale = 'bg', label, size = 32, className = '', announce = true, decorative = false }) {
  // Enlarge the existing indicator without changing header/partner logos.
  // Compact controls gain 4px; default/page marks grow by one quarter.
  const requestedSize = Number.isFinite(size) && size > 0 ? size : 32
  const markSize = requestedSize <= 24 ? requestedSize + 4 : Math.round(requestedSize * 1.25)
  return <span className={`gorez-loading ${className}`.trim()} role={!decorative && announce ? 'status' : undefined} aria-hidden={decorative || undefined} style={{ '--loading-mark-size': `${markSize}px` }}>
    <BrandMark size={markSize} sizes={`${markSize}px`} eager className="gorez-loading-mark"/>
    {!decorative && <span className="sr-only">{label || (locale === 'en' ? 'Loading…' : 'Зареждане…')}</span>}
  </span>
}
