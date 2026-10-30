import { notFound } from 'next/navigation'
import PhotoUploadPreview from './preview'

export const metadata = { title: 'Local photo upload QA', robots: { index: false, follow: false } }
export default function Page() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <PhotoUploadPreview />
}
