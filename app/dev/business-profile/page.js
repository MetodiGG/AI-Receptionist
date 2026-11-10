import { notFound } from 'next/navigation'
import PublicBookingPage from '../../../components/public-booking-page'
import { ReviewForm } from '../../../components/review-form'
import { ReviewAdmin } from '../../../components/review-admin'
import { getBusinessPhotos } from '../../../lib/business-photos.mjs'

export default async function BusinessProfileFixture({ searchParams }) {
  if (process.env.NODE_ENV === 'production') notFound()
  const query = await searchParams, locale = query?.lang === 'en' ? 'en' : 'bg'
  const token = '00000000-0000-4000-8000-000000000001'
  const business = { id: token, slug: 'qa-fictional-review-studio', name: 'QA Студио — пример', industry: 'beauty', timezone: 'Europe/Sofia', address: 'QA адрес, София', phone: '0000000000', theme_color: '#173e2a', booking_window_days: 60, staffServices: [],
    public_profile: { description: { bg: 'Локален пример за подреден бизнес профил. Данните и отзивите са измислени само за тест.', en: 'A local example of a structured business profile. All business details and reviews are fictional test data.' }, payments: ['cash', 'card'], brands: ['QA Brand One', 'QA Brand Two'], latitude: 42.7, longitude: 23.32 },
    photos: getBusinessPhotos({ id: '450c5c2f-db41-476b-a21e-98cf5ee29194' }),
    services: [{ id: token, name: 'QA Маникюр', category: 'QA Нокти', duration_min: 60, price: 30, currency: 'EUR', description: 'Примерно описание за тест на разгъващите се детайли.' }, { id: '00000000-0000-4000-8000-000000000002', name: 'QA Педикюр', category: 'QA Нокти', duration_min: 60, price: 36, currency: 'EUR' }],
    staff: [{ id: token, name: 'QA Специалист', bio: 'Примерен член на екипа' }],
    workingHours: [1, 2, 3, 4, 5].map(weekday => ({ staff_id: token, weekday, open_time: '09:00:00', close_time: '18:00:00', break_start: '12:00:00', break_end: '13:00:00' })),
  }
  const reviews = { summary: { count: 2, average: 4.5, quality: 4.5, service: 5, cleanliness: 4.5, atmosphere: 4 }, items: [{ id: token, rating: 5, display_name: 'QA Клиент А', comment: 'Измислен отзив само за локална проверка на изгледа.', created_at: '2026-10-25T12:00:00Z' }, { id: '00000000-0000-4000-8000-000000000003', rating: 4, display_name: 'QA Клиент Б', comment: 'Втори тестов коментар. Не е реална клиентска оценка.', created_at: '2026-10-24T12:00:00Z' }], next: null }
  if (locale === 'en') {
    business.name = 'QA Studio — sample'
    business.address = 'QA address, Sofia'
    business.services = business.services.map((service, index) => ({ ...service, name: index ? 'QA Pedicure' : 'QA Manicure', category: 'QA Nail care', description: index ? '' : 'Fictional service details for local testing.' }))
    business.staff = business.staff.map(person => ({ ...person, name: 'QA Specialist', bio: 'Fictional team member' }))
  }
  if (query?.reviews === 'empty') { reviews.summary = { count: 0 }; reviews.items = [] }
  if (query?.stress === '1') {
    business.name = locale === 'en' ? 'QA Studio with a deliberately long name for responsive layout verification' : 'QA Студио с дълго име за проверка на мобилното оформление'
    business.services.push({ id: '00000000-0000-4000-8000-000000000004', name: locale === 'en' ? 'A very long service name with detailed specialist care and consultation' : 'Услуга с много дълго наименование и допълнителна консултация', price: 1000, priceKind: 'range', priceMaximum: 1500, currency: 'EUR', duration_min: 90 }, { id: '00000000-0000-4000-8000-000000000005', name: locale === 'en' ? 'Consultation' : 'Консултация', price: null, currency: 'EUR', duration_min: 30 })
    business.staff.push({ id: '00000000-0000-4000-8000-000000000006', name: locale === 'en' ? 'QA Specialist Two' : 'QA Специалист две' })
  }
  if(query?.mode==='external'){business.booking_mode='external';business.staff=[];business.workingHours=[];business.services=business.services.map(s=>({...s,price:null,duration_min:null}));business.opening_hours=Array.from({length:7},(_,i)=>({weekday:i+1,periods:i<5?[{open:'09:00',close:'18:00'}]:[]}))}
  if (query?.view === 'review') return <ReviewForm token={token} initialLocale={locale} previewVisit={{ business: { name: business.name, slug: business.slug }, service: 'QA Маникюр', endsAt: '2026-10-25T12:00:00Z', submitted: false }} />
  if (query?.view === 'admin') return <ReviewAdmin preview={{ items: reviews.items.map(item => ({ ...item, business: { name: business.name, slug: business.slug }, status: 'published', revision: 0 })), next: null }} />
  const scenario = ['empty','error','slow','conflict'].includes(query?.calendar) ? query.calendar : 'normal'
  return <PublicBookingPage previewBusiness={business} previewReviews={reviews} initialLocale={locale} previewCalendarScenario={scenario}/>
}
