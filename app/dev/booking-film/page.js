import { notFound } from 'next/navigation'
import { BookingFilmPreview } from './preview'

export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <BookingFilmPreview/>
}
