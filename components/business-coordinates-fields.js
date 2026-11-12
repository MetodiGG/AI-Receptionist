'use client'

import { useState } from 'react'
import { hasBusinessCoordinates, parseBusinessCoordinates } from '../lib/business-coordinates.mjs'
import { registrationMapPreview } from '../lib/business-registration-location.mjs'

export function BusinessCoordinatesFields({ latitude, longitude, onChange, locale, required = false, confirmed = false, onConfirm, address = '', disabled = false }) {
  const en = locale === 'en', [pin, setPin] = useState(''), [error, setError] = useState('')
  const ready = hasBusinessCoordinates(latitude, longitude)
  const preview = registrationMapPreview({ latitude: Number(latitude), longitude: Number(longitude) })
  const search = address.trim() ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}` : null
  function applyPin() {
    if (disabled) return
    const point = parseBusinessCoordinates(pin)
    if (!point) { setError(en ? 'Paste latitude, longitude or a full Google Maps place link containing the pin coordinates. A short link or map viewport is not a pin.' : 'Постави ширина, дължина или пълен Google Maps линк с координатите на точката. Кратък линк или изглед на карта не е достатъчен.'); return }
    onChange(point); onConfirm?.(false); setPin(''); setError('')
  }
  const values = <div className="business-coordinate-values"><label><span>{en ? 'Latitude' : 'Географска ширина'}</span><input type="number" step="any" min={required ? '41' : '-90'} max={required ? '44.5' : '90'} value={latitude ?? ''} disabled={disabled} onChange={event => { onChange({ latitude: event.target.value, longitude }); onConfirm?.(false) }}/></label><label><span>{en ? 'Longitude' : 'Географска дължина'}</span><input type="number" step="any" min={required ? '22' : '-180'} max={required ? '29' : '180'} value={longitude ?? ''} disabled={disabled} onChange={event => { onChange({ latitude, longitude: event.target.value }); onConfirm?.(false) }}/></label></div>
  return <div className={`full business-coordinate-fields${required ? ' registration-coordinate-fields' : ''}`}>
    <h4>{required ? (en ? 'Exact business location *' : 'Точна локация на бизнеса *') : (en ? 'Business location on the map' : 'Точка на бизнеса на картата')}</h4>
    {required ? <>
      <p className={ready ? 'business-coordinate-ready' : 'business-coordinate-missing'} role="status">{pin.trim() ? (en ? 'Use the pasted pin before confirming.' : 'Приложи поставената точка, преди да потвърдиш.') : confirmed ? (en ? 'Location confirmed for this address.' : 'Локацията е потвърдена за този адрес.') : (en ? 'Check the actual venue pin, not your current location.' : 'Посочи точката на самия бизнес, не текущото си местоположение.')}</p>
      <div className="registration-coordinate-links">{search && <a href={search} target="_blank" rel="noopener noreferrer">{en ? 'Find the address on the map' : 'Намери адреса на картата'}</a>}{ready && preview && <a href={preview} target="_blank" rel="noopener noreferrer">{en ? 'Check the selected pin' : 'Провери избраната точка'}</a>}</div>
    </> :
    <p className={ready ? 'business-coordinate-ready' : 'business-coordinate-missing'} role="status">{ready ? (en ? 'Location set for Near me. Save to apply changes.' : 'Има точка за „Около мен“. Запази, за да приложиш промените.') : (en ? 'Missing map pin: this business cannot appear in Near me until its location is saved.' : 'Липсва точка на картата: бизнесът не може да излиза в „Около мен“, докато не бъде записана.')}</p>
    }
    <div className="business-coordinate-paste"><label><span>{en ? 'Coordinates or full map pin link' : 'Координати или пълен линк към точката'}</span><input value={pin} maxLength={3000} disabled={disabled} placeholder={required ? (en ? 'Paste the full place link or latitude, longitude' : 'Пълен линк към обекта или ширина, дължина') : '42.123456, 23.123456'} onChange={event => { setPin(event.target.value); onConfirm?.(false); setError('') }}/></label><button className="secondary-button" type="button" disabled={!pin.trim() || disabled} onClick={applyPin}>{en ? 'Use pin' : 'Приложи точката'}</button></div>
    {required ? <details className="registration-coordinate-manual"><summary>{en ? 'Enter coordinates / help' : 'Въведи координати / помощ'}</summary><p>{en ? 'Open the business in Google Maps. Copy its full place URL, or right-click its entrance and copy latitude, longitude. A shortened share link or the map-view centre is not an exact venue pin.' : 'Отвори бизнеса в Google Maps. Копирай пълния линк към обекта или натисни с десен бутон върху входа и копирай ширина, дължина. Кратък линк за споделяне или центърът на изгледа не е точка на обекта.'}</p>{values}</details> : values}
    {required && <label className="registration-coordinate-confirm"><input type="checkbox" required aria-required="true" checked={confirmed && ready && !pin.trim()} disabled={disabled || !ready || Boolean(pin.trim())} onChange={event => onConfirm?.(event.target.checked)}/><span>{en ? 'I checked: this pin is the business at the address above.' : 'Проверих: точката е на бизнеса на посочения по-горе адрес.'}</span></label>}
    {error && <p className="form-message" role="alert">{error}</p>}
  </div>
}
