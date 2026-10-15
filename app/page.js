'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandLogo } from '../components/brand-logo'
import { Icon } from '../components/icon'
import { LanguageSwitch } from '../components/language-switch'
import { usePublicLocale } from '../hooks/use-public-locale'
import { HOME_COPY } from '../lib/home-copy'
import { filterDirectoryBusinesses, getIndustryLabel, INDUSTRY_KEYS, INDUSTRY_META } from '../lib/public-locale.mjs'
import { hasSupabaseConfig, supabase } from '../lib/supabase'

function Logo({ eager = false }) {
  return <BrandLogo className="marketing-logo" eager={eager} />
}

function BusinessDirectory({ locale, copy }) {
  const [businesses, setBusinesses] = useState([])
  const [industry, setIndustry] = useState('all')
  const [selectedSlug, setSelectedSlug] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const filtered = useMemo(() => filterDirectoryBusinesses(businesses, industry), [businesses, industry])
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
        <label htmlFor="industry-filter">{copy.category}</label>
        <select id="industry-filter" value={industry} onChange={(event) => setIndustry(event.target.value)}>
          <option value="all">🗂️ {copy.all}</option>
          {INDUSTRY_KEYS.map((key) => <option value={key} key={key}>{INDUSTRY_META[key].symbol} {getIndustryLabel(key, locale)}</option>)}
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

function HeroVisual({ locale }) {
  const english = locale === 'en'
  return <div className="platform-hero-visual" aria-hidden="true">
    <div className="hero-service-card beauty"><span><Icon name="scissors" /></span><small>{getIndustryLabel('beauty', locale)}</small><strong>{english ? 'Haircut' : 'Подстригване'}</strong><i>10:30</i></div>
    <div className="hero-service-card auto"><span><Icon name="wrench" /></span><small>{getIndustryLabel('auto', locale)}</small><strong>{english ? 'Diagnostics' : 'Диагностика'}</strong><i>14:00</i></div>
    <div className="hero-service-card health"><span><Icon name="stethoscope" /></span><small>{getIndustryLabel('health', locale)}</small><strong>{english ? 'Consultation' : 'Консултация'}</strong><i>16:15</i></div>
    <div className="hero-calendar-card"><small>{english ? 'AVAILABLE TIMES' : 'СВОБОДНИ ЧАСОВЕ'}</small><div><span>09:30</span><span>11:00</span><span>13:30</span></div><strong>✓ {english ? 'Confirmed' : 'Потвърдено'}</strong></div>
  </div>
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
    if (result.data.session) { router.push(`/dashboard?lang=${locale}`); return }
    setMessage({ type: 'success', text: locale === 'bg' ? 'Профилът е създаден. Провери имейла си.' : 'Your profile is ready. Check your email to confirm it.' })
  }

  return <main className="marketing-page platform-home">
    {accountDeleted && <p className="account-deleted-notice" role="status">{locale === 'en' ? 'Your account has been deleted. You have been signed out.' : 'Акаунтът е изтрит. Излезе от профила си.'}</p>}
    <nav className="marketing-nav platform-nav" aria-label={locale === 'bg' ? 'Основна навигация' : 'Main navigation'}>
      <a href="#top" aria-label="GoRez"><Logo eager /></a>
      <div className="marketing-nav-links"><a href="#clients">{copy.navClients}</a><a href="#how">{copy.how}</a><Link href={`/for-businesses?lang=${locale}`}>{copy.navBusiness}</Link></div>
      <div className="platform-nav-actions"><LanguageSwitch locale={locale} onChange={setLocale} compact /><Link className="platform-nav-business-link" href={`/for-businesses?lang=${locale}`}>{locale === 'bg' ? 'Добави бизнес' : 'Add a business'}</Link><a className="marketing-nav-cta" href="#business">{copy.login} <Icon name="arrow" /></a></div>
    </nav>

    <section className="platform-hero" id="top"><div className="hero-orb orb-one" aria-hidden="true" /><div className="hero-orb orb-two" aria-hidden="true" /><div className="platform-hero-copy"><p className="marketing-kicker"><span /> {copy.eyebrow}</p><h1>{copy.titleA}<br /><em>{copy.titleB}</em><br />{copy.titleC}</h1><p>{copy.lead}</p><div className="marketing-hero-actions"><a className="marketing-primary-cta" href="#clients">{copy.find} <Icon name="arrow" /></a><Link className="marketing-secondary-cta" href={`/for-businesses?lang=${locale}`}>{copy.add}</Link></div><div className="marketing-trust-row">{copy.trust.map((item) => <span key={item}><Icon name="check" /> {item}</span>)}</div></div><HeroVisual locale={locale} /></section>

    <BusinessDirectory locale={locale} copy={copy} />

    <section className="platform-process" id="how"><div className="directory-heading"><p className="marketing-kicker"><span /> {copy.processKicker}</p><h2>{copy.processTitle}</h2></div><div className="platform-steps">{copy.steps.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

    <section className="platform-business" id="business"><div className="platform-business-copy"><p className="marketing-kicker"><span /> {copy.ownerKicker}</p><h2>{copy.ownerTitle}</h2><p>{copy.ownerLead}</p><div className="platform-benefits">{copy.benefits.map((item) => <span key={item}><Icon name="check" /> {item}</span>)}</div></div><div className="access-card platform-auth-card"><p className="auth-kicker">{isLogin ? copy.auth.loginKicker : copy.auth.signupKicker}</p><h2>{isLogin ? copy.auth.loginTitle : copy.auth.signupTitle}</h2><p className="auth-subtitle">{isLogin ? copy.auth.loginSub : copy.auth.signupSub}</p><form className="auth-form" onSubmit={submit} noValidate><div className="field"><label htmlFor="email">{copy.auth.email}</label><input id="email" className="text-input" type="email" autoComplete="email" placeholder="name@business.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} /></div><div className="field"><label htmlFor="password">{copy.auth.password}</label><input id="password" className="text-input" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder={copy.auth.min} value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} /></div>{message && <p className={`form-message ${message.type === 'success' ? 'success' : ''}`} role="alert">{message.text}</p>}<button className="primary-button" type="submit" disabled={loading}>{loading ? copy.auth.wait : isLogin ? copy.auth.login : copy.auth.signup}{!loading && <Icon name="arrow" />}</button></form><p className="auth-switch">{isLogin ? copy.auth.noAccount : copy.auth.hasAccount} <button className="link-button" type="button" onClick={switchMode}>{isLogin ? copy.auth.register : copy.auth.signIn}</button></p></div></section>

    <footer className="marketing-footer platform-footer"><Logo /><span>{copy.footer}</span><div><a href="#clients">{copy.navClients}</a><Link href={`/for-businesses?lang=${locale}`}>{copy.navBusiness}</Link><Link href={`/privacy?lang=${locale}`}>{locale === 'bg' ? 'Поверителност' : 'Privacy'}</Link><Link href={`/terms?lang=${locale}`}>{locale === 'bg' ? 'Условия' : 'Terms'}</Link></div></footer>
  </main>
}
