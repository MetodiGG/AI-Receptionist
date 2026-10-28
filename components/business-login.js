'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandLogo } from './brand-logo'
import { HomeLink } from './home-link'
import { LanguageSwitch } from './language-switch'
import { Icon } from './icon'
import { SiteFooter } from './site-footer'
import { usePublicLocale } from '../hooks/use-public-locale'
import { supabase, hasSupabaseConfig } from '../lib/supabase'

export function BusinessLogin({ initialLocale = 'bg', identity = {} }) {
  const router = useRouter(), { locale, setLocale } = usePublicLocale(initialLocale, true), en = locale === 'en'
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[session,setSession]=useState(null)
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  const lock=useRef(false)
  useEffect(()=>{
    if(new URLSearchParams(window.location.search).get('mode')==='signup')router.replace(`/for-businesses?lang=${initialLocale}`)
    let active=true
    supabase.auth.getSession().then(({data})=>{if(active)setSession(data.session)}).catch(()=>{})
    const {data}=supabase.auth.onAuthStateChange((_event,next)=>{if(active)setSession(next)})
    return()=>{active=false;data.subscription.unsubscribe()}
  },[router,initialLocale])
  async function goToDashboard(activeSession) {
    const response=await fetch('/api/admin/access',{headers:{Authorization:`Bearer ${activeSession.access_token}`},cache:'no-store'}).catch(()=>null)
    router.push(response?.ok?`/admin?lang=${locale}`:`/dashboard?lang=${locale}`)
  }
  async function submit(event) {
    event.preventDefault()
    if(lock.current)return
    setError('')
    if(!hasSupabaseConfig){setError(en?'Sign-in is temporarily unavailable. Contact info@gorez.co.':'Входът временно не е достъпен. Пиши на info@gorez.co.');return}
    lock.current=true;setBusy(true)
    try{
      const result=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password})
      if(result.error){setError(en?'Check your email and password or use password recovery. New business applications must be approved before sign-in.':'Провери имейла и паролата или използвай „Забравена парола“. Нова заявка за бизнес трябва да бъде одобрена преди вход.');return}
      setPassword('')
      if(result.data.session)await goToDashboard(result.data.session)
    }catch{setError(en?'Connection failed. Try again.':'Връзката прекъсна. Опитай отново.')}
    finally{lock.current=false;setBusy(false)}
  }
  return <main className="launch-login-page">
    <header className="home-navigation-header"><Link href={`/?lang=${locale}`} aria-label="GoRez"><BrandLogo compact decorative eager/></Link><div className="home-header-actions"><LanguageSwitch locale={locale} onChange={setLocale} compact/></div><HomeLink locale={locale}/></header>
    <section className="launch-login-layout"><div className="launch-login-intro"><p className="marketing-kicker">{en?'GoRez for business':'GoRez за бизнеса'}</p><h1>{en?'Your business.':'Твоят бизнес.'}<br/><em>{en?'Better organised.':'По-подреден.'}</em></h1><p>{en?'Bookings, clients and schedules in your own dashboard.':'Резервации, клиенти и график в собственото ти табло.'}</p><Link href={`/for-businesses?lang=${locale}`}>{en?'New business? Start here':'Нов бизнес? Започни тук'}<Icon name="arrow"/></Link></div>
      <div className="access-card launch-login-card"><h2>{en?'Business sign-in':'Вход за бизнес'}</h2>
      {session?<div className="launch-existing-session"><p>{en?'You are already signed in.':'Вече си влязъл в профила си.'}</p><button type="button" className="primary-button" disabled={busy} onClick={async()=>{setBusy(true);try{await goToDashboard(session)}finally{setBusy(false)}}}>{en?'Open dashboard':'Към таблото'}</button><button className="link-button" type="button" onClick={()=>supabase.auth.signOut({scope:'local'})}>{en?'Use another account':'Вход с друг акаунт'}</button></div>:<form className="auth-form" onSubmit={submit}><label>{en?'Email address':'Имейл адрес'}<input className="text-input" required type="email" autoComplete="email" maxLength={180} value={email} disabled={busy} onChange={event=>setEmail(event.target.value)}/></label><label>{en?'Password':'Парола'}<input className="text-input" required type="password" autoComplete="current-password" value={password} disabled={busy} onChange={event=>setPassword(event.target.value)}/></label><Link className="auth-forgot" href={`/forgot-password?lang=${locale}`}>{en?'Forgot password?':'Забравена парола?'}</Link>{error&&<p className="form-message" role="alert">{error}</p>}<button type="submit" className="primary-button" disabled={busy}>{busy?(en?'Please wait…':'Момент…'):(en?'Sign in':'Вход')}<Icon name="arrow"/></button></form>}
      </div>
    </section><SiteFooter locale={locale} identity={identity}/>
  </main>
}
