'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const box = {
  maxWidth: 380, margin: '80px auto', background: '#fff',
  padding: 28, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
}
const input = {
  width: '100%', boxSizing: 'border-box', padding: 10, marginBottom: 12,
  border: '1px solid #ccc', borderRadius: 8, fontSize: 16,
}
const btn = {
  width: '100%', padding: 12, border: 'none', borderRadius: 8,
  background: '#111', color: '#fff', fontSize: 16, cursor: 'pointer',
}

export default function Home() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setMsg('')
    setLoading(true)
    const fn = mode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })
    const { data, error } = await fn
    setLoading(false)
    if (error) { setMsg('Грешка: ' + error.message); return }
    if (data.session) { router.push('/dashboard'); return }
    setMsg('Регистрацията е успешна. Провери имейла си за потвърждение.')
  }

  return (
    <div style={box}>
      <h2 style={{ marginTop: 0 }}>AI Рецепционист</h2>
      <p style={{ color: '#666' }}>
        {mode === 'login' ? 'Вход за собственици' : 'Нов профил'}
      </p>
      <input style={input} type="email" placeholder="Имейл"
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <input style={input} type="password" placeholder="Парола (мин. 6 символа)"
        value={password} onChange={(e) => setPassword(e.target.value)} />
      <button style={btn} onClick={submit} disabled={loading}>
        {loading ? 'Момент...' : mode === 'login' ? 'Вход' : 'Регистрация'}
      </button>
      {msg && <p style={{ color: '#b00020' }}>{msg}</p>}
      <p style={{ marginBottom: 0, fontSize: 14 }}>
        <a href="#" onClick={(e) => { e.preventDefault(); setMsg(''); setMode(mode === 'login' ? 'signup' : 'login') }}>
          {mode === 'login' ? 'Нямаш профил? Регистрация' : 'Вече имаш профил? Вход'}
        </a>
      </p>
    </div>
  )
}
