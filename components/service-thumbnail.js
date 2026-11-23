'use client'

import { useEffect, useRef, useState } from 'react'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const rememberUnavailableSource = (previous, src) => previous.includes(src) ? previous : [...previous.slice(-7), src]

export function IllustrativeServicePhotoNote({ services, business, locale = 'bg' }) {
  if (!services?.some(service => {
    const photo = serviceThumbnail(service, { business, locale })
    return photo.source === 'illustrative' && photo.photoMatch !== 'neutral'
  })) return null
  return <p className="service-photo-note">{locale === 'en' ? 'Service photos are illustrative.' : 'Снимките на услугите са примерни.'}</p>
}

export function ServiceThumbnail({ service, business, locale = 'bg', size = 72, trustedServiceImage, className = '' }) {
  const [unavailableSources, setUnavailableSources] = useState([])
  const imageRef = useRef(null)
  const thumbnail = serviceThumbnail(service, { business, locale, trustedServiceImage, unavailableSources })
  const src = thumbnail.photoMatch === 'neutral' ? null : thumbnail.src
  const displaySize = Number.isFinite(size) ? Math.min(160, Math.max(32, size)) : 72

  useEffect(() => {
    const image = imageRef.current
    // A cached/SSR image can fail before React attaches onError. An empty
    // currentSrc is not a completed request (notably for lazy images).
    if (src && image?.complete === true && image.naturalWidth === 0 && typeof image.currentSrc === 'string' && image.currentSrc.trim()) {
      setUnavailableSources(previous => rememberUnavailableSource(previous, src))
    }
  }, [src])

  // Unknown names (or entirely failed artwork) do not justify a notebook,
  // emoji or an unrelated photograph. Preserve the service text and actions.
  if (!src) return null
  return <span className={`service-thumbnail service-thumbnail--${thumbnail.type} ${className}`.trim()} data-service-kind={thumbnail.kind} data-thumbnail-kind={thumbnail.type} data-photo-match={thumbnail.photoMatch} title={thumbnail.source === 'illustrative' ? thumbnail.alt : undefined} style={{ '--service-thumbnail-size': `${displaySize}px` }}>
    <img ref={imageRef} key={src} className="service-thumbnail-image" src={src} srcSet={thumbnail.srcSet || undefined} sizes={`${displaySize}px`} width={displaySize} height={displaySize} alt={thumbnail.alt} loading="lazy" decoding="async" onError={() => setUnavailableSources(previous => rememberUnavailableSource(previous, src))}/>
  </span>
}
