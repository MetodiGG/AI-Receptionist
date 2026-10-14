import { notFound } from 'next/navigation'
import CalendarPreview from './preview'

export default function DevelopmentCalendarPreview() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <CalendarPreview />
}
