'use client'

import { PRODUCT_EVENT_NAMES } from './product-event-names.mjs'
const CONSENT_KEY = 'gorez-product-measurement'
const flows = new Map(), sent = new Set()
export const productMeasurementEnabled = process.env.NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED === 'true'
export function productMeasurementConsent() { try {return localStorage.getItem(CONSENT_KEY)==='yes'} catch {return false} }
export function setProductMeasurementConsent(allowed) {
  try {localStorage.setItem(CONSENT_KEY,allowed?'yes':'no')} catch {}
  flows.clear(); sent.clear()
}
export function trackProductEvent(event, page, locale) {
  if (!productMeasurementEnabled || !productMeasurementConsent() || !PRODUCT_EVENT_NAMES.includes(event) || !['home','for-businesses','book'].includes(page)) return
  if (!flows.has(page)) flows.set(page,crypto.randomUUID())
  const flowKey=flows.get(page), key=`${flowKey}:${event}`
  if (sent.has(key)) return
  sent.add(key)
  // No page URL, user/account ID, business ID or free-form metadata is sent.
  fetch('/api/product-events',{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({event,page,locale:locale==='en'?'en':'bg',flowKey,consent:true})}).catch(()=>{})
}
