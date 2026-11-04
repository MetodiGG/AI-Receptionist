'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { BrandLogo } from './brand-logo'
import { Icon } from './icon'
import { LanguageSwitch } from './language-switch'
import { usePublicLocale } from '../hooks/use-public-locale'
import { INDUSTRY_KEYS, getIndustryLabel } from '../lib/public-locale.mjs'
import { MarketingNavigation } from './marketing-navigation'
import { SiteFooter } from './site-footer'
import { PRICING_COPY } from '../lib/product-config.mjs'
import { leadSubmissionSchema } from '../lib/partner-submission.mjs'
import { trackProductEvent } from '../lib/product-events-client'
import { BUSINESS_FAQ } from '../lib/faq.mjs'

const COPY = {
  bg: {
    navBenefits: 'Предимства', navHow: 'Как работи', navFaq: 'ЧЗВ', login: 'Вход за бизнес',
    kicker: 'GoRez за бизнеса', title: 'Повече време за клиентите.', titleEm: 'По-малко време за записвания.',
    lead: 'Организирай резервациите си на едно място и позволи на клиентите да запазват час онлайн, когато им е удобно.',
    primary: 'Добави бизнеса си безплатно', secondary: 'Виж как работи',
    pilot: PRICING_COPY.bg.summary,
    benefitsKicker: 'Практични ползи', benefitsTitle: 'Защо GoRez?',
    benefits: [
      ['calendar', 'Резервации 24/7', 'Клиентите могат да избират свободни часове дори когато не отговаряш на телефона.'],
      ['mail', 'Имейл напомняния', 'При включени известия клиентите получават напомняне около 24 часа преди посещението.'],
      ['clock', 'Организиран календар', 'Управлявай предстоящите часове, промени и откази от собствено табло.'],
      ['external', 'Личен линк за резервации', 'Сподели страницата си в Instagram, Facebook, Google профила или сайта си.'],
      ['calendarSearch', 'QR код за бърз достъп', 'Клиентът сканира кода и отваря директно страницата ти за резервации.'],
      ['spark', 'Лесно начало', 'Добави услугите, екипа и работното време чрез кратка настройка стъпка по стъпка.'],
    ],
    howKicker: 'Три ясни стъпки', howTitle: 'От заявка до първа онлайн резервация.',
    steps: [
      ['Изпрати кратка заявка', 'Остави контакт и информация за бизнеса. Ще уточним нуждите и първоначалната настройка.'],
      ['Настрой профила си', 'Добави услуги, цени, екип и работно време. GoRez показва само реално свободни часове.'],
      ['Сподели и приемай часове', 'Получи личен линк и QR код и виж новите резервации в таблото си.'],
    ],
    previewKicker: 'Какво получава бизнесът', previewTitle: 'Клиентският път и календарът работят заедно.',
    formKicker: 'Начало с GoRez', formTitle: 'Добави бизнеса си безплатно', formLead: 'Попълването отнема около минута. Ще се свържем лично, за да помогнем с настройката.',
    fields: { businessName: 'Име на бизнеса', contactName: 'Лице за контакт (по желание)', phone: 'Телефон', email: 'Имейл', category: 'Категория', city: 'Град (по желание)', websiteUrl: 'Instagram или уебсайт (незадължително)' },
    choose: 'Избери категория', submit: 'Изпрати заявка', submitting: 'Изпращане…', required: 'Задължително поле',
    successTitle: 'Заявката е получена', success: 'Благодарим за интереса към GoRez! Получихме заявката ти за преглед и настройване. Все още няма създаден или публикуван бизнес профил.',
    error: 'Не успяхме да изпратим заявката. Провери данните и опитай отново.',
    privacy: 'Данните се използват само за контакт относно присъединяването към GoRez.',
    faqKicker: 'Ясни отговори', faqTitle: 'Преди да започнем.',
    faq: [
      ['Как да добавя бизнеса си?', 'Изпрати кратката заявка на тази страница. Ще се свържем лично и ще помогнем с профила, услугите и работното време.'],
      ['Нужно ли е да имам собствен сайт?', 'Не. Получаваш собствен GoRez линк, който можеш да споделяш директно. Ако имаш сайт, можеш да добавиш и готов booking бутон.'],
      ['Мога ли да управлявам работното си време?', 'Да. В таблото настройваш график за всеки специалист и можеш да блокираш почивки и отсъствия.'],
      ['Как получавам новите резервации?', 'Новите резервации са в календара на бизнеса. При включени имейл известия се изпращат потвърждение към клиента и известие към бизнеса. За часове, записани повече от 24 часа предварително, е планирано напомняне около 24 часа преди посещението.'],
      ['Мога ли да редактирам или отменям часове?', 'Можеш да преместваш и променяш статуса на резервациите от таблото. Клиентът може да откаже чрез личния си защитен линк в позволения срок.'],
      ['Колко струва GoRez?', PRICING_COPY.bg.summary],
      ['Какво се случва след безплатния период?', PRICING_COPY.bg.afterTrial],
      ['Мога ли да прекратя използването?', 'Да. Можеш да поискаш спиране на профила и обработване на данните според приложимите правила и договорените условия.'],
    ],
    footer: 'Онлайн резервации за бизнеси, които работят с часове.', home: 'Начало', terms: 'Условия', privacyLink: 'Поверителност',
  },
  en: {
    navBenefits: 'Benefits', navHow: 'How it works', navFaq: 'FAQ', login: 'Business login',
    kicker: 'GoRez for business', title: 'More time for clients.', titleEm: 'Less time spent on bookings.',
    lead: 'Keep appointments in one place and let clients book online whenever it suits them.',
    primary: 'Add your business for free', secondary: 'See how it works',
    pilot: PRICING_COPY.en.summary,
    benefitsKicker: 'Practical benefits', benefitsTitle: 'Why GoRez?',
    benefits: [
      ['calendar', 'Bookings 24/7', 'Clients can choose an available time even when you cannot answer the phone.'],
      ['mail', 'Email reminders', 'When enabled, clients receive a reminder around 24 hours before their appointment.'],
      ['clock', 'Organised calendar', 'Manage upcoming appointments, changes and cancellations from your own dashboard.'],
      ['external', 'Personal booking link', 'Share your page on Instagram, Facebook, your Google profile or your website.'],
      ['calendarSearch', 'Quick-access QR code', 'Clients scan the code to open your booking page directly.'],
      ['spark', 'Easy setup', 'Add services, your team and working hours through a short guided setup.'],
    ],
    howKicker: 'Three clear steps', howTitle: 'From application to your first online booking.',
    steps: [
      ['Send a short application', 'Share your contact and business details. We will discuss your needs and initial setup.'],
      ['Set up your profile', 'Add services, prices, your team and working hours. GoRez shows only genuinely available times.'],
      ['Share and receive bookings', 'Get a personal link and QR code and see new bookings in your dashboard.'],
    ],
    previewKicker: 'What the business receives', previewTitle: 'The client journey and business calendar work together.',
    formKicker: 'Get started', formTitle: 'Add your business for free', formLead: 'It takes about a minute. We will contact you personally and help with setup.',
    fields: { businessName: 'Business name', contactName: 'Contact person (optional)', phone: 'Phone', email: 'Email', category: 'Category', city: 'City (optional)', websiteUrl: 'Instagram or website (optional)' },
    choose: 'Choose a category', submit: 'Send application', submitting: 'Sending…', required: 'Required field',
    successTitle: 'Application received', success: 'Thank you for your interest in GoRez! We received your application for review and setup. No business profile has been created or published yet.',
    error: 'We could not send the application. Check your details and try again.',
    privacy: 'Your details are used only to contact you about joining GoRez.',
    faqKicker: 'Clear answers', faqTitle: 'Before we get started.',
    faq: [
      ['How do I add my business?', 'Send the short application on this page. We will contact you personally and help set up your profile, services and working hours.'],
      ['Do I need my own website?', 'No. You receive a GoRez link you can share directly. If you have a website, you can also add the ready-made booking button.'],
      ['Can I manage my working hours?', 'Yes. The dashboard lets you set a schedule for each specialist and block breaks or time off.'],
      ['How do I receive new bookings?', 'New bookings appear in the business calendar. When email notifications are enabled, a confirmation is sent to the client and a notification to the business. Bookings made more than 24 hours ahead have a reminder scheduled around 24 hours before the visit.'],
      ['Can I edit or cancel appointments?', 'You can reschedule appointments and update their status in the dashboard. Clients can cancel through their private secure link within the allowed period.'],
      ['How much does GoRez cost?', PRICING_COPY.en.summary],
      ['What happens after the free period?', PRICING_COPY.en.afterTrial],
      ['Can I stop using GoRez?', 'Yes. You can request profile deactivation and data handling according to the applicable rules and agreed terms.'],
    ],
    footer: 'Online booking for appointment-based businesses.', home: 'Home', terms: 'Terms', privacyLink: 'Privacy',
  },
}

const EMPTY_FORM = { businessName: '', contactName: '', phone: '', email: '', category: '', city: '', websiteUrl: '', company: '' }

function ProductPreview({ locale }) {
  const en = locale === 'en'
  return <div className="business-product-preview" aria-label={en ? 'GoRez interface preview' : 'Преглед на интерфейса на GoRez'}>
    <div className="preview-browser-bar"><i /><i /><i /><span>{en ? 'Illustrative interface · not real bookings' : 'Илюстративен интерфейс · не реални резервации'}</span></div>
    <div className="preview-content">
      <aside><BrandLogo compact decorative /><span className="active"><Icon name="calendar" /> {en ? 'Bookings' : 'Резервации'}</span><span><Icon name="users" /> {en ? 'Clients' : 'Клиенти'}</span><span><Icon name="settings" /> {en ? 'Settings' : 'Настройки'}</span></aside>
      <section><small>{en ? 'TODAY' : 'ДНЕС'}</small><h3>{en ? 'Your bookings' : 'Твоите резервации'}</h3><div className="preview-stat-row"><span><b>4</b>{en ? 'appointments' : 'часа'}</span><span><b>2</b>{en ? 'available' : 'свободни'}</span></div><div className="preview-appointment"><time>10:30</time><div><strong>{en ? 'Service' : 'Услуга'}</strong><small>{en ? 'Confirmed appointment' : 'Потвърдена резервация'}</small></div><i>✓</i></div><div className="preview-appointment"><time>14:00</time><div><strong>{en ? 'Available time' : 'Свободен час'}</strong><small>{en ? 'Visible to clients' : 'Видим за клиентите'}</small></div><i className="open" /></div></section>
    </div>
  </div>
}

export function BusinessLanding({ initialLocale='bg',identity={},preview=null }) {
  const { locale,setLocale }=usePublicLocale(initialLocale, !preview),en=locale==='en',copy=COPY[locale]
  const [form,setForm]=useState(EMPTY_FORM),[status,setStatus]=useState('idle'),[message,setMessage]=useState(''),[errors,setErrors]=useState({})
  const submitting=useRef(false),formRef=useRef(null)
  function update(field,value){setForm(current=>({...current,[field]:value}));setErrors(current=>({...current,[field]:''}));trackProductEvent('form_start','for-businesses',locale)}
  async function submit(event){
    event.preventDefault()
    if(submitting.current)return
    const parsed=leadSubmissionSchema.safeParse({...form,locale})
    if(!parsed.success){const issues=Object.fromEntries(parsed.error.issues.map(issue=>[issue.path[0],en?'Please check this field.':'Провери това поле.']));setErrors(issues);setMessage(en?'Check the highlighted fields.':'Провери отбелязаните полета.');setTimeout(()=>formRef.current?.querySelector('[aria-invalid="true"]')?.focus(),0);return}
    submitting.current=true;setStatus('submitting');setMessage('');setErrors({})
    trackProductEvent('form_submit','for-businesses',locale)
    try{
      const response=preview?Response.json(preview==='success'?{ok:true}:{error:true},{status:preview==='rate-limit'?429:preview==='error'?503:201}):await fetch('/api/public/partner-leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(parsed.data),signal:AbortSignal.timeout(15000)})
      const result=await response.json()
      if(!response.ok||result.ok!==true)throw new Error(response.status===429?'RATE_LIMITED':'SUBMISSION_FAILED')
      trackProductEvent('business_signup_success','for-businesses',locale)
      setForm(EMPTY_FORM);setStatus('success')
    }catch(problem){setMessage(problem.message==='RATE_LIMITED'?(en?'Too many applications. Please try again later.':'Твърде много заявки. Опитай отново по-късно.'):copy.error);setStatus('error')}
    finally{submitting.current=false}
  }
  const field=(key,required=false,type='text',autoComplete)=> <label className={key==='websiteUrl'?'full':''}><span>{copy.fields[key]}{required?' *':''}</span><input id={`lead-${key}`} name={key} required={required} minLength={['businessName','contactName','city'].includes(key)?2:undefined} maxLength={key==='websiteUrl'?300:key==='email'?180:key==='businessName'?120:key==='phone'?32:100} type={type} autoComplete={autoComplete} value={form[key]} onChange={event=>update(key,event.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key]?`lead-${key}-error`:undefined} placeholder={key==='websiteUrl'?'https://':undefined}/>{errors[key]&&<small id={`lead-${key}-error`} className="launch-field-error">{errors[key]}</small>}</label>
  return <main className="marketing-page business-landing-page launch-business-page">
    {preview&&<p className="launch-preview-label">{en?'LOCAL TEST · fictional data · no submissions or emails':'ЛОКАЛЕН ТЕСТ · измислени данни · без заявки и имейли'}</p>}
    <a href="#join" className="skip-link">{en?'Skip to application':'Към заявката'}</a>
    <MarketingNavigation locale={locale} setLocale={setLocale} business/>
    <section className="business-landing-hero"><div className="business-hero-copy"><p className="marketing-kicker">{copy.kicker}</p><h1>{copy.title}<br/><em>{copy.titleEm}</em></h1><p>{copy.lead}</p><div className="marketing-hero-actions"><a className="marketing-primary-cta" href="#join" onClick={()=>trackProductEvent('cta_add_business_click','for-businesses',locale)}>{copy.primary}<Icon name="arrow"/></a><a className="launch-secondary-cta" href="#how">{copy.secondary}</a></div><div className="business-pilot-note"><Icon name="check"/><span>{copy.pilot}</span></div></div><ProductPreview locale={locale}/></section>
    <section className="business-benefits-section" id="benefits"><div className="directory-heading"><p className="marketing-kicker dark">{copy.benefitsKicker}</p><h2>{copy.benefitsTitle}</h2></div><div className="business-benefit-grid">{copy.benefits.map(([icon,title,text])=><article key={title}><span><Icon name={icon}/></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section className="business-how-section" id="how"><div className="directory-heading"><p className="marketing-kicker">{copy.howKicker}</p><h2>{copy.howTitle}</h2></div><div className="business-how-grid">{copy.steps.map(([title,text],index)=><article key={title}><b>0{index+1}</b><div><h3>{title}</h3><p>{text}</p></div></article>)}</div><div className="launch-assistant-note"><Icon name="chat"/><div><h3>{en?'A guided assistant, not guesswork.':'Асистент, който води през записването.'}</h3><p>{en?'Answers about published services, prices, hours and contact details. Helps clients choose real availability and review their booking before confirming.':'Отговаря за публикуваните услуги, цени, работно време и контакти. Помага за избор на реален свободен час и преглед преди потвърждение.'}</p><small>{en?'Uses the business data and a guided flow, not a generative AI model.':'Използва данните на бизнеса и насочван процес, не генеративен AI модел.'}</small></div></div></section>
    <section className="launch-pricing" id="pricing"><div><p className="marketing-kicker">GoRez</p><h2>{PRICING_COPY[locale].trial}</h2><p>{PRICING_COPY[locale].summary}</p><p>{PRICING_COPY[locale].afterTrial}</p></div><div className="launch-price-card"><small>{en?'Subscription terms':'Абонаментни условия'}</small><strong>{PRICING_COPY[locale].contact}</strong><span><Icon name="check"/>{en?'Calendar, booking page and QR code':'Календар, страница за записване и QR код'}</span><span><Icon name="check"/>{en?'No website required':'Без нужда от собствен сайт'}</span><a className="marketing-primary-cta" href="#join">{copy.primary}<Icon name="arrow"/></a></div></section>
    <section className="business-join-section" id="join"><div className="business-join-copy"><p className="marketing-kicker">{copy.formKicker}</p><h2>{copy.formTitle}</h2><p>{copy.formLead}</p><p>{PRICING_COPY[locale].summary}</p><p className="launch-application-explanation">{en?'This is an application for manual review and setup, not an account registration.':'Това е заявка за преглед и настройване, не регистрация на акаунт.'}</p></div>
      <div className="partner-form-card">{status==='success'?<div className="partner-success" role="status"><span><Icon name="check"/></span><h3>{copy.successTitle}</h3><p>{copy.success}</p><Link className="secondary-button" href={`/?lang=${locale}`}>{copy.home}</Link></div>:<form ref={formRef} onSubmit={submit} aria-busy={status==='submitting'}><fieldset disabled={status==='submitting'} className="launch-partner-fields"><div className="partner-form-grid">
        {field('businessName',true,'text','organization')}{field('phone',true,'tel','tel')}{field('email',true,'email','email')}
        <label><span>{copy.fields.category} *</span><select id="lead-category" name="category" required value={form.category} onChange={event=>update('category',event.target.value)} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category?'lead-category-error':undefined}><option value="">{copy.choose}</option>{INDUSTRY_KEYS.map(key=><option value={key} key={key}>{getIndustryLabel(key,locale)}</option>)}</select>{errors.category&&<small id="lead-category-error" className="launch-field-error">{errors.category}</small>}</label>
        {field('contactName',false,'text','name')}{field('city',false,'text','address-level2')}{field('websiteUrl',false,'url','url')}
        <label className="partner-honeypot" aria-hidden="true"><span>Company</span><input name="company" tabIndex={-1} autoComplete="off" value={form.company} onChange={event=>update('company',event.target.value)}/></label>
      </div>{message&&<p className="form-message" role="alert">{message}</p>}<button className="primary-button partner-submit" type="submit">{status==='submitting'?copy.submitting:copy.submit}<Icon name="arrow"/></button></fieldset><p className="partner-privacy"><Link href={`/privacy?lang=${locale}`}>{copy.privacyLink}</Link> · <Link href={`/terms?lang=${locale}`}>{copy.terms}</Link></p></form>}</div>
    </section>
    <section className="business-faq-section" id="faq"><div className="directory-heading"><h2>{copy.faqTitle}</h2></div><div className="business-faq-list">{BUSINESS_FAQ.filter(row=>['apply','website-needed','existing-calendar','opening-hours','business-emails','trial','after-trial','stop-business'].includes(row.id)).map((row,index)=><details key={row.id} open={index===0}><summary>{row[locale].question}<span>+</span></summary><p>{row[locale].answer}</p></details>)}</div><Link className="secondary-button" href={`/faq?lang=${locale}`}>{en?'All questions & answers':'Всички въпроси и отговори'} →</Link></section>
    <SiteFooter locale={locale} identity={identity}/>
  </main>
}
