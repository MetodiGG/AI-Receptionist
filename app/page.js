'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { hasSupabaseConfig, supabase } from '../lib/supabase'

function Icon({ name }) {
  const paths = {
    spark: <><path d="m12 3-1.4 4.1a5 5 0 0 1-3.1 3.1L3.4 12l4.1 1.4a5 5 0 0 1 3.1 3.1L12 20.6l1.4-4.1a5 5 0 0 1 3.1-3.1l4.1-1.4-4.1-1.8a5 5 0 0 1-3.1-3.1L12 3Z"/><path d="m19 3-.5 1.4a2 2 0 0 1-1.2 1.2L16 6l1.3.5a2 2 0 0 1 1.2 1.2L19 9l.5-1.3a2 2 0 0 1 1.2-1.2L22 6l-1.3-.4a2 2 0 0 1-1.2-1.2L19 3Z"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    shield: <><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
    message: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M8 10h8M8 14h5"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  }

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Logo({ inverse = false }) {
  return <span className={`marketing-logo ${inverse ? 'inverse' : ''}`}><span className="logo-mark"><Icon name="spark" /></span><span>AI Рецепционист</span></span>
}

const PERSPECTIVES = {
  client: {
    kicker: 'За клиента',
    title: 'От „имате ли час?“ до потвърдена резервация.',
    text: 'Клиентът отваря един линк, избира услуга и вижда само реално свободните часове. Без регистрация, обаждане или чакане за отговор.',
    points: ['Удобно от телефон', 'Реална наличност', 'Линк за управление'],
  },
  owner: {
    kicker: 'За собственика',
    title: 'Всичко пристига подредено в едно табло.',
    text: 'Новите резервации, клиентите и разговорите се записват автоматично. Графикът остава актуален, а двойните часове се блокират.',
    points: ['Един общ календар', 'История на клиентите', 'Настройки без програмист'],
  },
}

function ProductStage() {
  return (
    <div className="marketing-product-stage" aria-label="Преглед на продукта">
      <div className="stage-glow" aria-hidden="true" />
      <div className="owner-window">
        <div className="window-bar"><i /><i /><i /><span>Табло на бизнеса</span></div>
        <div className="owner-window-body">
          <aside><span className="mini-logo">✦</span><b /><b /><b /><b /></aside>
          <div className="owner-canvas">
            <div className="owner-canvas-head"><span><small>ДНЕС</small><strong>Добър ден, MG Barbershop</strong></span><em>Системата е активна</em></div>
            <div className="mini-stats"><span><small>Резервации</small><strong>6</strong></span><span><small>Свободни часа</small><strong>12</strong></span><span><small>Клиенти</small><strong>48</strong></span></div>
            <div className="mini-appointment"><time>14:30</time><span><strong>Подстригване</strong><small>Нова онлайн резервация</small></span><i>Потвърдена</i></div>
            <div className="mini-appointment muted"><time>16:00</time><span><strong>Подстригване</strong><small>Предстоящ час</small></span><i>Запазена</i></div>
          </div>
        </div>
      </div>

      <div className="client-phone">
        <div className="phone-speaker" />
        <div className="phone-business"><span>✦</span><div><small>ОНЛАЙН ЗАПИСВАНЕ</small><strong>MG Barbershop</strong></div></div>
        <p>Избери удобен час.</p>
        <div className="phone-service"><span>Подстригване<small>30 минути</small></span><b>25 €</b></div>
        <div className="phone-dates"><span><small>Ср</small>14</span><span className="active"><small>Чт</small>15</span><span><small>Пт</small>16</span></div>
        <div className="phone-times"><span>14:30</span><span>15:15</span><span>16:00</span></div>
        <button type="button" tabIndex={-1}>Продължи <Icon name="arrow" /></button>
      </div>

      <div className="floating-status status-booked"><span>✓</span><div><strong>Нова резервация</strong><small>Днес, 14:30</small></div></div>
      <div className="floating-status status-live"><i /><span>Приема резервации 24/7</span></div>
    </div>
  )
}

function PerspectiveVisual({ perspective }) {
  if (perspective === 'owner') {
    return (
      <div className="perspective-visual owner-perspective" aria-label="Примерно табло на собственик">
        <div className="perspective-top"><span>Днешен график</span><small>3 предстоящи</small></div>
        <div className="schedule-line"><time>09:30</time><i /><span><strong>Мария Петрова</strong><small>Подстригване · Анелия</small></span><em>Потвърдена</em></div>
        <div className="schedule-line"><time>11:00</time><i /><span><strong>Иван Димитров</strong><small>Подстригване · Методи</small></span><em>Потвърдена</em></div>
        <div className="schedule-line new"><time>14:30</time><i /><span><strong>Нова резервация</strong><small>Току-що от публичната страница</small></span><em>Нова</em></div>
      </div>
    )
  }

  return (
    <div className="perspective-visual client-perspective" aria-label="Примерно клиентско преживяване">
      <div className="client-journey-head"><span className="journey-avatar">М</span><span><small>MG BARBERSHOP</small><strong>Здравей! Как да помогна?</strong></span><i>Онлайн</i></div>
      <div className="journey-message user">Искам да резервирам час.</div>
      <div className="journey-message">Разбира се. Първо избери услуга.</div>
      <div className="journey-choice"><span><strong>Подстригване</strong><small>30 минути</small></span><b>25 €</b></div>
      <div className="journey-confirm"><span>✓</span><div><strong>Часът е потвърден</strong><small>Четвъртък, 15 октомври · 14:30</small></div></div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [perspective, setPerspective] = useState('client')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!hasSupabaseConfig) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/dashboard')
    })
  }, [router])

  function switchMode() {
    setMode((current) => current === 'login' ? 'signup' : 'login')
    setMessage(null)
  }

  async function submit(event) {
    event.preventDefault()
    setMessage(null)
    if (!hasSupabaseConfig) {
      setMessage({ type: 'error', text: 'Supabase настройките липсват. Добави environment variables и опитай отново.' })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setMessage({ type: 'error', text: 'Въведи валиден имейл адрес.' })
      return
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Паролата трябва да е поне 6 символа.' })
      return
    }

    setLoading(true)
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      : await supabase.auth.signUp({ email: normalizedEmail, password })
    setLoading(false)

    if (result.error) {
      const friendlyMessages = {
        'Invalid login credentials': 'Невалиден имейл или парола.',
        'Email not confirmed': 'Потвърди имейла си, преди да влезеш.',
        'User already registered': 'Вече има профил с този имейл.',
      }
      setMessage({ type: 'error', text: friendlyMessages[result.error.message] || result.error.message })
      return
    }
    if (result.data.session) {
      router.push('/dashboard')
      return
    }
    setMessage({ type: 'success', text: 'Профилът е създаден. Провери имейла си и потвърди регистрацията.' })
  }

  const isLogin = mode === 'login'
  const activePerspective = PERSPECTIVES[perspective]

  return (
    <main className="marketing-page">
      <nav className="marketing-nav" aria-label="Основна навигация">
        <Logo />
        <div className="marketing-nav-links"><a href="#experience">Как работи</a><a href="#client-view">За клиента</a><a href="#access">За бизнеса</a></div>
        <a className="marketing-nav-cta" href="#access">Вход за бизнес <Icon name="arrow" /></a>
      </nav>

      <section className="marketing-hero-section">
        <div className="hero-orb orb-one" aria-hidden="true" /><div className="hero-orb orb-two" aria-hidden="true" />
        <div className="marketing-hero-copy">
          <p className="marketing-kicker"><span /> Онлайн рецепция за малкия бизнес</p>
          <h1>Клиентите резервират.<br />Ти <em>печелиш време.</em></h1>
          <p className="marketing-hero-lead">Един красив линк приема резервации, показва реалните свободни часове и подрежда всичко в твоето табло — дори когато си зает.</p>
          <div className="marketing-hero-actions"><Link className="marketing-primary-cta" href="/book/mg-barbershop">Виж като клиент <Icon name="arrow" /></Link><a className="marketing-secondary-cta" href="#experience">Разгледай как работи</a></div>
          <div className="marketing-trust-row"><span><Icon name="check" /> Без платени AI съобщения</span><span><Icon name="check" /> Без двойни резервации</span><span><Icon name="check" /> На български</span></div>
        </div>
        <ProductStage />
      </section>

      <div className="marketing-marquee" aria-label="Основни възможности"><div><span>РЕЗЕРВАЦИИ 24/7</span><i>✦</i><span>РЕАЛНА НАЛИЧНОСТ</span><i>✦</i><span>КЛИЕНТСКА ИСТОРИЯ</span><i>✦</i><span>БЕЗ ДВОЙНИ ЧАСОВЕ</span><i>✦</i><span>РЕЗЕРВАЦИИ 24/7</span><i>✦</i><span>РЕАЛНА НАЛИЧНОСТ</span></div></div>

      <section className="experience-section" id="experience">
        <div className="section-heading"><p className="marketing-kicker dark"><span /> Две гледни точки. Една система.</p><h2>Лесно за клиента.<br /><em>Подредено за бизнеса.</em></h2><p>Покажи на собственика не просто софтуер, а как изглежда целият път — от първото клиентско запитване до новия час в календара.</p></div>
        <div className="perspective-switch" role="tablist" aria-label="Гледна точка">
          <button role="tab" aria-selected={perspective === 'client'} className={perspective === 'client' ? 'active' : ''} onClick={() => setPerspective('client')}><Icon name="users" /> Клиент</button>
          <button role="tab" aria-selected={perspective === 'owner'} className={perspective === 'owner' ? 'active' : ''} onClick={() => setPerspective('owner')}><Icon name="calendar" /> Собственик</button>
        </div>
        <div className="perspective-panel" key={perspective}>
          <div className="perspective-copy"><p>{activePerspective.kicker}</p><h3>{activePerspective.title}</h3><span>{activePerspective.text}</span><ul>{activePerspective.points.map((point) => <li key={point}><Icon name="check" /> {point}</li>)}</ul>{perspective === 'client' && <Link href="/book/mg-barbershop">Отвори реалното преживяване <Icon name="arrow" /></Link>}</div>
          <PerspectiveVisual perspective={perspective} />
        </div>
      </section>

      <section className="client-story-section" id="client-view">
        <div className="client-story-intro"><p className="marketing-kicker"><span /> Клиентското преживяване</p><h2>Никакво чудене.<br />Само три ясни стъпки.</h2><p>Страницата е създадена за телефон, защото точно там клиентът най-често решава да запази час.</p><Link href="/book/mg-barbershop">Тествай на живо <Icon name="arrow" /></Link></div>
        <div className="journey-steps">
          <article><span>01</span><div className="journey-icon"><Icon name="message" /></div><h3>Отваря един линк</h3><p>От Instagram, Google профил, сайт или съобщение — без регистрация.</p></article>
          <article><span>02</span><div className="journey-icon"><Icon name="clock" /></div><h3>Избира реален час</h3><p>Вижда услуги, специалисти и само часовете, които наистина са свободни.</p></article>
          <article><span>03</span><div className="journey-icon"><Icon name="check" /></div><h3>Получава потвърждение</h3><p>Резервацията влиза в таблото и може да бъде прегледана или отказана от личен линк.</p></article>
        </div>
      </section>

      <section className="live-demo-section"><div className="demo-pulse" aria-hidden="true"><span>✦</span></div><div><p>Готово за показване</p><h2>Влез в ролята на клиент.</h2><span>Това е работеща публична страница с примерен бизнес и реална проверка на свободните часове.</span></div><Link href="/book/mg-barbershop">Отвори клиентското демо <Icon name="arrow" /></Link></section>

      <section className="access-section" id="access">
        <div className="access-copy"><Logo inverse /><p className="marketing-kicker"><span /> Контролният център</p><h2>Твоят бизнес.<br /><em>Твоите правила.</em></h2><p>Настрой услуги, екип, графици и клиентската страница от едно място. Промените се отразяват веднага.</p><div className="access-benefits"><span><Icon name="shield" /> Данните са защитени</span><span><Icon name="calendar" /> Календар в реално време</span></div></div>
        <div className="access-card">
          <p className="auth-kicker">{isLogin ? 'Профил за бизнес' : 'Започни безплатно'}</p><h2>{isLogin ? 'Добре дошъл отново' : 'Създай бизнес профил'}</h2><p className="auth-subtitle">{isLogin ? 'Влез в таблото и управлявай своите резервации.' : 'Настрой публичната си страница само за няколко минути.'}</p>
          <form className="auth-form" onSubmit={submit} noValidate>
            <div className="field"><label htmlFor="email">Имейл адрес</label><div className="input-wrap"><Icon name="mail" /><input id="email" className="text-input" type="email" autoComplete="email" placeholder="name@business.bg" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} /></div></div>
            <div className="field"><label htmlFor="password">Парола</label><div className="input-wrap"><Icon name="lock" /><input id="password" className="text-input" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="Поне 6 символа" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} /></div></div>
            {message && <p className={`form-message ${message.type === 'success' ? 'success' : ''}`} role="alert">{message.text}</p>}
            <button className="primary-button" type="submit" disabled={loading}>{loading ? <span className="button-spinner" /> : null}{loading ? 'Момент...' : isLogin ? 'Вход в профила' : 'Създай профил'}{!loading ? <Icon name="arrow" /> : null}</button>
          </form>
          <p className="auth-switch">{isLogin ? 'Все още нямаш профил? ' : 'Вече имаш профил? '}<button className="link-button" type="button" onClick={switchMode}>{isLogin ? 'Регистрация' : 'Вход'}</button></p>
        </div>
      </section>

      <footer className="marketing-footer"><Logo /><span>Онлайн резервации с човешко усещане.</span><Link href="/book/mg-barbershop">Клиентско демо ↗</Link></footer>
    </main>
  )
}
