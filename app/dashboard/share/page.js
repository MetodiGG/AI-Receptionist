'use client'

import { useState } from 'react'
import Link from 'next/link'
import { OwnerPage } from '../../../components/owner-page'
import { buildPublicBookingUrl, resolvePublicOrigin } from '../../../lib/public-url.mjs'

function ShareContent({ business, locale }) {
  const en = locale === 'en'
  const [copied, setCopied] = useState('')
  const [message, setMessage] = useState('')
  const runtimeOrigin = typeof window === 'undefined' ? '' : window.location.origin
  const publicOrigin = resolvePublicOrigin(process.env.NEXT_PUBLIC_APP_URL, runtimeOrigin)
  const bookingUrl = `${buildPublicBookingUrl(publicOrigin, business.slug)}?lang=${locale}`
  const calendarUrl = business.calendar_feed_token ? `${publicOrigin}/api/calendar/${business.calendar_feed_token}` : ''
  const qrUrl = `${runtimeOrigin}/api/public/${encodeURIComponent(business.slug)}/qr?lang=${locale}`
  const widgetCode = `<script src="${publicOrigin}/ai-receptionist-widget.js" data-business="${business.slug}" data-lang="${locale}" data-label="${en ? 'Book now' : 'Запази час'}" async></script>`
  const shareText = `${en ? 'Book an appointment at' : 'Запази час в'} ${business.name}: ${bookingUrl}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const emailUrl = `mailto:?subject=${encodeURIComponent(`${en ? 'Online booking at' : 'Онлайн резервация в'} ${business.name}`)}&body=${encodeURIComponent(shareText)}`

  async function copy(value, key) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setMessage(en ? 'Copied. You can paste it wherever you need.' : 'Копирано. Можеш да го поставиш където пожелаеш.')
      window.setTimeout(() => { setCopied(''); setMessage('') }, 2200)
    } catch {
      setMessage(en ? 'Select the address and use Copy in your browser.' : 'Маркирай адреса и използвай Copy от браузъра.')
    }
  }

  async function share() {
    if (!navigator.share) {
      await copy(bookingUrl, 'share')
      return
    }

    try {
      await navigator.share({ title: `${en ? 'Booking at' : 'Резервация в'} ${business.name}`, text: `${en ? 'Book an appointment at' : 'Запази час в'} ${business.name}`, url: bookingUrl })
    } catch (error) {
      if (error?.name !== 'AbortError') setMessage(en ? 'We could not open the share menu.' : 'Не успяхме да отворим менюто за споделяне.')
    }
  }

  if (business.platform_status !== 'enabled' || !business.active) return <main className="dashboard-content admin-page share-page"><section className="settings-panel"><h2>{en ? 'Sharing opens after publication' : 'Споделянето започва след публикуване'}</h2><p>{business.platform_status === 'pending' ? (en ? 'Prepare your services, team and schedule. GoRez will review the profile before clients can book. Questions: info@gorez.co.' : 'Подготви услугите, екипа и графика. GoRez ще прегледа профила, преди клиентите да могат да записват часове. Въпроси: info@gorez.co.') : (en ? 'This profile is not currently public. The booking link and QR code should not be shared with clients.' : 'В момента този профил не е публичен. Линкът и QR кодът не трябва да се споделят с клиенти.')}</p><p><Link className="secondary-button" href={`/dashboard/settings?lang=${locale}`}>{en ? 'Business settings' : 'Настройки на бизнеса'}</Link></p></section></main>

  return (
    <main className="dashboard-content admin-page share-page">
      <div className="admin-page-head">
        <div>
          <p className="auth-kicker">{en ? 'Share' : 'Споделяне'}</p>
          <h2>{en ? 'Your clients are one click away' : 'Клиентите ти са на един клик разстояние'}</h2>
          <p>{en ? 'Send the link directly or add booking to your business profile and website.' : 'Изпрати линка директно или добави резервациите към профила и сайта на бизнеса.'}</p>
        </div>
        <a className="primary-button" href={bookingUrl} target="_blank" rel="noreferrer">{en ? 'Open public page' : 'Отвори публичната страница'} ↗</a>
      </div>

      {message && <p className="share-message" role="status">{message}</p>}

      <section className="share-quick-card">
        <div className="share-link-intro">
          <span className="share-live-dot" aria-hidden="true" />
          <div><strong>{en ? 'Your public page is ready' : 'Публичната страница е готова'}</strong><small>{en ? 'This permanent address is suitable for clients and QR materials.' : 'Този постоянен адрес е подходящ за клиенти и QR материали.'}</small></div>
        </div>
        <div className="share-link-box"><span>{bookingUrl}</span><button type="button" onClick={() => copy(bookingUrl, 'link')}>{copied === 'link' ? (en ? 'Copied ✓' : 'Копирано ✓') : (en ? 'Copy link' : 'Копирай линка')}</button></div>
        <div className="share-actions" aria-label={en ? 'Sharing options' : 'Начини за споделяне'}>
          <button type="button" onClick={share}>{en ? 'Share from phone' : 'Сподели от телефона'}</button>
          <a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp</a>
          <a href={emailUrl}>{en ? 'Email' : 'Имейл'}</a>
          <a href={bookingUrl} target="_blank" rel="noreferrer">{en ? 'Open page' : 'Отвори страницата'}</a>
        </div>
      </section>

      <div className="share-grid">
        <section className="settings-panel share-primary">
          <div className="settings-panel-head"><h3>{en ? 'QR code for your location and ads' : 'QR код за мястото и рекламите'}</h3><p>{en ? 'Download it and place it at reception, on business cards, shop windows or social posts.' : 'Свали го и го постави на рецепцията, визитка, витрина или публикация.'}</p></div>
          <div className="qr-card">
            <div className="qr-preview"><img src={qrUrl} alt={`${en ? 'Booking QR code for' : 'QR код за резервации в'} ${business.name}`} /></div>
            <div><span className="share-step">{en ? 'SCAN → CHOOSE → BOOK' : 'СКАНИРАЙ → ИЗБЕРИ → ЗАПАЗИ'}</span><h4>{en ? 'Direct access to available times' : 'Директно към свободните часове'}</h4><p>{en ? 'The client does not need an account or an app.' : 'Клиентът не прави регистрация и не инсталира приложение.'}</p><div className="qr-actions"><a className="secondary-button" href={`${qrUrl}&download=1`}>{en ? 'Download QR code' : 'Изтегли QR кода'}</a><button className="ghost-button" type="button" onClick={() => copy(bookingUrl, 'qr-link')}>{copied === 'qr-link' ? (en ? 'Copied ✓' : 'Копирано ✓') : (en ? 'Copy address' : 'Копирай адреса')}</button></div></div>
          </div>
        </section>

        <section className="settings-panel embed-panel">
          <div className="settings-panel-head"><h3>{en ? 'Button for an existing website' : 'Бутон в съществуващ сайт'}</h3><p>{en ? 'Copy the code and send it to the person managing your website. It works with WordPress, Wix and standard websites.' : 'Копирай кода и го изпрати на човека, който поддържа сайта. Работи с WordPress, Wix и стандартен сайт.'}</p></div>
          <div className="widget-preview"><span>{en ? 'Preview' : 'Как ще изглежда'}</span><button type="button">✦ {en ? 'Book now' : 'Запази час'}</button></div>
          <details className="embed-details"><summary>{en ? 'Show embed code' : 'Покажи кода за вграждане'}</summary><textarea className="embed-code" readOnly value={widgetCode} /><button className="secondary-button" type="button" onClick={() => copy(widgetCode, 'widget')}>{copied === 'widget' ? (en ? 'Copied ✓' : 'Копирано ✓') : (en ? 'Copy code' : 'Копирай кода')}</button></details>
        </section>

        <section className="settings-panel calendar-feed-card">
          <div className="settings-panel-head"><h3>{en ? 'Business calendar' : 'Календар на бизнеса'}</h3><p>{en ? 'Add bookings to Google Calendar, Apple Calendar or Outlook using the private address.' : 'Добави резервациите към Google Calendar, Apple Calendar или Outlook чрез частния адрес.'}</p></div>
          {calendarUrl ? <><div className="copy-row"><input aria-label={en ? 'Private calendar address' : 'Частен адрес на календара'} readOnly value={calendarUrl} /><button className="secondary-button" type="button" onClick={() => copy(calendarUrl, 'calendar')}>{copied === 'calendar' ? (en ? 'Copied ✓' : 'Копирано ✓') : (en ? 'Copy' : 'Копирай')}</button></div><p className="security-note">{en ? 'This address provides read access to the calendar. Do not publish it or send it to clients.' : 'Този адрес дава достъп за четене на календара. Не го публикувай и не го изпращай на клиенти.'}</p></> : <p className="share-warning">{en ? 'Refresh the page to load the private calendar address.' : 'Обнови страницата, за да се зареди частният календарен адрес.'}</p>}
        </section>
      </div>
    </main>
  )
}

export default function SharePage() {
  return <OwnerPage title={{ bg: 'Споделяне', en: 'Share' }}>{(props) => <ShareContent {...props} />}</OwnerPage>
}

