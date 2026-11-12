import PublicBookingPage from '../../../components/public-booking-page'
import { readSeoBusiness } from '../../../lib/seo-businesses'
import { pageMetadata, businessStructuredData, safeJsonLd } from '../../../lib/seo.mjs'

export async function generateMetadata({params,searchParams}) {
  const {slug}=await params,query=await searchParams,locale=query?.lang==='en'?'en':'bg'
  try {
    const business=await readSeoBusiness(slug)
    if(!business||query?.embed==='1')return {title:'GoRez',robots:{index:false,follow:false}}
    const external=business.booking_mode==='external',phone=business.booking_mode==='phone'
    return pageMetadata(`/book/${slug}`,locale,{title:`${business.name} — ${phone?(locale==='en'?'book an appointment':'резервирай час'):(locale==='en'?'book online':'запази час онлайн')} · GoRez`,description:phone?(locale==='en'?`Explore services and prices at ${business.name}. Contact the business by phone to arrange an appointment.`:`Разгледай услугите и цените в ${business.name}. Уговори час с бизнеса по телефон.`):external?(locale==='en'?`Explore ${business.name} on GoRez. Check appointments and complete booking on the business’s website.`:`Разгледай ${business.name} в GoRez. Провери часовете и завърши резервацията в сайта на бизнеса.`):(locale==='en'?`Services and available appointments at ${business.name}. Book online with GoRez.`:`Услуги и свободни часове в ${business.name}. Запази час онлайн с GoRez.`)})
  } catch {return {title:'GoRez',robots:{index:false,follow:false}}}
}
export default async function Booking({params,searchParams}) {
  const {slug}=await params,query=await searchParams,locale=query?.lang==='en'?'en':'bg'
  let structured
  try {if(query?.embed!=='1')structured=businessStructuredData(await readSeoBusiness(slug),locale)} catch {}
  return <>{structured&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:safeJsonLd(structured)}}/>}<PublicBookingPage initialLocale={locale}/></>
}
