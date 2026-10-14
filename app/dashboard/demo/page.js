'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { OwnerPage } from '../../../components/owner-page'
import { Icon } from '../../../components/icon'
import { supabase } from '../../../lib/supabase'

function DemoContent({ business, locale }) {
  const en = locale === 'en'
  const [readiness, setReadiness] = useState({ services: 0, staff: 0, hours: 0, loading: true })
  const [copied, setCopied] = useState(false)
  const bookingPath = `/book/${business.slug}?lang=${locale}`

  useEffect(() => {
    Promise.all([
      supabase.from('services').select('id', { count: 'exact', head: true }).eq('business_id', business.id).eq('active', true),
      supabase.from('staff').select('id', { count: 'exact', head: true }).eq('business_id', business.id).eq('active', true),
      supabase.from('working_hours').select('id', { count: 'exact', head: true }).eq('business_id', business.id),
    ]).then(([services, staff, hours]) => setReadiness({ services: services.count || 0, staff: staff.count || 0, hours: hours.count || 0, loading: false }))
  }, [business.id])

  const checks = useMemo(() => [
    { ready: Boolean(business.name && business.slug), bg: 'Бизнес профил', en: 'Business profile' },
    { ready: readiness.services > 0, bg: 'Поне една активна услуга', en: 'At least one active service' },
    { ready: readiness.staff > 0, bg: 'Поне един активен специалист', en: 'At least one active specialist' },
    { ready: readiness.hours > 0, bg: 'Добавено работно време', en: 'Working hours added' },
  ], [business.name, business.slug, readiness])
  const ready = !readiness.loading && checks.every((check) => check.ready)

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}${bookingPath}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const steps = en ? [
    ['Customer discovery', 'Open the GoRez homepage and explain how clients choose a category and a real active business.', '/?lang=en', 'Open homepage'],
    ['Customer booking', 'Show services, specialists, the 14-day calendar, available times and the confirmation flow.', bookingPath, 'Open client page'],
    ['Business calendar', 'Return to the dashboard and show where the new booking appears and how it can be rescheduled.', '/dashboard/appointments', 'Open bookings'],
    ['Services and availability', 'Show how the owner changes services, the team, working hours and time off.', '/dashboard/settings', 'Open settings'],
    ['Sharing', 'Finish with the personal link, QR code, website button and private calendar feed.', '/dashboard/share', 'Open sharing'],
  ] : [
    ['Откриване от клиент', 'Отвори началната страница и покажи как клиентът избира категория и реален активен бизнес.', '/?lang=bg', 'Отвори началото'],
    ['Резервация от клиент', 'Покажи услугите, специалистите, 14-дневния календар, свободните часове и потвърждението.', bookingPath, 'Отвори клиентската страница'],
    ['Календар на бизнеса', 'Върни се в таблото и покажи къде се появява новият час и как се премества.', '/dashboard/appointments', 'Отвори резервациите'],
    ['Услуги и наличност', 'Покажи как собственикът променя услуги, екип, работно време и отсъствия.', '/dashboard/settings', 'Отвори настройките'],
    ['Споделяне', 'Завърши с личния линк, QR кода, бутона за сайт и частния календар.', '/dashboard/share', 'Отвори споделянето'],
  ]

  return <main className="dashboard-content admin-page demo-mode-page">
    <div className="admin-page-head"><div><p className="auth-kicker">{en ? 'Founder presentation' : 'Презентация за собственик'}</p><h2>{en ? 'Five-minute GoRez demo' : 'GoRez демо за пет минути'}</h2><p>{en ? 'A guided path from the client view to everyday business management.' : 'Подреден път от клиентската гледна точка до ежедневното управление на бизнеса.'}</p></div><button className="secondary-button" type="button" onClick={copyLink}>{copied ? (en ? 'Copied ✓' : 'Копирано ✓') : (en ? 'Copy client link' : 'Копирай клиентския линк')}</button></div>

    <section className={`demo-readiness-card ${ready ? 'ready' : ''}`}><div><span><Icon name={ready ? 'check' : 'clock'} /></span><div><small>{en ? 'DEMO READINESS' : 'ГОТОВНОСТ ЗА ДЕМО'}</small><h3>{readiness.loading ? (en ? 'Checking setup…' : 'Проверяваме настройката…') : ready ? (en ? 'This business is ready to demonstrate' : 'Този бизнес е готов за представяне') : (en ? 'Complete the missing setup first' : 'Довърши липсващите настройки')}</h3></div></div><div className="demo-readiness-list">{checks.map((check) => <span className={check.ready ? 'done' : ''} key={check.en}><i>{check.ready ? '✓' : '!'}</i>{check[locale]}</span>)}</div>{!ready && !readiness.loading && <Link className="primary-button" href="/dashboard/settings">{en ? 'Complete setup' : 'Довърши настройките'}</Link>}</section>

    <div className="demo-safety-note"><Icon name="clock" /><p><strong>{en ? 'This mode uses the real business profile.' : 'Този режим използва реалния бизнес профил.'}</strong> {en ? 'A booking created during the meeting is a real booking and will appear in the calendar. Use a clearly recognisable test name and cancel it after the presentation. No notification is promised unless email delivery is configured.' : 'Резервация, създадена по време на срещата, е реална и ще се появи в календара. Използвай ясно разпознаваемо тестово име и я отмени след представянето. Не обещавай известие, освен ако имейл доставката не е конфигурирана.'}</p></div>

    <section className="demo-steps"><div className="settings-panel-head"><h3>{en ? 'Presentation path' : 'Път на презентацията'}</h3><p>{en ? 'Open each step in order. The full story fits in about five minutes.' : 'Отваряй стъпките последователно. Цялото представяне се побира в около пет минути.'}</p></div>{steps.map(([title, text, href, action], index) => <article key={title}><b>0{index + 1}</b><div><h4>{title}</h4><p>{text}</p></div><Link className="secondary-button" href={href} target={index < 2 ? '_blank' : undefined}>{action} <Icon name="arrow" /></Link></article>)}</section>
  </main>
}

export default function DemoPage() {
  return <OwnerPage title={{ bg: 'Демо', en: 'Demo' }}>{(props) => <DemoContent {...props} />}</OwnerPage>
}
