'use client'

import { editServicePriceDetails } from '../lib/service-pricing.mjs'

export function ServicePricingFields({ value, onChange, locale = 'bg', disabled = false }) {
  const en = locale === 'en', details = value.price_details || {}, kind = details.kind || 'fixed'
  const update = patch => onChange({ price_details: editServicePriceDetails(value, patch) })
  return <details className="service-pricing-options"><summary>{en ? 'Price type and units' : 'Вид цена и мерна единица'}</summary><div className="settings-form-grid">
    <label><span>{en ? 'Currency' : 'Валута'}</span><select value={value.currency || 'EUR'} disabled={disabled} onChange={event => onChange({ currency: event.target.value })}><option value="EUR">EUR · €</option><option value="BGN">BGN · лв.</option>{value.currency && !['EUR','BGN'].includes(value.currency) && <option value={value.currency}>{value.currency}</option>}</select></label>
    <label><span>{en ? 'Price type' : 'Вид цена'}</span><select value={kind} disabled={disabled} onChange={event => update({ kind: event.target.value })}><option value="fixed">{en ? 'Fixed' : 'Фиксирана'}</option><option value="from">{en ? 'From' : 'От'}</option><option value="range">{en ? 'Range' : 'Диапазон'}</option></select></label>
    {kind === 'range' && <label><span>{en ? 'Maximum price' : 'Максимална цена'}</span><input type="number" min={value.price || 0} max="999999.99" step="0.01" required disabled={disabled} value={details.maximum ?? ''} onChange={event => update({ maximum: event.target.value === '' ? '' : Number(event.target.value) })}/></label>}
    <label><span>{en ? 'Unit, if applicable' : 'Мерна единица, ако е приложима'}</span><input maxLength={100} disabled={disabled} value={details.unit || ''} onChange={event => update({ unit: event.target.value })}/></label>
  </div></details>
}
