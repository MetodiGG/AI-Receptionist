import { notFound } from 'next/navigation'
import { HomeNavigationPreview } from './preview'

export default function HomeNavigationFixture() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <HomeNavigationPreview />
}
