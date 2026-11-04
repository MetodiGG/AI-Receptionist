'use client'

import { useState } from 'react'
import { hasBusinessCoordinates, parseBusinessCoordinates } from '../lib/business-coordinates.mjs'

export function BusinessCoordinatesFields({ latitude, longitude, onChange, locale }) {
  const en = locale === 'en', [pin, setPin] = useState(''), [error, setError] = useState('')
  const ready = hasBusinessCoordinates(latitude, longitude)
  function applyPin() {
    const point = parseBusinessCoordinates(pin)
    if (!point) { setError(en ? 'Paste latitude, longitude or a full Google Maps place link containing the pin coordinates. A short link or map viewport is not a pin.' : 'Постави ширина, дължина или пълен Google Maps линк с координатите на точката. Кратък линк или изглед на карта не е достатъчен.'); return }
    onChange(point); setPin(''); setError('')
  }
  return <div className="full business-coordinate-fields">
    <h4>{en ? 'Business location on the map' : 'Точка на бизнеса на картата'}</h4>
    <p className={ready ? 'business-coordinate-ready' : 'business-coordinate-missing'} role="status">{ready ? (en ? 'Location set for Near me. Save to apply changes.' : 'Има точка за „Около мен“. Запази, за да приложиш промените.') : (en ? 'Missing map pin: this business cannot appear in Near me until its location is saved.' : 'Липсва точка на картата: бизнесът не може да излиза в „Около мен“, докато не бъде записана.')}</p>
    <div className="business-coordinate-paste"><label><span>{en ? 'Coordinates or full map pin link' : 'Координати или пълен линк към точката'}</span><input value={pin} maxLength={3000} placeholder="42.123456, 23.123456" onChange={event => setPin(event.target.value)}/></label><button className="secondary-button" type="button" disabled={!pin.trim()} onClick={applyPin}>{en ? 'Use pin' : 'Приложи точката'}</button></div>
    <div className="business-coordinate-values"><label><span>{en ? 'Latitude' : 'Географска ширина'}</span><input type="number" step="any" min="-90" max="90" value={latitude ?? ''} onChange={event => onChange({ latitude: event.target.value, longitude })}/></label><label><span>{en ? 'Longitude' : 'Географска дължина'}</span><input type="number" step="any" min="-180" max="180" value={longitude ?? ''} onChange={event => onChange({ latitude, longitude: event.target.value })}/></label></div>
    {error && <p className="form-message" role="alert">{error}</p>}
  </div>
}
