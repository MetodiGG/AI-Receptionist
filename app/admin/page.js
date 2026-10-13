'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function PlatformAdminPage() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: auth }) => {
      if (!auth.session) { router.replace('/'); return }
      const response = await fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${auth.session.access_token}` } })
      const body = await response.json()
      if (!response.ok) { setError(body.error?.message || 'Достъпът е отказан.'); return }
      setData(body)
    })
  }, [router])

  return <main className="platform-admin"><header><div><p className="auth-kicker">Операторски център</p><h1>Състояние на платформата</h1></div><Link className="secondary-button" href="/dashboard">Към таблото</Link></header>{error && <p className="form-message">{error}</p>}{!data && !error ? <div className="admin-loading"><span className="button-spinner" /> Проверка на достъпа...</div> : data && <><div className="analytics-kpis"><article><small>Всички бизнеси</small><strong>{data.totals.businesses}</strong></article><article><small>Активни</small><strong>{data.totals.active}</strong></article><article><small>Резервации / 30 дни</small><strong>{data.totals.bookings30d}</strong></article><article><small>Проблемни имейли</small><strong>{data.totals.failedNotifications30d}</strong></article></div><section className="admin-business-table"><div className="admin-business-head"><span>Бизнес</span><span>Тип</span><span>Резервации</span><span>Известия</span><span>Статус</span></div>{data.businesses.map((business) => <article key={business.id}><span><strong>{business.name}</strong><small>/{business.slug}</small></span><span>{business.industry}</span><span>{business.bookings30d}</span><span className={business.failedNotifications30d ? 'has-error' : ''}>{business.failedNotifications30d}</span><span>{business.active ? 'Активен' : 'Спрян'}</span></article>)}</section></>}</main>
}

