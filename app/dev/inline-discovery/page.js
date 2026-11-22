import { notFound } from 'next/navigation'
import { discoveryConfig } from '../../../lib/discovery/config.mjs'
import { GuidedDiscoveryPreview } from '../guided-discovery/preview'
import { presentPublicBusiness } from '../../../lib/locale/public-content-server.mjs'
import { getBusinessPhotos } from '../../../lib/business-photos.mjs'
import snapshot from '../../../tests/fixtures/guided-public-partners-20261121.json'

export const metadata = { title: 'GoRez · inline discovery local review', robots: { index: false, follow: false } }
export default async function InlinePreviewPage({ searchParams }) {
  if (!discoveryConfig(process.env).devMock) notFound()
  const params = await searchParams
  const partners = snapshot.businesses.map(row => presentPublicBusiness({ ...row, photos: snapshot.localPhotos[row.id] || getBusinessPhotos(row) }))
  return <>
    {params.text === 'large' && <><style>{'html:has([data-inline-review-text="large"]) { font-size: 200%; }'}</style><span hidden data-inline-review-text="large"/></>}
    <GuidedDiscoveryPreview locale={params.lang === 'en' ? 'en' : 'bg'} photos={params.view === 'photos'} partners={partners}/>
  </>
}
