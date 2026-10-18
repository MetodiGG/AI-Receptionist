'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { BrandLogo } from './brand-logo'
import { Icon } from './icon'
import { bookingFilmDates, FILM_COPY, FILM_CYCLE_MS, FILM_PHASE_MS, FILM_PHASES } from '../lib/booking-film.mjs'

function FilmCursor({ className = '' }) {
  return <span className={`film-cursor ${className}`}><span/><svg viewBox="0 0 28 32" fill="none"><path d="M4 2 25 18l-11 1-5 10L4 2Z" fill="#173e2a" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/></svg></span>
}

// An illustrative, CSS-timed walkthrough. It never calls the booking API.
// Preview controls are used only by the guarded /dev/booking-film fixture.
export function BookingStory({ locale = 'bg', previewOffset = 0, previewPaused = false, previewReduced = false }) {
  const copy = FILM_COPY[locale === 'en' ? 'en' : 'bg'], id = useId(), root = useRef(null)
  const [dates, setDates] = useState([]), [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false), [inView, setInView] = useState(true), [tabVisible, setTabVisible] = useState(true)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => setReduced(media.matches)
    const syncPage = () => { setTabVisible(!document.hidden); if (!document.hidden) setDates(bookingFilmDates(locale)) }
    syncMotion(); syncPage()
    media.addEventListener('change', syncMotion)
    document.addEventListener('visibilitychange', syncPage)
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= .1), { threshold: .1 })
    if (root.current) observer?.observe(root.current)
    return () => { media.removeEventListener('change', syncMotion); document.removeEventListener('visibilitychange', syncPage); observer?.disconnect() }
  }, [locale])

  const motionOff = reduced || previewReduced, selectedDate = dates[2]
  const phase = (name, children) => <div key={name} className={`film-scene film-${name}`} data-phase={name} style={{ '--phase-offset': `${FILM_PHASES.indexOf(name) * FILM_PHASE_MS}ms` }}>{children}</div>
  const heading = (number, title, description) => <div className="film-scene-heading"><span className="film-step-number">0{number}<i>/ 04</i></span><h3>{title}</h3><p>{description}</p></div>

  return <figure ref={root} className="booking-story booking-film" id="how" lang={locale === 'en' ? 'en' : 'bg'} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} data-paused={paused || previewPaused || !inView || !tabVisible} data-reduced={motionOff} style={{ '--film-cycle': `${FILM_CYCLE_MS}ms`, '--film-shift': `${-previewOffset}ms` }}>
    <div className="film-heading"><div><span>{copy.subtitle}</span><h2 id={`${id}-title`}>{copy.title}</h2></div>
      <button type="button" className="film-playback" disabled={motionOff} onClick={() => setPaused(value => !value)} aria-label={motionOff ? copy.reduced : paused ? copy.resumeLabel : copy.pauseLabel}>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">{paused ? <path d="m7 4 9 6-9 6V4Z" fill="currentColor"/> : <path d="M7 5v10M13 5v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>}</svg>
        <span>{motionOff ? copy.reduced : paused ? copy.resume : copy.pause}</span>
      </button>
    </div>
    <p className="sr-only" id={`${id}-description`}>{copy.description}</p>
    <div className="film-visual" aria-hidden="true">
      <div className="film-window-bar"><BrandLogo compact decorative/><span className="film-window-dots"><i/><i/><i/></span></div>
      {phase('service', <>{heading(1, copy.service, copy.serviceNote)}<div className="film-services">{copy.services.map((name, index) => <div key={name} className={`film-service-row ${index === 0 ? 'film-chosen' : ''}`}><span className="film-service-icon"><Icon name={index === 2 ? 'user' : 'scissors'}/></span><div><strong>{name}</strong><small>{[45, 60, 30][index]} {copy.minutes}</small></div><span className="film-choice-check"><Icon name="check"/></span></div>)}</div><FilmCursor className="film-cursor-service"/></>)}
      {phase('time', <>{heading(2, copy.time, copy.timeNote)}<div className="film-calendar-title"><Icon name="calendar"/><span>{selectedDate?.monthName || '—'}</span><span>{copy.date}</span></div><div className="film-date-strip">{Array.from({ length: 5 }, (_, index) => <div key={dates[index]?.key || index} className={index === 2 ? 'film-date-selected film-chosen' : ''}><small>{dates[index]?.weekday || '—'}</small><strong>{dates[index]?.day || '—'}</strong><span>{dates[index]?.month || '—'}</span></div>)}</div><div className="film-time-title"><Icon name="clock"/>{copy.hour}</div><div className="film-time-grid">{['09:00', '09:45', '10:30', '13:00', '13:45', '14:30'].map(time => <span key={time} className={time === '10:30' ? 'film-chosen' : ''}>{time}</span>)}</div><div className="film-selected-note"><Icon name="check"/>{selectedDate?.label || '—'} · 10:30 – 11:15</div><FilmCursor className="film-cursor-time"/></>)}
      {phase('details', <>{heading(3, copy.details, copy.detailsNote)}<div className="film-contact-fields">{[[copy.name, copy.nameValue], [copy.phone, '+359 ••• ••• •••'], [copy.email, 'name@example.com']].map(([label, value], index) => <div className="film-field" key={label}><small>{label} *</small><div><span style={{ '--field-offset': `${index * 180}ms` }}>{value}</span><i/></div></div>)}</div><div className="film-privacy"><span><Icon name="check"/></span>{copy.privacy}</div><div className="film-confirm-button">{copy.confirm}<Icon name="arrow"/></div><FilmCursor className="film-cursor-details"/></>)}
      {phase('confirmation', <><div className="film-success-mark"><Icon name="check"/><span/></div><div className="film-success-copy"><small>04 / 04</small><h3>{copy.done}</h3><p>{copy.booked}</p></div><div className="film-receipt"><span><Icon name="scissors"/>{copy.services[0]}<small>45 {copy.minutes}</small></span><div><span><Icon name="calendar"/>{selectedDate?.label || '—'}</span><strong>10:30 – 11:15</strong></div></div><p className="film-success-note">{copy.bookedNote}</p></>)}
      {phase('slogan', <><p className="film-finale-kicker">{copy.finale}</p><h3>{copy.slogan.map((word, index) => <span key={word} style={{ '--word-offset': `${index * 140}ms` }}>{word}</span>)}</h3><div className="film-finale-signature"><span><Icon name="check"/></span><strong>GoRez</strong></div><p className="film-finale-note">{copy.endNote}</p></>)}
      <div className="film-progress"><span/><i/><i/><i/><i/></div>
    </div>
    <figcaption>{copy.caption}</figcaption>
  </figure>
}
