'use client'

import { DateTime } from 'luxon'
import { useId, useRef } from 'react'
import { Icon } from './icon'

export function DateMenu({ value, onChange, locale = 'bg', timezone = 'Europe/Sofia', minDate, required = false }) {
  const en = locale === 'en', id = useId(), ref = useRef(null)
  const today = DateTime.now().setZone(timezone).startOf('day')
  const selected = value ? DateTime.fromISO(value,{zone:timezone}) : today
  const current = selected.isValid ? selected : today
  const minimum = minDate ? DateTime.fromISO(minDate,{zone:timezone}).startOf('day') : null
  const years = [...new Set([...Array.from({length:12},(_,i)=>today.year-5+i),current.year])].filter(year=>!minimum || year>=minimum.year).sort((a,b)=>a-b)
  function change(field,next) {
    const year = field === 'year' ? Number(next) : current.year, month = field === 'month' ? Number(next) : current.month
    const first = DateTime.fromObject({year,month,day:1},{zone:timezone})
    const day = Math.min(field === 'day' ? Number(next) : current.day,first.daysInMonth)
    let result = first.set({day})
    if (minimum && result < minimum) result = minimum
    onChange(result.toISODate())
  }
  const close = () => { if(ref.current){ref.current.open=false;ref.current.querySelector('summary')?.focus()} }
  return <details className="date-menu" ref={ref} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();close()}}}>
    <summary><Icon name="calendar"/><span>{value ? current.setLocale(locale).toFormat('d LLLL yyyy') : (en ? 'Choose date' : 'Избери дата')}{required && !value ? ' *' : ''}</span><span aria-hidden="true">⌄</span></summary>
    <div className="date-menu-panel">
      <div><label htmlFor={`${id}-day`}>{en ? 'Day' : 'Ден'}</label><select id={`${id}-day`} value={current.day} onChange={event=>change('day',event.target.value)}>{Array.from({length:current.daysInMonth},(_,i)=>i+1).map(day=><option key={day} value={day} disabled={Boolean(minimum && current.set({day}).startOf('day')<minimum)}>{day}</option>)}</select></div>
      <div><label htmlFor={`${id}-month`}>{en ? 'Month' : 'Месец'}</label><select id={`${id}-month`} value={current.month} onChange={event=>change('month',event.target.value)}>{Array.from({length:12},(_,i)=>i+1).map(month=><option key={month} value={month} disabled={Boolean(minimum && current.year===minimum.year && month<minimum.month)}>{current.set({month,day:1}).setLocale(locale).toFormat('LLLL')}</option>)}</select></div>
      <div><label htmlFor={`${id}-year`}>{en ? 'Year' : 'Година'}</label><select id={`${id}-year`} value={current.year} onChange={event=>change('year',event.target.value)}>{years.map(year=><option key={year} value={year}>{year}</option>)}</select></div>
      <button type="button" onClick={()=>{if(!value)onChange(current.toISODate());close()}}>{en ? 'Done' : 'Готово'}</button>
    </div>
  </details>
}
