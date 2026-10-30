'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'

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

export function GoogleDiscoveryList({ plan, locale, onRetry }) {
  const host = useRef(null), [status, setStatus] = useState('loading'), copy = DISCOVERY_COPY[locale]
  useEffect(() => {
    let active = true, list
    setStatus('loading')
    const timer = setTimeout(async () => {
      try {
        await loadPlacesLibrary(plan.browserKey, plan.locale)
        await customElements.whenDefined('gmp-advanced-place-list')
        if (!active || !host.current) return
        list = document.createElement('gmp-advanced-place-list')
        const template = document.createElement('template'); template.setAttribute('slot', 'details-item')
        // Photos stay in Google's attributed widget; no media URLs, bytes or
        // author data are imported into our database or custom GoRez cards.
        const media = document.createElement('gmp-place-media')
        media.setAttribute('preferred-size', 'large'); media.setAttribute('lightbox-preferred', '')
        template.content.append(media)
        for (const tag of ['gmp-place-name', 'gmp-place-address', 'gmp-place-rating']) template.content.append(document.createElement(tag))
        const link = document.createElement('gmp-place-link'); link.setAttribute('action', 'open-map'); link.setAttribute('target', '_blank'); link.textContent = copy.maps
        template.content.append(link)
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
  }, [plan])
  return <section className="discovery-google-kit" aria-label="Google Maps">
    <header><h3>{copy.google}</h3><p>{copy.externalHint}</p></header>
    {status === 'loading' && <p role="status">{copy.searching}</p>}
    {status === 'error' && <div className="discovery-notice" role="status"><p>{copy.unavailable}</p>{onRetry && <button type="button" className="secondary-button" onClick={onRetry}>{locale === 'en' ? 'Try search again' : 'Опитай търсенето отново'}</button>}</div>}
    <div ref={host}/>
    <details className="discovery-claim"><summary>{copy.claim}</summary><p>{copy.claimHint}</p><Link href={`/for-businesses?lang=${locale}`}>{locale === 'en' ? 'Start application' : 'Към регистрацията'}</Link></details>
  </section>
}
