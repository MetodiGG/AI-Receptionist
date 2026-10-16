'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandLogo } from './brand-logo'
import { LanguageSwitch } from './language-switch'
import { Icon } from './icon'
import { SiteFooter } from './site-footer'
import { usePublicLocale } from '../hooks/use-public-locale'
import { supabase, hasSupabaseConfig } from '../lib/supabase'

export function BusinessLogin({ initialLocale = 'bg', identity = {} }) {
  const router = useRouter(), { locale, setLocale } = usePublicLocale(initialLocale, true), en = locale === 'en'
  const [mode, setMode] = useState('login'), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [session, setSession] = useState(null)
  const lock = useRef(false), signup = mode === 'signup'
  useEffect(() => {
    setMode(new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'signup' : 'login')
    let active = true
    supabase.auth.getSession().then(({data}) => { if (active) setSession(data.session) }).catch(() => {})
    const {data} = supabase.auth.onAuthStateChange((_event,next) => { if (active) setSession(next) })
    return () => { active = false; data.subscription.unsubscribe() }
  }, [])
  async function goToDashboard(activeSession) {
    const response = await fetch('/api/admin/access', { headers: {Authorization:`Bearer ${activeSession.access_token}`}, cache:'no-store' }).catch(() => null)
    router.push(response?.ok ? `/admin?lang=${locale}` : `/dashboard?lang=${locale}`)
  }
  async function submit(event) {
    event.preventDefault()
    if (lock.current) return
    setError(''); setMessage('')
    if (!hasSupabaseConfig) { setError(en ? 'Sign-in is temporarily unavailable. Contact info@gorez.co.' : 'Входът временно не е достъпен. Пиши на info@gorez.co.'); return }
    lock.current = true; setBusy(true)
    try {
      const result = signup ? await supabase.auth.signUp({email:email.trim().toLowerCase(),password,options:{emailRedirectTo:`${window.location.origin}/account?lang=${locale}`}}) : await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password})
      if (result.error) { setError(en ? 'Could not continue. Check your details, confirm your email or use password recovery.' : 'Не успяхме да продължим. Провери данните, потвърди имейла или използвай „Забравена парола“.'); return }
      setPassword('')
      if (result.data.session) await goToDashboard(result.data.session)
      else setMessage(en ? 'Check your inbox and Spam for the confirmation link. This creates a sign-in account, not a published business.' : 'Провери пощата и „Спам“ за линк за потвърждение. Това създава входен акаунт, не публикуван бизнес.')
    } catch { setError(en ? 'Connection failed. Try again.' : 'Връзката прекъсна. Опитай отново.') }
    finally { lock.current = false; setBusy(false) }
  }
  return <main className="launch-login-page"><header><Link href={`/?lang=${locale}`} aria-label="GoRez"><BrandLogo compact decorative eager/></Link><LanguageSwitch locale={locale} onChange={setLocale} compact/></header><section className="launch-login-layout"><div className="launch-login-intro"><p className="marketing-kicker">{en ? 'GoRez for business' : 'GoRez за бизнеса'}</p><h1>{en ? 'Your business.' : 'Твоят бизнес.'}<br/><em>{en ? 'Better organised.' : 'По-подреден.'}</em></h1><p>{en ? 'Bookings, clients and schedules in your own dashboard.' : 'Резервации, клиенти и график в собственото ти табло.'}</p><Link href={`/for-businesses?lang=${locale}#join`}>{en ? 'New to GoRez? Add your business' : 'За първи път тук? Добави бизнеса си'}<Icon name="arrow"/></Link></div><div className="access-card launch-login-card"><h2>{signup ? (en ? 'Create a business account' : 'Създай бизнес акаунт') : (en ? 'Business sign-in' : 'Вход за бизнес')}</h2>
      {session ? <div className="launch-existing-session"><p>{en ? 'You are already signed in.' : 'Вече си влязъл в профила си.'}</p><button type="button" className="primary-button" disabled={busy} onClick={async () => {setBusy(true);try {await goToDashboard(session)} finally {setBusy(false)} }}>{en ? 'Open dashboard' : 'Към таблото'}</button><button className="link-button" type="button" onClick={() => supabase.auth.signOut({scope:'local'})}>{en ? 'Use another account' : 'Вход с друг акаунт'}</button></div> : <><form className="auth-form" onSubmit={submit}><label>{en ? 'Email address' : 'Имейл адрес'}<input className="text-input" required type="email" autoComplete="email" maxLength={180} value={email} disabled={busy} onChange={event => setEmail(event.target.value)}/></label><label>{en ? 'Password' : 'Парола'}<input className="text-input" required type="password" minLength={signup ? 8 : 6} autoComplete={signup ? 'new-password' : 'current-password'} value={password} disabled={busy} onChange={event => setPassword(event.target.value)}/></label>{signup ? <label className="launch-signup-consent"><input type="checkbox" required checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)}/><span>{en ? 'I accept the' : 'Приемам'} <Link href={`/terms?lang=${locale}`}>{en ? 'terms' : 'условията'}</Link> {en ? 'and have read the' : 'и съм прочел'} <Link href={`/privacy?lang=${locale}`}>{en ? 'privacy information' : 'информацията за поверителност'}</Link>.</span></label> : <Link className="auth-forgot" href={`/forgot-password?lang=${locale}`}>{en ? 'Forgot password?' : 'Забравена парола?'}</Link>}{error && <p className="form-message" role="alert">{error}</p>}{message && <p className="form-message success" role="status">{message}</p>}<button type="submit" className="primary-button" disabled={busy}>{busy ? (en ? 'Please wait…' : 'Момент…') : signup ? (en ? 'Create account' : 'Създай акаунт') : (en ? 'Sign in' : 'Вход')}<Icon name="arrow"/></button></form><p className="auth-switch"><button className="link-button" type="button" disabled={busy} onClick={() => {setMode(signup ? 'login' : 'signup');setError('');setMessage('');setPassword('') }}>{signup ? (en ? 'Already have an account? Sign in' : 'Имаш акаунт? Влез') : (en ? 'Need a sign-in account? Register' : 'Нужен ти е входен акаунт? Регистрация')}</button></p><p className="launch-login-note">{en ? 'Client and business sign-in use the same account. Creating an account does not approve or publish a business.' : 'Клиентският и бизнес входът използват един акаунт. Регистрацията на акаунт не одобрява и не публикува бизнес.'}</p></>}
    </div></section><SiteFooter locale={locale} identity={identity}/></main>
}
