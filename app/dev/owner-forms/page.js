import { notFound } from 'next/navigation'
import { OwnerFormsPreview } from './preview'

export const metadata = { title: 'Local owner forms review', robots: { index: false, follow: false } }

export default async function OwnerFormsPage({ searchParams }) {
  if (process.env.NODE_ENV !== 'development') notFound()
  const params = await searchParams
  return <OwnerFormsPreview locale={params?.lang === 'en' ? 'en' : 'bg'}/>
}
