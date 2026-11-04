import { FaqPage } from '../../components/faq-page'
import { pageMetadata } from '../../lib/seo.mjs'
import { companyIdentity } from '../../lib/product-config.mjs'
export async function generateMetadata({searchParams}){const en=(await searchParams)?.lang==='en';return pageMetadata('/faq',en?'en':'bg',{title:en?'Frequently Asked Questions · GoRez':'Често задавани въпроси · GoRez',description:en?'Answers for customers and businesses about GoRez bookings, external systems, profiles and privacy.':'Отговори за клиенти и бизнеси за GoRez резервации, външни системи, профили и поверителност.'})}
export default async function Page({searchParams}){return <FaqPage initialLocale={(await searchParams)?.lang==='en'?'en':'bg'} identity={companyIdentity(process.env)}/>}
