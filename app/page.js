import { HomePage } from '../components/home-page'
import { companyIdentity } from '../lib/product-config.mjs'
import { pageMetadata, websiteStructuredData } from '../lib/seo.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { homepageBrowseStartScript } from '../lib/discovery/homepage-browse-start.mjs'
import { SOCIAL_PREVIEW_TITLE } from '../lib/social-preview.mjs'

export async function generateMetadata({ searchParams }) {
  const locale = (await searchParams)?.lang === 'en' ? 'en' : 'bg'
  return pageMetadata('/', locale, { title: SOCIAL_PREVIEW_TITLE })
}

export default async function Home({ searchParams }) {
  const locale = (await searchParams)?.lang === 'en' ? 'en' : 'bg'
  const discoveryEnabled = discoveryConfig(process.env).enabled
  return <>
    {discoveryEnabled && <script id="gorez-home-browse-start" dangerouslySetInnerHTML={{ __html: homepageBrowseStartScript(locale) }}/>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(websiteStructuredData()).replace(/</g,'\\u003c')}}/>
    <HomePage initialLocale={locale} identity={companyIdentity(process.env)} discoveryEnabled={discoveryEnabled}/>
  </>
}
