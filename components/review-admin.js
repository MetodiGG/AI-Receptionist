'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BrandLogo } from './brand-logo'
import { LanguageSwitch } from './language-switch'
import { HomeLink } from './home-link'
import { usePublicLocale } from '../hooks/use-public-locale'
import { supabase } from '../lib/supabase'
import { ReviewStars } from './business-reviews'

async function requestReviews(query = '', options = {}) {
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw new Error('UNAUTHORIZED')
  const response = await fetch(`/api/admin/reviews${query}`, { ...options, cache: 'no-store', headers: { Authorization: `Bearer ${data.session.access_token}`, ...options.headers } })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error?.code || 'REVIEWS_UNAVAILABLE')
  return body
}

export function ReviewAdmin({ preview = null }) {
  const { locale, setLocale } = usePublicLocale(), en = locale === 'en'
  const [data, setData] = useState(preview), [filter, setFilter] = useState('all'), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(null), [reason, setReason] = useState(''), [saving, setSaving] = useState(false)
  const version = useRef(0), requestBusy = useRef(false), savingRef = useRef(false)
  const load = useCallback(async (cursor = null) => {
    if (preview || requestBusy.current) return
    requestBusy.current = true; setBusy(true); setError('')
    const current = ++version.current
    try {
      const query = new URLSearchParams({ status: filter, ...(cursor || {}) })
      const result = await requestReviews(`?${query}`)
      if (current === version.current) setData(previous => ({ ...result, items: cursor ? [...(previous?.items || []), ...result.items] : result.items }))
    } catch (problem) { if (current === version.current) setError(problem.message) }
    finally { if (current === version.current) { requestBusy.current = false; setBusy(false) } }
  }, [filter, preview])
  useEffect(() => { load() }, [load])
  const latestLoad = useRef(load)
  latestLoad.current = load
  useEffect(() => {
    if (preview) return
    const { data: listener } = supabase.auth.onAuthStateChange(() => { version.current++; requestBusy.current = false; setBusy(false); setData(null); setError(''); latestLoad.current() })
    return () => { listener.subscription.unsubscribe(); version.current++ }
  }, [preview])
  async function moderate(event) {
    event.preventDefault()
    if (!editing || savingRef.current) return
    savingRef.current = true; setSaving(true); setError(''); setNotice('')
    const body = { id: editing.id, status: editing.status === 'published' ? 'hidden' : 'published', revision: editing.revision, reason: reason.trim() }
    try {
      if (!preview) await requestReviews('', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (preview) setData(current => ({ ...current, items: current.items.map(item => item.id === body.id ? { ...item, status: body.status, revision: item.revision + 1, moderation_reason: body.reason } : item) }))
      setEditing(null); setReason(''); setNotice(en ? 'Moderation action saved with an audit record.' : 'Действието е запазено в журнала за модериране.')
      if (!preview) await load()
    } catch (problem) { setError(problem.message) }
    finally { savingRef.current = false; setSaving(false) }
  }
  const errorText = error === 'FORBIDDEN' ? (en ? 'Administrator access is required.' : 'Нужен е администраторски достъп.') : error === 'REVIEW_CHANGED' ? (en ? 'This review changed. Close the form and refresh before trying again.' : 'Отзивът е променен. Затвори формата и обнови, преди да опиташ отново.') : (en ? 'Could not load or save reviews. Please try again.' : 'Не успяхме да заредим или запазим отзивите. Опитай отново.')
  return <main className="platform-admin admin-console review-admin"><header className="admin-console-header home-navigation-header"><div className="admin-heading-identity"><Link href={`/?lang=${locale}`} className="admin-brand" aria-label="GoRez"><BrandLogo /></Link><h1>{en ? 'Review moderation' : 'Модериране на отзиви'}</h1></div><div className="admin-header-actions home-header-actions"><LanguageSwitch locale={locale} onChange={setLocale} compact /><Link className="secondary-button" href={`/admin?lang=${locale}`}>{en ? 'Admin panel' : 'Админ панел'}</Link></div><HomeLink locale={locale}/></header>
    {preview && <p className="admin-preview-notice">LOCAL QA · fictional reviews · no real changes</p>}
    <section className="admin-console-section"><p className="business-section-note">{en ? 'Hide only spam, abusive content or exposed personal information. Unfavourable feedback alone is not a reason to hide a review. Original ratings and text cannot be edited. Each action requires a reason and is audited.' : 'Скривай само спам, обидно съдържание или публикувани лични данни. Ниската оценка сама по себе си не е основание. Оригиналните оценки и текстът не могат да се редактират. Всяко действие изисква причина и се записва в журнал.'}</p>
      {error === 'UNAUTHORIZED' ? <div className="admin-access-state"><h2>{en ? 'Administrator sign-in' : 'Вход за администратори'}</h2><Link className="primary-button" href={`/account?lang=${locale}&next=admin`}>{en ? 'Sign in' : 'Влез в профила'}</Link></div> : <>
        <div className="admin-business-filters"><label>{en ? 'Visibility' : 'Видимост'}<select value={filter} disabled={busy || Boolean(editing)} onChange={event => setFilter(event.target.value)}><option value="all">{en ? 'All reviews' : 'Всички отзиви'}</option><option value="published">{en ? 'Published' : 'Публикувани'}</option><option value="hidden">{en ? 'Hidden' : 'Скрити'}</option></select></label><button type="button" className="secondary-button" disabled={busy || saving} onClick={() => load()}>{en ? 'Refresh' : 'Обнови'}</button></div>
        {error && <p role="alert" className="form-message">{errorText}</p>}{notice && <p role="status" className="form-message success">{notice}</p>}
        {busy && !data && <p role="status">{en ? 'Loading…' : 'Зареждане…'}</p>}
        {data?.items?.length === 0 && <p className="empty-state">{en ? 'No reviews in this section yet.' : 'Все още няма отзиви в тази секция.'}</p>}
        <div className="review-admin-list">{data?.items?.map(item => <article key={item.id} className="review-admin-card"><header><div><h2>{item.business?.name || '—'}</h2><p>{item.display_name} · {new Intl.DateTimeFormat(en ? 'en-GB' : 'bg-BG', { dateStyle: 'medium' }).format(new Date(item.created_at))}</p></div><span className={`review-moderation-status ${item.status}`}>{item.status === 'published' ? (en ? 'Published' : 'Публикуван') : (en ? 'Hidden' : 'Скрит')}</span></header><ReviewStars value={item.rating} />{item.comment && <p className="review-admin-comment">{item.comment}</p>}{item.moderation_reason && <p className="helper-text">{en ? 'Last reason' : 'Последна причина'}: {item.moderation_reason}</p>}
          {editing?.id === item.id ? <form className="review-moderation-form" onSubmit={moderate}><label>{en ? 'Reason (required, internal)' : 'Причина (задължителна, вътрешна)'}<textarea required minLength={3} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} rows={3} /></label><div><button className="secondary-button" type="button" disabled={saving} onClick={() => { setEditing(null); setReason('') }}>{en ? 'Cancel' : 'Отказ'}</button><button className="primary-button" type="submit" disabled={saving}>{saving ? (en ? 'Saving…' : 'Запазване…') : item.status === 'published' ? (en ? 'Confirm hiding' : 'Потвърди скриването') : (en ? 'Restore review' : 'Възстанови отзива')}</button></div></form> : <button className="secondary-button" type="button" disabled={Boolean(editing) || saving} onClick={() => { setEditing(item); setReason(''); setError('') }}>{item.status === 'published' ? (en ? 'Hide with reason' : 'Скрий с причина') : (en ? 'Restore with reason' : 'Възстанови с причина')}</button>}
        </article>)}</div>
        {data?.next && <button type="button" className="secondary-button" onClick={() => load(data.next)} disabled={busy}>{en ? 'More reviews' : 'Още отзиви'}</button>}
      </>}
    </section>
  </main>
}
