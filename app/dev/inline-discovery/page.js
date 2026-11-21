import { notFound } from 'next/navigation'
import { discoveryConfig } from '../../../lib/discovery/config.mjs'
import { GuidedDiscoveryPreview } from '../guided-discovery/preview'

export const metadata = { title: 'GoRez · inline discovery local review', robots: { index: false, follow: false } }
export default async function InlinePreviewPage({ searchParams }) {
  if (!discoveryConfig(process.env).devMock) notFound()
  const params = await searchParams
  return <>
    {params.text === 'large' && <><style>{'html:has([data-inline-review-text="large"]) { font-size: 200%; }'}</style><span hidden data-inline-review-text="large"/></>}
    <GuidedDiscoveryPreview locale={params.lang === 'en' ? 'en' : 'bg'} photos={params.view === 'photos'}/>
  </>
}
