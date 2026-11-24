'use client'

import { useEffect, useRef, useState } from 'react'
import { publicBusinessCoverPhoto } from '../lib/discovery-photo-presentation.mjs'

// Standalone example, never passed into the real-photo carousel or metadata.
export function BusinessCoverPhoto({ business, locale = 'bg', className = '', eager = false, omitIfUnavailable = false }) {
  const [unavailableSources, setUnavailableSources] = useState([]), imageRef = useRef(null)
  const { category, src, size, activityPhotoKey } = publicBusinessCoverPhoto(business, { unavailableSources })
  const remember = failed => setUnavailableSources(previous => previous.includes(failed) ? previous : [...previous.slice(-3), failed])
  useEffect(() => {
    const image = imageRef.current
    if (src && image?.complete === true && image.naturalWidth === 0 && image.currentSrc) remember(src)
  }, [src])
  if (!src && omitIfUnavailable) return null
  const missing = locale === 'en' ? 'Photo unavailable' : 'Снимката не е налична'
  return <div className={`business-category-cover ${className}`.trim()} data-category-cover={category} data-activity-cover={activityPhotoKey || undefined} data-image-kind={src ? 'ai-illustration' : undefined}>
    {src ? <><img ref={imageRef} key={src} src={src} width={size} height={size} alt={locale === 'en' ? 'Illustrative activity photo, not the business’s own premises or work' : 'Илюстративна снимка на дейността, не е собствена снимка на бизнеса'} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => remember(src)}/>
      <span className="business-category-cover-label">{locale === 'en' ? 'AI illustration' : 'AI илюстрация'}</span></> :
      <span role="img" aria-label={missing} style={{ display: 'grid', placeItems: 'center', minHeight: '100%', padding: 16 }}>{missing}</span>}
  </div>
}
