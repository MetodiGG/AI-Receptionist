import { notFound } from 'next/navigation'
import { discoveryConfig } from '../../../lib/discovery/config.mjs'
import { GuidedDiscoveryPreview } from './preview'
import { presentPublicBusiness } from '../../../lib/locale/public-content-server.mjs'
import { getBusinessPhotos } from '../../../lib/business-photos.mjs'
import snapshot from '../../../tests/fixtures/guided-public-partners-20261121.json'

export const metadata = { title: 'GoRez · guided discovery local review', robots: { index: false, follow: false } }
export default async function GuidedPreviewPage({ searchParams }) {
  if (!discoveryConfig(process.env).devMock) notFound()
  const params = await searchParams
  const partners = snapshot.businesses.map(row => presentPublicBusiness({ ...row, photos: snapshot.localPhotos[row.id] || getBusinessPhotos(row) }))
  return <GuidedDiscoveryPreview locale={params.lang === 'en' ? 'en' : 'bg'} photos={params.view === 'photos'} largeText={params.text === 'large'} partners={partners}/>
}
