'use client'

import Image from 'next/image'
import { useEffect,useState } from 'react'
import { DateTime } from 'luxon'
import { Icon } from './icon'
import { formatBulgarianMonthShort } from '../lib/booking-window.mjs'

const scenes=[
  {key:'salon',industry:'beauty',icon:'spark',bg:'Салон за красота',en:'Beauty salon',service:{bg:'Подстригване и стайлинг',en:'Cut & styling'},duration:60},
  {key:'barber',industry:'beauty',icon:'scissors',bg:'Барбършоп',en:'Barbershop',service:{bg:'Мъжко подстригване',en:'Barber haircut'},duration:45},
  {key:'garage',industry:'auto',icon:'wrench',bg:'Автосервиз',en:'Auto workshop',service:{bg:'Диагностика',en:'Diagnostics'},duration:60},
]
export function BookingStory({ locale,onExplore }) {
  const en=locale==='en', [scene,setScene]=useState(0), [day,setDay]=useState(0), [time,setTime]=useState('11:00'), [confirmed,setConfirmed]=useState(false), [dates,setDates]=useState([])
  useEffect(()=>setDates(Array.from({length:3},(_,i)=>DateTime.now().setZone('Europe/Sofia').startOf('day').plus({days:i+1}))),[])
  const selected=scenes[scene]
  const change=(setter,value)=>{setter(value);setConfirmed(false)}
  return <div className="booking-story" id="how">
    <div className="story-scenes" aria-label={en?'Explore business types':'Разгледай типове бизнес'}>
      {scenes.map((item,index)=><button className={`story-scene ${scene===index?'selected':''}`} type="button" key={item.key} aria-pressed={scene===index} onClick={()=>change(setScene,index)}><Image src={`/images/gorez-${item.key}.webp`} width={1200} height={800} sizes="(max-width: 760px) 90vw, 45vw" loading={index===0?'eager':'lazy'} alt={en?`Smiling professional at work in a ${item.en.toLowerCase()}`:`Усмихнат специалист работи в ${item.bg.toLowerCase()}`} /><span><Icon name={item.icon}/><b>{en?item.en:item.bg}</b></span></button>)}
    </div>
    <div className="story-booking-card"><div className="story-card-head"><span className="story-step-icon"><Icon name={confirmed?'check':'calendar'}/></span><div><small>{en?'INTERACTIVE EXAMPLE':'ИНТЕРАКТИВЕН ПРИМЕР'}</small><strong>{selected.service[locale]}</strong></div><span>{selected.duration} {en?'min':'мин'}</span></div>
      <div className="story-days" aria-label={en?'Example date':'Примерна дата'}>{dates.map((date,index)=><button type="button" key={date.toISODate()} aria-pressed={day===index} onClick={()=>change(setDay,index)}><span>{date.setLocale(locale).toFormat('ccc')}</span><strong>{date.day}</strong><small>{en?date.setLocale(locale).toFormat('LLL'):formatBulgarianMonthShort(date.month)}</small></button>)}</div>
      <div className="story-times" aria-label={en?'Example time':'Примерен час'}>{['09:30','11:00','14:30'].map(item=><button type="button" key={item} aria-pressed={time===item} onClick={()=>change(setTime,item)}>{item}</button>)}</div>
      {confirmed?<div className="story-confirmed" role="status"><Icon name="check"/><span>{en?'That is how easy it is.':'Ето колко е лесно.'}<small>{dates[day]?.setLocale(locale).toFormat('d LLLL')} · {time}</small></span><button type="button" onClick={()=>onExplore(selected.industry)}>{en?'Find a business':'Намери бизнес'}<Icon name="arrow"/></button></div>:<button type="button" className="story-confirm" onClick={()=>setConfirmed(true)}>{en?'Try booking':'Пробвай записването'}<Icon name="arrow"/></button>}
    </div><p className="story-caption">{en?'Illustrative photos and times. Real availability is shown in each business profile.':'Илюстративни снимки и часове. Реалната наличност е в профила на бизнеса.'}</p>
  </div>
}
