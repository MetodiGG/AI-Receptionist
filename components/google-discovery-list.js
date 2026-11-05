'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { selectedDiscoveryPlaceId } from '../lib/discovery/place-selection.mjs'
import { ExternalPlaceBooking } from './external-place-booking'
import { googleRailWidth } from '../lib/discovery/rail.mjs'
import { containDialogTab } from '../lib/dialog-focus.mjs'
import { loadPlacesLibrary } from '../lib/discovery/google-ui-loader.mjs'
import { renderedGooglePlaceIds } from '../lib/discovery/rail-scroll.mjs'

export function GoogleDiscoveryList({ plan, locale, onRetry, rail = false, nearby = false }) {
  const host = useRef(null), [status, setStatus] = useState('loading'), copy = DISCOVERY_COPY[locale]
  const [selected,setSelected]=useState(null)
  const [renderedCount, setRenderedCount] = useState(null)
  useEffect(() => {
    let active = true, list
    setStatus('loading')
    setSelected(null)
    setRenderedCount(null)
    const timer = setTimeout(async () => {
      try {
        await loadPlacesLibrary(plan.browserKey, plan.locale)
        await customElements.whenDefined('gmp-advanced-place-list')
        if (!active || !host.current) return
        list = document.createElement('gmp-advanced-place-list')
        if (rail) { list.setAttribute('orientation', 'horizontal'); list.setAttribute('attribution-position', 'bottom'); list.setAttribute('truncation-preferred', '') }
        list.setAttribute('selectable','')
        list.addEventListener('gmp-select',event=>{const id=selectedDiscoveryPlaceId(event,plan.placeIds);if(active&&id)setSelected(id)})
        const template = document.createElement('template'); template.setAttribute('slot', 'details-item')
        // Photos stay in Google's attributed widget; no media URLs, bytes or
        // author data are imported into our database or custom GoRez cards.
        const media = document.createElement('gmp-place-media')
        media.setAttribute('preferred-size', 'large'); media.setAttribute('lightbox-preferred', '')
        template.content.append(media)
        for (const tag of ['gmp-place-name', 'gmp-place-type', 'gmp-place-rating', ...(!nearby ? ['gmp-place-address'] : [])]) template.content.append(document.createElement(tag))
        const link = document.createElement('gmp-place-link'); link.setAttribute('action', rail ? 'open-directions' : 'open-map'); link.setAttribute('target', '_blank'); link.setAttribute('action-aria-label', locale === 'en' ? 'Google Maps directions' : 'Упътване в Google Maps')
        template.content.append(link)
        // Predefined actions let Google show real website/phone availability.
        // Their visible labels and destinations are provider-owned. Never
        // scrape shadow DOM, invent a booking URL or relabel a homepage as one.
        const website=document.createElement('gmp-place-link');website.setAttribute('action','open-website');website.setAttribute('target','_blank');template.content.append(website)
        if (rail) { const phone = document.createElement('gmp-place-link'); phone.setAttribute('action', 'call'); template.content.append(phone) }
        const attribution = document.createElement('gmp-place-attribution'); attribution.setAttribute('light-scheme-color', 'black')
        list.append(template, attribution)
        list.addEventListener('gmp-load', event => { if (active && event.target === list) { const ids = renderedGooglePlaceIds(list, plan.placeIds); setRenderedCount(ids?.length ?? null); setStatus(ids?.length === 0 ? 'empty' : 'ready') } })
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
  if (status === 'empty') return null
  return <section className={`discovery-google-kit${rail ? ' home-google-kit' : ''}`} aria-label="Google Maps" style={rail ? { '--google-rail-count': googleRailWidth(renderedCount ?? plan.placeIds.length) } : undefined}>
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
