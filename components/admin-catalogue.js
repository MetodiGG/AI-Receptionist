'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { PhotoPicker } from './photo-picker'
import { BusinessCategoryIcon } from './business-category-icon'
import { useUnsavedChanges } from '../hooks/use-unsaved-changes'
import { mediaErrorText } from '../lib/business-media.mjs'

function errorText(problem, en) {
  const code = problem.code || problem.message
  const messages = {
    CATALOGUE_MEDIA_NOT_READY: ['Качването още не е активирано. Нужна е настройката за снимки в базата.', 'Photo uploads are not activated yet. Database setup is required.'],
    CATALOGUE_PHOTO_CHANGED: ['Снимката е променена от друг прозорец. Обнови преди да запазиш.', 'Another window changed this photo. Refresh before saving.'],
    CATALOGUE_REVIEW_REQUIRED: ['Обектът се нуждае от преглед или вече е партньор. Данните на партньорите са в „Бизнеси“.', 'This listing needs review or is now a partner. Manage partners in Businesses.'],
    CATALOGUE_MEDIA_LIMIT: ['Хранилището за каталога е запълнено. Свържи се с поддръжката преди ново качване.', 'Catalogue storage is full. Contact support before uploading more.'],
    CATALOGUE_NOT_FOUND: ['Обектът вече не е в каталога. Обнови списъка.', 'This listing is no longer in the catalogue. Refresh the list.'],
  }
  return messages[code]?.[en ? 1 : 0] || mediaErrorText(code, en ? 'en' : 'bg')
}

export function AdminCatalogue({ send, locale = 'bg', refreshKey = 0, onDirty, onBusy }) {
  const en = locale === 'en', titleId = useId(), dialog = useRef(null), opener = useRef(null), sequence = useRef(0), lock = useRef(false)
  const [data, setData] = useState(null), [query, setQuery] = useState(''), [settledQuery, setSettledQuery] = useState(''), [category, setCategory] = useState('')
  const [entry, setEntry] = useState(null), [files, setFiles] = useState([]), [consent, setConsent] = useState(false), [reference, setReference] = useState(''), [alt, setAlt] = useState('')
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false), [preparing, setPreparing] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const dirty = Boolean(entry && (files.length || consent || reference || alt !== (entry.photo?.alt || '')))
  useUnsavedChanges(dirty, locale)
  useEffect(() => { onDirty?.(dirty); return () => onDirty?.(false) }, [dirty, onDirty])
  useEffect(() => { onBusy?.(busy || preparing); return () => onBusy?.(false) }, [busy, preparing, onBusy])
  useEffect(() => { const timer = setTimeout(() => setSettledQuery(query), 300); return () => clearTimeout(timer) }, [query])
  const load = useCallback(async () => {
    const current = ++sequence.current
    setLoading(true); setError('')
    try {
      const next = await send(`/api/admin/catalogue?q=${encodeURIComponent(settledQuery)}&category=${encodeURIComponent(category)}`)
      if (current === sequence.current) setData(next)
    } catch (problem) { if (current === sequence.current) { setError(errorText(problem, en)); setData(null) } }
    finally { if (current === sequence.current) setLoading(false) }
  }, [settledQuery, category, send, en])
  useEffect(() => { load(); return () => { sequence.current++ } }, [load, refreshKey])
  useEffect(() => {
    if (!entry) return
    const node = dialog.current, original = document.body.style.overflow
    document.body.style.overflow = 'hidden'; node.showModal()
    return () => { node.close(); document.body.style.overflow = original; opener.current?.focus() }
  }, [Boolean(entry)])
  useEffect(() => () => { sequence.current++ }, [])

  async function open(event, row) {
    if (lock.current) return
    opener.current = event.currentTarget; lock.current = true; setBusy(true); setError(''); setNotice('')
    try {
      const next = await send(`/api/admin/catalogue/${row.id}/photo`)
      setEntry(next); setFiles([]); setConsent(false); setReference(''); setAlt(next.photo?.alt || '')
    } catch (problem) { setError(errorText(problem, en)) }
    finally { setBusy(false); lock.current = false }
  }
  function close() {
    if (busy || preparing || (dirty && !window.confirm(en ? 'Discard the unsaved photo changes?' : 'Да отхвърлим ли незапазените промени по снимката?'))) return
    setEntry(null); setFiles([]); setError('')
  }
  async function change(kind) {
    if (!entry || lock.current || preparing) return
    if (kind === 'upload' && (!files.length || !consent || reference.trim().length < 5)) return
    if (kind === 'remove' && !window.confirm(en ? `Remove the cover photo for ${entry.name}? The category illustration will be used instead.` : `Да премахнем ли снимката на „${entry.name}“? Вместо нея ще се показва иконката за категорията.`)) return
    lock.current = true; setBusy(true); setError(''); setNotice('')
    try {
      let options
      if (kind === 'upload') {
        const body = new FormData()
        body.append('file', files[0]); body.append('revision', String(entry.revision)); body.append('consent', 'true'); body.append('rightsReference', reference.trim()); body.append('alt', alt.trim() || entry.name)
        options = { method: 'POST', body }
      } else options = { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove', revision: entry.revision }) }
      const next = await send(`/api/admin/catalogue/${entry.id}/photo`, options)
      setEntry(next); setFiles([]); setConsent(false); setReference(''); setAlt(next.photo?.alt || '')
      setData(value => value && ({ ...value, entries: value.entries.map(row => row.id === next.id ? next : row) }))
      setNotice(en ? 'Saved. The next search or refresh will show the change.' : 'Запазено. Промяната ще се вижда при следващо търсене или обновяване.')
    } catch (problem) { setError(errorText(problem, en)) }
    finally { lock.current = false; setBusy(false) }
  }
  async function more() {
    if (!data || data.nextOffset == null || loading || lock.current) return
    const current = sequence.current
    setLoading(true)
    try {
      const next = await send(`/api/admin/catalogue?q=${encodeURIComponent(settledQuery)}&category=${encodeURIComponent(category)}&offset=${data.nextOffset}`)
      if (current === sequence.current) setData(value => ({ ...next, entries: [...value.entries, ...next.entries.filter(row => !value.entries.some(item => item.id === row.id))] }))
    } catch (problem) { if (current === sequence.current) setError(errorText(problem, en)) }
    finally { if (current === sequence.current) setLoading(false) }
  }
  const categoryName = id => data?.categories.find(item => item.id === id)?.[en ? 'en' : 'bg'] || id
  return <section className="admin-console-section catalogue-admin">
    <header><div><h2>{en ? 'Catalogue photos' : 'Каталог · снимки'}</h2><p>{en ? 'Manage cover photos for businesses outside the partner network.' : 'Основни снимки на бизнесите извън партньорската мрежа.'}</p></div>{data && <span>{data.total} {en ? 'businesses' : 'бизнеса'}</span>}</header>
    <div className="admin-business-filters"><label>{en ? 'Find a business' : 'Намери бизнес'}<input type="search" value={query} onChange={event => setQuery(event.target.value)} maxLength={100} placeholder={en ? 'Name, neighbourhood or service' : 'Име, квартал или услуга'} disabled={busy}/></label><label>{en ? 'Category' : 'Категория'}<select value={category} disabled={busy} onChange={event => setCategory(event.target.value)}><option value="">{en ? 'All categories' : 'Всички категории'}</option>{data?.categories.map(item => <option key={item.id} value={item.id}>{item[en ? 'en' : 'bg']} · {item.count}</option>)}</select></label></div>
    {error && !entry && <p className="form-message" role="alert">{error} <button type="button" className="secondary-button" onClick={load}>{en ? 'Retry' : 'Опитай отново'}</button></p>}
    {loading && <p role="status">{en ? 'Loading catalogue…' : 'Зареждаме каталога…'}</p>}
    <div className="catalogue-admin-list">{data?.entries.map(row => <article key={row.id} className="catalogue-admin-card">
      <div className="catalogue-admin-thumb">{row.photo ? <img src={row.photo.src} alt={row.photo.alt || row.name} loading="lazy"/> : <BusinessCategoryIcon category={row.category} size={70}/>}</div>
      <div><h3>{row.name}</h3><p>{categoryName(row.category)}</p><p>{row.address || row.neighborhood || (en ? 'Service at your address' : 'Услуга на адрес')}</p>{!row.editable && <p>{en ? 'Review required' : 'Нужен е преглед'}</p>}</div>
      <button className="secondary-button" type="button" disabled={busy} onClick={event => open(event, row)}>{row.photo ? (en ? 'Manage photo' : 'Управлявай снимката') : (en ? 'Add photo' : 'Добави снимка')}</button>
    </article>)}</div>
    {!loading && data?.total === 0 && <p>{en ? 'No businesses match this search.' : 'Няма бизнеси по това търсене.'}</p>}
    {data?.nextOffset != null && <button type="button" className="secondary-button" disabled={loading || busy} onClick={more}>{en ? 'Load next listings' : 'Зареди следващите обекти'}</button>}
    {entry && <dialog className="catalogue-photo-dialog" ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close() }}>
      <header><div><h2 id={titleId}>{entry.name}</h2><p>{entry.address || entry.neighborhood}</p></div><button type="button" className="secondary-button" onClick={close} disabled={busy || preparing} aria-label={en ? 'Close' : 'Затвори'}>×</button></header>
      {error && <p className="form-message" role="alert">{error}</p>}{notice && <p className="form-message success" role="status">{notice}</p>}
      <div className="catalogue-current-photo">{entry.photo ? <img src={entry.photo.src} alt={entry.photo.alt || entry.name}/> : <BusinessCategoryIcon category={entry.category} size={112}/>}</div>
      {entry.photo && <button type="button" className="secondary-button" disabled={busy || preparing} onClick={() => change('remove')}>{en ? 'Remove cover photo' : 'Премахни основната снимка'}</button>}
      {!entry.editable ? <p>{en ? 'Review the listing before adding a photo. Manage partner profiles in Businesses.' : 'Нужен е преглед на обекта преди качване. Партньорските профили се редактират от „Бизнеси“.'}</p> : <form onSubmit={event => { event.preventDefault(); change('upload') }}>
        <fieldset disabled={busy}><PhotoPicker files={files} onChange={setFiles} single locale={locale} disabled={busy} onProcessing={setPreparing} label={entry.photo ? (en ? 'Choose a replacement photo' : 'Избери нова снимка') : (en ? 'Choose a cover photo' : 'Избери основна снимка')}/>
          <label>{en ? 'Photo description (optional)' : 'Описание на снимката (по желание)'}<input maxLength={160} value={alt} onChange={event => setAlt(event.target.value)}/></label>
          <label>{en ? 'Permission reference' : 'Получено разрешение'}<input required minLength={5} maxLength={160} value={reference} onChange={event => setReference(event.target.value)} placeholder={en ? 'E.g. Business email · 06.11.2026' : 'Напр. Имейл от бизнеса · 06.11.2026'}/></label>
          <label className="booking-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/><span>{en ? 'I have permission to publish this photo in GoRez, including consent from any people shown.' : 'Имам разрешение за публикуване на снимката в GoRez, включително от хората на нея.'}</span></label>
          <button type="submit" className="primary-button" disabled={busy || preparing || !files.length || !consent || reference.trim().length < 5}>{busy ? (en ? 'Saving…' : 'Запазване…') : (en ? 'Save cover photo' : 'Запази основната снимка')}</button>
        </fieldset>
      </form>}
    </dialog>}
  </section>
}
