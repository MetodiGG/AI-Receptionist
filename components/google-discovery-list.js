'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { selectedDiscoveryPlaceId } from '../lib/discovery/place-selection.mjs'
import { ExternalPlaceBooking } from './external-place-booking'
import { googleRailWidth } from '../lib/discovery/rail.mjs'
import { containDialogTab } from '../lib/dialog-focus.mjs'

let libraryPromise
function loadPlacesLibrary(key, locale) {
  if (libraryPromise) return libraryPromise
  libraryPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.importLibrary) { window.google.maps.importLibrary('places').then(resolve, reject); return }
    const script = document.createElement('script'), callback = '__gorezPlacesReady'
    const timeout = setTimeout(() => { delete window[callback]; reject(new Error('GOOGLE_TIMEOUT')) }, 8000)
    window[callback] = async () => { clearTimeout(timeout); delete window[callback]; try { resolve(await window.google.maps.importLibrary('places')) } catch { reject(new Error('GOOGLE_UNAVAILABLE')) } }
    const url = new URL('https://maps.googleapis.com/maps/api/js')
    // Advanced Place List is GA on weekly since Maps JS 3.66.11a (2026-10-22).
    // Loading is still gated by a separately approved provider grant.
    url.search = new URLSearchParams({ key, v: 'weekly', libraries: 'places', language: locale, region: 'BG', loading: 'async', callback }).toString()
    script.src = url.href; script.async = true; script.referrerPolicy = 'strict-origin-when-cross-origin'
    script.onerror = () => { clearTimeout(timeout); delete window[callback]; reject(new Error('GOOGLE_UNAVAILABLE')) }
    document.head.append(script)
  }).catch(error => { libraryPromise = null; throw error })
  return libraryPromise
}

export function GoogleDiscoveryList({ plan, locale, onRetry, rail = false, nearby = false }) {
  const host = useRef(null), [status, setStatus] = useState('loading'), copy = DISCOVERY_COPY[locale]
  const [selected,setSelected]=useState(null)
  useEffect(() => {
    let active = true, list
    setStatus('loading')
    setSelected(null)
    const timer = setTimeout(async () => {
      try {
        await loadPlacesLibrary(plan.browserKey, plan.locale)
        await customElements.whenDefined('gmp-advanced-place-list')
        if (!active || !host.current) return
        list = document.createElement('gmp-advanced-place-list')
        if (rail) { list.setAttribute('orientation', 'horizontal'); list.setAttribute('attribution-position', 'bottom') }
        list.setAttribute('selectable','')
        list.addEventListener('gmp-select',event=>{const id=selectedDiscoveryPlaceId(event,plan.placeIds);if(active&&id)setSelected(id)})
        const template = document.createElement('template'); template.setAttribute('slot', 'details-item')
        // Photos stay in Google's attributed widget; no media URLs, bytes or
        // author data are imported into our database or custom GoRez cards.
        const media = document.createElement('gmp-place-media')
        media.setAttribute('preferred-size', 'large'); media.setAttribute('lightbox-preferred', '')
        template.content.append(media)
        for (const tag of ['gmp-place-name', 'gmp-place-type', 'gmp-place-rating', ...(!nearby ? ['gmp-place-address'] : [])]) template.content.append(document.createElement(tag))
        const link = document.createElement('gmp-place-link'); link.setAttribute('action', rail ? 'open-directions' : 'open-map'); link.setAttribute('target', '_blank'); link.setAttribute('action-aria-label', locale === 'en' ? 'Take me there' : 'Заведи ме')
        template.content.append(link)
        // Predefined actions let Google show real website/phone availability.
        // Their visible labels and destinations are provider-owned. Never
        // scrape shadow DOM, invent a booking URL or relabel a homepage as one.
        const website=document.createElement('gmp-place-link');website.setAttribute('action','open-website');website.setAttribute('target','_blank');template.content.append(website)
        if (rail) { const phone = document.createElement('gmp-place-link'); phone.setAttribute('action', 'call'); template.content.append(phone) }
        const attribution = document.createElement('gmp-place-attribution'); attribution.setAttribute('light-scheme-color', 'black')
        list.append(template, attribution)
        list.addEventListener('gmp-load', () => { if (active) setStatus('ready') })
        list.addEventListener('gmp-error', () => { if (active) setStatus('error') })
        // Only IDs cross this boundary. We never extract Google's names,
        // addresses, ratings, photos or reviews out of their attributed UI Kit.
        list.setAttribute('places', plan.placeIds.map(id => `places/${id}`).join(' '))
        host.current.replaceChildren(list)
      } catch { if (active) setStatus('error') }
    }, 0)
    const deadline = setTimeout(() => { if (active) setStatus(current => current === 'loading' ? 'error' : current) }, 15000)
    return () => { active = false; clearTimeout(timer); clearTimeout(deadline); list?.remove() }
  }, [plan, rail, nearby])
  return <section className={`discovery-google-kit${rail ? ' home-google-kit' : ''}`} aria-label="Google Maps" style={rail ? { '--google-rail-count': googleRailWidth(plan.placeIds.length) } : undefined}>
    {!rail && <header><h3>{copy.google}</h3></header>}
    {status === 'loading' && <p role="status">{copy.searching}</p>}
    {status === 'error' && <div className="discovery-notice" role="status"><p>{copy.unavailable}</p>{onRetry && <button type="button" className="secondary-button" onClick={onRetry}>{locale === 'en' ? 'Try search again' : 'Опитай търсенето отново'}</button>}</div>}
    <div ref={host}/>
    {selected && (rail ? <GoogleBookingSelection key={selected} placeId={selected} locale={locale} onClose={() => setSelected(null)}/> : <ExternalPlaceBooking key={selected} placeId={selected} locale={locale}/>)}
    {!rail && <details className="discovery-claim"><summary>{copy.claim}</summary><p>{copy.claimHint}</p><Link href={`/for-businesses?lang=${locale}`}>{locale === 'en' ? 'Start application' : 'Към регистрацията'}</Link></details>}
  </section>
}

function GoogleBookingSelection({ placeId, locale, onClose }) {
  const dialog = useRef(null)
  useEffect(() => { const node = dialog.current, focused = document.activeElement; node?.showModal(); return () => { node?.close(); if (focused?.isConnected) focused.focus() } }, [])
  return <dialog ref={dialog} className="home-booking-dialog" onCancel={event => { event.preventDefault(); onClose() }} onKeyDown={event => containDialogTab(event, dialog.current)} onClick={event => { if (event.target === dialog.current) { const box = dialog.current.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose() } }} aria-label={locale === 'en' ? 'Booking options' : 'Запазване на час'}><button type="button" className="secondary-button" onClick={onClose}>{locale === 'en' ? 'Close' : 'Затвори'}</button><ExternalPlaceBooking placeId={placeId} locale={locale} compact/></dialog>
}
