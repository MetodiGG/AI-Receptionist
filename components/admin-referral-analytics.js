'use client'

import { BrandLoading } from './brand-loading'
import { useEffect, useState } from 'react'

export function AdminReferralAnalytics({ send, locale = 'bg', preview = false, businesses = [], onReport }) {
  const en = locale === 'en'
  const [days, setDays] = useState('30'), [summary, setSummary] = useState(null), [error, setError] = useState(false)
  const [businessId, setBusinessId] = useState('')
  useEffect(() => {
    if (preview) return
    let active = true
    setSummary(null); setError(false)
    send(`/api/admin/referral-analytics?days=${days}`).then(value => { if (active) setSummary(value.summary) }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [days, send, preview])
  const labels = en ? ['Business profile views', 'Partner external booking clicks', 'Non-partner booking clicks', 'GoRez bookings', 'Published businesses now'] : ['Прегледи на бизнес профили', 'Външни кликове към партньори', 'Кликове към непартньорски резервации', 'Резервации през GoRez', 'Публикувани бизнеси в момента']
  return <section className="admin-console-section">
    <header><div><h2>{en ? 'Platform statistics' : 'Статистика на платформата'}</h2><p>{en ? 'Actual activity, with bookings and referrals kept separate.' : 'Реална активност, с отделни показатели за резервации и пренасочвания.'}</p></div></header>
    {onReport&&<div className="admin-report-launch"><label>{en?'Business report':'Справка за бизнес'}<select value={businessId} onChange={event=>setBusinessId(event.target.value)}><option value="">{en?'Choose a business':'Избери бизнес'}</option>{businesses.map(business=><option key={business.id} value={business.id}>{business.name}{business.city?` · ${business.city}`:''}</option>)}</select></label><button className="secondary-button" type="button" disabled={!businesses.some(row=>row.id===businessId)} onClick={()=>{const business=businesses.find(row=>row.id===businessId);if(business)onReport(business)}}>{en?'Open report':'Отвори справка'}</button></div>}
    <label>{en ? 'Period' : 'Период'}<select value={days} onChange={e => setDays(e.target.value)}><option value="7">{en ? 'Last 7 days' : 'Последните 7 дни'}</option><option value="30">{en ? 'Last 30 days' : 'Последните 30 дни'}</option></select></label>
    {preview ? <p>{en ? 'Local layout preview. No live statistics were loaded.' : 'Локална проверка на изгледа. Не са заредени реални статистики.'}</p> : error ? <p role="status">{en ? 'Statistics are temporarily unavailable.' : 'Статистиката временно не е достъпна.'}</p> : !summary ? <div role="status"><BrandLoading label={en ? 'Loading…' : 'Зареждане…'} announce={false}/></div> : <div className="admin-console-kpis">{['profileViews','partnerOutboundClicks','nonpartnerOutboundClicks','gorezBookings','publishedBusinesses'].map((key,i) => <article key={key}><small>{labels[i]}</small><strong>{summary[key]}</strong></article>)}</div>}
    <p>{en ? 'An external click does not confirm a reservation, a new customer or a sale. Profile views and clicks are anonymous events, not unique people; their collection starts with this release. GoRez bookings exclude cancellations and manually entered visits.' : 'Външният клик не потвърждава резервация, нов клиент или продажба. Прегледите и кликовете са анонимни събития, не уникални хора; събирането им започва с тази версия. GoRez резервациите изключват отказаните и ръчно въведените посещения.'}</p>
    <div className="settings-panel"><h3>{en ? 'Website visitors & page views' : 'Посетители и разгледани страници на сайта'}</h3><p>{en ? 'These totals are in your private Vercel project dashboard when Web Analytics is enabled. They are separate from booking and referral counts.' : 'Тези показатели са в личния ти Vercel панел, когато Web Analytics е включен. Те са отделни от броя резервации и пренасочвания.'}</p><a className="secondary-button" href="https://vercel.com/ai-receptionist12/ai-receptionist/analytics" target="_blank" rel="noopener noreferrer">{en ? 'Open Vercel Analytics' : 'Отвори Vercel Analytics'} ↗</a></div>
  </section>
}
