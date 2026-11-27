'use client'
import { safeBookingUrl } from '../lib/booking-mode.mjs'
import { useId } from 'react'
import { Icon } from './icon'
export function BookingModeFields({mode,url,consent,onChange,locale='bg',presentation='classic'}) {
  const en=locale==='en',external=mode==='external',safe=safeBookingUrl(url)
  const groupId=useId()
  const cardMode=presentation==='cards'
  const choices=[
    {mode:'external', icon:'external', label:en?'On my own booking page':'През моята страница', hint:en?'Customers book on your page. GoRez does not sync that calendar.':'Клиентите запазват час на твоята страница. Няма синхронизация с GoRez.'},
    {mode:'gorez', icon:'calendar', label:en?'Through GoRez':'През GoRez', hint:en?'Set up services, your team and schedule in GoRez.':'Настрой услугите, екипа и графика си в GoRez.'},
    {mode:'phone', icon:'phone', label:en?'By phone':'По телефон', hint:en?'Customers call you directly to arrange an appointment.':'Клиентите ти звънят директно, за да уговорят час.'},
  ]
  return <fieldset className={`booking-mode-fields full${cardMode?' booking-mode-cards':''}`}>
    <legend>{cardMode?(en?'How do customers book?':'Как приемаш резервации?'):(en?'Booking method':'Начин на резервация')}</legend>
    {cardMode ? <div className="booking-mode-options">{choices.map(choice=><label className="booking-mode-choice booking-mode-option" key={choice.mode}>
      <input type="radio" name={`booking-mode-${groupId}`} checked={mode===choice.mode} onChange={()=>onChange({mode:choice.mode,consent:false})}/>
      <span><strong>{choice.label}</strong><small>{choice.hint}</small></span><Icon name={choice.icon}/>
    </label>)}</div> : <>
      <label className="booking-mode-choice"><input type="checkbox" checked={external} onChange={e=>onChange({mode:e.target.checked?'external':'gorez',consent:false})}/><strong>{en?'I already use my own booking calendar':'Вече използвам собствен календар за резервации'}</strong></label>
      <label className="booking-mode-choice"><input type="checkbox" checked={mode==='phone'} onChange={e=>onChange({mode:e.target.checked?'phone':'gorez',consent:false})}/><strong>{en?'I want to receive bookings only by phone':'Желая да получавам резервации само по телефонен номер'}</strong></label>
    </>}
    {external&&<div className="booking-mode-destination">
      <label>{en?'Direct booking page URL':'Директен линк за резервации'} *<input type="url" required maxLength={2048} value={url} placeholder="https://" onChange={e=>onChange({url:e.target.value,consent:false})}/></label>
      <p>{en?'Use the exact page that accepts appointments, not a general homepage. GoRez does not synchronize its calendar with this system.':'Постави точната страница, която приема резервации, не обща начална страница. GoRez не синхронизира календара си с тази система.'}</p>
      {safe&&<a href={safe} target="_blank" rel="noopener noreferrer">{en?'Preview booking destination':'Провери страницата за резервации'} ↗</a>}
      <label className="booking-mode-choice"><input type="checkbox" required checked={consent} onChange={e=>onChange({consent:e.target.checked})}/><span>{en?'I allow customers who click “Book an appointment” in GoRez to be redirected to my own booking system. I confirm this destination accepts appointments for my business.':'Разрешавам клиентите, които натиснат „Запази час“ в GoRez, да бъдат пренасочвани към моята собствена система за резервации. Потвърждавам, че тази страница приема часове за моя бизнес.'}</span></label>
    </div>}
  </fieldset>
}
