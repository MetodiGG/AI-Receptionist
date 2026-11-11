import { notFound } from 'next/navigation'
import { ServiceTextPreview } from './preview'

export const metadata = { title: 'Local service text layout review', robots: { index: false, follow: false } }

export default async function ServiceTextPage({ searchParams }) {
  if (process.env.NODE_ENV !== 'development') notFound()
  const params = await searchParams
  return <ServiceTextPreview locale={params?.lang === 'en' ? 'en' : 'bg'} stress={params?.stress === '1'}/>
}
