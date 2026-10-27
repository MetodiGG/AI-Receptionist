import { HomePage } from '../components/home-page'
import { companyIdentity } from '../lib/product-config.mjs'
import { pageMetadata, websiteStructuredData } from '../lib/seo.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'

export async function generateMetadata({ searchParams }) {
  const locale = (await searchParams)?.lang === 'en' ? 'en' : 'bg'
  return pageMetadata('/', locale)
}

export default async function Home({ searchParams }) {
  const locale = (await searchParams)?.lang === 'en' ? 'en' : 'bg'
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(websiteStructuredData()).replace(/</g,'\\u003c')}}/><HomePage initialLocale={locale} identity={companyIdentity(process.env)} discoveryEnabled={discoveryConfig(process.env).enabled}/></>
}
