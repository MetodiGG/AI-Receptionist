'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { externalLinkDraftSchema } from '../lib/external-booking-links.mjs'
import { useUnsavedChanges } from '../hooks/use-unsaved-changes'

const blank = { place_id: '', label: '', booking_url: '', official_url: '', evidence: '' }
const empty = { links: [], reports: [], clicks: {} }

export function AdminExternalBookingLinks({ send, locale = 'bg', preview = false, previewData, refreshKey = 0, onDirty, onBusy, onManagePartners }) {
  const en = locale === 'en'
  const [data, setData] = useState(preview ? previewData || empty : empty)
  const [draft, setDraft] = useState(blank), [edit, setEdit] = useState(null)
  const [query, setQuery] = useState(''), [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  const [composerOpen, setComposerOpen] = useState(false), [loading, setLoading] = useState(!preview)
  const lock = useRef(false), composerTitle = useRef(null), addButton = useRef(null), opener = useRef(null), loadSequence = useRef(0)
  const composerId = useId()
  const dirty = Object.keys(blank).some(key => draft[key] !== (edit?.[key] ?? blank[key]))
  useUnsavedChanges(dirty, locale)
  useEffect(() => { onDirty?.(dirty); return () => onDirty?.(false) }, [dirty, onDirty])
  useEffect(() => { onBusy?.(busy) }, [busy, onBusy])
  useEffect(() => () => { onBusy?.(false); loadSequence.current++ }, [onBusy])
  useEffect(() => {
    if (composerOpen) composerTitle.current?.focus()
    else if (opener.current) (opener.current.isConnected ? opener.current : addButton.current)?.focus()
  }, [composerOpen, edit])
  const discard = () => !dirty || window.confirm(en ? 'Discard this unsaved draft?' : 'Да отхвърлим ли незапазената чернова?')
  const load = useCallback(async () => {
    if (preview) return
    const sequence = ++loadSequence.current
    setLoading(true)
    try {
      const next = await send(`/api/admin/external-booking-links?q=${encodeURIComponent(query)}`)
      if (sequence === loadSequence.current) setData(next)
    } catch {
      if (sequence === loadSequence.current) setMessage(en ? 'Unable to load links.' : 'Не успяхме да заредим линковете.')
    } finally { if (sequence === loadSequence.current) setLoading(false) }
  }, [query, send, preview, en])
  useEffect(() => { load(); return () => { loadSequence.current++ } }, [load, refreshKey])

  function closeComposer() {
    if (lock.current || !discard()) return
    setComposerOpen(false); setDraft(blank); setEdit(null)
  }
  function openComposer(event, row = null) {
    if (lock.current || !discard()) return
    opener.current = event.currentTarget
    setEdit(row); setDraft(row ? Object.fromEntries(Object.keys(blank).map(key => [key, row[key] ?? ''])) : blank)
    setMessage(''); setComposerOpen(true)
  }
  async function action(input) {
    if (lock.current || (input.action !== 'save' && !discard())) return
    lock.current = true; setBusy(true); setMessage('')
    try {
      if (!preview) await send('/api/admin/external-booking-links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
      setDraft(blank); setEdit(null); setComposerOpen(false)
      setMessage(input.action === 'save'
        ? (en ? 'Draft saved. Approval is a separate step.' : 'Черновата е запазена. Одобрението е отделна стъпка.')
        : (en ? 'Change saved.' : 'Промяната е запазена.'))
      await load()
    } catch (error) {
      const codes = {
        LINK_CHANGED: en ? 'This record changed. Refresh before saving.' : 'Записът е променен. Обнови преди запис.',
        PARTNER_PLACE_LINK: en ? 'This is a GoRez partner. Use Businesses instead.' : 'Това е GoRez партньор. Използвай „Бизнеси“.',
        PLACE_ID_EXISTS: en ? 'This Place ID already has a record. Search and edit it.' : 'Този Place ID вече има запис. Намери и редактирай него.',
      }
      setMessage(codes[error.code] || (en ? 'Save failed. Check the HTTPS destinations and verification notes.' : 'Записът не успя. Провери HTTPS адресите и бележката за проверката.'))
    } finally { setBusy(false); lock.current = false }
  }
  function save(event) {
    event.preventDefault()
    const parsed = externalLinkDraftSchema.safeParse(draft)
    if (!parsed.success) { setMessage(en ? 'Enter a valid Place ID, HTTPS URLs and verification notes.' : 'Въведи валиден Place ID, HTTPS адреси и бележка за проверката.'); return }
    action({ action: 'save', id: edit?.id || null, revision: edit?.revision ?? null, data: parsed.data })
  }
  function review(row, kind) {
    if (lock.current) return
    const question = en
      ? `Confirm ${kind} for ${row.label} (${row.place_id})? For approval, personally check this exact Google Place association AND the real appointment flow on the official site.`
      : `Потвърждаваш ли „${kind === 'approve' ? 'Одобри' : kind === 'disable' ? 'Изключи' : 'Приключи сигналите'}“ за ${row.label} (${row.place_id})? При одобрение лично провери точния Google обект И реалното записване в официалния сайт.`
    if (!window.confirm(question)) return
    action({ action: kind, id: row.id, revision: row.revision, data: { confirmation: row.place_id, ...(kind === 'approve' ? { verifiedBusinessAndBookingFlow: true } : {}) } })
  }

  return <section className="admin-console-section external-links-admin">
    <header><div><h2>{en ? 'External booking links' : 'Външни линкове'}</h2><p>{en ? 'Only for businesses that have not joined GoRez.' : 'Само за бизнеси, които не са регистрирани в GoRez.'}</p></div>
      {!composerOpen && <button ref={addButton} className="primary-button" type="button" disabled={busy} aria-expanded={composerOpen} aria-controls={composerId} onClick={event => openComposer(event)}>{en ? '+ Add link' : '+ Добави линк'}</button>}
    </header>
    <div className="external-partner-route"><p>{en ? 'Already registered? Their information is in Businesses.' : 'Регистрираните партньори и данните им са в „Бизнеси“.'}</p>{onManagePartners && <button type="button" className="secondary-button" disabled={busy} onClick={onManagePartners}>{en ? 'Manage partners' : 'Към бизнесите'} →</button>}</div>
    <details className="external-links-help"><summary>{en ? 'When do I use this section?' : 'Кога се използва този раздел?'}</summary><p>{en ? 'Use it to manually verify a non-partner’s direct booking link. Partners enter their own information during registration and can edit it without registering again. A saved draft does not approve a link. Check the exact Google Place and real appointment flow; a homepage or HTTP 200 is not verification. Approval expires after 90 days without rechecking.' : 'Тук ръчно проверяваш директен линк за резервации на непартньор. Партньорите въвеждат данните си при регистрация и после могат да ги редактират, без нова регистрация. Запазването на чернова не одобрява линка. Провери точния Google обект и реалното записване на час — начална страница или HTTP 200 не са проверка. Одобрението изтича след 90 дни без повторна проверка.'}</p></details>
    {composerOpen && <form id={composerId} className="settings-panel external-link-composer" onSubmit={save} aria-labelledby={`${composerId}-title`}>
      <div className="external-composer-heading"><h3 id={`${composerId}-title`} ref={composerTitle} tabIndex={-1}>{edit ? (en ? 'Edit external link' : 'Редакция на външен линк') : (en ? 'New external link' : 'Нов външен линк')}</h3><button type="button" className="secondary-button" disabled={busy} onClick={closeComposer}>{en ? 'Cancel' : 'Отказ'}</button></div>
      <fieldset disabled={busy} className="content-fields settings-form-grid">
        {[
          ['label', en ? 'Business name' : 'Име на бизнеса'],
          ['place_id', 'Google Place ID'],
          ['booking_url', en ? 'Direct booking link' : 'Директен линк за резервации'],
          ['official_url', en ? 'Official source' : 'Официален източник'],
        ].map(([key, label]) => <label key={key}>{label}<input required autoComplete="off" maxLength={key === 'label' ? 150 : key === 'place_id' ? 256 : 2000} type={key.endsWith('url') ? 'url' : 'text'} disabled={key === 'place_id' && Boolean(edit)} value={draft[key]} onChange={event => setDraft({ ...draft, [key]: event.target.value })} /></label>)}
        <label className="full">{en ? 'How did you verify the business and its booking flow?' : 'Как провери бизнеса и записването на час?'}<textarea required minLength={10} maxLength={1500} value={draft.evidence} onChange={event => setDraft({ ...draft, evidence: event.target.value })} /></label>
      </fieldset>
      <div className="settings-actions"><button className="primary-button" disabled={busy}>{busy ? (en ? 'Saving…' : 'Запазване…') : (en ? 'Save draft' : 'Запази чернова')}</button></div>
    </form>}
    {message && <p className="form-message" role="status">{message}</p>}
    <label className="external-link-search">{en ? 'Find a saved link by Place ID' : 'Намери записан линк по Place ID'}<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label>
    {loading && <p role="status">{en ? 'Loading links…' : 'Зареждане на линковете…'}</p>}
    <div className="admin-business-cards">{data.links.map(row => <article className="admin-business-card" key={row.id}>
      <div className="external-link-card-heading"><h3>{row.label}</h3><strong>{row.verification_status === 'approved' ? (en ? 'Approved' : 'Одобрен') : row.verification_status === 'disabled' ? (en ? 'Disabled' : 'Изключен') : (en ? 'Draft' : 'Чернова')}</strong></div>
      <p>{en ? 'Last checked' : 'Последна проверка'}: {row.last_checked_at ? new Date(row.last_checked_at).toLocaleDateString(en ? 'en-GB' : 'bg-BG') : '—'}</p>
      <p>{data.clicks[row.id] || 0} {en ? 'outgoing clicks / 30 days — not bookings' : 'пренасочвания / 30 дни — не са резервации'}{data.clicksTruncated ? ' · ≥' : ''}</p>
      <details className="external-link-record-details"><summary>{en ? 'Link and verification details' : 'Линк и подробности за проверката'}</summary><p>Google Place ID: {row.place_id}</p><p><a href={row.booking_url} target="_blank" rel="noopener noreferrer">{en ? 'Open booking page' : 'Отвори страницата за часове'} ↗</a></p><p><a href={row.official_url} target="_blank" rel="noopener noreferrer">{en ? 'Official source' : 'Официален източник'} ↗</a></p><p>{row.evidence}</p><p>{en ? 'Reviewer' : 'Проверил'}: {row.verified_by || '—'}</p></details>
      <div className="admin-card-actions"><button className="secondary-button" disabled={busy} onClick={event => openComposer(event, row)}>{en ? 'Edit' : 'Редактирай'}</button><button className="primary-button" disabled={busy} onClick={() => review(row, 'approve')}>{en ? 'Verify & approve' : 'Провери и одобри'}</button><button className="secondary-button" disabled={busy || row.verification_status === 'disabled'} onClick={() => review(row, 'disable')}>{en ? 'Disable' : 'Изключи'}</button></div>
      {data.reports.filter(report => report.link_id === row.id).map(report => <p key={report.id}>{en ? 'Report' : 'Сигнал'}: {report.reason}</p>)}
      {data.reports.some(report => report.link_id === row.id) && <button className="secondary-button" disabled={busy} onClick={() => review(row, 'resolve')}>{en ? 'Resolve reports' : 'Приключи сигналите'}</button>}
    </article>)}</div>
    {!loading && !data.links.length && <p className="external-links-empty">{query ? (en ? 'No saved link matches this Place ID.' : 'Няма записан линк с този Place ID.') : (en ? 'No external links added yet. Registering a partner does not require this form.' : 'Още няма добавени външни линкове. За регистрация на партньор този формуляр не е нужен.')}</p>}
  </section>
}
