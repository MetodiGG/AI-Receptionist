'use client'
import { useEffect, useState } from 'react'

const statuses = {
  verified_sofia: ['Адресът е потвърден', 'Address is verified'],
  outside_sofia: ['Извън София', 'Outside Sofia'],
  conflict: ['Несъответствие в адреса или координатите', 'Address or coordinate conflict'],
  missing: ['Няма достатъчно данни за упътване', 'Missing directions destination'],
  unverified: ['Адресът изисква проверка', 'Address needs verification'],
}

export function AdminLocationReview({ send, onSelect, locale, preview = false, refreshKey }) {
  const en = locale === 'en'
  const [expanded, setExpanded] = useState(false), [cursor, setCursor] = useState(null)
  const [data, setData] = useState(null), [error, setError] = useState(false), [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!expanded || preview) return
    const controller = new AbortController()
    send('/api/admin/location-review' + (cursor ? '?after=' + encodeURIComponent(cursor) : ''), { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) { setData(result); setError(false) } })
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [cursor, expanded, preview, refreshKey, retry, send])
  function page(after) { setData(null); setError(false); setCursor(after) }
  return <details className="admin-console-section" onToggle={event => setExpanded(event.currentTarget.open)}>
    <summary>{en ? 'Locations to review' : 'Локации за проверка'}</summary>
    <p>{en ? 'This queue is independent of partner approval and booking. It lists native business profiles, in pages of 40.' : 'Справката не променя партньорския статус или резервациите. Показва GoRez профилите на страници по 40.'}</p>
    {preview ? <p>{en ? 'This queue is available in the signed-in admin panel.' : 'Справката е достъпна след вход в админ панела.'}</p> : error
      ? <p role="alert">{en ? 'The location queue could not be loaded.' : 'Справката за локации не се зареди.'} <button type="button" className="secondary-button" onClick={() => { setError(false); setRetry(value => value + 1) }}>{en ? 'Retry' : 'Опитай отново'}</button></p>
      : !data ? <p role="status">{en ? 'Loading locations…' : 'Зареждане на локациите…'}</p>
      : <>
        <p role="status">{en ? 'Profiles checked on this page' : 'Проверени профили на тази страница'}: {data.examined} · {en ? 'Needs review' : 'За проверка'}: {data.unresolved.length}</p>
        <ul className="admin-audit-list">{data.unresolved.map(row => <li key={row.id}>
          <strong>{row.name}</strong><p>{[row.address, row.city].filter(Boolean).join(' · ') || '—'}</p>
          <p>{statuses[row.status]?.[en ? 1 : 0]}{row.stalePlace ? (en ? ' · Saved map link needs review' : ' · Запазеният линк към карта изисква проверка') : ''}</p>
          <button type="button" className="secondary-button" onClick={() => onSelect(row)}>{en ? 'Open business profile' : 'Отвори бизнес профила'}</button>
        </li>)}</ul>
        {cursor && <button type="button" className="secondary-button" onClick={() => page(null)}>{en ? 'First page' : 'Първа страница'}</button>}
        {data.next && <button type="button" className="secondary-button" onClick={() => page(data.next)}>{en ? 'Next profiles' : 'Следващи профили'}</button>}
      </>}
  </details>
}
