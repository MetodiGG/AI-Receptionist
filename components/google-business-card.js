'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from './icon'
import { DiscoveryDistanceBadge } from './discovery-distance-badge'
import { OutboundBookingButton } from './outbound-booking-button'
import { loadPlacesLibrary } from '../lib/discovery/google-ui-loader.mjs'
import { createGoogleCardWidget } from '../lib/discovery/google-card-widget.mjs'
import { widgetBusinessPoint } from '../lib/discovery/distance-origin.mjs'
import { railDirections } from '../lib/discovery/rail.mjs'

// Each effect mounts at most ONE native widget after ONE durable reservation.
// Origin changes update only the GoRez badge, never instantiate a second widget.
function useAuthorizedGoogleWidget({ card, locale, nearby, purpose = 'card', host, attempt = 0 }) {
  const [state, setState] = useState({ status: 'idle', point: null })
  useEffect(() => {
    let active = true, started = false, widget, timer, deadline
    const abort = new AbortController()
    setState({ status: 'idle', point: null })
    const unavailable = status => { clearTimeout(deadline); widget?.remove(); if (active) setState({ status, point: null }) }
    const start = () => {
      if (started || !active) return
      started = true
      // Strict Mode's discarded mount cancels this before making a request.
      timer = setTimeout(async () => {
        try {
          setState({ status: 'loading', point: null })
          deadline = setTimeout(() => { abort.abort(); unavailable('error') }, 15000)
          const response = await fetch('/api/public/discovery/google-card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket: card.ticket, purpose }), signal: abort.signal, cache: 'no-store' })
          if (!response.ok) { unavailable(response.status === 429 ? 'quota' : response.status === 403 ? 'expired' : 'error'); return }
          const { plan } = await response.json(), mode = purpose === 'card' ? 'ui_kit_card' : 'ui_kit_contacts'
          if (plan?.mode !== mode || plan.placeId !== card.placeId || plan.locale !== locale || typeof plan.browserKey !== 'string' || !plan.browserKey) throw new Error('INVALID_CARD_PLAN')
          if (!active || abort.signal.aborted) return
          await loadPlacesLibrary(plan.browserKey, plan.locale)
          const tag = purpose === 'card' ? 'gmp-advanced-place-details-compact' : 'gmp-advanced-place-details'
          await customElements.whenDefined(tag)
          if (!active || abort.signal.aborted || !host.current) return
          widget = createGoogleCardWidget(document, plan, { nearby })
          widget.addEventListener('gmp-load', event => {
            if (event.target !== widget || !active || abort.signal.aborted) return
            if (widget.place?.id !== card.placeId) { unavailable('error'); return }
            clearTimeout(deadline)
            setState({ status: 'ready', point: purpose === 'card' ? widgetBusinessPoint(widget, card.placeId) : null })
          })
          widget.addEventListener('gmp-error', event => { if (event.target === widget) unavailable('error') })
          host.current.replaceChildren(widget)
        } catch { if (active) unavailable('error') }
      }, 0)
    }
    const observer = purpose === 'card' && typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); start() } }, { rootMargin: '0px', threshold: .01 }) : null
    if (observer && host.current) observer.observe(host.current)
    else start()
    return () => { active = false; abort.abort(); observer?.disconnect(); clearTimeout(timer); clearTimeout(deadline); widget?.remove() }
  }, [card.ticket, card.placeId, locale, nearby, purpose, host, attempt])
  return state
}

function WidgetNotice({ status, locale, onRetry }) {
  if (status === 'ready') return null
  const en = locale === 'en', loading = status === 'idle' || status === 'loading'
  return <div className="google-card-notice" role="status"><p>{loading ? en ? 'Loading business…' : 'Зареждане на бизнеса…' : status === 'quota' ? en ? 'The request limit is reached. Google Maps remains available.' : 'Лимитът на заявките е достигнат. Google Maps остава достъпен.' : status === 'expired' ? en ? 'Refresh your search to load this business.' : 'Обнови търсенето, за да заредиш този бизнес.' : en ? 'Could not load this business.' : 'Бизнесът временно не се зарежда.'}</p>{!loading && status === 'error' && onRetry && <button type="button" className="secondary-button" onClick={onRetry}>{en ? 'Try again' : 'Опитай отново'}</button>}</div>
}

// This frame is GoRez-owned. The attributed native content is not read,
// rewritten, cropped or covered. The distance occupies its own top-left band
// so a missing Google photo can never put the badge over the business name.
export function GoogleBusinessCardFrame({ locale, origin, point, children, maps, booking, distancePending = false }) {
  return <article className="home-business-card google-business-card" data-source="google-ui-kit">
    <div className="google-card-distance-band"><DiscoveryDistanceBadge origin={origin} destination={point} locale={locale}/>{!point && !distancePending && <span className="google-distance-unavailable">{locale === 'en' ? 'Distance unavailable' : 'Разстоянието не е налично'}</span>}</div>
    {children}
    <div className="home-business-actions">{maps}{booking}</div>
  </article>
}

export function GoogleBusinessCard({ card, locale = 'bg', providerLocale = locale, nearby = false, distanceOrigin = null }) {
  const host = useRef(null), [attempt, setAttempt] = useState(0), [contacts, setContacts] = useState(false)
  const { status, point } = useAuthorizedGoogleWidget({ card, locale: providerLocale, nearby, host, attempt })
  const en = locale === 'en', reserve = en ? 'Book a time' : 'Резервирай час'
  const directions = railDirections({ source: 'google', placeId: card.placeId })
  const knownBooking = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(card.bookingLinkId || '')
  return <>
    <GoogleBusinessCardFrame locale={locale} origin={distanceOrigin} point={point} distancePending={['idle', 'loading'].includes(status)} maps={directions && <a className="home-directions" href={directions} target="_blank" rel="noopener noreferrer" aria-label={en ? 'Google Maps directions' : 'Упътване в Google Maps'}><Icon name="map"/><span className="home-maps-label" translate="no">Google Maps</span></a>} booking={knownBooking ? <OutboundBookingButton linkId={card.bookingLinkId} locale={locale} className="home-reserve">{reserve}</OutboundBookingButton> : status === 'ready' && <button type="button" className="home-reserve" onClick={() => setContacts(true)} aria-haspopup="dialog">{reserve}</button>}>
      <WidgetNotice status={status} locale={locale} onRetry={() => setAttempt(value => value + 1)}/>
      <div className="google-card-native" ref={host} aria-label="Google Maps"/>
    </GoogleBusinessCardFrame>
    {contacts && <GoogleBusinessContactDialog card={card} locale={locale} providerLocale={providerLocale} onClose={() => setContacts(false)}/>}
  </>
}

export function GoogleContactDialogFrame({ locale, onClose, children }) {
  const dialog = useRef(null), en = locale === 'en'
  useEffect(() => {
    const node = dialog.current, focused = document.activeElement
    node?.showModal()
    return () => { node?.close(); if (focused?.isConnected) focused.focus() }
  }, [])
  return <dialog ref={dialog} className="home-booking-dialog google-contact-dialog" aria-label={en ? 'Booking and contact options' : 'Резервация и контакти'} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === dialog.current) { const box = dialog.current.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose() } }}>
    <header><h3>{en ? 'Arrange your visit' : 'Запази своето посещение'}</h3><button type="button" className="secondary-button" onClick={onClose} aria-label={en ? 'Close' : 'Затвори'} autoFocus><Icon name="close"/></button></header>
    {children}
  </dialog>
}

function GoogleBusinessContactDialog({ card, locale, providerLocale, onClose }) {
  const host = useRef(null), [attempt, setAttempt] = useState(0), en = locale === 'en'
  const { status } = useAuthorizedGoogleWidget({ card, locale: providerLocale, nearby: false, purpose: 'contacts', host, attempt })
  return <GoogleContactDialogFrame locale={locale} onClose={onClose}>
    <p className="google-contact-note">{en ? 'Use the business website or phone to ask about a time. Online booking and availability are not verified here.' : 'Избери сайта или телефона на бизнеса и уточни час. Онлайн резервацията и свободните часове тук не са проверени.'}</p>
    <WidgetNotice status={status} locale={locale} onRetry={() => setAttempt(value => value + 1)}/>
    <div ref={host} className="google-card-native" aria-label={en ? 'Contact details from Google Maps' : 'Контакти от Google Maps'}/>
    {status === 'ready' && <p className="google-contact-note">{en ? 'If no contact is listed, use Google Maps. Opening a website or calling does not confirm an appointment.' : 'Ако не е посочен контакт, използвай Google Maps. Отварянето на сайт или обаждането не потвърждават резервация.'}</p>}
    <a className="home-directions google-dialog-maps" href={railDirections({ source: 'google', placeId: card.placeId })} target="_blank" rel="noopener noreferrer" translate="no">Google Maps</a>
  </GoogleContactDialogFrame>
}
