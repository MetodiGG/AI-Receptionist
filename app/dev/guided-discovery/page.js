import { notFound } from 'next/navigation'
import { discoveryConfig } from '../../../lib/discovery/config.mjs'
import { GuidedDiscoveryPreview } from './preview'

export const metadata = { title: 'GoRez · guided discovery local review', robots: { index: false, follow: false } }
export default async function GuidedPreviewPage({ searchParams }) {
  if (!discoveryConfig(process.env).devMock) notFound()
  const params = await searchParams
  return <GuidedDiscoveryPreview locale={params.lang === 'en' ? 'en' : 'bg'} photos={params.view === 'photos'} largeText={params.text === 'large'}/>
}
