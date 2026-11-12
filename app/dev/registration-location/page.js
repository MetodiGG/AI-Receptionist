import { notFound } from 'next/navigation'
import { RegistrationLocationPreview } from './preview'

export default async function RegistrationLocationPage({ searchParams }) {
  if (process.env.NODE_ENV !== 'development') notFound()
  const params = await searchParams
  return <RegistrationLocationPreview locale={params?.lang === 'en' ? 'en' : 'bg'}/>
}
