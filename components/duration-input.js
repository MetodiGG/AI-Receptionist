'use client'

import { useId } from 'react'
import { DURATION_OPTIONS } from '../lib/business-schedule.mjs'

export function DurationInput({ id, value, onChange, className = '', locale = 'bg', required = false }) {
  const listId = useId()
  return <>
    <input id={id} className={className} type="number" inputMode="numeric" min="5" max="1440" step="1" required={required} list={listId} value={value} onChange={event => onChange(event.target.value)}/>
    <datalist id={listId}>{DURATION_OPTIONS.map(minutes => <option key={minutes} value={minutes}>{minutes} {locale === 'en' ? 'min' : 'мин'}</option>)}</datalist>
  </>
}
