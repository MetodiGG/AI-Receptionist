'use client'

import { createElement, useCallback, useEffect, useRef, useState } from 'react'

// A lazy image with no currentSrc has not necessarily started loading.
export function isPreparedThumbnailFailure(image) {
  return image?.complete === true && image.naturalWidth === 0 && Boolean(image.currentSrc?.trim())
}

function PreparedPhotoCandidates({ candidates, locale, size, className }) {
  const [index, setIndex] = useState(0)
  const imageRef = useRef(null)
  const photo = candidates[index]
  const advance = useCallback(image => {
    if (image && imageRef.current === image) {
      // The cached-error check and onError may see the same failed image.
      setIndex(current => current === index ? current + 1 : current)
    }
  }, [index])

  useEffect(() => {
    const image = imageRef.current
    if (isPreparedThumbnailFailure(image)) advance(image)
  }, [advance])

  if (!photo) return createElement('span', { className: 'sr-only', 'data-service-photo-unavailable': true },
    locale === 'en' ? 'No distinct service photo' : 'Няма отделна снимка за услугата')

  const illustration = photo.illustration === true
  const disclosure = locale === 'en' ? 'AI illustration' : 'AI илюстрация'
  const description = photo.alt?.[locale] || photo.alt?.bg || ''
  return createElement('span', {
    className: `service-thumbnail service-thumbnail--${photo.type || 'photo'} ${className}`.trim(),
    'data-service-kind': photo.kind,
    'data-thumbnail-kind': photo.type || 'photo',
    'data-photo-match': photo.photoMatch,
    'data-image-kind': illustration ? 'ai-illustration' : undefined,
    style: { '--service-thumbnail-size': `${size}px` },
  }, createElement('img', {
    key: index, ref: imageRef, className: 'service-thumbnail-image', src: photo.src, srcSet: photo.srcSet || undefined,
    sizes: `${size}px`, width: size, height: size,
    alt: illustration ? (description ? `${disclosure} · ${description}` : disclosure) : description,
    loading: 'lazy', decoding: 'async', onError: event => advance(event.currentTarget),
  }))
}

export function PreparedServiceThumbnail({ candidates = [], locale = 'bg', size = 128, className = '' }) {
  const sources = Array.isArray(candidates) ? candidates.filter(candidate => typeof candidate?.src === 'string' && candidate.src) : []
  const displaySize = Number.isFinite(size) ? Math.min(160, Math.max(32, size)) : 128
  // Reset failures when actual sources change, not every time the API data
  // receives a new object identity or only the locale changes.
  const key = JSON.stringify(sources.map(({ src, srcSet }) => [src, srcSet || null]))
  return createElement(PreparedPhotoCandidates, { key, candidates: sources, locale, size: displaySize, className })
}
