'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { Icon } from './icon'
import { getIndustryServiceTemplate } from '../lib/industry-templates.mjs'
import { BusinessLocationFields } from './business-location-fields'
import { WeeklyScheduleFields } from './weekly-schedule-fields'
import { DurationInput } from './duration-input'
import { PhotoPicker } from './photo-picker'
import { APPLICATION_PHOTO_BUDGET, mediaErrorText } from '../lib/business-media.mjs'
import { fitPhotoFilesToBudget } from '../lib/photo-selection'
import { businessAddress, businessLocationFields, findCity } from '../lib/business-location.mjs'
import { validDuration, scheduleProblem, scheduleRows, scheduleErrorText } from '../lib/business-schedule.mjs'
import { BookingModeFields } from './booking-mode-fields'
import { OpeningHoursEditor } from './opening-hours-editor'
import { safeBookingUrl, emptyOpeningHours, openingHoursSchema } from '../lib/booking-mode.mjs'
import { businessPageSlug } from '../lib/business-slug.mjs'
import { CatalogueBusinessLookup } from './catalogue-business-lookup'
import { CatalogueImportReview } from './catalogue-import-review'
import { emptyOnboardingService, hasServiceDraftEdits, selectCatalogueBusinessDraft, editOnboardingBusinessDraft, normalizeImportedServices, servicesForApplication } from '../lib/onboarding-catalogue-draft.mjs'

const WEEK = {
  bg: [
    { weekday: 1, label: 'Понеделник', short: 'Пон' }, { weekday: 2, label: 'Вторник', short: 'Вто' },
    { weekday: 3, label: 'Сряда', short: 'Сря' }, { weekday: 4, label: 'Четвъртък', short: 'Чет' },
    { weekday: 5, label: 'Петък', short: 'Пет' }, { weekday: 6, label: 'Събота', short: 'Съб' },
    { weekday: 7, label: 'Неделя', short: 'Нед' },
  ],
  en: [
    { weekday: 1, label: 'Monday', short: 'Mon' }, { weekday: 2, label: 'Tuesday', short: 'Tue' },
    { weekday: 3, label: 'Wednesday', short: 'Wed' }, { weekday: 4, label: 'Thursday', short: 'Thu' },
    { weekday: 5, label: 'Friday', short: 'Fri' }, { weekday: 6, label: 'Saturday', short: 'Sat' },
    { weekday: 7, label: 'Sunday', short: 'Sun' },
  ],
}

function createInitialSchedule(locale) {
  return WEEK[locale].map((day) => ({
  ...day,
  enabled: day.weekday <= 5,
  open: day.weekday <= 5 ? '09:00' : '10:00',
  close: day.weekday <= 5 ? '18:00' : '14:00',
  breakEnabled: false, breakStart: '12:00', breakEnd: '13:00',
  }))
}

const STEPS = {
  bg: [['Бизнес', 'Основни данни'], ['Услуги', 'Какво предлагаш'], ['Екип', 'Кой работи'], ['График', 'Работно време'], ['Преглед', 'Потвърждение']],
  en: [['Business', 'Basic details'], ['Services', 'What you offer'], ['Team', 'Who works here'], ['Schedule', 'Working hours'], ['Review', 'Confirmation']],
}

export function BusinessSetup({ session, onComplete, locale, preview = false, application = false }) {
  const [businessPhotos,setBusinessPhotos]=useState([]),[photoConsent,setPhotoConsent]=useState(false)
  const [photosProcessing,setPhotosProcessing]=useState(0)
  const photoProcessing=active=>setPhotosProcessing(count=>Math.max(0,count+(active?1:-1)))
  const en = locale === 'en'
  const steps = STEPS[locale]
  const [step, setStep] = useState(0)
  const [businessDraft, setBusinessDraft] = useState({business:{ name: '', slug: '', phone: '', contact_email: session?.user?.email || '', address: '', timezone: 'Europe/Sofia', industry: 'other', city_ekatte: '', neighborhood: '', default_duration_min: '45', booking_slot_minutes: '15',website_url:'',booking_mode:'gorez',external_booking_url:'',external_booking_consent:false,opening_hours:emptyOpeningHours(),public_profile:{description:{bg:'',en:''},payments:[],brands:[],latitude:null,longitude:null},booking_terms:'' },importedFields:{}})
  const business=businessDraft.business
  const setBusiness=update=>setBusinessDraft(current=>({...current,business:typeof update==='function'?update(current.business):update}))
  const external=business.booking_mode==='external'
  const applyBooking=patch=>setBusiness(current=>({...current,...('mode'in patch?{booking_mode:patch.mode}:{}),...('url'in patch?{external_booking_url:patch.url}:{}),...('consent'in patch?{external_booking_consent:patch.consent}:{})}))
  const [services, setServices] = useState(()=>[emptyOnboardingService()])
  const [catalogueImport,setCatalogueImport]=useState(null),[catalogueLoaded,setCatalogueLoaded]=useState(null)
  const [staff, setStaff] = useState([{ name: '' }])
  const [schedule, setSchedule] = useState(() => createInitialSchedule(locale))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const pageNonce = useRef(null)
  const [accountEmail,setAccountEmail]=useState(session?.user?.email||''),[password,setPassword]=useState(''),[consent,setConsent]=useState(false),[company,setCompany]=useState('')
  const lock=useRef(false)
  useEffect(()=>{if(session?.user?.email){setAccountEmail(session.user.email);setBusiness(current=>({...current,contact_email:current.contact_email||session.user.email}))}},[session?.user?.email])
  useEffect(()=>{if(!session)setAccountEmail(business.contact_email)},[business.contact_email,session])

  const stepContent = en ? [
    ['Your business', ''],
    ['Services and prices', ''],
    ['Your team', ''],
    ['Working hours', ''],
    ['Review and send', application ? 'Your profile goes to GoRez for approval.' : 'Public booking starts after GoRez approval.'],
  ] : [
    ['Твоят бизнес', ''],
    ['Услуги и цени', ''],
    ['Твоят екип', ''],
    ['Работно време', ''],
    ['Преглед и изпращане', application ? 'Профилът се изпраща за одобрение от GoRez.' : 'Публичното записване започва след одобрение от GoRez.'],
  ]

  useEffect(() => {
    setError('')
    setSchedule((current) => current.map((day) => ({ ...day, ...WEEK[locale].find((item) => item.weekday === day.weekday) })))
  }, [locale])

  function updateBusiness(field, value) {
    if (field === 'name' && !pageNonce.current) pageNonce.current = crypto.randomUUID().replace(/-/g, '').slice(0,12)
    if (field === 'default_duration_min') setServices((current) => current.map((service) => service.name.trim() ? service : { ...service, duration_min: value }))
    setBusinessDraft(current=>editOnboardingBusinessDraft(current,{[field]:value,...(field==='name'?{slug:businessPageSlug(value, pageNonce.current)}:{})}))
  }

  function updateList(setter, index, field, value) {
    setter((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row))
  }

  function applyCatalogueDraft(draft,indexes) {
    const imported=normalizeImportedServices(draft.services,indexes)
    if(!imported.length||imported.length>40){setError(en?'Choose from 1 to 40 services.':'Избери между 1 и 40 услуги.');return}
    if(!pageNonce.current)pageNonce.current=crypto.randomUUID().replace(/-/g,'').slice(0,12)
    const nonce=pageNonce.current
    setBusinessDraft(current=>{
      const next=selectCatalogueBusinessDraft(current,draft.business)
      return {...next,business:{...next.business,slug:businessPageSlug(next.business.name,nonce)}}
    })
    setServices(imported);setCatalogueLoaded({name:draft.business.name,count:imported.length});setCatalogueImport(null);setError('')
  }
  function loadCatalogueDraft(draft) {
    if(hasServiceDraftEdits(services)||draft.services.length>40)setCatalogueImport(draft)
    else applyCatalogueDraft(draft)
  }

  function renewPageAddress() {
    const nonce = crypto.randomUUID().replace(/-/g, '').slice(0,12)
    pageNonce.current = nonce
    setBusiness(current => ({ ...current, slug: businessPageSlug(current.name, nonce) }))
  }

  function removeListRow(setter, index) {
    setter((current) => current.filter((_, rowIndex) => rowIndex !== index))
  }

  function validateCurrentStep(currentStep = step) {
    if(currentStep===0&&external&&(!safeBookingUrl(business.external_booking_url)||!business.external_booking_consent))return en?'Enter a secure direct booking URL and give permission to redirect clients.':'Въведи сигурен директен линк за резервации и разреши пренасочването.'
    if(currentStep===0&&business.website_url&&!safeBookingUrl(business.website_url))return en?'Enter a valid HTTPS website.':'Въведи валиден HTTPS сайт.'
    if(currentStep===1&&(!services.length||services.length>40||services.some(s=>s.name.trim().length<2||s.name.trim().length>120)))return en?'Use 1–40 services with names of 2–120 characters.':'Добави от 1 до 40 услуги с имена между 2 и 120 знака.'
    if(currentStep===1&&external)return services.some(s=>(s.price!==''&&(!Number.isFinite(Number(s.price))||Number(s.price)<0||Number(s.price)>999999.99||!/^\d+(?:\.\d{1,2})?$/.test(String(s.price))))||(s.duration_min!==''&&!validDuration(s.duration_min)))?(en?'Check the prices and durations you entered.':'Провери въведените цени и продължителности.') : ''
    if(currentStep===2&&external)return staff.some(p=>!p.name.trim())?(en?'Enter team names or remove optional empty rows.':'Въведи имената или премахни празните редове за екип.') : ''
    if(currentStep===3&&external)return openingHoursSchema.safeParse(business.opening_hours).success?'':(en?'Check all seven days and non-overlapping opening periods.':'Провери седемте дни и неприпокриващите се периоди.')
    if (currentStep === 0 && (business.name.trim().length<2||business.name.trim().length>120)) return en ? 'Use a business name of 2–120 characters.' : 'Името на бизнеса трябва да е между 2 и 120 знака.'
    if (currentStep === 0 && !findCity(business.city_ekatte)) return en ? 'Choose your business city from the list.' : 'Избери града на бизнеса от списъка.'
    if (currentStep === 0 && !validDuration(business.default_duration_min)) return en ? 'Enter a whole number of minutes from 5 to 1440.' : 'Въведи цял брой минути от 5 до 1440.'
    if((application||external)&&currentStep===0&&(!/^[+()\d .-]{7,32}$/.test(business.phone)||!/^\S+@\S+\.\S+$/.test(business.contact_email)||business.address.trim().length<2))return en?'Add a valid phone, booking email and street address.':'Добави валиден телефон, имейл за резервации и адрес.'
    if(currentStep===0&&!businessPhotos.length)return en?'Add at least one photo of your business to continue.':'Добави поне една снимка на бизнеса, за да продължиш.'
    if (currentStep === 1 && services.length>40) return en ? 'Keep up to 40 services in this application.' : 'Остави до 40 услуги в заявката.'
    if (currentStep === 1 && services.some((service) => service.price === '' || !Number.isFinite(Number(service.price)) || Number(service.price)<0||Number(service.price)>999999.99||!/^\d+(?:\.\d{1,2})?$/.test(String(service.price)) || !validDuration(service.duration_min))) return en ? 'Check each service: price and duration (5–1440 minutes).' : 'Провери цената и продължителността (5–1440 минути) на всяка услуга.'
    if (currentStep === 2 && (!staff.length || staff.some((person) => !person.name.trim()))) return en ? 'Enter a name for every team member.' : 'Въведи име за всеки член на екипа.'
    if (currentStep === 3) {
      const enabled = schedule.filter((day) => day.enabled)
      if (!enabled.length) return en ? 'Choose at least one working day.' : 'Избери поне един работен ден.'
      const problem = scheduleProblem(schedule)
      if (problem) return scheduleErrorText(problem, locale)
    }
    return ''
  }

  function next() {
    if(photosProcessing)return
    const validationError = validateCurrentStep()
    if (validationError) { setError(validationError); return }
    setError('')
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  async function save() {
    if(lock.current||photosProcessing)return
    for (let index = 0; index < 4; index++) {
      const problem = validateCurrentStep(index)
      if (problem) { setError(problem); setStep(index); return }
    }
    if(application&&(!consent||!/^\S+@\S+\.\S+$/.test(accountEmail)||(!session&&password.length<10))){setError(en?'Enter a valid login email, a password of at least 10 characters and accept the terms.':'Въведи валиден имейл за вход, парола с поне 10 знака и приеми условията.');return}
    let selectedPhotos=[...businessPhotos.map((file,index)=>({key:`gallery_${index}`,file})),...staff.map((person,index)=>({key:`staff_${index}`,file:person.photo})).filter(row=>row.file)]
    if(selectedPhotos.length&&!photoConsent){setError(en?'Confirm you have permission to publish the photos.':'Потвърди, че имаш право да публикуваш снимките.');return}
    setError('');lock.current=true
    setSaving(true)
    let createdBusinessId = null
    try {
      const fitted=await fitPhotoFilesToBudget(selectedPhotos.map(row=>row.file),APPLICATION_PHOTO_BUDGET)
      selectedPhotos=selectedPhotos.map((row,index)=>({...row,file:fitted[index]}))
      if (preview) { onComplete({ business, services:servicesForApplication(services), staff, schedule }); return }
      if(application||external) {
        const payload=JSON.stringify({business,services:servicesForApplication(services),staff:staff.map(({name,bio})=>({name,...(bio?{bio}:{})})),schedule:schedule.map(({weekday,enabled,open,close,breakEnabled,breakStart,breakEnd})=>({weekday,enabled,open,close,breakEnabled,breakStart,breakEnd})),account:{email:accountEmail,password:session?'':password},consent:application?consent:true,company,locale})
        let body=payload
        if(selectedPhotos.length){body=new FormData();body.append('payload',payload);body.append('photoConsent','true');selectedPhotos.forEach(row=>body.append(row.key,row.file))}
        const response=await fetch('/api/public/business-applications',{method:'POST',headers:{...(!selectedPhotos.length?{'Content-Type':'application/json'}:{}),...(session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{})},body})
        if(!response.ok) {
          const code=(await response.json().catch(()=>null))?.error?.code
          if(code==='BUSINESS_PHOTO_REQUIRED'){setError(en?'Add at least one photo of your business.':'Добави поне една снимка на бизнеса.');setStep(0);return}
          if(code==='ADDRESS_IN_USE'){renewPageAddress();setError(en?'We refreshed your page link. Press Send for approval again.':'Обновихме линка на страницата ти. Натисни отново „Изпрати за одобрение“.');return}
          const messages={SIGN_IN_REQUIRED:en?'Use a new email and a password of at least 10 characters, or sign in to your existing account first.':'Използвай нов имейл и парола с поне 10 знака, или първо влез в съществуващия си профил.',RATE_LIMITED:en?'Too many attempts. Please try later.':'Твърде много опити. Опитай по-късно.',VALIDATION_ERROR:en?'Check the details in all five steps. Names must have at least 2 characters.':'Провери данните в петте стъпки. Имената трябва да са поне 2 знака.'}
          setError(messages[code]||(['INVALID_IMAGE','IMAGE_TOO_LARGE'].includes(code)?mediaErrorText(code,locale):(en?'We could not accept the application. Try again later.':'Не успяхме да приемем заявката. Опитай отново по-късно.')));return
        }
        const result=await response.json()
        setPassword('');onComplete({pending:true,photos:result.photos});return
      }
      const { data: createdBusiness, error: businessError } = await supabase.from('businesses').insert({
        owner_id: session.user.id,
        name: business.name.trim(),
        slug: business.slug.trim(),
        phone: business.phone.trim() || null,
        contact_email: business.contact_email.trim() || null,
        address: business.address.trim() || null,
        timezone: business.timezone,
        industry: business.industry,
        website_url:business.website_url||null,public_profile:business.public_profile,booking_terms:business.booking_terms||null,
        ...businessLocationFields(business.city_ekatte, business.neighborhood),
        default_duration_min: Number(business.default_duration_min),
        booking_slot_minutes: Number(business.booking_slot_minutes),
        languages: ['bg', 'en'],
        notification_locale: locale,
      }).select().single()
      if (businessError) throw businessError
      createdBusinessId = createdBusiness.id

      const { data: createdServices, error: servicesError } = await supabase.from('services').insert(services.map((service) => ({
        business_id: createdBusinessId,
        name: service.name.trim(),
        price: Number(service.price),
        currency: 'EUR',
        duration_min: Number(service.duration_min),
      }))).select()
      if (servicesError) throw servicesError

      const staffToInsert=staff.map((person,index)=>({id:crypto.randomUUID(),business_id:createdBusinessId,name:person.name.trim(),sort_order:index}))
      const { data: createdStaff, error: staffError } = await supabase.from('staff').insert(staffToInsert).select()
      if (staffError) throw staffError

      const hours = createdStaff.flatMap((person) => scheduleRows(schedule).map((day) => ({
        business_id: createdBusinessId,
        staff_id: person.id,
        ...day,
      })))
      const { error: hoursError } = await supabase.from('working_hours').insert(hours)
      if (hoursError) throw hoursError

      let photoWarning=false
      if(selectedPhotos.length){
        const photos=[...businessPhotos.map(file=>({file,staffId:null})),...staff.map((person,index)=>({file:person.photo,staffId:staffToInsert[index].id})).filter(row=>row.file)]
        try{for(const row of photos){const headers={Authorization:`Bearer ${session.access_token}`};const current=await fetch(`/api/businesses/${createdBusinessId}/media`,{headers,cache:'no-store'});if(!current.ok)throw new Error();const latest=await current.json();const body=new FormData();body.append('file',row.file);body.append('consent','true');body.append('revision',String(latest.business.content_revision));if(row.staffId)body.append('staffId',row.staffId);const response=await fetch(`/api/businesses/${createdBusinessId}/media`,{method:'POST',headers,body});if(!response.ok)throw new Error()}}catch{photoWarning=true}
      }
      onComplete({ business: createdBusiness, services: createdServices, staff: createdStaff, schedule, photoWarning })
    } catch (saveError) {
      if(['IMAGE_PROCESSING_FAILED','SOURCE_IMAGE_TOO_LARGE','INVALID_IMAGE','HEIC_UNSUPPORTED'].includes(saveError.message)){setError(mediaErrorText(saveError.message,locale));return}
      if (createdBusinessId) await supabase.from('businesses').delete().eq('id', createdBusinessId)
      const duplicateSlug = saveError.code === '23505'
      if (duplicateSlug) renewPageAddress()
      setError(duplicateSlug
        ? (en ? 'We refreshed your page link. Press Complete setup again.' : 'Обновихме линка на страницата ти. Натисни отново „Завърши настройката“.')
        : `${en ? 'We could not save the setup' : 'Не успяхме да запазим настройките'}: ${saveError.message}`)
    } finally {
      setSaving(false);lock.current=false
    }
  }

  return (
    <div className="setup-layout compact-business-setup">
      <aside className="steps-card" aria-label={en ? 'Setup steps' : 'Стъпки за настройка'}>
        {steps.map(([label, help], index) => (
          <button type="button" disabled={index>step||saving||photosProcessing>0} aria-current={index===step?'step':undefined} onClick={()=>{setError('');setStep(index)}} className={`step-item ${index === step ? 'active' : ''} ${index < step ? 'done' : ''}`} key={label}>
            <span className="step-number">{index < step ? <Icon name="check" /> : index + 1}</span>
            <span className="step-label">{label}</span>
          </button>
        ))}
      </aside>

      <section className="wizard-card">
        <header className="wizard-head">
          <small>{en ? 'Step' : 'Стъпка'} {step + 1} {en ? 'of' : 'от'} {steps.length}</small>
          <h3>{external&&step===3?(en?'Opening hours for customers':'Работно време за клиентите'):stepContent[step][0]}</h3>
          {stepContent[step][1]&&<p>{stepContent[step][1]}</p>}
        </header>
        <div className="wizard-body">
          {step === 0 && (
            <div className="form-grid">
              <CatalogueBusinessLookup value={business.name} onChange={value=>updateBusiness('name',value)} cityCode={business.city_ekatte} locale={locale} onSelect={loadCatalogueDraft} loadedName={catalogueLoaded?.name} disabled={saving}/>
              {catalogueLoaded&&<p className="catalogue-loaded full" role="status"><Icon name="check"/>{en?`${catalogueLoaded.count} services loaded. Review them in the next step.`:`Заредени ${catalogueLoaded.count} услуги. Провери ги в следващата стъпка.`}</p>}
              <div className="field"><label htmlFor="business-phone">{en ? 'Phone' : 'Телефон'}{application?' *':''}</label><input id="business-phone" className="text-input" value={business.phone} onChange={(event) => updateBusiness('phone', event.target.value)} placeholder="+359 88 123 4567" type="tel" /></div>
              <div className="field"><label htmlFor="business-email">{en ? 'Booking email' : 'Имейл за резервации'}{application?' *':''}</label><input id="business-email" className="text-input" value={business.contact_email} onChange={(event) => updateBusiness('contact_email', event.target.value)} placeholder="office@business.com" type="email" /></div>
              <div className="field"><label htmlFor="business-industry">{en ? 'Business type' : 'Тип бизнес'}</label><select id="business-industry" className="select-input" value={business.industry} onChange={(event) => updateBusiness('industry', event.target.value)}><option value="beauty">{en ? 'Beauty & salons' : 'Красота и салони'}</option><option value="auto">{en ? 'Auto services & repair shops' : 'Авто услуги и сервизи'}</option><option value="fitness">{en ? 'Sports' : 'Спорт'}</option><option value="education">{en ? 'Education' : 'Обучение'}</option><option value="consulting">{en ? 'Consulting' : 'Консултации'}</option><option value="home_services">{en ? 'Home services' : 'Услуги на адрес'}</option><option value="pets">{en ? 'Pet services' : 'Домашни любимци'}</option><option value="health">{en ? 'Health services' : 'Здравни услуги'}</option><option value="other">{en ? 'Other appointment business' : 'Друг бизнес с часове'}</option></select></div>
              {!application&&<div className="field"><label htmlFor="business-timezone">{en ? 'Time zone' : 'Часова зона'}</label><select id="business-timezone" className="select-input" value={business.timezone} onChange={(event) => updateBusiness('timezone', event.target.value)}><option value="Europe/Sofia">{en ? 'Sofia' : 'София'} (GMT+2/+3)</option><option value="Europe/London">{en ? 'London' : 'Лондон'}</option><option value="Europe/Berlin">{en ? 'Berlin' : 'Берлин'}</option></select></div>}
              <div className="field full"><BusinessLocationFields required cityCode={business.city_ekatte} neighborhood={business.neighborhood} onChange={patch=>setBusinessDraft(current=>editOnboardingBusinessDraft(current,patch))} locale={locale} /></div>
              <div className="field full"><label htmlFor="business-address">{en ? 'Address' : 'Адрес'}{application?' *':''}</label><input id="business-address" className="text-input" value={business.address} onChange={(event) => updateBusiness('address', event.target.value)} placeholder={en ? '12 Example Street, Sofia' : 'ул. Примерна 12, София'} /></div>
              <div className="field full"><PhotoPicker files={businessPhotos} onChange={setBusinessPhotos} locale={locale} disabled={saving} onProcessing={photoProcessing} required label={en?'Business photos *':'Снимки на бизнеса *'}/></div>
              <BookingModeFields mode={business.booking_mode} url={business.external_booking_url} consent={business.external_booking_consent} locale={locale} onChange={patch=>{applyBooking(patch);if(patch.mode==='external'){if(staff.length===1&&!staff[0].name.trim())setStaff([]);setServices(current=>current.map(service=>service.name.trim()?service:{...service,price:'',duration_min:''}))}}}/>
              <details className="onboarding-extra full"><summary>{en?'Additional settings':'Допълнителни настройки'}<Icon name="chevronDown"/></summary><div className="onboarding-extra-fields">
              <label className="field full">{en?'Business website (optional)':'Уебсайт (по желание)'}<input type="url" className="text-input" value={business.website_url} onChange={e=>updateBusiness('website_url',e.target.value)}/></label>
              {!external&&<div className="field full duration-setup"><label htmlFor="usual-duration">{en?'Default duration (min)':'Продължителност по подразбиране (мин)'}</label><DurationInput id="usual-duration" className="text-input" value={business.default_duration_min} onChange={value=>updateBusiness('default_duration_min',value)} locale={locale} required/></div>}
              <fieldset className="field full"><legend>{en?'Payment methods (optional)':'Начини на плащане (по желание)'}</legend>{[['cash',en?'Cash':'В брой'],['card',en?'Card':'Карта'],['bank',en?'Bank transfer':'Банков превод']].map(([key,label])=><label key={key}><input type="checkbox" checked={business.public_profile.payments.includes(key)} onChange={e=>updateBusiness('public_profile',{...business.public_profile,payments:e.target.checked?[...business.public_profile.payments,key]:business.public_profile.payments.filter(p=>p!==key)})}/>{label}</label>)}</fieldset>
              <label className="field full">{en?'Booking policies (optional)':'Условия за резервации (по желание)'}<textarea maxLength={5000} value={business.booking_terms} onChange={e=>updateBusiness('booking_terms',e.target.value)}/></label>
              </div></details>
            </div>
          )}

          {step === 1 && (
            <div>
              {catalogueLoaded?<p className="catalogue-loaded" role="status"><Icon name="check"/>{en?`From ${catalogueLoaded.name}. Check the prices and add any missing durations.`:`От ${catalogueLoaded.name}. Провери цените и добави липсващите времена.`}</p>:<details className="onboarding-extra onboarding-templates"><summary>{en?'Use a service template':'Използвай примерни услуги'}<Icon name="chevronDown"/></summary><button type="button" className="secondary-button" onClick={()=>{if(hasServiceDraftEdits(services))return;setServices(getIndustryServiceTemplate(business.industry,locale).map(service=>({...service,price:'',duration_min:''})))}} disabled={hasServiceDraftEdits(services)}>{en?'Load names only':'Зареди само имената'}</button></details>}
              {external&&<p className="onboarding-short-help">{en?'Unknown price or duration? Leave it blank.':'Неизвестна цена или време? Остави празно.'}</p>}
              <div className="repeat-list">
                {services.map((service, index) => (
                  <div className="repeat-row onboarding-service-row" key={index}>
                    <div className="onboarding-service-name"><label className="compact-label" htmlFor={`service-${index}`}>{en ? 'Service' : 'Услуга'}</label><input id={`service-${index}`} className="compact-input" value={service.name} maxLength={120} onChange={(event) => updateList(setServices, index, 'name', event.target.value)} placeholder={en ? 'Haircut' : 'Подстригване'} autoFocus={index === 0} /></div>
                    <div><label className="compact-label" htmlFor={`price-${index}`}>{en ? 'Price' : 'Цена'} (€)</label><input id={`price-${index}`} className="compact-input" type="number" min="0" max="999999.99" step="0.01" value={service.price} required={!external} onChange={(event) => updateList(setServices, index, 'price', event.target.value)} placeholder={en?'Price':'Цена'}/></div>
                    <div><label className="compact-label" htmlFor={`duration-${index}`}>{en ? 'Minutes' : 'Минути'}</label><DurationInput id={`duration-${index}`} className="compact-input" value={service.duration_min} onChange={value => updateList(setServices,index,'duration_min',value)} locale={locale} required={!external}/></div>
                    <button className="icon-button" type="button" aria-label={en ? 'Remove service' : 'Премахни услугата'} onClick={() => removeListRow(setServices, index)} disabled={services.length === 1}><Icon name="trash" /></button>
                    {service.catalogueHint?.requiresPriceConfirmation&&<div className="catalogue-service-hint">{service.catalogueHint.priceLabel&&<strong>{en?'Published: ':'Публикувано: '}{service.catalogueHint.priceLabel}. </strong>}{!service.price&&(en?'Confirm your final price.':'Уточни точната си цена.')}{service.catalogueHint.description&&<details><summary>{en?'Published conditions':'Публикувани условия'}</summary><p>{service.catalogueHint.description}</p></details>}</div>}
                    {service.name.length>120&&<small className="catalogue-service-hint" role="alert">{en?'Shorten the name to 120 characters.':'Съкрати името до 120 знака.'}</small>}
                  </div>
                ))}
              </div>
              <button className="add-row-button" type="button" disabled={services.length>=40} onClick={() => setServices((current) => current.length>=40?current:[...current,emptyOnboardingService()])}><Icon name="plus" /> {en ? 'Add service' : 'Добави услуга'} · {services.length}/40</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="repeat-list">
                {staff.map((person, index) => (
                  <div className="repeat-row staff-row" key={index}>
                    <div><label className="compact-label" htmlFor={`staff-${index}`}>{en ? 'Name' : 'Име'}</label><input id={`staff-${index}`} className="compact-input" value={person.name} onChange={(event) => updateList(setStaff, index, 'name', event.target.value)} placeholder={index === 0 ? (en ? 'Your name' : 'Твоето име') : (en ? 'Team member name' : 'Име на служител')} autoFocus={index === 0} /></div>
                    <PhotoPicker files={person.photo?[person.photo]:[]} onChange={files=>updateList(setStaff,index,'photo',files[0]||null)} single locale={locale} disabled={saving} onProcessing={photoProcessing} label={en?'Team photo (optional)':'Снимка на специалиста (по желание)'}/>
                    <label>{en?'Bio (optional)':'Представяне (по желание)'}<textarea maxLength={2000} value={person.bio||''} onChange={e=>updateList(setStaff,index,'bio',e.target.value)}/></label>
                    <button className="icon-button" type="button" aria-label={en ? 'Remove team member' : 'Премахни служителя'} onClick={() => removeListRow(setStaff, index)} disabled={(!external&&staff.length === 1)||photosProcessing>0||saving}><Icon name="trash" /></button>
                  </div>
                ))}
              </div>
              <button className="add-row-button" type="button" disabled={saving||photosProcessing>0} onClick={() => setStaff((current) => [...current, { name: '' }])}><Icon name="plus" /> {en ? 'Add team member' : 'Добави човек'}</button>
            </div>
          )}

          {step === 3 && (
            external?<OpeningHoursEditor value={business.opening_hours} onChange={value=>updateBusiness('opening_hours',value)} locale={locale} disabled={saving}/>:<WeeklyScheduleFields days={schedule} onChange={setSchedule} locale={locale} disabled={saving} />
          )}

          {step === 4 && (
            <div className="review-grid">
              <div className="review-card full"><span className="review-icon"><Icon name="store" /></span><small>{en ? 'Business' : 'Бизнес'}</small><strong>{business.name}</strong><p>{businessAddress({ ...business, ...businessLocationFields(business.city_ekatte, business.neighborhood) }, locale)}{business.phone ? ` · ${business.phone}` : ''}</p></div>
              <div className="review-card"><span className="review-icon"><Icon name="briefcase" /></span><small>{en ? 'Services' : 'Услуги'}</small><strong>{services.length} {en ? (services.length === 1 ? 'service' : 'services') : (services.length === 1 ? 'услуга' : 'услуги')}</strong><p>{services.map((service) => `${service.name}${service.duration_min!==''&&service.duration_min!=null?` · ${service.duration_min} ${en ? 'min' : 'мин.'}`:''}`).join(', ')}</p></div>
              <div className="review-card"><span className="review-icon"><Icon name="users" /></span><small>{en ? 'Team' : 'Екип'}</small><strong>{staff.length} {en ? (staff.length === 1 ? 'person' : 'people') : (staff.length === 1 ? 'човек' : 'души')}</strong><p>{staff.map((person) => person.name).join(', ')}</p></div>
              <div className="review-card full"><span className="review-icon"><Icon name="clock" /></span><small>{en ? 'Working hours' : 'Работно време'}</small>{external?<><strong>{en?'External booking system':'Външна система за резервации'}</strong><p>{business.external_booking_url}</p><p>{business.opening_hours.filter(d=>d.periods.length).map(d=>`${WEEK[locale][d.weekday-1].short} ${d.periods.map(p=>`${p.open}–${p.close}`).join(', ')}`).join(' · ')}</p></>:<><strong>{schedule.filter((day) => day.enabled).length} {en ? 'working days' : 'работни дни'}</strong><p>{schedule.filter((day) => day.enabled).map((day) => `${day.short} ${day.open}–${day.close}${day.breakEnabled ? ` (${en ? 'break' : 'почивка'} ${day.breakStart}–${day.breakEnd})` : ''}`).join(' · ')}</p></>}</div>
              {(businessPhotos.length>0||staff.some(person=>person.photo))&&<label className="onboarding-consent full"><input type="checkbox" checked={photoConsent} onChange={event=>setPhotoConsent(event.target.checked)}/><span>{en?'I have permission to publish these photos and the consent of the people shown.':'Имам право да публикувам снимките и съгласието на хората на тях.'}</span></label>}
              {application&&<div className="onboarding-account"><label>{en?'Login email':'Имейл за вход'} *<input className="text-input" type="email" autoComplete="email" maxLength={180} value={accountEmail} disabled={Boolean(session)||saving} onChange={event=>setAccountEmail(event.target.value)}/></label>{!session&&<label>{en?'Password · at least 10 characters':'Парола · поне 10 знака'} *<input className="text-input" type="password" autoComplete="new-password" minLength={10} maxLength={128} value={password} onChange={event=>setPassword(event.target.value)}/></label>}<label className="onboarding-consent"><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)}/><span>{en?'I accept the':'Приемам'} <Link href={`/terms?lang=${locale}`}>{en?'terms':'условията'}</Link> {en?'and have read the':'и съм прочел'} <Link href={`/privacy?lang=${locale}`}>{en?'privacy information':'информацията за поверителност'}</Link>.</span></label><div hidden aria-hidden="true"><input name="company" tabIndex={-1} autoComplete="off" value={company} onChange={event=>setCompany(event.target.value)}/></div><Link href={`/login?lang=${locale}`}>{en?'Already have an account? Sign in first.':'Имаш акаунт? Първо влез в него.'}</Link></div>}
            </div>
          )}

          {error && <p className="form-message" role="alert" style={{ marginTop: 20 }}>{error}</p>}
        </div>
        <footer className="wizard-actions">
          <button className="secondary-button" type="button" onClick={() => { setError(''); setStep((current) => Math.max(0, current - 1)) }} disabled={step === 0 || saving || photosProcessing>0}><Icon name="back" /> {en ? 'Back' : 'Назад'}</button>
          {step < steps.length - 1
            ? <button className="primary-button" type="button" onClick={next} disabled={photosProcessing>0}>{en ? 'Continue' : 'Продължи'} <Icon name="arrow" /></button>
            : <button className="primary-button accent" type="button" onClick={save} disabled={saving||photosProcessing>0}>{saving ? <span className="button-spinner" /> : <Icon name="check" />}{saving ? (en ? 'Saving...' : 'Запазване...') : application ? (en?'Send for approval':'Изпрати за одобрение') : (en ? 'Complete setup' : 'Завърши настройката')}</button>}
        </footer>
      </section>
      {catalogueImport&&<CatalogueImportReview key={catalogueImport.business.id} draft={catalogueImport} locale={locale} replace={hasServiceDraftEdits(services)} onCancel={()=>setCatalogueImport(null)} onConfirm={indexes=>applyCatalogueDraft(catalogueImport,indexes)}/>}
    </div>
  )
}
