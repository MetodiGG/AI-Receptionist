'use client'

import { useState } from 'react'
import { businessDisplayAddress } from '../lib/locale/public-content.mjs'
import { businessDirectionsAddress, resolveBusinessDestination } from '../lib/business-directions.mjs'
import styles from './directions-unavailable.module.css'

export function DirectionsUnavailable({ business, locale = 'bg', showAddress = false, preview = false }) {
  const en = locale === 'en'
  const [result, setResult] = useState('')
  const location = resolveBusinessDestination(business)
  const address = businessDirectionsAddress(business)
  if (location.status === 'not_visit_location') return showAddress ? <p>{en ? 'No public visit address' : 'Без публичен адрес за посещение'}</p> : null
  const status = location.status === 'outside_sofia' ? (en ? 'Outside the Sofia service area' : 'Извън зоната за обслужване в София')
    : (en ? 'Location is being verified' : 'Локацията се уточнява')
  async function copy() {
    try { await navigator.clipboard.writeText(address); setResult('copied') }
    catch { setResult('manual') }
  }
  return <div className={styles.container} data-location-status={location.status}>
    {showAddress && address && <p>{businessDisplayAddress(business, locale)}</p>}
    <small role="status">{result === 'copied' ? (en ? 'Address copied' : 'Адресът е копиран') : status}</small>
    {address && <button type="button" className={styles.copy} onClick={copy} disabled={preview}>
      {en ? 'Copy address' : 'Копирай адреса'}
    </button>}
    {result === 'manual' && <input readOnly value={address} aria-label={en ? 'Address to copy' : 'Адрес за копиране'}
      onFocus={event => event.currentTarget.select()}/>}
  </div>
}
