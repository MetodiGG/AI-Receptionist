import Image from 'next/image'

export function BrandLogo({ className = '', compact = false, decorative = false, eager = false }) {
  return (
    <span className={`gorez-lockup ${compact ? '' : 'gorez-logo'} ${className}`.trim()}>
      <Image className="gorez-mark-image" src="/gorez-symbol.svg?v=3" width={72} height={72} sizes="48px" alt="" aria-hidden="true" loading={eager ? 'eager' : 'lazy'} />
      <span className="gorez-wordmark" aria-hidden="true">GoRez</span>
      {!decorative && <span className="sr-only">GoRez</span>}
    </span>
  )
}
