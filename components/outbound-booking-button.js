'use client'
import { isValidElement,useEffect,useRef,useState } from 'react'
import { bookingAction, isPhoneBooking } from '../lib/booking-mode.mjs'
import { BookingButtonContent } from './booking-button-content'
import { PublicAction } from './public-action'
import styles from './public-action.module.css'
export function OutboundBookingButton({business,linkId,locale='bg',className='',children,disabled=false}) {
 const [busy,setBusy]=useState(false)
 const lock=useRef(false),[eventId,setEventId]=useState('')
 useEffect(()=>{setEventId(crypto.randomUUID());const restore=()=>{lock.current=false;setBusy(false);setEventId(crypto.randomUUID())};window.addEventListener('pageshow',restore);return()=>window.removeEventListener('pageshow',restore)},[])
 const path=linkId?`/out/place/${encodeURIComponent(linkId)}?lang=${locale}`:bookingAction(business,locale).href
 const content=isValidElement(children)&&children.type===BookingButtonContent?children.props.children:children||(locale==='en'?'Book':'Резервирай')
 if(!linkId&&isPhoneBooking(business))return disabled||!path?<PublicAction as="span" className={className} aria-disabled="true">{content}</PublicAction>:<PublicAction as="a" className={className} href={path}>{content}</PublicAction>
 return <form className={styles.outboundForm} data-public-outbound-form action={path} method="post" onSubmit={event=>{if(lock.current||disabled){event.preventDefault();return}lock.current=true;setBusy(true)}}><input type="hidden" name="eventId" value={eventId}/><PublicAction className={className} type="submit" disabled={busy||disabled}>{busy?(locale==='en'?'Opening…':'Отваряне…'):content}</PublicAction></form>
}
