import { notFound } from 'next/navigation'
import PasswordRecoveryPreview from './preview'

export default function Page() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <PasswordRecoveryPreview />
}
