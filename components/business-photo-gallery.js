'use client'

import Image from 'next/image'
import { useId, useRef, useState } from 'react'
import { nextPhotoIndex, photoSwipeDirection } from '../lib/business-photos.mjs'

export function BusinessPhotoGallery({ photos = [], businessName, locale = 'bg' }) {
  const en = locale === 'en'
  const [index, setIndex] = useState(0)
  const dialogRef = useRef(null)
  const touchStart = useRef(null)
  const titleId = useId()
  if (!photos.length) return null
  const photo = photos[index] || photos[0]
  const text = value => value?.[locale] || value?.bg || businessName
  const move = direction => setIndex(current => nextPhotoIndex(current, direction, photos.length))

  function openPhoto(value) {
    setIndex(value)
    dialogRef.current?.showModal()
  }

  function keydown(event) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      move(event.key === 'ArrowRight' ? 1 : -1)
    }
  }

  function swipeEnd(event) {
    const start = touchStart.current
    touchStart.current = null
    if (!start || !event.changedTouches[0]) return
    const end = event.changedTouches[0]
    const direction = photoSwipeDirection(start, { x: end.clientX, y: end.clientY })
    if (direction) move(direction)
  }

  return <>
    <div className="business-photo-gallery" aria-label={en ? `Photos of ${businessName}` : `Снимки на ${businessName}`}>
      {photos.slice(0, 2).map((item, itemIndex) => <button className="business-photo-tile" key={item.src} type="button" onClick={() => openPhoto(itemIndex)} aria-label={`${en ? 'Open photo' : 'Отвори снимката'}: ${text(item.caption)}`}>
        <Image src={item.src} alt={text(item.alt)} fill sizes="(max-width: 860px) 65vw, 360px" style={{ objectPosition: item.position }} />
        <span>{text(item.caption)}<span aria-hidden="true">↗</span></span>
        {itemIndex === 1 && photos.length > 2 && <b>+{photos.length - 2}</b>}
      </button>)}
    </div>
    <dialog ref={dialogRef} className="business-photo-dialog" aria-labelledby={titleId} onKeyDown={keydown} onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close() }}>
      <header><h2 id={titleId}>{businessName}</h2><button className="business-photo-close" type="button" onClick={() => dialogRef.current?.close()} aria-label={en ? 'Close photos' : 'Затвори снимките'}>×</button></header>
      <div className="business-photo-viewer" onTouchStart={event => { const touch = event.touches.length === 1 && event.touches[0]; touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null }} onTouchEnd={swipeEnd} onTouchCancel={() => { touchStart.current = null }}>
        <Image src={photo.src} alt={text(photo.alt)} fill sizes="(max-width: 700px) 100vw, 1100px" />
        {photos.length > 1 && <><button className="business-photo-prev" type="button" onClick={() => move(-1)} aria-label={en ? 'Previous photo' : 'Предишна снимка'}>‹</button><button className="business-photo-next" type="button" onClick={() => move(1)} aria-label={en ? 'Next photo' : 'Следваща снимка'}>›</button></>}
      </div>
      <footer aria-live="polite"><span>{text(photo.caption)}</span><span>{index + 1} / {photos.length}</span></footer>
    </dialog>
  </>
}
