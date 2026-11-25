'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import { nextPhotoIndex, photoSwipeDirection } from '../lib/business-photos.mjs'
import { createPhotoAutoplay } from '../lib/photo-autoplay.mjs'
import { businessPhotoStyle } from '../lib/business-photo-layout.mjs'
import { publicProse } from '../lib/locale/public-content.mjs'

export function BusinessPhotoGallery({ photos: suppliedPhotos = [], businessName, locale = 'bg', variant = 'profile', autoplay = true, fallback = null, onDisplayedPhoto }) {
  const [failedSources, setFailedSources] = useState([])
  const photos = (Array.isArray(suppliedPhotos) ? suppliedPhotos : []).filter(photo =>
    typeof photo?.src === 'string' && photo.src && !failedSources.includes(photo.src))
  const en = locale === 'en', count = photos.length
  const [index, setIndex] = useState(0), [isOpen, setIsOpen] = useState(false)
  const [paused, setPaused] = useState(false), [hovered, setHovered] = useState(false)
  const [reduced, setReduced] = useState(true), [playing, setPlaying] = useState(false)
  const root = useRef(null), dialogRef = useRef(null), touchStart = useRef(null), dragged = useRef(false), activeImage = useRef(null)
  const titleId = useId()
  const activeIndex = index < count ? index : 0
  const photo = photos[activeIndex], activeSource = photo?.src

  useEffect(() => {
    if (count < 2 || !autoplay) return
    const rotation = createPhotoAutoplay(() => setIndex(current => nextPhotoIndex(current, 1, count)))
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let inView = typeof IntersectionObserver === 'undefined'
    const sync = () => {
      setReduced(media.matches)
      const enabled = !paused && !media.matches && !document.hidden && (isOpen || (inView && !hovered))
      setPlaying(enabled)
      rotation.setEnabled(enabled)
    }
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync() }, { threshold: .15 })
    if (root.current) observer?.observe(root.current)
    media.addEventListener('change', sync); document.addEventListener('visibilitychange', sync); sync()
    return () => { rotation.dispose(); observer?.disconnect(); media.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync) }
  }, [count, paused, hovered, isOpen, autoplay])

  useEffect(() => {
    // Only a successfully displayed preview photo can suppress a service image.
    // Report its original public path rather than Next's resized image URL.
    if (variant !== 'details' || !activeSource || !onDisplayedPhoto) return
    const image = activeImage.current
    if (image?.complete && image.naturalWidth > 0) onDisplayedPhoto(activeSource)
    return () => onDisplayedPhoto(null)
  }, [variant, activeSource, onDisplayedPhoto])

  if (!count) return fallback
  const text = value => publicProse(value, locale) || businessName
  const move = direction => { setPaused(true); setIndex(current => nextPhotoIndex(current, direction, count)) }
  const rejectPhoto = (source) => {
    setFailedSources(current => current.includes(source) ? current : [...current, source])
    if (source === photo.src) setIndex(0)
  }

  function keydown(event) {
    if (event.key === 'Tab') setPaused(true)
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) }
  }

  function swipeStart(event) {
    dragged.current = false
    const touch = event.touches.length === 1 && event.touches[0]
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
  }

  function swipeEnd(event) {
    const start = touchStart.current, end = event.changedTouches[0]
    touchStart.current = null
    const direction = photoSwipeDirection(start, end ? { x: end.clientX, y: end.clientY } : null)
    if (direction) { dragged.current = true; move(direction) }
  }

  const arrows = count > 1 && <><button className="business-photo-prev" type="button" onClick={() => move(-1)} aria-label={en ? 'Previous photo' : 'Предишна снимка'}>‹</button><button className="business-photo-next" type="button" onClick={() => move(1)} aria-label={en ? 'Next photo' : 'Следваща снимка'}>›</button></>
  const playback = count > 1 && !reduced && <button className="business-photo-playback" type="button" onClick={() => setPaused(current => !current)} aria-label={paused ? (en ? 'Start slideshow' : 'Пусни автоматичното прелистване') : (en ? 'Pause slideshow' : 'Спри автоматичното прелистване')}><span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span></button>
  const counter = <span className="business-photo-counter" aria-live={playing ? 'off' : 'polite'}>{activeIndex + 1} / {count}</span>

  return <>
    <div ref={root} className={`business-photo-gallery${variant === 'directory' ? ' directory-business-cover' : ''}`} role="region" aria-roledescription={en ? 'carousel' : 'галерия'} aria-label={en ? `Photos of ${businessName}` : `Снимки на ${businessName}`} data-photo-fit="contain" data-photo-controls={count > 1 ? 'navigation' : 'counter'} data-photo-index={index} data-autoplay={playing} onKeyDown={keydown} onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true) }} onPointerLeave={() => setHovered(false)} onFocusCapture={event => { if (event.target.matches(':focus-visible')) setPaused(true) }}>
      <button className="business-photo-open" type="button" onTouchStart={swipeStart} onTouchEnd={swipeEnd} onTouchCancel={() => { touchStart.current = null }} onClick={() => { if (dragged.current) { dragged.current = false; return }; setIsOpen(true); dialogRef.current?.showModal() }} aria-label={en ? `Open photos of ${businessName}` : `Отвори снимките на ${businessName}`}>
        {variant === 'details' ? <Image ref={activeImage} key={photo.src} src={photo.src} alt={text(photo.alt)} className="is-active" fill sizes="(max-width: 680px) 100vw, 640px" style={businessPhotoStyle(photo, { preview: true })}
          onLoad={onDisplayedPhoto ? event => { if (event.currentTarget === activeImage.current && event.currentTarget.naturalWidth > 0) onDisplayedPhoto(photo.src) } : undefined}
          onError={event => { if (event.currentTarget !== activeImage.current) return; onDisplayedPhoto?.(null); rejectPhoto(photo.src) }}/> : photos.map((item, itemIndex) => <Image src={item.src} alt={itemIndex === activeIndex ? text(item.alt) : ''} aria-hidden={itemIndex !== activeIndex} className={itemIndex === activeIndex ? 'is-active' : ''} fill key={item.src} preload={variant === 'profile' && itemIndex === 0} sizes={variant === 'directory' ? '(max-width: 760px) 100vw, 50vw' : '(max-width: 1200px) 100vw, 1160px'} style={businessPhotoStyle(item, { preview: true })} onError={() => rejectPhoto(item.src)}/>)}
      </button>
      <div className="business-photo-preview-controls">{arrows}{playback}{counter}</div>
    </div>
    <dialog ref={dialogRef} className="business-photo-dialog" aria-labelledby={titleId} onClose={() => setIsOpen(false)} onKeyDown={keydown} onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close() }}>
      <header><h2 id={titleId}>{businessName}</h2><button className="business-photo-close" type="button" onClick={() => dialogRef.current?.close()} aria-label={en ? 'Close photos' : 'Затвори снимките'}>×</button></header>
      <div className="business-photo-viewer" onTouchStart={swipeStart} onTouchEnd={swipeEnd} onTouchCancel={() => { touchStart.current = null }}>
        {(variant !== 'details' || isOpen) && <Image src={photo.src} alt={text(photo.alt)} fill sizes="(max-width: 700px) 100vw, 1100px" onError={() => rejectPhoto(photo.src)}/>}{arrows}
      </div>
      <footer>{playback}{counter}</footer>
    </dialog>
  </>
}
