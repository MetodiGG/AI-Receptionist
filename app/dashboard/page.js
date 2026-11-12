'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { OwnerPage } from '../../components/owner-page'
import { Icon } from '../../components/icon'
import { businessAddress } from '../../lib/business-location.mjs'
import { BusinessSetup } from '../../components/business-setup'
import { profileServicePrice } from '../../lib/business-profile-ui.mjs'

function ReadyDashboard({ business, data, locale }) {
  const en = locale === 'en'
  const { services, staff, hours, appointmentsCount } = data
  const openDays = ['external','phone'].includes(business.booking_mode)?(business.opening_hours||[]).filter(d=>d.periods?.length).length:new Set(hours.map(row => row.weekday)).size
  const stats = [
    ['calendar', en ? 'Bookings' : 'Резервации', appointmentsCount],
    ['briefcase', en ? 'Active services' : 'Активни услуги', services.length],
    ['users', en ? 'Team members' : 'Членове на екипа', staff.length],
    ['clock', en ? 'Working days' : 'Работни дни', openDays],
  ]
  return <>
    <div className="stats-grid">
      {stats.map(([icon, label, value]) => <article className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon name={icon} /></span></div><p className="stat-value">{value}</p></article>)}
    </div>
    <div className="dashboard-grid">
      <section className="content-card">
        <div className="card-head"><h3>{en ? 'Your services' : 'Твоите услуги'}</h3></div>
        {services.length ? <div className="service-list">{services.map(service => <div className="service-item" key={service.id}><span className="service-avatar">{service.name.slice(0, 1).toUpperCase()}</span><div><p className="service-name">{service.name}</p>{service.duration_min!=null&&<p className="service-meta">{service.duration_min} {en ? 'minutes' : 'минути'}</p>}</div><span className="service-price">{profileServicePrice(service, locale)}</span></div>)}</div> : <div className="empty-state">{en ? 'No services have been added yet.' : 'Все още няма добавени услуги.'}</div>}
      </section>
      <section className="content-card">
        <div className="card-head"><h3>{en ? 'Business profile' : 'Бизнес профил'}</h3></div>
        <div className="business-summary">
          <div className="summary-row"><Icon name="store" /><span><strong>{business.name}</strong><br />/{business.slug}</span></div>
          {businessAddress(business, locale) && <div className="summary-row"><Icon name="pin" /><span>{businessAddress(business, locale)}</span></div>}
          {business.phone && <div className="summary-row"><Icon name="phone" /><span>{business.phone}</span></div>}
          <div className="summary-row"><Icon name="clock" /><span>{business.timezone}</span></div>
        </div>
      </section>
    </div>
  </>
}

function DashboardContent({ business, session, refreshBusiness, locale }) {
  const en = locale === 'en'
  const [data, setData] = useState(null), [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!business?.id) return
    let active = true
    setData(null); setError('')
    Promise.all([
      supabase.from('services').select('id,name,description,duration_min,price,currency,price_details').eq('business_id', business.id).eq('active', true).order('name'),
      supabase.from('staff').select('id').eq('business_id', business.id).eq('active', true),
      supabase.from('working_hours').select('weekday').eq('business_id', business.id),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('business_id', business.id),
    ]).then(([services, staff, hours, appointments]) => {
      if (!active) return
      const failure = [services, staff, hours, appointments].find(result => result.error)?.error
      if (failure) throw failure
      setData({ services: services.data || [], staff: staff.data || [], hours: hours.data || [], appointmentsCount: appointments.count || 0 })
    }).catch(failure => { if (active) setError(failure.message || 'Unavailable') })
    return () => { active = false }
  }, [business?.id, version])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? (en ? 'Good morning' : 'Добро утро') : hour < 18 ? (en ? 'Good afternoon' : 'Добър ден') : (en ? 'Good evening' : 'Добър вечер')
  return <main className="dashboard-content">
    <div className="page-intro"><div>
      <p className="auth-kicker">{business ? (en ? 'Your dashboard' : 'Твоето табло') : (en ? 'Initial setup' : 'Първоначална настройка')}</p>
      <h2>{business ? `${greeting}, ${business.name}` : (en ? 'Set up your GoRez booking page.' : 'Да настроим твоята GoRez страница.')}</h2>
      <p>{business ? (en ? 'Here is what is happening in your business right now.' : 'Ето какво се случва в бизнеса ти в момента.') : (en ? 'Add your services, team and schedule. Public booking starts after GoRez reviews and publishes your profile.' : 'Добави услуги, екип и график. Публичното записване започва след преглед и публикуване на профила от GoRez.')}</p>
    </div></div>
    {!business && <BusinessSetup application session={session} locale={locale} onComplete={refreshBusiness} />}
    {business && !data && !error && <div className="admin-loading" role="status"><span className="button-spinner" />{en ? 'Loading...' : 'Зареждаме...'}</div>}
    {error && <div className="form-message" role="alert"><p>{en ? 'We could not load the data.' : 'Не успяхме да заредим данните.'} {error}</p><button className="secondary-button" type="button" onClick={() => setVersion(current => current + 1)}>{en ? 'Try again' : 'Опитай отново'}</button></div>}
    {business && data && <ReadyDashboard business={business} data={data} locale={locale} />}
  </main>
}

export default function Dashboard() {
  return <OwnerPage allowSetup>{props => <DashboardContent {...props} />}</OwnerPage>
}
