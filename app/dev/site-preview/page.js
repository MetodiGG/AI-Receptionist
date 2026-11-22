import { notFound } from 'next/navigation'
import { discoveryConfig } from '../../../lib/discovery/config.mjs'
import { ResponsiveSitePreview } from './preview'

export const metadata = { title: 'GoRez · responsive local preview', robots: { index: false, follow: false } }

export default async function SitePreviewPage({ searchParams }) {
  if (!discoveryConfig(process.env).devMock) notFound()
  const params = await searchParams
  return <ResponsiveSitePreview locale={params.lang === 'en' ? 'en' : 'bg'} initialDevice={params.device === 'laptop' ? 'laptop' : 'phone'}/>
}
