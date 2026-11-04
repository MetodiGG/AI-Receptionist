'use client'
import { useEffect,useRef,useState } from 'react'
import { OutboundBookingButton } from './outbound-booking-button'
import { validPlaceId } from '../lib/outbound-booking.mjs'
export function ExternalPlaceBooking({placeId,locale='bg'}) {
 const en=locale==='en',[booking,setBooking]=useState(null),[status,setStatus]=useState('loading'),[reason,setReason]=useState(''),[reported,setReported]=useState(false),[reportState,setReportState]=useState('idle'),reportLock=useRef(false)
 useEffect(()=>{setBooking(null);setStatus('loading');setReported(false);const abort=new AbortController();fetch('/api/public/external-booking-links',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({placeId}),signal:abort.signal}).then(r=>r.ok?r.json():Promise.reject()).then(v=>{setBooking(v.booking);setStatus('ready')}).catch(()=>{if(!abort.signal.aborted)setStatus('error')});return()=>abort.abort()},[placeId])
 if(!validPlaceId(placeId))return null
 const maps=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeId)}&query_place_id=${encodeURIComponent(placeId)}`
 async function report(e){
  e.preventDefault();if(reportLock.current||!booking)return
  reportLock.current=true;setReportState('sending')
  try {
   const r=await fetch('/api/public/external-booking-reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({linkId:booking.id,reason})})
   if(!r.ok)throw new Error('REPORT_UNAVAILABLE')
   setReported(true);setReason('');setReportState('sent')
  }catch{setReportState('error')}finally{reportLock.current=false}
 }
 return <section className="external-place-selection" aria-live="polite"><h4>{en?'Selected Google Maps business':'Избраният бизнес от Google Maps'}</h4><p>{en?'Another business from Google Maps — not a GoRez partner.':'Друг бизнес от Google Maps — не е партньор на GoRez'}</p><a className="secondary-button" href={maps} target="_blank" rel="noopener noreferrer">{en?'View on Google Maps / photos':'Покажи на карта / снимки'}</a>{status==='loading'?<p role="status">{en?'Checking for a verified booking link…':'Проверяваме за потвърден линк за резервации…'}</p>:status==='error'?<p role="status">{en?'Could not check the booking link. Use Google Maps or try later.':'Не успяхме да проверим линка. Използвай Google Maps или опитай по-късно.'}</p>:booking?<><h5>{booking.label}</h5><p>{en?'GoRez has checked the business association and booking page. Availability and confirmation are handled only by that website.':'GoRez е проверил връзката с бизнеса и страницата за резервации. Наличността и потвърждението се управляват само от външния сайт.'}</p><OutboundBookingButton linkId={booking.id} locale={locale}/><details><summary>{en?'Report an incorrect booking link':'Съобщи за грешен линк за резервации'}</summary>{reported?<p>{en?'Report received. Thank you.':'Сигналът е получен. Благодарим.'}</p>:<form onSubmit={report}><label>{en?'What is incorrect? Do not include personal data.':'Какво не е правилно? Не включвай лични данни.'}<textarea required minLength={5} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label><button type="submit" className="secondary-button" disabled={reportState==='sending'}>{en?'Send report':'Изпрати сигнал'}</button></form>}</details></>:<p>{en?'No verified booking link is available here. Use Google Maps or the official website action on the Google card.':'Тук няма потвърден линк за резервации. Използвай Google Maps или действието за официалния сайт в Google картата.'}</p>}</section>
}
