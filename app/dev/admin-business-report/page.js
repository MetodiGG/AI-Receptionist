import { notFound } from 'next/navigation'
import { AdminReportPreview } from './preview'

export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <AdminReportPreview/>
}
