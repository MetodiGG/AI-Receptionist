'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandLogo } from '../components/brand-logo'
import { Icon } from '../components/icon'
import { LanguageSwitch } from '../components/language-switch'
import { usePublicLocale } from '../hooks/use-public-locale'
import { HOME_COPY } from '../lib/home-copy'
import { PASSWORD_RECOVERY_COPY } from '../lib/password-recovery-copy.mjs'
import { filterDirectoryBusinesses, getIndustryLabel, INDUSTRY_KEYS, INDUSTRY_META } from '../lib/public-locale.mjs'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import { BookingStory } from '../components/booking-story'
import { AdminAccessLink } from '../components/admin-access-link'

function Logo({ eager = false }) {
  return <BrandLogo className="marketing-logo" eager={eager} />
}

function BusinessDirectory({ locale, copy, industry, setIndustry }) {
  const [businesses, setBusinesses] = useState([])
  const [search, setSearch] = useState('')
  const [selectedSlug, setSelectedSlug] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const filtered = useMemo(() => filterDirectoryBusinesses(businesses, industry).filter(business => `${business.name} ${business.address || ''} ${business.city || ''}`.toLocaleLowerCase(locale).includes(search.trim().toLocaleLowerCase(locale))), [businesses, industry, search, locale])
  const selected = filtered.find((business) => business.slug === selectedSlug) || filtered[0]

  function loadBusinesses() {
    setStatus('loading')
    setError('')
    fetch('/api/public/businesses')
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error?.message || copy.empty)
        setBusinesses(result.businesses || [])
        setStatus('ready')
      })
      .catch((requestError) => { setError(requestError.message); setStatus('error') })
  }

  useEffect(loadBusinesses, [])
  useEffect(() => { setSelectedSlug(filtered[0]?.slug || '') }, [industry, businesses.length])

  return <section className="business-directory" id="clients">
    <div className="directory-heading"><p className="marketing-kicker dark"><span /> {copy.directoryKicker}</p><h2>{copy.directoryTitle}</h2><p>{copy.directoryLead}</p></div>
    <div className="directory-shell">
      <aside className="directory-filters">
        <label htmlFor="business-search">{locale === 'en' ? 'Search by name or city' : 'Търси по име или град'}</label>
        <input id="business-search" type="search" className="directory-search" value={search} onChange={event=>setSearch(event.target.value)} placeholder={locale === 'en' ? 'Business, city…' : 'Бизнес, град…'} />
        <label htmlFor="industry-filter">{copy.category}</label>
        <select id="industry-filter" value={industry} onChange={(event) => setIndustry(event.target.value)}>
          <option value="all">{copy.all}</option>
          {INDUSTRY_KEYS.map((key) => <option value={key} key={key}>{getIndustryLabel(key, locale)}</option>)}
        </select>
        <label htmlFor="business-filter">{copy.chooseBusiness}</label>
        <select id="business-filter" value={selected?.slug || ''} onChange={(event) => setSelectedSlug(event.target.value)} disabled={!filtered.length}>
          {filtered.map((business) => <option value={business.slug} key={business.id}>{business.name}</option>)}
        </select>
        <div className="category-chips" aria-label={copy.category}>
          {INDUSTRY_KEYS.slice(0, 4).map((key) => <button type="button" className={industry === key ? 'active' : ''} onClick={() => setIndustry(key)} key={key}><span><Icon name={INDUSTRY_META[key].icon} /></span>{getIndustryLabel(key, locale)}</button>)}
        </div>
      </aside>
      <div className="directory-result" aria-live="polite">
        {status === 'loading' && <div className="directory-state"><span className="button-spinner" />{copy.loading}</div>}
        {status === 'error' && <div className="directory-state"><p>{error}</p><button type="button" onClick={loadBusinesses}>{copy.retry}</button></div>}
        {status === 'ready' && !selected && <div className="directory-state"><p>{copy.empty}</p></div>}
        {status === 'ready' && selected && <article className="directory-business-card" style={{ '--card-color': selected.theme_color || '#173e2a' }}>
          <div className="directory-business-head"><span className="directory-business-icon"><Icon name={(INDUSTRY_META[selected.industry] || INDUSTRY_META.other).icon} /></span><div><small>{getIndustryLabel(selected.industry, locale)}</small><h3>{selected.name}</h3>{selected.address && <p>⌖ {selected.address}</p>}</div></div>
          <div className="directory-services"><small>{copy.services}</small><div>{selected.services.slice(0, 5).map((service) => <span key={service.id}>{service.name}<b>{service.duration_min} min</b></span>)}</div></div>
          <Link className="directory-book-button" href={`/book/${selected.slug}?lang=${locale}`}>{copy.book} <Icon name="arrow" /></Link>
        </article>}
      </div>
    </div>
  </section>
}

export default function Home() {
  const router = useRouter()
  const { locale, setLocale } = usePublicLocale()
  const copy = HOME_COPY[locale]
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [accountDeleted, setAccountDeleted] = useState(false)
  const [industry, setIndustry] = useState('all')
  const isLogin = mode === 'login'

  useEffect(() => { setAccountDeleted(new URLSearchParams(window.location.search).get('account') === 'deleted') }, [])

  function switchMode() { setMode((current) => current === 'login' ? 'signup' : 'login'); setMessage(null) }

  async function submit(event) {
    event.preventDefault()
    setMessage(null)
    if (!hasSupabaseConfig) { setMessage({ type: 'error', text: 'Supabase configuration is missing.' }); return }
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail.includes('@')) { setMessage({ type: 'error', text: locale === 'bg' ? 'Въведи валиден имейл адрес.' : 'Enter a valid email address.' }); return }
    if (password.length < 6) { setMessage({ type: 'error', text: locale === 'bg' ? 'Паролата трябва да е поне 6 символа.' : 'Password must be at least 6 characters.' }); return }
    setLoading(true)
    const result = isLogin ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password }) : await supabase.auth.signUp({ email: normalizedEmail, password })
    setLoading(false)
    if (result.error) { setMessage({ type: 'error', text: result.error.message }); return }
    if (result.data.session) {
      const access=await fetch('/api/admin/access',{headers:{Authorization:`Bearer ${result.data.session.access_token}`},cache:'no-store'}).catch(()=>null)
      router.push(access?.ok?`/admin?lang=${locale}`:`/dashboard?lang=${locale}`); return
    }
    setMessage({ type: 'success', text: locale === 'bg' ? 'Профилът е създаден. Провери имейла си.' : 'Your profile is ready. Check your email to confirm it.' })
  }

  return <main className="marketing-page platform-home">
    {accountDeleted && <p className="account-deleted-notice" role="status">{locale === 'en' ? 'Your account has been deleted. You have been signed out.' : 'Акаунтът е изтрит. Излезе от профила си.'}</p>}
    <nav className="marketing-nav platform-nav" aria-label={locale === 'bg' ? 'Основна навигация' : 'Main navigation'}>
      <a href="#top" aria-label="GoRez"><Logo eager /></a>
      <div className="marketing-nav-links"><a href="#clients">{copy.navClients}</a><a href="#how">{copy.how}</a><a href="#business">{copy.login}</a></div>
      <div className="platform-nav-actions"><LanguageSwitch locale={locale} onChange={setLocale} compact /><AdminAccessLink locale={locale}/><Link className="nav-client-account" aria-label={locale === 'bg' ? 'Моят клиентски профил' : 'My client account'} href={`/account?lang=${locale}`}><Icon name="user"/><span>{locale === 'bg' ? 'Моят профил' : 'My account'}</span></Link><Link className="platform-nav-business-link" href={`/for-businesses?lang=${locale}`}><Icon name="plus"/>{locale === 'bg' ? 'Добави бизнес' : 'Add a business'}<Icon name="arrow"/></Link></div>
    </nav>

    <section className="platform-hero" id="top"><div className="platform-hero-copy"><p className="marketing-kicker">{copy.eyebrow}</p><h1>{locale==='en'?'Your next':'Следващият'}<br/>{locale==='en'?'appointment.':'ти час.'}<br/><em>{locale==='en'?'One click away.':'На един клик.'}</em></h1><p>{locale==='en'?'For you. For your car. For everything on your calendar.':'За теб. За колата. За всичко в графика ти.'}</p><div className="marketing-hero-actions"><a className="marketing-primary-cta" href="#clients">{locale==='en'?'Find an appointment':'Намери час'} <Icon name="arrow" /></a><Link className="hero-account-link" href={`/account?lang=${locale}&mode=signup`}>{locale==='en'?'Create a client account':'Създай клиентски профил'}</Link></div><div className="marketing-trust-row">{[locale==='en'?'Book without an account':'Записване и без профил',locale==='en'?'Your history, in one place':'История на посещенията'].map(item=><span key={item}><Icon name="check" />{item}</span>)}</div></div><BookingStory locale={locale} onExplore={key=>{setIndustry(key);document.getElementById('clients')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}} /></section>

    <BusinessDirectory locale={locale} copy={copy} industry={industry} setIndustry={setIndustry} />

    <section className="home-client-profile"><div className="home-client-symbol"><Icon name="calendar"/></div><div><p className="marketing-kicker">{locale==='en'?'Made for your everyday':'За твоето ежедневие'}</p><h2>{locale==='en'?'Your visits. One account.':'Твоите посещения. Един профил.'}</h2><p>{locale==='en'?'Upcoming bookings, past visits and a quick way to book again.':'Предстоящи часове, минали посещения и бързо записване отново.'}</p></div><Link className="marketing-primary-cta" href={`/account?lang=${locale}&mode=signup`}>{locale==='en'?'My GoRez':'Моят GoRez'}<Icon name="arrow"/></Link></section>

    <section className="platform-business" id="business">
      <div className="platform-business-copy"><p className="marketing-kicker"><span /> {copy.ownerKicker}</p><h2>{copy.ownerTitle}</h2><p>{copy.ownerLead}</p><div className="platform-benefits">{copy.benefits.map((item) => <span key={item}><Icon name="check" /> {item}</span>)}</div></div>
      <div className="access-card platform-auth-card">
        <p className="auth-kicker">{isLogin ? copy.auth.loginKicker : copy.auth.signupKicker}</p><h2>{isLogin ? copy.auth.loginTitle : copy.auth.signupTitle}</h2><p className="auth-subtitle">{isLogin ? copy.auth.loginSub : copy.auth.signupSub}</p>
        <form className="auth-form" onSubmit={submit} noValidate>
          <div className="field"><label htmlFor="email">{copy.auth.email}</label><input id="email" className="text-input" type="email" autoComplete="email" placeholder="name@business.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} /></div>
          <div className="field"><label htmlFor="password">{copy.auth.password}</label><input id="password" className="text-input" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder={copy.auth.min} value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} /></div>
          {isLogin && <Link className="auth-forgot" href={`/forgot-password?lang=${locale}`}>{PASSWORD_RECOVERY_COPY[locale].forgotTitle}</Link>}
          {message && <p className={`form-message ${message.type === 'success' ? 'success' : ''}`} role="alert">{message.text}</p>}
          <button className="primary-button" type="submit" disabled={loading}>{loading ? copy.auth.wait : isLogin ? copy.auth.login : copy.auth.signup}{!loading && <Icon name="arrow" />}</button>
        </form>
        <p className="auth-switch">{isLogin ? copy.auth.noAccount : copy.auth.hasAccount} <button className="link-button" type="button" onClick={switchMode}>{isLogin ? copy.auth.register : copy.auth.signIn}</button></p>
      </div>
    </section>

    <footer className="marketing-footer platform-footer"><Logo /><span>{copy.footer}</span><div><a href="#clients">{copy.navClients}</a><Link href={`/for-businesses?lang=${locale}`}>{copy.navBusiness}</Link><Link href={`/privacy?lang=${locale}`}>{locale === 'bg' ? 'Поверителност' : 'Privacy'}</Link><Link href={`/terms?lang=${locale}`}>{locale === 'bg' ? 'Условия' : 'Terms'}</Link></div></footer>
  </main>
}
