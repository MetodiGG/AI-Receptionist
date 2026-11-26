'use client'

import { useEffect, useRef, useState } from 'react'
import { matchesBusinessCoverPhoto, publicServiceThumbnail } from '../lib/discovery-photo-presentation.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'

const rememberUnavailableSource = (previous, src) => previous.includes(src) ? previous : [...previous.slice(-7), src]

export function IllustrativeServicePhotoNote({ services, business, locale = 'bg' }) {
  if (!services?.some(service => {
    const photo = publicServiceThumbnail(service, { business, locale })
    return photo.source === 'illustrative' && photo.photoMatch !== 'neutral'
  })) return null
  return <p className="service-photo-note">{locale === 'en' ? 'Service photos are illustrative.' : 'Снимките на услугите са примерни.'}</p>
}

export function ServiceThumbnail({ service, business, locale = 'bg', size = 72, trustedServiceImage, className = '', businessCoverSources }) {
  const [unavailableSources, setUnavailableSources] = useState([])
  const imageRef = useRef(null)
  const options = { business, locale, trustedServiceImage, unavailableSources }
  const thumbnail = businessCoverSources === undefined
    ? publicServiceThumbnail(service, options)
    : publicDetailServiceThumbnail(service, { ...options, coverSources: businessCoverSources })
  const repeatsCover = matchesBusinessCoverPhoto(thumbnail.src, businessCoverSources)
  const src = repeatsCover ? null : thumbnail.src
  const displaySize = Number.isFinite(size) ? Math.min(160, Math.max(32, size)) : 72

  useEffect(() => {
    const image = imageRef.current
    // A cached/SSR image can fail before React attaches onError. An empty
    // currentSrc is not a completed request (notably for lazy images).
    if (src && image?.complete === true && image.naturalWidth === 0 && typeof image.currentSrc === 'string' && image.currentSrc.trim()) {
      setUnavailableSources(previous => rememberUnavailableSource(previous, src))
    }
  }, [src])

  // The hero already shows this exact image, including its small derivative.
  if (repeatsCover) return null
  // Unknown names (or entirely failed artwork) do not justify a notebook,
  // emoji or an unrelated photograph. Preserve the service text and actions.
  if (!src) return <span className="sr-only" data-service-photo-unavailable>{locale === 'en' ? 'No distinct service photo' : 'Няма отделна снимка за услугата'}</span>
  const illustration = thumbnail.source === 'illustrative'
  const disclosure = locale === 'en' ? 'AI illustration' : 'AI илюстрация'
  const compactDisclosure = illustration && businessCoverSources !== undefined
  const illustratedImageLabel = illustration ? `${disclosure} · ${thumbnail.alt}` : undefined
  return <span className={`service-thumbnail service-thumbnail--${thumbnail.type} ${className}`.trim()} data-service-kind={thumbnail.kind} data-thumbnail-kind={thumbnail.type} data-photo-match={thumbnail.photoMatch} data-image-kind={illustration ? 'ai-illustration' : undefined} title={compactDisclosure ? undefined : illustratedImageLabel} style={{ '--service-thumbnail-size': `${displaySize}px` }}>
    <img ref={imageRef} key={src} className="service-thumbnail-image" src={src} srcSet={thumbnail.srcSet || undefined} sizes={`${displaySize}px`} width={displaySize} height={displaySize} alt={thumbnail.alt} aria-label={compactDisclosure ? illustratedImageLabel : undefined} loading="lazy" decoding="async" onError={() => setUnavailableSources(previous => rememberUnavailableSource(previous, src))}/>
    {illustration && (compactDisclosure
      ? <small className="service-thumbnail-ai-label" data-compact-disclosure="true" aria-hidden="true">AI</small>
      : <small className="service-thumbnail-ai-label" aria-label={disclosure}>{displaySize >= 96 ? disclosure : 'AI'}</small>)}
  </span>
}
