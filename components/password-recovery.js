'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { BrandLogo } from './brand-logo'
import { LanguageSwitch } from './language-switch'
import { usePublicLocale } from '../hooks/use-public-locale'
import { PASSWORD_RECOVERY_COPY } from '../lib/password-recovery-copy.mjs'
import { newPasswordSchema, passwordUpdateError, recoveryRequestSchema } from '../lib/password-recovery.mjs'
import { getPasswordRecovery } from '../lib/password-recovery-client'

async function clearSavedLogin() {
  const { supabase } = await import('../lib/supabase')
  await supabase.auth.signOut({ scope: 'local' })
}

export function PasswordRecovery({ mode = 'request', initializeRecovery = getPasswordRecovery, clearLogin = clearSavedLogin }) {
  const { locale, setLocale } = usePublicLocale()
  const copy = PASSWORD_RECOVERY_COPY[locale]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [status, setStatus] = useState(mode === 'reset' ? 'checking' : 'idle')
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const auth = useRef(null)
  const submitting = useRef(false)

  useEffect(() => {
    if (mode !== 'reset') return
    let active = true
    const recovery = initializeRecovery()
    auth.current = recovery.auth
    recovery.ready.then((valid) => { if (active) setStatus(valid ? 'ready' : 'invalid') })
    return () => { active = false }
  }, [mode, initializeRecovery])

  useEffect(() => {
    if (!cooldown) return
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  async function requestLink(event) {
    event.preventDefault()
    if (submitting.current || cooldown) return
    setError('')
    const parsed = recoveryRequestSchema.safeParse({ email, locale })
    if (!parsed.success) { setError('email'); return }
    submitting.current = true
    setStatus('sending')
    try {
      const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) })
      if (!response.ok) {
        setError(response.status === 429 ? 'rate' : 'unavailable')
        setStatus('idle')
        setCooldown(response.status === 429 ? 60 : 0)
        return
      }
      setStatus('accepted')
      setCooldown(60)
    } catch { setStatus('idle'); setError('unavailable') }
    finally { submitting.current = false }
  }

  async function updatePassword(event) {
    event.preventDefault()
    if (submitting.current || status !== 'ready') return
    setError('')
    if (!newPasswordSchema.safeParse({ password, confirmation }).success) {
      setError(password.length < 8 || password.length > 128 ? 'password' : 'mismatch')
      return
    }
    submitting.current = true
    setStatus('saving')
    try {
      const { error: updateError } = await auth.current.updateUser({ password })
      if (updateError) {
        const code = passwordUpdateError(updateError)
        setError(code)
        setStatus(code === 'expired' ? 'invalid' : 'ready')
        return
      }
      setPassword('')
      setConfirmation('')
      // Recovery never persists a session or signs the browser into the owner
      // dashboard. Invalidate recovery refresh tokens after the password update.
      setStatus('success')
      await auth.current.signOut({ scope: 'global' }).catch(() => {})
      await clearLogin().catch(() => {})
    } catch { setError('unavailable'); setStatus('ready') }
    finally { submitting.current = false }
  }

  const reset = mode === 'reset'
  const success = status === 'success'
  const invalid = status === 'invalid'
  const title = success ? copy.successTitle : invalid ? copy.invalidTitle : reset ? copy.resetTitle : copy.forgotTitle
  const lead = success ? copy.successLead : invalid ? copy.invalidLead : reset ? copy.resetLead : copy.forgotLead

  return <main className="recovery-page">
    <nav className="recovery-nav" aria-label={locale === 'en' ? 'Account navigation' : 'Навигация за профила'}>
      <Link href={`/?lang=${locale}`} aria-label="GoRez"><BrandLogo compact eager /></Link>
      <LanguageSwitch locale={locale} onChange={setLocale} compact />
    </nav>
    <section className="access-card recovery-card" aria-labelledby="recovery-title">
      <p className="auth-kicker">{copy.portal}</p>
      <h1 id="recovery-title">{title}</h1><p className="auth-subtitle">{lead}</p>
      {!reset && <form className="auth-form" onSubmit={requestLink} noValidate>
        <div className="field"><label htmlFor="recovery-email">{copy.email}</label><input id="recovery-email" className="text-input" type="email" autoComplete="email" inputMode="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={status === 'sending'} aria-invalid={error === 'email'} aria-describedby={error ? 'recovery-error' : undefined} /></div>
        {status === 'accepted' && <p className="form-message success" role="status">{copy.accepted}</p>}
        {error && <p className="form-message" id="recovery-error" role="alert">{copy.errors[error]}</p>}
        <button className="primary-button" type="submit" disabled={status === 'sending' || cooldown > 0}>{status === 'sending' ? copy.sending : cooldown ? `${copy.wait} ${cooldown} ${copy.seconds}` : status === 'accepted' ? copy.resend : copy.send}</button>
        <p className="recovery-note">{copy.deliveryNote}</p>
      </form>}
      {reset && status === 'checking' && <p role="status">{copy.checking}</p>}
      {reset && ['ready', 'saving'].includes(status) && <form className="auth-form" onSubmit={updatePassword} noValidate>
        <div className="field"><label htmlFor="new-password">{copy.password}</label><input id="new-password" className="text-input" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} disabled={status === 'saving'} aria-describedby="password-hint" /><small id="password-hint" className="recovery-note">{copy.passwordHint}</small></div>
        <div className="field"><label htmlFor="confirm-password">{copy.confirmation}</label><input id="confirm-password" className="text-input" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={status === 'saving'} aria-invalid={error === 'mismatch'} aria-describedby={error ? 'recovery-error' : undefined} /></div>
        {error && <p className="form-message" id="recovery-error" role="alert">{copy.errors[error]}</p>}
        <button className="primary-button" type="submit" disabled={status === 'saving'}>{status === 'saving' ? copy.saving : copy.save}</button>
      </form>}
      {invalid && <Link className="primary-button recovery-action" href={`/forgot-password?lang=${locale}`}>{copy.resend}</Link>}
      {success && <Link className="primary-button recovery-action" href={`/?lang=${locale}#business`}>{copy.signIn}</Link>}
      <div className="recovery-links"><Link href={`/account?lang=${locale}`}>{locale === 'en' ? 'Client sign-in' : 'Вход за клиенти'}</Link><Link href={`/?lang=${locale}#business`}>{locale === 'en' ? 'Business sign-in' : 'Вход за бизнес'}</Link><Link href={`/?lang=${locale}`}>{copy.home}</Link></div>
    </section>
  </main>
}
