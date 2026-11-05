'use client'
import Link from 'next/link'
import { useEffect,useState } from 'react'
import { usePublicLocale } from '../hooks/use-public-locale'
import { MarketingNavigation } from './marketing-navigation'
import { SiteFooter } from './site-footer'
import { BusinessSetup } from './business-setup'
import { Icon } from './icon'
import { HomeLink } from './home-link'
import { supabase } from '../lib/supabase'
import { PRICING_COPY } from '../lib/product-config.mjs'

export function BusinessOnboarding({initialLocale='bg',identity={},preview=false}) {
  const {locale,setLocale}=usePublicLocale(initialLocale,true),en=locale==='en'
  const [session,setSession]=useState(null),[sent,setSent]=useState(false)
  const [photoWarning,setPhotoWarning]=useState(false)
  useEffect(()=>{
    if(preview)return
    let active=true
    supabase.auth.getSession().then(({data})=>{if(active)setSession(data.session)}).catch(()=>{})
    const {data}=supabase.auth.onAuthStateChange((_event,next)=>{if(active)setSession(next)})
    return()=>{active=false;data.subscription.unsubscribe()}
  },[preview])
  return <main className="marketing-page launch-business-page"><MarketingNavigation locale={locale} setLocale={setLocale} business/><section className="business-onboarding" id="join">{sent?<div className="onboarding-success" role="status"><Icon name="check"/><h1>{en?'Application received':'Заявката е получена'}</h1><p>{en?'Your profile, services and schedule are waiting for GoRez approval. There is no email-confirmation step. Once approved, sign in with the email and password you chose.':'Профилът, услугите и графикът чакат одобрение от GoRez. Няма стъпка за потвърждение по имейл. След одобрение влез с избраните имейл и парола.'}</p>{photoWarning&&<p className="form-message">{en?'Your application is saved, but some photos could not be uploaded. Add them from Settings → Photos after approval. Do not submit a second application.':'Заявката е запазена, но част от снимките не са качени. Добави ги от Настройки → Снимки след одобрение. Не изпращай втора заявка.'}</p>}<Link className="primary-button" href={`/login?lang=${locale}`}>{en?'Business sign-in':'Вход за бизнес'}</Link><HomeLink locale={locale}/></div>:<><header><p className="marketing-kicker">{en?'For business owners':'За собственици на бизнес'}</p><h1>{en?'Your business. Five steps.':'Твоят бизнес. Пет стъпки.'}</h1><Link className="onboarding-help" href={`/faq?lang=${locale}`}>{PRICING_COPY[locale].contact}<Icon name="arrow"/></Link></header><BusinessSetup application session={session} locale={locale} onComplete={result=>{setPhotoWarning(Boolean(result.photos&&result.photos.saved<result.photos.requested));setSent(true);window.scrollTo({top:0,behavior:'instant'})}} preview={preview}/></>}</section><SiteFooter locale={locale} identity={identity}/></main>
}
