'use client'
import {useState} from 'react'
import {BusinessDirectory} from '../../../components/business-directory'
import {BusinessLanding} from '../../../components/business-landing'
const rows=[{id:'local-beauty',name:'Sample Salon · LOCAL ONLY',slug:'local-only',industry:'beauty',city:'София',address:'София',services:[{id:'a',name:'Подстригване / Haircut',duration_min:45,price:25,currency:'EUR'}]},{id:'local-auto',name:'Sample Garage · LOCAL ONLY',slug:'local-only-auto',industry:'auto',city:'Пловдив',services:[{id:'b',name:'Диагностика / Diagnostics',duration_min:60,price:40,currency:'EUR'}]}]
export function LaunchPreview(){
  const [mode,setMode]=useState('directory-ready'),[locale,setLocale]=useState('bg'),[industry,setIndustry]=useState('all')
  return <div><div className="launch-qa-controls"><b>LOCAL QA · no real data, bookings or emails</b><label>Scenario<select value={mode} onChange={event=>setMode(event.target.value)}>{['directory-ready','directory-empty','directory-error','directory-loading','form-success','form-error','form-rate-limit'].map(value=><option key={value}>{value}</option>)}</select></label><button type="button" onClick={()=>setLocale(locale==='bg'?'en':'bg')}>{locale==='bg'?'EN':'BG'}</button></div>{mode.startsWith('directory')?<BusinessDirectory locale={locale} industry={industry} setIndustry={setIndustry} key={mode} preview={{status:mode.slice(10)==='loading'?'loading':mode.slice(10)==='error'?'error':'ready',businesses:mode==='directory-ready'?rows:[]}}/>:<BusinessLanding key={mode} initialLocale={locale} preview={mode.slice(5)}/>}</div>
}
