import { BRAND_MARK_SRC, BRAND_MARK_SRC_SET } from '../lib/brand-assets.mjs'

export function BrandMark({ size = 72, eager = false, className = '' }) {
  return <img className={`gorez-mark-image gorez-brand-mark ${className}`.trim()} src={BRAND_MARK_SRC} srcSet={BRAND_MARK_SRC_SET} sizes={`${Math.min(size, 48)}px`} width={size} height={size} style={{ '--brand-mark-size': `${size}px` }} alt="" aria-hidden="true" loading={eager ? 'eager' : 'lazy'} decoding="async"/>
}

export function BrandLogo({ className = '', compact = false, decorative = false, eager = false }) {
  return (
    <span className={`gorez-lockup ${compact ? '' : 'gorez-logo'} ${className}`.trim()}>
      <BrandMark eager={eager}/>
      <span className="gorez-wordmark" aria-hidden="true"><span className="gorez-wordmark-accent">G</span>o<span className="gorez-wordmark-accent">R</span>ez</span>
      {!decorative && <span className="sr-only">GoRez</span>}
    </span>
  )
}
