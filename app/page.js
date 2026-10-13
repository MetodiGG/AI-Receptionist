'use client'

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
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function Logo({ mobile = false }) {
  return (
    <div className={mobile ? 'app-logo mobile-logo' : 'brand-logo'}>
      <span className="logo-mark"><Icon name="spark" /></span>
      <span>AI Рецепционист</span>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
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

  return (
    <main className="auth-page">
      <section className="brand-panel" aria-label="Предимства на AI Рецепционист">
        <Logo />
        <div className="brand-content">
          <p className="eyebrow">Твоят бизнес, винаги на линия</p>
          <h1>Повече клиенти.<br />По-малко <em>пропуснати</em> часове.</h1>
          <p className="brand-lead">
            Умен асистент, който отговаря на запитвания, намира свободни часове и прави резервации — дори когато ти си зает.
          </p>
          <div className="benefit-row">
            <span className="benefit-pill"><Icon name="check" /> Работи 24/7</span>
            <span className="benefit-pill"><Icon name="check" /> Без двойни резервации</span>
            <span className="benefit-pill"><Icon name="check" /> На български език</span>
          </div>
        </div>
        <div className="conversation-preview" aria-hidden="true">
          <div className="conversation-head"><span className="online-dot" /> AI асистентът е онлайн</div>
          <div className="message-bubble">Имате ли свободен час утре следобед?</div>
          <div className="message-bubble bot">Да — имаме свободен час в 15:30. Да го запазя ли за вас?</div>
        </div>
        <div className="brand-foot">Създадено за модерния малък бизнес.</div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <Logo mobile />
          <p className="auth-kicker">{isLogin ? 'Добре дошъл отново' : 'Започни безплатно'}</p>
          <h2>{isLogin ? 'Влез в своя профил' : 'Създай своя профил'}</h2>
          <p className="auth-subtitle">
            {isLogin ? 'Управлявай бизнеса и резервациите си от едно място.' : 'Настрой своя AI рецепционист само за няколко минути.'}
          </p>

          <form className="auth-form" onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="email">Имейл адрес</label>
              <div className="input-wrap">
                <Icon name="mail" />
                <input id="email" className="text-input" type="email" autoComplete="email" placeholder="name@business.bg" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="password">Парола</label>
              <div className="input-wrap">
                <Icon name="lock" />
                <input id="password" className="text-input" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="Поне 6 символа" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} />
              </div>
            </div>
            {message && <p className={`form-message ${message.type === 'success' ? 'success' : ''}`} role="alert">{message.text}</p>}
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? <span className="button-spinner" /> : null}
              {loading ? 'Момент...' : isLogin ? 'Вход в профила' : 'Създай профил'}
              {!loading ? <Icon name="arrow" /> : null}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? 'Все още нямаш профил? ' : 'Вече имаш профил? '}
            <button className="link-button" type="button" onClick={switchMode}>{isLogin ? 'Регистрация' : 'Вход'}</button>
          </p>
          <p className="auth-trust"><Icon name="shield" /> Данните ти са защитени и достъпни само за теб.</p>
        </div>
      </section>
    </main>
  )
}
