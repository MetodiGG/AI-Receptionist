'use client'

import { useState } from 'react'
import { Icon } from './icon'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

export function ServiceThumbnail({ service, business, locale = 'bg', size = 72, trustedServiceImage, className = '' }) {
  const [unavailableSources, setUnavailableSources] = useState([])
  const thumbnail = serviceThumbnail(service, { business, locale, trustedServiceImage, unavailableSources })
  const displaySize = Number.isFinite(size) ? Math.min(160, Math.max(32, size)) : 72

  return <span className={`service-thumbnail service-thumbnail--${thumbnail.type} ${className}`.trim()} data-service-kind={thumbnail.kind} data-thumbnail-kind={thumbnail.type} style={{ '--service-thumbnail-size': `${displaySize}px` }}>
    {thumbnail.src ? <img key={thumbnail.src} className="service-thumbnail-image" src={thumbnail.src} srcSet={thumbnail.srcSet || undefined} sizes={`${displaySize}px`} width={displaySize} height={displaySize} alt={thumbnail.alt} loading="lazy" decoding="async" onError={() => setUnavailableSources(previous => previous.includes(thumbnail.src) ? previous : [...previous, thumbnail.src])}/> :
      <span className="service-thumbnail-icon" role="img" aria-label={thumbnail.alt}><Icon name={thumbnail.icon}/></span>}
  </span>
}
