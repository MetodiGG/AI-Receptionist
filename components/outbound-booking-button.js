'use client'
import { useEffect,useRef,useState } from 'react'
import { bookingAction, isPhoneBooking } from '../lib/booking-mode.mjs'
export function OutboundBookingButton({business,linkId,locale='bg',className='primary-button',children,disabled=false}) {
 const [busy,setBusy]=useState(false)
 const lock=useRef(false),[eventId,setEventId]=useState('')
 useEffect(()=>{setEventId(crypto.randomUUID());const restore=()=>{lock.current=false;setBusy(false);setEventId(crypto.randomUUID())};window.addEventListener('pageshow',restore);return()=>window.removeEventListener('pageshow',restore)},[])
 const path=linkId?`/out/place/${encodeURIComponent(linkId)}?lang=${locale}`:bookingAction(business,locale).href
 if(!linkId&&isPhoneBooking(business))return disabled||!path?<span className={className} aria-disabled="true">{children||(locale==='en'?'Book an appointment':'Резервирай час')}</span>:<a className={className} href={path}>{children||(locale==='en'?'Book an appointment':'Резервирай час')}</a>
 return <form className="outbound-booking-form" action={path} method="post" onSubmit={event=>{if(lock.current||disabled){event.preventDefault();return}lock.current=true;setBusy(true)}}><input type="hidden" name="eventId" value={eventId}/><button className={className} type="submit" disabled={busy||disabled}>{busy?(locale==='en'?'Opening…':'Отваряне…'):(children||(locale==='en'?'Book an appointment':'Запази час'))}</button></form>
}
