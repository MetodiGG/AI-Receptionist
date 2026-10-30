'use client'

import Link from 'next/link'
import { useEffect,useRef,useState } from 'react'
import { useRouter } from 'next/navigation'
import { DateTime } from 'luxon'
import { BrandLogo } from './brand-logo'
import { HomeLink } from './home-link'
import { Icon } from './icon'
import { LanguageSwitch } from './language-switch'
import { usePublicLocale } from '../hooks/use-public-locale'
import { hasSupabaseConfig,supabase } from '../lib/supabase'
import { customerAccountRedirect,customerSignupSchema,requestCustomerSignInLink } from '../lib/customer-account.mjs'
import { bookingStatusLabel } from '../lib/booking-safety.mjs'
import { formatBulgarianMonthShort } from '../lib/booking-window.mjs'
import { AdminAccessLink } from './admin-access-link'

function CustomerBookingCard({ row,locale,view }) {
  const en=locale==='en'
  const date=DateTime.fromISO(row.starts_at).setZone(row.business.timezone||'Europe/Sofia').setLocale(locale)
  const end=DateTime.fromISO(row.ends_at).setZone(row.business.timezone||'Europe/Sofia')
  return <article className="customer-booking-card" aria-label={`${row.service.name}, ${date.toFormat('d LLLL yyyy')}`}>
    <div className="customer-date-block"><span>{en?date.toFormat('LLL'):formatBulgarianMonthShort(date.month)}</span><strong>{date.toFormat('dd')}</strong><small>{date.toFormat('ccc')} · {date.year}</small></div>
    <div className="customer-booking-main"><small>{row.business.name}</small><h2>{row.service.name}</h2><p><Icon name="clock" />{date.toFormat('HH:mm')}–{end.toFormat('HH:mm')}<span>·</span>{row.staff.name}</p>{row.business.address&&<p><Icon name="pin" />{row.business.address}</p>}</div>
    <div className="customer-booking-actions"><span className={`customer-booking-status ${row.status}`}>{bookingStatusLabel(row.status,locale)}</span><Link href={`/booking/${row.cancellation_token}?lang=${locale}`}>{en?'View booking':'Виж резервацията'}<Icon name="arrow" /></Link>{view==='past'&&row.business.active&&<Link href={`/book/${row.business.slug}?lang=${locale}`}>{en?'Book again':'Запази отново'}</Link>}</div>
  </article>
}

export function CustomerAccount({ preview = null }) {
  const router=useRouter()
  const { locale,setLocale }=usePublicLocale(), en=locale==='en'
  const [session,setSession]=useState(preview?.session || null), [checking,setChecking]=useState(!preview)
  const [mode,setMode]=useState('login'), [busy,setBusy]=useState(false), [message,setMessage]=useState(''), [error,setError]=useState(''), [cooldown,setCooldown]=useState(0)
  const [form,setForm]=useState({ name:'',email:'',password:'',confirmation:'',consent:false })
  const [view,setView]=useState('upcoming'), [page,setPage]=useState(0), [reload,setReload]=useState(0)
  const [history,setHistory]=useState({ status:'loading',bookings:[],hasMore:false })
  const submitting=useRef(false)
  const update=(key,value)=>setForm(current=>({...current,[key]:value}))

  useEffect(()=>{
    if(preview)return
    // Only a fixed local destination; never redirect to an arbitrary next URL.
    try{if(new URLSearchParams(window.location.search).get('next')==='admin')window.sessionStorage.setItem('gorez-return-to-admin','yes')}catch{}
  },[preview])
  useEffect(()=>{
    if(preview||!session)return
    let requested=false
    try{requested=window.sessionStorage.getItem('gorez-return-to-admin')==='yes'}catch{}
    if(!requested)return
    const controller=new AbortController()
    fetch('/api/admin/access',{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store',signal:controller.signal})
      .then(async response=>{
        const body=await response.json()
        if(controller.signal.aborted)return
        if(response.ok&&body.admin===true){try{window.sessionStorage.removeItem('gorez-return-to-admin')}catch{};router.replace(`/admin?lang=${locale}`)}
        else if(response.status===403){try{window.sessionStorage.removeItem('gorez-return-to-admin')}catch{};setError(en?'This account has no administrator access.':'Този профил няма администраторски достъп.')}
      }).catch(()=>{})
    return()=>controller.abort()
  },[session,preview,locale,en,router])

  useEffect(()=>{
    if (preview) return
    setMode(new URLSearchParams(window.location.search).get('mode')==='signup'?'signup':'login')
    if (!hasSupabaseConfig) { setChecking(false); return }
    let active=true
    supabase.auth.getSession().then(({data})=>{if(active){setSession(data.session);setChecking(false)}}).catch(()=>{if(active)setChecking(false)})
    const {data:listener}=supabase.auth.onAuthStateChange((_event,next)=>{if(active){setSession(next);setHistory({status:'loading',bookings:[],hasMore:false});setPage(0)}})
    return ()=>{active=false;listener.subscription.unsubscribe()}
  },[preview])

  useEffect(()=>{
    if (!cooldown) return
    const timer=window.setTimeout(()=>setCooldown(v=>v-1),1000)
    return ()=>window.clearTimeout(timer)
  },[cooldown])

  useEffect(()=>{
    if (!session) return
    if (preview) {setHistory({status:'ready',bookings:preview.bookings.filter(row=>view==='upcoming'?['booked','confirmed'].includes(row.status):!['booked','confirmed'].includes(row.status)),hasMore:false});return}
    const controller=new AbortController()
    setHistory({status:'loading',bookings:[],hasMore:false})
    fetch(`/api/customer/bookings?view=${view}&page=${page}`,{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store',signal:controller.signal})
      .then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error?.code || 'ACCOUNT_UNAVAILABLE');return data})
      .then(data=>{if(!controller.signal.aborted)setHistory({status:'ready',...data})})
      .catch(problem=>{if(!controller.signal.aborted)setHistory({status:problem.message==='EMAIL_NOT_VERIFIED'?'unverified':problem.message==='UNAUTHORIZED'?'expired':'error',bookings:[],hasMore:false})})
    return ()=>controller.abort()
  },[session,view,page,reload,preview])

  async function submit(event) {
    event.preventDefault()
    if (submitting.current) return
    setError('');setMessage('')
    if (!hasSupabaseConfig) {setError(en?'Sign-in is temporarily unavailable.':'Входът временно не е достъпен.');return}
    const signup=mode==='signup'
    if (signup && !customerSignupSchema.safeParse(form).success) {setError(en?'Enter your name, a valid email, matching passwords of at least 8 characters, and accept the terms.':'Въведи име, валиден имейл, еднакви пароли от поне 8 символа и приеми условията.');return}
    submitting.current=true;setBusy(true)
    try {
      const credentials={email:form.email.trim().toLowerCase(),password:form.password}
      const result=signup?await supabase.auth.signUp({...credentials,options:{data:{full_name:form.name.trim()},emailRedirectTo:customerAccountRedirect(window.location.origin,locale)}}):await supabase.auth.signInWithPassword(credentials)
      if(result.error)throw result.error
      update('password','');update('confirmation','')
      if(result.data.session)setSession(result.data.session)
      else {setMessage(en?'Request accepted. New accounts need email confirmation. An already confirmed account does not receive a new signup email: choose Sign in or an email sign-in link.':'Заявката е приета. Нов профил се потвърждава по имейл. Вече потвърден профил не получава нов регистрационен имейл — избери „Вход“ с парола или имейл линк.');setCooldown(60)}
    } catch(problem) {
      setError(problem.status===429?(en?'Too many attempts. Try again in a few minutes.':'Твърде много опити. Опитай след няколко минути.'):(en?'Unable to sign in or register. Check your details and email confirmation.':'Неуспешен вход или регистрация. Провери данните и потвърждението на имейла.'))
    } finally {submitting.current=false;setBusy(false)}
  }

  async function resend() {
    if(submitting.current || busy || cooldown || preview)return
    submitting.current=true;setBusy(true);setError('')
    try {
      const options={emailRedirectTo:customerAccountRedirect(window.location.origin,locale)}
      const {error:problem}=session
        ? await supabase.auth.signInWithOtp({email:session.user.email,options:{...options,shouldCreateUser:false}})
        : await supabase.auth.resend({type:'signup',email:form.email.trim().toLowerCase(),options})
      if(problem)throw problem
      setMessage(en?'Confirmation requested. Check your inbox and Spam.':'Заявено е потвърждение. Провери пощата и „Спам“.');setCooldown(60)
    }catch{setError(en?'Could not request confirmation. Please try later.':'Не успяхме да заявим потвърждение. Опитай по-късно.');setCooldown(60)}finally{submitting.current=false;setBusy(false)}
  }

  async function emailSignIn() {
    if(submitting.current || cooldown || preview)return
    if(!hasSupabaseConfig){setError(en?'Sign-in is temporarily unavailable.':'Входът временно не е достъпен.');return}
    submitting.current=true;setBusy(true);setError('');setMessage('')
    const result=await requestCustomerSignInLink({auth:supabase.auth,email:form.email,origin:window.location.origin,locale})
    if(result.error)setError(result.error==='VALIDATION_ERROR'?(en?'Enter a valid email address first.':'Първо въведи валиден имейл адрес.'):result.error==='RATE_LIMITED'?(en?'Too many attempts. Please try in a few minutes.':'Твърде много опити. Опитай след няколко минути.'):(en?'Unable to request a link. Please try later.':'Не успяхме да заявим линк. Опитай по-късно.'))
    else setMessage(en?'If this email has an account, a secure sign-in link has been requested. Check your inbox and Spam. No new account is created by this action.':'Ако с този имейл има профил, е заявен сигурен линк за вход. Провери пощата и „Спам“. Тази опция не създава нов акаунт.')
    if(result.error!=='VALIDATION_ERROR')setCooldown(60)
    submitting.current=false;setBusy(false)
  }

  async function logout() {
    if(preview)return
    setBusy(true);setError('')
    try{const {error:problem}=await supabase.auth.signOut({scope:'local'});if(problem)throw problem;setSession(null);setHistory({status:'loading',bookings:[],hasMore:false})}
    catch{setError(en?'Could not sign out. Please try again.':'Неуспешен изход. Опитай отново.')}finally{setBusy(false)}
  }

  return <main className="customer-page">
    <nav className="customer-nav home-navigation-header" aria-label={en?'Account navigation':'Навигация за профила'}><Link href={`/?lang=${locale}`} aria-label="GoRez"><BrandLogo className="marketing-logo" eager /></Link><div className="home-header-actions"><AdminAccessLink locale={locale}/><LanguageSwitch locale={locale} onChange={setLocale} compact />{session && <button type="button" className="customer-signout" disabled={busy} onClick={logout}><Icon name="logout" />{en?'Sign out':'Изход'}</button>}</div><HomeLink locale={locale}/></nav>
    {checking?<section className="customer-loading" role="status"><span className="button-spinner" />{en?'Loading your account…':'Зареждаме профила…'}</section>:!session?<section className="customer-access">
      <div className="customer-access-copy"><p className="marketing-kicker">{en?'Your GoRez':'Твоят GoRez'}</p><h1>{en?'Your time.':'Твоите часове.'}<br/><em>{en?'All in one place.':'На едно място.'}</em></h1><p>{en?'Upcoming visits and booking history, with one account.':'Предстоящи посещения и история с един профил.'}</p><div className="customer-access-feature"><Icon name="calendar" /><span>{en?'Keep track of every visit':'Следи всяко посещение'}</span></div><div className="customer-access-feature"><Icon name="check" /><span>{en?'Booking without an account is still available':'Можеш да резервираш и без профил'}</span></div></div>
      <section className="access-card customer-auth"><div className="customer-auth-tabs"><button type="button" aria-pressed={mode==='login'} onClick={()=>{setMode('login');setError('');setMessage('')}}>{en?'Sign in':'Вход'}</button><button type="button" aria-pressed={mode==='signup'} onClick={()=>{setMode('signup');setError('');setMessage('')}}>{en?'Register':'Регистрация'}</button></div><h2>{mode==='login'?(en?'Welcome back':'Добре дошъл отново'):(en?'Create your client account':'Създай клиентски профил')}</h2><form onSubmit={submit} className="auth-form">
        {mode==='signup'&&<div className="field"><label htmlFor="client-name">{en?'Name':'Име'}</label><input id="client-name" className="text-input" autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={e=>update('name',e.target.value)} /></div>}
        <div className="field"><label htmlFor="client-email">{en?'Email':'Имейл'}</label><input id="client-email" type="email" className="text-input" autoComplete="email" required maxLength={180} value={form.email} onChange={e=>update('email',e.target.value)} /></div>
        <div className="field"><label htmlFor="client-password">{en?'Password':'Парола'}</label><input id="client-password" type="password" className="text-input" autoComplete={mode==='signup'?'new-password':'current-password'} required minLength={mode==='signup'?8:1} maxLength={128} value={form.password} onChange={e=>update('password',e.target.value)} /></div>
        {mode==='signup'?<><div className="field"><label htmlFor="client-confirm">{en?'Repeat password':'Повтори паролата'}</label><input id="client-confirm" type="password" className="text-input" autoComplete="new-password" required minLength={8} maxLength={128} value={form.confirmation} onChange={e=>update('confirmation',e.target.value)} /></div><label className="customer-consent"><input type="checkbox" required checked={form.consent} onChange={e=>update('consent',e.target.checked)} /><span>{en?'I accept the ':'Приемам '}<Link target="_blank" href={`/terms?lang=${locale}`}>{en?'terms':'условията'}</Link>{en?' and ':' и '}<Link target="_blank" href={`/privacy?lang=${locale}`}>{en?'privacy policy':'политиката за поверителност'}</Link>.</span></label></>:<Link className="auth-forgot" href={`/forgot-password?lang=${locale}`}>{en?'Forgot your password?':'Забравена парола?'}</Link>}
        {message&&<p className="form-message success" role="status">{message}</p>}{error&&<p className="form-message" role="alert">{error}</p>}<button type="submit" className="primary-button" disabled={busy}>{busy?(en?'Please wait…':'Момент…'):mode==='signup'?(en?'Create account':'Създай профил'):(en?'Sign in':'Вход')}<Icon name="arrow" /></button>
        {mode==='login'&&<button className="secondary-button customer-email-signin" type="button" onClick={emailSignIn} disabled={busy||cooldown>0}><Icon name="mail"/>{cooldown?`${en?'Wait':'Изчакай'} ${cooldown}s`:(en?'Sign in with an email link':'Вход с имейл линк')}</button>}
        {message&&mode==='signup'&&<><button className="link-button" type="button" onClick={resend} disabled={busy||cooldown>0}>{cooldown?`${en?'Wait':'Изчакай'} ${cooldown}s`:(en?'Resend verification':'Изпрати потвърждение отново')}</button><button className="link-button" type="button" onClick={()=>{setMode('login');setMessage('');setError('')}}>{en?'Already registered? Go to sign in':'Вече имаш профил? Към вход'}</button></>}
      </form><Link className="customer-owner-link" href={`/login?lang=${locale}`}><span><Icon name="store"/><span>{en?'Have a business?':'Имаш бизнес?'}</span></span><strong>{en?'Business sign-in':'Вход за бизнес'}<Icon name="arrow"/></strong></Link></section>
    </section>:<section className="customer-dashboard">
      <header className="customer-dashboard-head"><div><p className="marketing-kicker">{en?'Your GoRez':'Твоят GoRez'}</p><h1>{en?'My bookings':'Моите резервации'}</h1><p>{session.user.email}</p></div><Link className="marketing-primary-cta" href={`/?lang=${locale}`}><Icon name="plus" />{en?'Book a new visit':'Запази нов час'}</Link></header>
      <div className="customer-history-controls"><div className="customer-auth-tabs">{[['upcoming',en?'Upcoming':'Текущи'],['past',en?'History':'Минали']].map(([key,label])=><button type="button" key={key} aria-pressed={view===key} onClick={()=>{setView(key);setPage(0)}}>{label}</button>)}</div><button className="customer-signout" type="button" onClick={()=>setReload(v=>v+1)} disabled={history.status==='loading'}>{en?'Refresh':'Обнови'}</button></div>
      {error&&<p className="form-message" role="alert">{error}</p>}{message&&<p className="form-message success" role="status">{message}</p>}
      <div aria-live="polite" className="customer-bookings">
        {history.status==='loading'&&<div className="customer-empty"><span className="button-spinner" /><p>{en?'Loading bookings…':'Зареждаме резервациите…'}</p></div>}
        {history.status==='unverified'&&<div className="customer-empty"><Icon name="mail" /><h2>{en?'Unlock your private history':'Отключи личната си история'}</h2><p>{en?'For your first history access, verify this mailbox once using an email link. Open it, then refresh. This also protects bookings made before registration.':'При първи достъп потвърди еднократно този имейл с личен линк. Отвори го, след което обнови. Така защитаваме и часовете, записани преди регистрацията.'}</p><button className="primary-button" type="button" onClick={resend} disabled={busy||cooldown>0}>{cooldown?`${cooldown}s`:(en?'Email me a secure link':'Изпрати ми сигурен линк')}</button></div>}
        {['error','expired'].includes(history.status)&&<div className="customer-empty" role="alert"><h2>{history.status==='expired'?(en?'Please sign in again':'Влез отново в профила'):(en?'Could not load bookings':'Не успяхме да заредим часовете')}</h2><button className="secondary-button" type="button" onClick={history.status==='expired'?logout:()=>setReload(v=>v+1)}>{en?'Try again':'Опитай отново'}</button></div>}
        {history.status==='ready'&&!history.bookings.length&&<div className="customer-empty"><Icon name="calendar" /><h2>{en?'No bookings here yet':'Все още няма резервации тук'}</h2><p>{en?'Bookings made with your verified email appear here, including visits booked without an account.':'Тук се показват записванията с потвърдения ти имейл, включително направените без профил.'}</p><Link className="marketing-primary-cta" href={`/?lang=${locale}`}>{en?'Find an appointment':'Намери час'}<Icon name="arrow" /></Link></div>}
        {history.status==='ready'&&history.bookings.map(row=><CustomerBookingCard key={row.id} row={row} locale={locale} view={view} />)}
      </div>{history.status==='ready'&&(page>0||history.hasMore)&&<div className="customer-pagination"><button type="button" disabled={page===0} onClick={()=>setPage(v=>v-1)}>{en?'Previous':'Назад'}</button><span>{en?'Page':'Страница'} {page+1}</span><button type="button" disabled={!history.hasMore} onClick={()=>setPage(v=>v+1)}>{en?'Next':'Напред'}</button></div>}
    </section>}
  </main>
}
