import Image from 'next/image'

export function BrandLogo({ className = '', compact = false, decorative = false }) {
  if (compact) {
    return (
      <span className={`gorez-lockup ${className}`.trim()}>
        <Image className="gorez-mark-image" src="/gorez-mark.png" width={512} height={350} alt="" aria-hidden="true" />
        <span className="gorez-wordmark" aria-hidden="true">GoRez</span>
        {!decorative && <span className="sr-only">GoRez</span>}
      </span>
    )
  }

  return (
    <span className={`gorez-logo ${className}`.trim()}>
      <Image className="gorez-logo-image" src="/gorez-logo.png" width={760} height={570} alt={decorative ? '' : 'GoRez'} />
    </span>
  )
}
