'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { searchServiceSuggestions } from '../lib/service-suggestions.mjs'

/** Optional local name suggestions. Selecting a name never sets service prices,
 * duration, category or identifiers; the controlled owner draft remains valid. */
export function ServiceNameInput({ id, value = '', onChange, industry, locale = 'bg', disabled = false, required = false, maxLength = 120, className = 'text-input', ...inputProps }) {
  const generatedId = useId(), inputId = id || `${generatedId}-service-name`, listId = `${generatedId}-service-options`
  const input = useRef(null), options = useRef([]), composing = useRef(false)
  const [composition, setComposition] = useState(false)
  const [menu, setMenu] = useState({ context: '', open: false, active: -1 })
  const context = JSON.stringify([industry, locale, value])
  const current = menu.context === context ? menu : { open: false, active: -1 }
  const suggestions = !disabled && !composition && value.trim().length >= 2 ? searchServiceSuggestions(value, { industry, locale, limit: 8 }).filter(item => item.name.length <= maxLength && item.name.trim().toLocaleLowerCase(locale) !== value.trim().toLocaleLowerCase(locale)).slice(0, 8) : []
  const expanded = current.open && suggestions.length > 0
  const active = expanded ? suggestions[current.active] : null
  const hintId = `${generatedId}-service-hint`
  const en = locale === 'en'
  const description = [inputProps['aria-describedby'], expanded ? hintId : ''].filter(Boolean).join(' ') || undefined
  function close() { setMenu({ context, open: false, active: -1 }) }
  function choose(item) {
    if (disabled || composing.current || !item || !suggestions.some(suggestion => suggestion.id === item.id && suggestion.name === item.name)) return
    onChange(item.name)
    setMenu({ context: JSON.stringify([industry, locale, item.name]), open: false, active: -1 })
    input.current?.focus()
  }
  function change(event) {
    const name = event.target.value
    onChange(name)
    setMenu({ context: JSON.stringify([industry, locale, name]), open: !composing.current, active: -1 })
  }
  function keyDown(event) {
    if (composing.current || event.isComposing || event.nativeEvent?.isComposing || event.keyCode === 229) return
    if (event.key === 'Escape' && expanded) { event.preventDefault(); event.stopPropagation(); close() }
    else if (event.key === 'Tab') close()
    else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && suggestions.length) {
      event.preventDefault()
      const active = !expanded || current.active < 0 ? (event.key === 'ArrowDown' ? 0 : suggestions.length - 1) : (current.active + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length
      setMenu({ context, open: true, active })
    } else if (event.key === 'Enter' && active) { event.preventDefault(); choose(active) }
    inputProps.onKeyDown?.(event)
  }
  useEffect(() => {
    if (expanded && current.active >= 0) options.current[current.active]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [expanded, current.active, context])
  return <div className="service-name-input" data-open={expanded ? 'true' : 'false'} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close() }}>
    <input {...inputProps} ref={input} id={inputId} className={className} type="text" value={value} disabled={disabled} required={required} maxLength={maxLength} role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={expanded} aria-controls={expanded ? listId : undefined} aria-activedescendant={active ? `${generatedId}-service-option-${current.active}` : undefined} aria-describedby={description} autoComplete="off"
      onChange={change} onKeyDown={keyDown} onFocus={event => { setMenu({ context, open: true, active: -1 }); inputProps.onFocus?.(event) }}
      onBlur={event => inputProps.onBlur?.(event)}
      onCompositionStart={event => { composing.current = true; setComposition(true); close(); inputProps.onCompositionStart?.(event) }}
      onCompositionEnd={event => { composing.current = false; setComposition(false); setMenu({ context: JSON.stringify([industry, locale, event.currentTarget.value]), open: true, active: -1 }); inputProps.onCompositionEnd?.(event) }}/>
    {expanded && <div className="service-name-suggestions checked-select-panel">
      <span id={hintId} className="visually-hidden">{en ? 'Optional service names. Use arrow keys and Enter, or keep your own text.' : 'Предложения за име на услуга. Използвай стрелките и Enter или запази своя текст.'}</span>
      <ul id={listId} className="checked-select-options" role="listbox" aria-label={en ? 'Suggested service names' : 'Предложения за име на услуга'}>{suggestions.map((item, index) => <li key={item.id} role="presentation"><button ref={element => { options.current[index] = element }} id={`${generatedId}-service-option-${index}`} type="button" role="option" tabIndex={-1} aria-selected={current.active === index} className={`checked-option${current.active === index ? ' active' : ''}`} onPointerDown={event => { if (event.isPrimary !== false && (event.button === 0 || event.pointerType === 'touch')) event.preventDefault() }} onMouseDown={event => event.preventDefault()} onClick={() => choose(item)}><span>{item.name}</span></button></li>)}</ul>
    </div>}
  </div>
}
