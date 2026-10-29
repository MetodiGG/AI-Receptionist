import { resolvePublicOrigin } from './public-url.mjs'
import { PRICING_COPY, SUPPORT_EMAIL } from './product-config.mjs'
export const SITE_ORIGIN = resolvePublicOrigin(process.env.NEXT_PUBLIC_APP_URL) || 'https://www.gorez.co'
export function localizedUrl(path,locale='bg') { return `${SITE_ORIGIN}${path}?lang=${locale==='en'?'en':'bg'}` }
export function languageAlternates(path) { return {canonical:localizedUrl(path),languages:{'bg-BG':localizedUrl(path),'en':localizedUrl(path,'en'),'x-default':localizedUrl(path)}} }
export function pageMetadata(path,locale='bg',overrides={}) {
  const en=locale==='en',business=path==='/for-businesses'
  const title=overrides.title || (business ? `${en?'GoRez for business':'GoRez за бизнеса'} — ${PRICING_COPY[locale].trial}` : (en?'GoRez — online booking for appointment-based businesses':'GoRez — онлайн резервации за бизнеси с часове'))
  const description=overrides.description || (business ? (en?`Online bookings, a calendar and a personal page for your business. ${PRICING_COPY.en.summary}`:`Онлайн резервации, календар и лична страница за твоя бизнес. ${PRICING_COPY.bg.summary}`) : (en?'Find a business, explore services and book an available time. Beauty, auto services and more.':'Намери бизнес, избери услуга и запази свободен час онлайн. Красота, автосервизи и още услуги.'))
  const alternates=languageAlternates(path);alternates.canonical=localizedUrl(path,locale)
  const images=[{url:`/share-image?lang=${locale}&page=${business?'business':'home'}`,width:1200,height:630,alt:title}]
  return {title:{absolute:title},description,alternates,openGraph:{title,description,url:alternates.canonical,locale:en?'en_GB':'bg_BG',alternateLocale:[en?'bg_BG':'en_GB'],siteName:'GoRez',type:'website',images},twitter:{card:'summary_large_image',title,description,images:images.map(image=>image.url)}}
}
export function websiteStructuredData() {
  return {'@context':'https://schema.org','@graph':[
    {'@type':'Organization','@id':`${SITE_ORIGIN}/#organization`,name:'GoRez',url:SITE_ORIGIN,email:SUPPORT_EMAIL,logo:`${SITE_ORIGIN}/gorez-symbol.svg?v=3`},
    {'@type':'WebSite','@id':`${SITE_ORIGIN}/#website`,name:'GoRez',url:SITE_ORIGIN,inLanguage:['bg','en'],publisher:{'@id':`${SITE_ORIGIN}/#organization`}},
  ]}
}
export function businessStructuredData(business,locale='bg') {
  if(!business?.active||business.platform_status!=='enabled')return null
  const types={beauty:'BeautySalon',auto:'AutomotiveBusiness',fitness:'SportsActivityLocation'}
  return {'@context':'https://schema.org','@type':types[business.industry]||'LocalBusiness',name:business.name,url:localizedUrl(`/book/${business.slug}`,locale),...(business.phone?{telephone:business.phone}:{}),...(business.address?{address:business.address}:{})}
}
export const safeJsonLd = value => JSON.stringify(value).replace(/</g,'\\u003c')
