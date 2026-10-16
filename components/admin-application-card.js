'use client'

import { useEffect, useId, useState } from 'react'
import { Icon } from './icon'
import { PARTNER_STATUS_KEYS, PARTNER_STATUS_LABELS, PARTNER_DECISION_STATUS, partnerReviewGroup } from '../lib/partner-leads.mjs'
import { getIndustryLabel } from '../lib/public-locale.mjs'

const CATEGORY_ICONS = { beauty: 'scissors', auto: 'wrench', health: 'stethoscope', fitness: 'dumbbell', education: 'graduation', consulting: 'briefcase', home_services: 'house', pets: 'paw' }
export const adminIndustryIcon = category => CATEGORY_ICONS[category] || 'store'

function websiteLink(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null } catch { return null }
}

export function AdminApplicationCard({ row, locale, saving, onSave }) {
  const en = locale === 'en', titleId = useId(), detailsId = useId(), decisionId = useId()
  const [expanded, setExpanded] = useState(false), [decision, setDecision] = useState('')
  const [status, setStatus] = useState(row.status), [notes, setNotes] = useState(row.notes || '')
  useEffect(() => { setStatus(row.status); setNotes(row.notes || ''); setDecision('') }, [row.status, row.notes, row.updated_at])
  const pending = partnerReviewGroup(row.status) === 'pending'
  const dirty = status !== row.status || notes !== (row.notes || '')
  const website = websiteLink(row.website_url)
  async function decide() {
    if (await onSave(row, { status: PARTNER_DECISION_STATUS[decision] })) setDecision('')
  }
  return <article className="admin-application-card" aria-labelledby={titleId} aria-busy={saving}>
    <div className="admin-application-heading">
      <span className="admin-store-icon"><Icon name={adminIndustryIcon(row.category)}/></span>
      <div><h3 id={titleId}>{row.business_name}</h3><p>{getIndustryLabel(row.category, locale)} · {row.city}</p></div>
      <span className={`admin-state application-${partnerReviewGroup(row.status)}`}>{PARTNER_STATUS_LABELS[row.status]?.[locale]}</span>
    </div>
    <div className="admin-application-contact">
      <span><Icon name="user"/>{row.contact_name}</span>
      <a href={`tel:${row.phone}`}><Icon name="phone"/>{row.phone}</a>
      <a href={`mailto:${row.email}`}><Icon name="mail"/>{row.email}</a>
    </div>
    <div className="admin-application-actions">
      {pending && <><button className="primary-button" disabled={saving || dirty} type="button" onClick={() => setDecision('approve')} aria-expanded={decision === 'approve'} aria-controls={decisionId}><Icon name="check"/>{en ? 'Approve' : 'Одобри'}</button><button className="secondary-button admin-reject-button" disabled={saving || dirty} type="button" onClick={() => setDecision('reject')} aria-expanded={decision === 'reject'} aria-controls={decisionId}><span aria-hidden="true">×</span>{en ? 'Reject' : 'Откажи'}</button></>}
      <button type="button" className="admin-details-toggle" disabled={saving} aria-expanded={expanded} aria-controls={detailsId} onClick={() => { setExpanded(!expanded); setDecision('') }}>{expanded ? (en ? 'Hide details' : 'Скрий детайлите') : (en ? 'Details' : 'Детайли')}<span aria-hidden="true">{expanded ? '−' : '+'}</span></button>
    </div>
    {dirty && <p className="admin-application-hint">{en ? 'Save or discard your edits before making a decision.' : 'Запази или отмени редакциите преди решение.'}</p>}
    {decision && <div className="admin-lead-confirm" id={decisionId} role="group" aria-label={en ? 'Confirm application decision' : 'Потвърди решение по заявката'}>
      <strong>{decision === 'approve' ? (en ? 'Approve this application?' : 'Одобряваш ли заявката?') : (en ? 'Reject this application?' : 'Отказваш ли заявката?')}</strong>
      <p>{decision === 'approve' ? (en ? 'Moves it to setup. It does not create or publish a business, or send an email.' : 'Премества я за настройване. Не създава и не публикува бизнес, не изпраща имейл.') : (en ? 'Keeps the application as rejected. You can change it later in Details. No email is sent.' : 'Запазва заявката като отказана. Можеш да я промениш от „Детайли“. Не се изпраща имейл.')}</p>
      <div><button className={decision === 'reject' ? 'secondary-button admin-reject-button' : 'primary-button'} disabled={saving} type="button" onClick={decide}>{saving ? (en ? 'Saving…' : 'Запазване…') : (en ? 'Confirm' : 'Потвърди')}</button><button className="secondary-button" disabled={saving} type="button" onClick={() => setDecision('')}>{en ? 'Cancel' : 'Отмени'}</button></div>
    </div>}
    {expanded && <div id={detailsId} className="admin-application-details">
      <div className="admin-application-meta"><span>{en ? 'Received' : 'Получена'} <time dateTime={row.created_at}>{new Intl.DateTimeFormat(en ? 'en-GB' : 'bg-BG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(row.created_at))}</time></span>{website && <a href={website} target="_blank" rel="noreferrer">{en ? 'Business website' : 'Сайт на бизнеса'} <Icon name="external"/></a>}</div>
      <form onSubmit={async event => { event.preventDefault(); await onSave(row, { status, notes }) }}>
        <fieldset disabled={saving} className="partner-lead-controls">
          <label><span>{en ? 'Application status' : 'Статус на заявката'}</span><select value={status} onChange={event => { setStatus(event.target.value); setDecision('') }}>{PARTNER_STATUS_KEYS.map(key => <option value={key} key={key}>{PARTNER_STATUS_LABELS[key][locale]}</option>)}</select></label>
          <label className="notes"><span>{en ? 'Internal notes' : 'Вътрешни бележки'}</span><textarea value={notes} maxLength={3000} onChange={event => { setNotes(event.target.value); setDecision('') }}/></label>
          <div className="admin-lead-edit-actions"><button className="primary-button" disabled={!dirty} type="submit">{saving ? (en ? 'Saving…' : 'Запазване…') : (en ? 'Save' : 'Запази')}</button>{dirty && <button className="secondary-button" type="button" onClick={() => { setStatus(row.status); setNotes(row.notes || '') }}>{en ? 'Discard' : 'Отмени'}</button>}</div>
        </fieldset>
      </form>
    </div>}
  </article>
}
