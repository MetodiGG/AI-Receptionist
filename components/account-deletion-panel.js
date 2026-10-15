'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createReauthenticationClient, supabase } from '../lib/supabase'
import { ACCOUNT_DELETION_COPY } from '../lib/account-deletion-copy.mjs'

async function loadCurrentAccount() {
  const { data } = await supabase.auth.getSession()
  if (!data.session) throw { code: 'UNAUTHORIZED' }
  const response = await fetch('/api/owner/account', { headers: { Authorization: `Bearer ${data.session.access_token}` }, cache: 'no-store' })
  const body = await response.json()
  if (!response.ok) throw body.error
  return body.account
}

async function deleteCurrentAccount({ businessId, account, password, confirmation, acknowledged }) {
  const reauth = createReauthenticationClient()
  try {
    const { data, error } = await reauth.auth.signInWithPassword({ email: account.email, password })
    if (error || !data.session) throw { code: 'REAUTH_FAILED' }
    const response = await fetch('/api/owner/account', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
      body: JSON.stringify({ businessId, confirmation, acknowledged }),
    })
    const body = await response.json()
    if (!response.ok || body.deleted !== true) throw body.error || { code: 'ACCOUNT_DELETE_FAILED' }
  } finally { await reauth.auth.signOut({ scope: 'local' }).catch(() => {}) }
}

async function finishDeletion(locale) {
  try { await supabase.auth.signOut({ scope: 'local' }) } finally { window.location.replace(`/?lang=${locale}&account=deleted`) }
}

export function AccountDeletionPanel({ businessId, locale = 'bg', onExport, loadAccount = loadCurrentAccount, deleteAccount = deleteCurrentAccount, onDeleted = finishDeletion }) {
  const copy = ACCOUNT_DELETION_COPY[locale === 'en' ? 'en' : 'bg']
  const titleId = useId()
  const explanationId = useId()
  const dialog = useRef(null)
  const opener = useRef(null)
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [errorCode, setErrorCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    if (!account) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current?.querySelector('h3')?.focus()
    return () => { document.body.style.overflow = previousOverflow; opener.current?.focus() }
  }, [account])

  useEffect(() => {
    if (account && errorCode && !deleting) dialog.current?.querySelector('input[type="password"]')?.focus()
  }, [account, errorCode, deleting])

  async function open() {
    if (loading) return
    setLoading(true); setErrorCode(''); setPassword(''); setConfirmation(''); setAcknowledged(false)
    try { setAccount(await loadAccount()) } catch (error) { setErrorCode(error?.code || 'ACCOUNT_READ_FAILED') } finally { setLoading(false) }
  }

  function close() {
    if (deleting || deleted) return
    setAccount(null); setPassword(''); setConfirmation(''); setAcknowledged(false); setErrorCode('')
  }

  function handleDialogKey(event) {
    if (event.key === 'Escape') { event.preventDefault(); close() }
    if (event.key !== 'Tab') return
    const elements = [...dialog.current.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')]
    if (!elements.length) { event.preventDefault(); return }
    const first = elements[0], last = elements[elements.length - 1]
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current.querySelector('h3'))) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  async function submit(event) {
    event.preventDefault()
    if (deleting || deleted || !account || !password || confirmation !== 'DELETE' || !acknowledged) return
    setDeleting(true); setErrorCode('')
    try {
      await deleteAccount({ businessId, account, password, confirmation, acknowledged })
    } catch (error) {
      setPassword(''); setErrorCode(error?.code || 'ACCOUNT_DELETE_FAILED'); setDeleting(false)
      return
    }
    setPassword(''); setDeleted(true); setDeleting(false)
    await onDeleted(locale)
  }

  return <>
    <section className="settings-panel account-danger-zone">
      <div className="settings-panel-head"><h3>{copy.title}</h3><p>{copy.lead}</p></div>
      <p>{copy.consequences}</p><p className="security-note">{copy.bookings}</p>
      <div className="settings-actions"><button className="secondary-button" type="button" onClick={onExport}>{copy.export}</button><button className="account-delete-button" ref={opener} type="button" disabled={loading} onClick={open}>{loading ? copy.loading : copy.open}</button></div>
      {!account && errorCode && <p className="form-message" role="alert">{copy.errors[errorCode] || copy.errors.ACCOUNT_READ_FAILED}</p>}
    </section>
    {account && <div className="modal-backdrop account-delete-backdrop" onKeyDown={handleDialogKey}>
      <form className="admin-modal account-delete-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={explanationId} ref={dialog} onSubmit={submit} aria-busy={deleting}>
        <div className="settings-panel-head"><h3 id={titleId} tabIndex={-1}>{copy.dialog}</h3><p>{copy.account}: <strong>{account.email}</strong></p></div>
        <div id={explanationId}><p>{copy.consequences}</p><p className="account-delete-warning">{copy.irreversible}</p></div>
        <div className="account-delete-summary"><strong>{copy.businesses}</strong><ul>{account.businesses.map((business) => <li key={business.id}>{business.name} <small>/book/{business.slug}</small></li>)}</ul><p>{copy.upcoming}: <strong>{account.upcomingBookings}</strong></p></div>
        <p className="security-note">{copy.bookings}</p>
        <fieldset className="account-delete-fields" disabled={deleting || deleted}>
          <label><span>{copy.password}</span><input required type="password" autoComplete="current-password" maxLength={1024} value={password} onChange={(event) => setPassword(event.target.value)} /><small>{copy.passwordHint}</small></label>
          <label><span>{copy.phrase}</span><input required autoComplete="off" spellCheck={false} autoCapitalize="characters" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
          <label className="account-delete-ack"><input required type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span>{copy.acknowledgement}</span></label>
        </fieldset>
        {errorCode && <p className="form-message" role="alert">{copy.errors[errorCode] || copy.errors.ACCOUNT_DELETE_FAILED}</p>}
        {deleted && <p role="status">{copy.success}</p>}
        <div className="settings-actions"><button className="secondary-button" type="button" disabled={deleting || deleted} onClick={close}>{copy.cancel}</button><button className="account-delete-button" type="submit" disabled={deleting || deleted || !password || confirmation !== 'DELETE' || !acknowledged}>{deleting ? copy.deleting : copy.submit}</button></div>
      </form>
    </div>}
  </>
}
