import Image from 'next/image'

export function BrandLogo({ className = '', compact = false, decorative = false, eager = false }) {
  if (compact) {
    return (
      <span className={`gorez-lockup ${className}`.trim()}>
        <Image className="gorez-mark-image" src="/gorez-mark.png" width={512} height={350} sizes="64px" alt="" aria-hidden="true" loading={eager ? 'eager' : 'lazy'} />
        <span className="gorez-wordmark" aria-hidden="true">GoRez</span>
        {!decorative && <span className="sr-only">GoRez</span>}
      </span>
    )
  }

  return (
    <span className={`gorez-logo ${className}`.trim()}>
      <Image className="gorez-logo-image" src="/gorez-logo.png" width={760} height={570} sizes="(max-width: 760px) 96px, 128px" alt={decorative ? '' : 'GoRez'} loading={eager ? 'eager' : 'lazy'} />
    </span>
  )
}
