'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { mediaErrorText, mediaUrl } from '../lib/business-media.mjs'
import { PhotoPicker } from './photo-picker'

async function request(path, options = {}) {
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw new Error('FORBIDDEN')
  const response = await fetch(path, { ...options, cache: 'no-store', headers: { Authorization: `Bearer ${data.session.access_token}`, ...options.headers } })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error?.code || 'MEDIA_UNAVAILABLE')
  return body
}
function PrivatePhoto({ id, alt }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let active = true, url
    const abort = new AbortController()
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return
      const response = await fetch(mediaUrl(id), { cache: 'no-store', signal: abort.signal, headers: { Authorization: `Bearer ${data.session.access_token}` } })
      if (!response.ok) return
      url = URL.createObjectURL(await response.blob())
      if (active) setSrc(url); else URL.revokeObjectURL(url)
    })().catch(() => {})
    return () => { active = false; abort.abort(); if (url) URL.revokeObjectURL(url) }
  }, [id])
  return src ? <img src={src} alt={alt}/> : <span className="media-image-placeholder">—</span>
}
export function BusinessMediaEditor({ businessId, locale, onSaved, preview = null, onBusy = () => {} }) {
  const en = locale === 'en', [data, setData] = useState(preview), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false)
  const [files, setFiles] = useState([]), [target, setTarget] = useState(''), [consent, setConsent] = useState(false), [alt, setAlt] = useState('')
  const [preparing,setPreparing]=useState(false)
  const lock = useRef(false), version = useRef(0)
  const load = useCallback(async () => {
    if (preview) return
    const current = ++version.current
    try { const value = await request(`/api/businesses/${businessId}/media`); if (version.current === current) { setData(value); setError('') } }
    catch (problem) { if (version.current === current) setError(mediaErrorText(problem.message, locale)) }
  }, [businessId, locale, preview])
  useEffect(() => { load(); return () => { version.current++ } }, [load])
  async function action(fn) {
    if (lock.current || !data) return
    lock.current = true; setBusy(true); onBusy(true); setError(''); setNotice('')
    try { await fn(); if (!preview) await load(); await onSaved?.(); setNotice(en ? 'Photos saved.' : 'Снимките са запазени.') }
    catch (problem) { await load(); setError(mediaErrorText(problem.message, locale)) }
    finally { lock.current = false; setBusy(false); onBusy(false) }
  }
  async function upload() {
    if (!consent || !files.length || preparing) return
    await action(async () => {
      if (preview) { setFiles([]); return }
      for (const file of files) {
        // Each completed file advances the shared revision; other concurrent
        // writes are still rejected by the transaction rather than overwritten.
        const latest = await request(`/api/businesses/${businessId}/media`)
        const form = new FormData()
        form.append('file', file); form.append('revision', String(latest.business.content_revision)); form.append('consent', 'true'); form.append('alt', alt)
        if (target) form.append('staffId', target)
        await request(`/api/businesses/${businessId}/media`, { method: 'POST', body: form })
        setFiles(current => current.filter(item => item !== file))
      }
    })
  }
  function mutate(row, kind) {
    action(async () => {
      if (preview) { setData(current => ({ ...current, media: current.media.map(item => item.id === row.id ? { ...item, active: kind === 'hide' ? false : true, sort_order: kind === 'cover' ? -1 : item.sort_order } : item) })); return }
      await request(`/api/businesses/${businessId}/media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: kind, mediaId: row.id, revision: data.business.content_revision }) })
    })
  }
  return <section className="settings-panel business-media-editor"><header className="settings-panel-head"><h3>{en ? 'Business & team photos' : 'Снимки на бизнеса и екипа'}</h3><p>{en ? 'Optional · up to 12 business photos and one current portrait per specialist.' : 'По желание · до 12 снимки на бизнеса и една текуща снимка на специалист.'}</p><button type="button" className="secondary-button" disabled={busy||preparing} onClick={load}>{en?'Refresh photos':'Обнови снимките'}</button></header>
    {error && <p className="form-message" role="alert">{error}</p>}{notice && <p className="form-message success" role="status">{notice}</p>}
    {!data ? <button type="button" className="secondary-button" onClick={load}>{en ? 'Load photos' : 'Зареди снимките'}</button> : <>
      <fieldset disabled={busy||preparing} className="media-upload-controls"><label>{en ? 'Photo destination' : 'За кого е снимката'}<select value={target} onChange={event => { setTarget(event.target.value); setFiles([]) }}><option value="">{en ? 'Business gallery' : 'Галерия на бизнеса'}</option>{data.staff.filter(person => person.active).map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
        <PhotoPicker files={files} onChange={setFiles} locale={locale} single={Boolean(target)} disabled={busy} onProcessing={setPreparing}/>
        <label>{en ? 'Photo description (optional)' : 'Описание на снимката (по желание)'}<input maxLength={180} value={alt} onChange={event => setAlt(event.target.value)}/></label>
        <label className="booking-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/><span>{en ? 'I have permission to publish these photos and the consent of the people shown.' : 'Имам право да публикувам снимките и съгласието на хората на тях.'}</span></label>
        <button type="button" className="primary-button" disabled={busy || preparing || !files.length || !consent} onClick={upload}>{busy ? (en ? 'Saving…' : 'Запазване…') : (en ? 'Upload selected photos' : 'Качи избраните снимки')}</button>
      </fieldset>
      {!data.media.length && <p>{en ? 'No photos yet. Add a business photo or an optional team portrait.' : 'Още няма снимки. Добави снимка на бизнеса или портрет на човек от екипа по желание.'}</p>}
      <div className="media-editor-grid">{[...data.media].sort((a, b) => a.sort_order - b.sort_order).map(row => <article className={row.active ? '' : 'media-hidden'} key={row.id}>
        {preview ? <span className="media-image-placeholder">{en ? 'Local example' : 'Локален пример'}</span> : <PrivatePhoto id={row.id} alt={row.alt_text || ''}/>}
        <strong>{row.staff_id ? data.staff.find(person => person.id === row.staff_id)?.name || (en ? 'Team' : 'Екип') : (en ? 'Business' : 'Бизнес')}{!row.active && ` · ${en ? 'Hidden' : 'Скрита'}`}</strong>
        <div>{row.active && !row.staff_id && <button type="button" className="secondary-button" disabled={busy} onClick={() => mutate(row, 'cover')}>{en ? 'Set as cover' : 'За корица'}</button>}<button type="button" className="secondary-button" disabled={busy} onClick={() => mutate(row, row.active ? 'hide' : 'restore')}>{row.active ? (en ? 'Hide' : 'Скрий') : (en ? 'Restore' : 'Възстанови')}</button></div>
      </article>)}</div>
    </>}
  </section>
}
