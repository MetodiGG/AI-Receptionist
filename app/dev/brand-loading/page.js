import { notFound } from 'next/navigation'
import { BrandLoading } from '../../../components/brand-loading'
import { MonthlyBookingCalendarView } from '../../../components/monthly-booking-calendar'
import { bookingMonthGrid } from '../../../lib/monthly-booking-calendar.mjs'

export const metadata = { title: 'GoRez · local loading-logo review', robots: { index: false, follow: false } }
export default function Page() {
  if (process.env.NODE_ENV !== 'development') notFound()
  const calendar = bookingMonthGrid({ month: '2028-02', timezone: 'Europe/Sofia', firstBookableDate: '2028-02-01', lastBookableDate: '2028-02-29' })
  return <main className="marketing-page" style={{ maxWidth: 760, margin: '24px auto', padding: 20 }}>
    <h1>GoRez · локален преглед</h1><p>Само индикатори — без заявки, резервации или известия.</p>
    <section className="settings-panel"><h2>Страница</h2><BrandLoading size={48}/></section>
    <section className="settings-panel"><h2>Детайли</h2><BrandLoading locale="en"/></section>
    <section className="settings-panel"><h2>Бутон</h2><button type="button" className="primary-button" disabled aria-label="Търсене"><BrandLoading size={20} decorative/></button></section>
    <MonthlyBookingCalendarView month="2028-02" timezone="Europe/Sofia" locale="bg" calendar={calendar} status="loading" canPrevious={false} canNext={false}/>
  </main>
}
