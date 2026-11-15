'use client'

import { cloneElement, useEffect, useId, useRef, useState } from 'react'
import { Icon } from './icon'
import { BrandLoading } from './brand-loading'
import { createSuggestionInteractionCache, DISCOVERY_SUGGESTION_COPY, DISCOVERY_SUGGESTION_DEBOUNCE_MS, validSuggestionResponse } from '../lib/discovery/suggestions-ui.mjs'

export function DiscoveryAutocomplete({ id, value, onChange, onSelect, onAll, locale = 'bg', cityCode = '68134', neighborhood = '', category = '', placeholder = '', dismissKey = 0, preview = false, fetcher = fetch, children }) {
  const uid = useId(), root = useRef(null), request = useRef(null), version = useRef(0)
  const cache = useRef(null), selectedValue = useRef(null), previousDismiss = useRef(dismissKey)
  if (!cache.current) cache.current = createSuggestionInteractionCache()
  const copy = DISCOVERY_SUGGESTION_COPY[locale === 'en' ? 'en' : 'bg'], listId = `${uid}-suggestions`, statusId = `${uid}-suggestion-status`
  const [focused, setFocused] = useState(false), [open, setOpen] = useState(false), [response, setResponse] = useState(null)
  const [status, setStatus] = useState('idle'), [active, setActive] = useState(-1), [retry, setRetry] = useState(0)
  const choices = response?.groups?.flatMap(group => group.items) || []
  const alternatives = choices.length ? [] : response?.alternatives || []
  const options = [...choices, ...alternatives, { id: 'all', kind: 'all', label: copy.all }]

  function close() { version.current++; request.current?.abort(); setOpen(false); setActive(-1); setStatus('idle') }
  useEffect(() => {
    const outside = event => { if (root.current && !root.current.contains(event.target)) { setFocused(false); close() } }
    document.addEventListener('pointerdown', outside)
    return () => { version.current++; request.current?.abort(); cache.current.clear(); document.removeEventListener('pointerdown', outside) }
  }, [])
  useEffect(() => {
    if (previousDismiss.current !== dismissKey) { previousDismiss.current = dismissKey; close() }
  }, [dismissKey])
  useEffect(() => { if (open && active >= 0) document.getElementById?.(`${uid}-option-${active}`)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }) }, [active, open])
  useEffect(() => {
    const generation = ++version.current, query = value.trim()
    request.current?.abort(); setResponse(null); setActive(-1); setOpen(false); setStatus('idle')
    if (!focused || preview || query.length < 2 || query.length > 120 || selectedValue.current === value) return
    const payload = { query, locale, cityCode: cityCode || '68134', neighborhood, ...(category ? { category } : {}) }
    const key = JSON.stringify(payload), saved = retry === 0 && cache.current.get(key)
    if (saved) { setResponse(saved); setStatus('ready'); setOpen(true); return }
    const controller = new AbortController(); request.current = controller
    let alive = true, deadline
    const timer = setTimeout(async () => {
      setStatus('loading'); setOpen(true)
      let timedOut = false
      try {
        const body = await Promise.race([
          (async () => {
            const result = await fetcher('/api/public/discovery/suggestions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), cache: 'no-store', signal: controller.signal })
            if (!result.ok) throw Error('SUGGESTIONS_UNAVAILABLE')
            const data = await result.json()
            if (!validSuggestionResponse(data)) throw Error('SUGGESTIONS_UNAVAILABLE')
            return data
          })(),
          new Promise((_, reject) => { deadline = setTimeout(() => { timedOut = true; controller.abort(); reject(Error('SUGGESTIONS_TIMEOUT')) }, 5000) }),
        ])
        if (!alive || controller.signal.aborted || generation !== version.current) return
        cache.current.set(key, body); setResponse(body); setActive(-1); setStatus('ready'); setOpen(true)
      } catch (error) {
        if (alive && generation === version.current && (!controller.signal.aborted || timedOut)) { setResponse(null); setStatus('error'); setOpen(true) }
      } finally { clearTimeout(deadline) }
    }, DISCOVERY_SUGGESTION_DEBOUNCE_MS)
    return () => { alive = false; clearTimeout(timer); clearTimeout(deadline); controller.abort() }
  }, [value, cityCode, neighborhood, category, locale, focused, retry, preview, fetcher])

  function change(next) { selectedValue.current = null; version.current++; request.current?.abort(); setResponse(null); setStatus('idle'); setOpen(false); setActive(-1); setRetry(0); onChange(next) }
  function choose(item) {
    selectedValue.current = item.kind === 'service' ? item.query : item.kind === 'category' ? item.label : value
    close()
    if (item.kind === 'all') onAll(); else onSelect(item)
  }
  function keyboard(event) {
    if (event.isComposing || event.nativeEvent?.isComposing) return
    if (event.key === 'Escape') { if (open) event.preventDefault(); close(); return }
    if (event.key === 'Tab') { close(); return }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (value.trim().length < 2) return
      event.preventDefault(); setOpen(true)
      setActive(current => current < 0 ? event.key === 'ArrowDown' ? 0 : options.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length)
    } else if (event.key === 'Enter' && value.trim().length >= 2) {
      event.preventDefault(); choose(open && active >= 0 ? options[active] : options.at(-1))
    }
  }
  let index = 0
  const option = item => {
    const at = index++
    return <li role="presentation" key={`${item.kind}-${item.id}`}><button id={`${uid}-option-${at}`} className={`discovery-suggestion-option${active === at ? ' is-active' : ''}`} type="button" role="option" tabIndex={-1} aria-selected={active === at} onPointerDown={event => event.preventDefault()} onPointerMove={() => setActive(at)} onClick={() => choose(item)}><span><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}{item.partner === true && <small className="discovery-suggestion-partner">{copy.partner}</small>}</span><Icon name={item.kind === 'business' ? 'arrow' : 'search'}/></button></li>
  }
  const inputProps = { id, value, maxLength: 300, placeholder, autoComplete: 'off', enterKeyHint: 'search', onChange: event => change(event.target.value), onFocus: () => { setFocused(true); if (response && value.trim().length >= 2) setOpen(true) }, onBlur: () => { setFocused(false); close() }, onKeyDown: keyboard,
    required: true, minLength: 2, role: 'combobox', 'aria-autocomplete': 'list', 'aria-haspopup': 'listbox', 'aria-expanded': open, 'aria-controls': listId,
    'aria-activedescendant': open && active >= 0 ? `${uid}-option-${active}` : undefined, 'aria-describedby': open ? statusId : undefined }
  return <div className="discovery-autocomplete" ref={root}>
    {children ? cloneElement(children, inputProps) : <input {...inputProps}/>}
    {open && value.trim().length >= 2 && <div className="discovery-suggestion-panel">
      <div id={statusId} className="discovery-suggestion-status" role="status" aria-live="polite">{status === 'loading' ? <><BrandLoading size={20} decorative/>{copy.loading}</> : status === 'error' ? <>{copy.unavailable} <button type="button" onPointerDown={event => event.preventDefault()} onClick={() => { cache.current.clear(); setRetry(number => number + 1) }}>{copy.retry}</button></> : !choices.length ? copy.empty : response?.partial ? copy.partial : ''}</div>
      <ul id={listId} className="discovery-suggestion-list" role="listbox" aria-label={locale === 'en' ? 'Search suggestions' : 'Предложения за търсене'}>
        {(response?.groups || []).map(group => <li key={group.kind} role="presentation"><ul role="group" aria-labelledby={`${uid}-${group.kind}`}><li id={`${uid}-${group.kind}`} role="presentation" className="discovery-suggestion-group">{group.label}</li>{group.items.map(option)}</ul></li>)}
        {alternatives.length > 0 && <li role="presentation"><ul role="group" aria-labelledby={`${uid}-related`}><li id={`${uid}-related`} role="presentation" className="discovery-suggestion-group">{copy.related}</li>{alternatives.map(option)}</ul></li>}
        {option(options.at(-1))}
      </ul>
    </div>}
  </div>
}
