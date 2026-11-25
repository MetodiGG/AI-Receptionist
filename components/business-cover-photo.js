'use client'

import { useEffect, useRef, useState } from 'react'
import { businessCoverPhoto } from '../lib/business-cover-photo.mjs'

// Standalone example, never passed into the real-photo carousel or metadata.
export function BusinessCoverPhoto({ business, locale = 'bg', className = '', eager = false, onDisplayedPhoto }) {
  const [unavailableSources, setUnavailableSources] = useState([]), imageRef = useRef(null)
  const { category, src, size, activityPhotoKey } = businessCoverPhoto(business, { unavailableSources })
  const remember = failed => setUnavailableSources(previous => previous.includes(failed) ? previous : [...previous.slice(-3), failed])
  useEffect(() => {
    const image = imageRef.current
    if (!src || image?.complete !== true || !image.currentSrc) return
    if (image.naturalWidth === 0) remember(src)
    else onDisplayedPhoto?.(src)
  }, [src, onDisplayedPhoto])
  // Clear the previous cover identity while a new candidate is loading.
  useEffect(() => src && onDisplayedPhoto ? () => onDisplayedPhoto(null) : undefined, [src, onDisplayedPhoto])
  const missing = locale === 'en' ? 'Photo unavailable' : 'Снимката не е налична'
  return <div className={`business-category-cover ${className}`.trim()} data-category-cover={category} data-activity-cover={activityPhotoKey || undefined} data-image-kind={src ? 'ai-illustration' : undefined}>
    {src ? <><img ref={imageRef} key={src} src={src} width={size} height={size} alt={locale === 'en' ? 'Illustrative activity photo, not the business’s own premises or work' : 'Илюстративна снимка на дейността, не е собствена снимка на бизнеса'} loading={eager ? 'eager' : 'lazy'} decoding="async"
      onLoad={onDisplayedPhoto ? event => { if (event.currentTarget === imageRef.current && event.currentTarget.naturalWidth > 0) onDisplayedPhoto(src) } : undefined}
      onError={event => { if (event.currentTarget !== imageRef.current) return; onDisplayedPhoto?.(null); remember(src) }}/>
      <span className="business-category-cover-label">{locale === 'en' ? 'AI illustration' : 'AI илюстрация'}</span></> :
      <span role="img" aria-label={missing} style={{ display: 'grid', placeItems: 'center', minHeight: '100%', padding: 16 }}>{missing}</span>}
  </div>
}
