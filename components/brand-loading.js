import { BrandMark } from './brand-logo'

// Shared, CSS-only indicator: no timer, extra request or artificial delay.
// Keep the loading state announced even when its visible wording is removed.
export function BrandLoading({ locale = 'bg', label, size = 32, className = '', announce = true, decorative = false }) {
  return <span className={`gorez-loading ${className}`.trim()} role={!decorative && announce ? 'status' : undefined} aria-hidden={decorative || undefined} style={{ '--loading-mark-size': `${size}px` }}>
    <BrandMark size={size} eager className="gorez-loading-mark"/>
    {!decorative && <span className="sr-only">{label || (locale === 'en' ? 'Loading…' : 'Зареждане…')}</span>}
  </span>
}
