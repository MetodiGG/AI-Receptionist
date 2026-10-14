'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BrandLogo } from './brand-logo'
import { Icon } from './icon'
import { LanguageSwitch } from './language-switch'
import { usePublicLocale } from '../hooks/use-public-locale'
import { INDUSTRY_KEYS, getIndustryLabel } from '../lib/public-locale.mjs'

const COPY = {
  bg: {
    navBenefits: 'Предимства', navHow: 'Как работи', navFaq: 'Въпроси', login: 'Вход за бизнес',
    kicker: 'GoRez за бизнеса', title: 'Повече време за клиентите.', titleEm: 'По-малко време за записвания.',
    lead: 'Организирай резервациите си на едно място и позволи на клиентите да запазват час онлайн, когато им е удобно.',
    primary: 'Добави бизнеса си безплатно', secondary: 'Виж как работи',
    pilot: 'В момента приемаме ранни бизнес партньори. Заявката и първоначалната настройка са безплатни; бъдещи условия не се активират без изрично съгласие.',
    benefitsKicker: 'Практични ползи', benefitsTitle: 'Всичко необходимо за по-лесно записване.',
    benefits: [
      ['calendar', 'Резервации 24/7', 'Клиентите могат да избират свободни часове дори когато не отговаряш на телефона.'],
      ['chat', 'По-малко съобщения', 'Услугите, цените и реално свободните часове са видими на едно място.'],
      ['clock', 'Организиран календар', 'Управлявай предстоящите часове, промени и откази от собствено табло.'],
      ['external', 'Личен линк за резервации', 'Сподели страницата си в Instagram, Facebook, Google профила или сайта си.'],
      ['users', 'По-лесно обслужване', 'Клиентите избират услуга, специалист, дата и удобен час без регистрация.'],
      ['spark', 'Лесно начало', 'Добави услугите, екипа и работното време чрез кратка настройка стъпка по стъпка.'],
    ],
    howKicker: 'Три ясни стъпки', howTitle: 'От заявка до първа онлайн резервация.',
    steps: [
      ['Изпрати кратка заявка', 'Остави контакт и информация за бизнеса. Ще уточним реалните нужди и пилотните условия.'],
      ['Настрой профила си', 'Добави услуги, цени, екип и работно време. GoRez показва само реално свободни часове.'],
      ['Сподели и приемай часове', 'Получи личен линк и QR код и виж новите резервации в таблото си.'],
    ],
    previewKicker: 'Какво получава бизнесът', previewTitle: 'Клиентският път и календарът работят заедно.',
    formKicker: 'Ранен достъп', formTitle: 'Добави бизнеса си безплатно', formLead: 'Попълването отнема около минута. Ще се свържем лично, за да помогнем с настройката.',
    fields: { businessName: 'Име на бизнеса', contactName: 'Лице за контакт', phone: 'Телефон', email: 'Имейл', category: 'Категория', city: 'Град', websiteUrl: 'Instagram или уебсайт (незадължително)' },
    choose: 'Избери категория', submit: 'Изпрати заявка', submitting: 'Изпращане…', required: 'Задължително поле',
    successTitle: 'Заявката е получена', success: 'Благодарим за интереса към GoRez! Получихме заявката ти и ще се свържем с теб, за да помогнем с настройката.',
    error: 'Не успяхме да изпратим заявката. Провери данните и опитай отново.',
    privacy: 'Данните се използват само за контакт относно присъединяването към GoRez.',
    faqKicker: 'Ясни отговори', faqTitle: 'Преди да започнем.',
    faq: [
      ['Как да добавя бизнеса си?', 'Изпрати кратката заявка на тази страница. Ще се свържем лично и ще помогнем с профила, услугите и работното време.'],
      ['Нужно ли е да имам собствен сайт?', 'Не. Получаваш собствен GoRez линк, който можеш да споделяш директно. Ако имаш сайт, можеш да добавиш и готов booking бутон.'],
      ['Мога ли да управлявам работното си време?', 'Да. В таблото настройваш график за всеки специалист и можеш да блокираш почивки и отсъствия.'],
      ['Как получавам новите резервации?', 'Всяка успешна резервация се появява веднага в календара на бизнеса. Имейл известия работят само когато доставчикът е конфигуриран.'],
      ['Мога ли да редактирам или отменям часове?', 'Можеш да преместваш и променяш статуса на резервациите от таблото. Клиентът може да откаже чрез личния си защитен линк в позволения срок.'],
      ['Колко струва GoRez?', 'В момента приемаме ранни бизнес партньори. Свържи се с нас за актуалните условия за участие. Не се активира платен абонамент без изрично съгласие.'],
      ['Какво се случва след пилотния период?', 'Ще обсъдим резултатите и бъдещите условия предварително. Няма автоматично преминаване към платен план.'],
      ['Мога ли да прекратя използването?', 'Да. Можеш да поискаш спиране на профила и обработване на данните според приложимите правила и договорените условия.'],
    ],
    footer: 'Онлайн резервации за бизнеси, които работят с часове.', home: 'Начало', terms: 'Условия', privacyLink: 'Поверителност',
  },
  en: {
    navBenefits: 'Benefits', navHow: 'How it works', navFaq: 'FAQ', login: 'Business login',
    kicker: 'GoRez for business', title: 'More time for clients.', titleEm: 'Less time spent on bookings.',
    lead: 'Keep appointments in one place and let clients book online whenever it suits them.',
    primary: 'Add your business for free', secondary: 'See how it works',
    pilot: 'We are currently welcoming early business partners. Your application and initial setup are free; future terms are never activated without explicit consent.',
    benefitsKicker: 'Practical benefits', benefitsTitle: 'Everything you need for easier booking.',
    benefits: [
      ['calendar', 'Bookings 24/7', 'Clients can choose an available time even when you cannot answer the phone.'],
      ['chat', 'Fewer messages', 'Services, prices and real availability are visible in one place.'],
      ['clock', 'Organised calendar', 'Manage upcoming appointments, changes and cancellations from your own dashboard.'],
      ['external', 'Personal booking link', 'Share your page on Instagram, Facebook, your Google profile or your website.'],
      ['users', 'Easier service', 'Clients choose a service, specialist, date and time without creating an account.'],
      ['spark', 'Easy setup', 'Add services, your team and working hours through a short guided setup.'],
    ],
    howKicker: 'Three clear steps', howTitle: 'From application to your first online booking.',
    steps: [
      ['Send a short application', 'Share your contact and business details. We will clarify your real needs and pilot terms.'],
      ['Set up your profile', 'Add services, prices, your team and working hours. GoRez shows only genuinely available times.'],
      ['Share and receive bookings', 'Get a personal link and QR code and see new bookings in your dashboard.'],
    ],
    previewKicker: 'What the business receives', previewTitle: 'The client journey and business calendar work together.',
    formKicker: 'Early access', formTitle: 'Add your business for free', formLead: 'It takes about a minute. We will contact you personally and help with setup.',
    fields: { businessName: 'Business name', contactName: 'Contact person', phone: 'Phone', email: 'Email', category: 'Category', city: 'City', websiteUrl: 'Instagram or website (optional)' },
    choose: 'Choose a category', submit: 'Send application', submitting: 'Sending…', required: 'Required field',
    successTitle: 'Application received', success: 'Thank you for your interest in GoRez! We received your application and will contact you to help with setup.',
    error: 'We could not send the application. Check your details and try again.',
    privacy: 'Your details are used only to contact you about joining GoRez.',
    faqKicker: 'Clear answers', faqTitle: 'Before we get started.',
    faq: [
      ['How do I add my business?', 'Send the short application on this page. We will contact you personally and help set up your profile, services and working hours.'],
      ['Do I need my own website?', 'No. You receive a GoRez link you can share directly. If you have a website, you can also add the ready-made booking button.'],
      ['Can I manage my working hours?', 'Yes. The dashboard lets you set a schedule for each specialist and block breaks or time off.'],
      ['How do I receive new bookings?', 'Every successful booking appears in the business calendar immediately. Email notifications work only when the provider is configured.'],
      ['Can I edit or cancel appointments?', 'You can reschedule appointments and update their status in the dashboard. Clients can cancel through their private secure link within the allowed period.'],
      ['How much does GoRez cost?', 'We are currently welcoming early business partners. Contact us for the current participation terms. No paid subscription is activated without explicit consent.'],
      ['What happens after the pilot?', 'We will discuss results and future terms in advance. There is no automatic conversion to a paid plan.'],
      ['Can I stop using GoRez?', 'Yes. You can request profile deactivation and data handling according to the applicable rules and agreed terms.'],
    ],
    footer: 'Online booking for appointment-based businesses.', home: 'Home', terms: 'Terms', privacyLink: 'Privacy',
  },
}

const EMPTY_FORM = { businessName: '', contactName: '', phone: '', email: '', category: '', city: '', websiteUrl: '', company: '' }

function ProductPreview({ locale }) {
  const en = locale === 'en'
  return <div className="business-product-preview" aria-label={en ? 'GoRez interface preview' : 'Преглед на интерфейса на GoRez'}>
    <div className="preview-browser-bar"><i /><i /><i /><span>GoRez</span></div>
    <div className="preview-content">
      <aside><BrandLogo compact decorative /><span className="active"><Icon name="calendar" /> {en ? 'Bookings' : 'Резервации'}</span><span><Icon name="users" /> {en ? 'Clients' : 'Клиенти'}</span><span><Icon name="settings" /> {en ? 'Settings' : 'Настройки'}</span></aside>
      <section><small>{en ? 'TODAY' : 'ДНЕС'}</small><h3>{en ? 'Your bookings' : 'Твоите резервации'}</h3><div className="preview-stat-row"><span><b>4</b>{en ? 'appointments' : 'часа'}</span><span><b>2</b>{en ? 'available' : 'свободни'}</span></div><div className="preview-appointment"><time>10:30</time><div><strong>{en ? 'Service' : 'Услуга'}</strong><small>{en ? 'Confirmed appointment' : 'Потвърдена резервация'}</small></div><i>✓</i></div><div className="preview-appointment"><time>14:00</time><div><strong>{en ? 'Available time' : 'Свободен час'}</strong><small>{en ? 'Visible to clients' : 'Видим за клиентите'}</small></div><i className="open" /></div></section>
    </div>
  </div>
}

export function BusinessLanding() {
  const { locale, setLocale } = usePublicLocale()
  const copy = COPY[locale]
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting'); setMessage('')
    try {
      const response = await fetch('/api/public/partner-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locale }),
      })
      if (!response.ok) throw new Error('SUBMISSION_FAILED')
      setForm(EMPTY_FORM); setStatus('success')
    } catch {
      setMessage(copy.error); setStatus('error')
    }
  }

  return <main className="marketing-page business-landing-page">
    <nav className="marketing-nav platform-nav business-landing-nav" aria-label={locale === 'bg' ? 'Основна навигация' : 'Main navigation'}>
      <Link href={`/?lang=${locale}`} aria-label="GoRez"><BrandLogo className="marketing-logo" eager /></Link>
      <div className="marketing-nav-links"><a href="#benefits">{copy.navBenefits}</a><a href="#how">{copy.navHow}</a><a href="#faq">{copy.navFaq}</a></div>
      <div className="platform-nav-actions"><LanguageSwitch locale={locale} onChange={setLocale} compact /><Link className="marketing-nav-cta" href={`/?lang=${locale}#business`}>{copy.login} <Icon name="arrow" /></Link></div>
    </nav>

    <section className="business-landing-hero"><div className="business-hero-copy"><p className="marketing-kicker"><span /> {copy.kicker}</p><h1>{copy.title}<br /><em>{copy.titleEm}</em></h1><p>{copy.lead}</p><div className="marketing-hero-actions"><a className="marketing-primary-cta" href="#join">{copy.primary} <Icon name="arrow" /></a><a className="marketing-secondary-cta" href="#how">{copy.secondary}</a></div><div className="business-pilot-note"><Icon name="check" /><span>{copy.pilot}</span></div></div><ProductPreview locale={locale} /></section>

    <section className="business-benefits-section" id="benefits"><div className="directory-heading"><p className="marketing-kicker dark"><span /> {copy.benefitsKicker}</p><h2>{copy.benefitsTitle}</h2></div><div className="business-benefit-grid">{copy.benefits.map(([icon, title, text]) => <article key={title}><span><Icon name={icon} /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

    <section className="business-how-section" id="how"><div className="directory-heading"><p className="marketing-kicker"><span /> {copy.howKicker}</p><h2>{copy.howTitle}</h2></div><div className="business-how-grid">{copy.steps.map(([title, text], index) => <article key={title}><b>0{index + 1}</b><div><h3>{title}</h3><p>{text}</p></div></article>)}</div><div className="business-preview-caption"><span>{copy.previewKicker}</span><strong>{copy.previewTitle}</strong></div></section>

    <section className="business-join-section" id="join"><div className="business-join-copy"><p className="marketing-kicker"><span /> {copy.formKicker}</p><h2>{copy.formTitle}</h2><p>{copy.formLead}</p><div className="business-join-points"><span><Icon name="check" /> {locale === 'en' ? 'No payment details' : 'Без данни за плащане'}</span><span><Icon name="check" /> {locale === 'en' ? 'Personal setup help' : 'Лична помощ за настройката'}</span><span><Icon name="check" /> {locale === 'en' ? 'No automatic paid plan' : 'Без автоматичен платен план'}</span></div></div>
      <div className="partner-form-card">
        {status === 'success' ? <div className="partner-success" role="status"><span><Icon name="check" /></span><h3>{copy.successTitle}</h3><p>{copy.success}</p><Link className="secondary-button" href={`/?lang=${locale}`}>{copy.home}</Link></div> : <form onSubmit={submit}><div className="partner-form-grid"><label><span>{copy.fields.businessName} *</span><input required minLength="2" maxLength="120" value={form.businessName} onChange={(event) => update('businessName', event.target.value)} autoComplete="organization" /></label><label><span>{copy.fields.contactName} *</span><input required minLength="2" maxLength="100" value={form.contactName} onChange={(event) => update('contactName', event.target.value)} autoComplete="name" /></label><label><span>{copy.fields.phone} *</span><input required minLength="6" maxLength="32" type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} autoComplete="tel" /></label><label><span>{copy.fields.email} *</span><input required maxLength="180" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" /></label><label><span>{copy.fields.category} *</span><select required value={form.category} onChange={(event) => update('category', event.target.value)}><option value="">{copy.choose}</option>{INDUSTRY_KEYS.map((key) => <option value={key} key={key}>{getIndustryLabel(key, locale)}</option>)}</select></label><label><span>{copy.fields.city} *</span><input required minLength="2" maxLength="100" value={form.city} onChange={(event) => update('city', event.target.value)} autoComplete="address-level2" /></label><label className="full"><span>{copy.fields.websiteUrl}</span><input maxLength="300" type="url" value={form.websiteUrl} onChange={(event) => update('websiteUrl', event.target.value)} placeholder="https://" /></label><label className="partner-honeypot" aria-hidden="true"><span>Company</span><input tabIndex="-1" autoComplete="off" value={form.company} onChange={(event) => update('company', event.target.value)} /></label></div>{message && <p className="form-message" role="alert">{message}</p>}<button className="primary-button partner-submit" type="submit" disabled={status === 'submitting'}>{status === 'submitting' ? copy.submitting : copy.submit}{status !== 'submitting' && <Icon name="arrow" />}</button><p className="partner-privacy"><Icon name="check" /> {copy.privacy}</p></form>}
      </div>
    </section>

    <section className="business-faq-section" id="faq"><div className="directory-heading"><p className="marketing-kicker dark"><span /> {copy.faqKicker}</p><h2>{copy.faqTitle}</h2></div><div className="business-faq-list">{copy.faq.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>

    <footer className="marketing-footer platform-footer business-landing-footer"><BrandLogo className="marketing-logo" /><span>{copy.footer}</span><div><Link href={`/?lang=${locale}`}>{copy.home}</Link><Link href={`/privacy?lang=${locale}`}>{copy.privacyLink}</Link><Link href={`/terms?lang=${locale}`}>{copy.terms}</Link></div></footer>
  </main>
}
