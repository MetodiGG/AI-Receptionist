'use client'
import { useState } from 'react'
import { productMeasurementEnabled, productMeasurementConsent, setProductMeasurementConsent } from '../lib/product-events-client'

export function ProductMeasurement({locale}) {
  const [open,setOpen]=useState(false),[allowed,setAllowed]=useState(false),en=locale==='en'
  if(!productMeasurementEnabled)return null
  return <div className="product-measurement"><button type="button" className="link-button" aria-expanded={open} onClick={()=>{setAllowed(productMeasurementConsent());setOpen(!open)}}>{en?'Measurement preferences':'Настройки за измерване'}</button>{open&&<div role="group" aria-label={en?'Usage measurement':'Измерване на използването'}><p>{en?'Optional first-party measurement of clicks and completed flows. Event data excludes names, emails, phones and private booking links. Your choice is saved on this device.':'Незадължително измерване на кликвания и завършени стъпки в GoRez. Събитията не съдържат имена, имейли, телефони или лични линкове за резервации. Изборът се запазва на това устройство.'}</p><p>{allowed?(en?'Currently allowed':'В момента е разрешено'):(en?'Currently disabled':'В момента е изключено')}</p><button type="button" onClick={()=>{setProductMeasurementConsent(true);setAllowed(true);setOpen(false)}}>{en?'Allow':'Разреши'}</button><button type="button" onClick={()=>{setProductMeasurementConsent(false);setAllowed(false);setOpen(false)}}>{en?'Decline / withdraw':'Откажи / оттегли'}</button></div>}</div>
}
