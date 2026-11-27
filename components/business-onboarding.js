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
  return <main className="marketing-page launch-business-page"><MarketingNavigation locale={locale} setLocale={setLocale} business/>
    <section className="business-onboarding business-signup" id="join">{sent?<div className="onboarding-success" role="status"><Icon name="check"/><h1>{en?'Application received':'Заявката е получена'}</h1><p>{en?'Your profile is waiting for GoRez approval. After approval, sign in with your email and password.':'Профилът чака одобрение от GoRez. След одобрение влез с избрания имейл и парола.'}</p>{photoWarning&&<p className="form-message">{en?'Your application is saved, but some photos could not be uploaded. Add them from Settings → Photos after approval. Do not submit a second application.':'Заявката е запазена, но част от снимките не са качени. Добави ги от Настройки → Снимки след одобрение. Не изпращай втора заявка.'}</p>}<Link className="primary-button" href={`/login?lang=${locale}`}>{en?'Business sign-in':'Вход за бизнес'}</Link><HomeLink locale={locale}/></div>:<>
      <aside className="business-signup-intro" aria-labelledby="signup-title">
        <span className="signup-eyebrow"><Icon name="store"/>{en?'GoRez for business':'GoRez за бизнеса'}</span>
        <h1 id="signup-title">{en?'Help customers find you':'Нека клиентите те намират'}<span>.</span></h1>
        <p>{en?'Add your business to GoRez. If you already have a website, add it so customers can find it in your profile.':'Добави бизнеса си в GoRez. Ако вече имаш сайт, посочи го — той ще се вижда в профила ти.'}</p>
        <ul className="signup-benefits">
          <li><span><Icon name="external"/></span><div><strong>{en?'Your website stays yours':'Твоят сайт си остава твой'}</strong><small>{en?'A public link on your profile':'Публичен линк в профила'}</small></div></li>
          <li><span><Icon name="calendar"/></span><div><strong>{en?'Choose how you take bookings':'Ти избираш как приемаш часове'}</strong><small>{en?'Through GoRez, your own page or by phone':'През GoRez, твоя страница или по телефон'}</small></div></li>
        </ul>
        <Link className="onboarding-help" href={`/faq?lang=${locale}`}>{PRICING_COPY[locale].contact}<Icon name="arrow"/></Link>
      </aside>
      <BusinessSetup application session={session} locale={locale} onComplete={result=>{setPhotoWarning(Boolean(result.photos&&result.photos.saved<result.photos.requested));setSent(true);window.scrollTo({top:0,behavior:'instant'})}} preview={preview}/>
    </>}</section><SiteFooter locale={locale} identity={identity}/></main>
}
