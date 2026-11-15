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
    <section className="settings-panel" data-loading-example="page"><h2>Страница</h2><BrandLoading size={48}/></section>
    <section className="settings-panel" data-loading-example="details"><h2>Детайли</h2><BrandLoading locale="en"/></section>
    <section className="settings-panel"><h2>Бутон</h2><button type="button" className="primary-button" disabled aria-label="Търсене"><BrandLoading size={20} decorative/></button></section>
    <section className="settings-panel" data-loading-example="icon-controls"><h2>Компактни контроли</h2><div style={{display:'flex',gap:16,alignItems:'center'}}><button className="home-search-trigger" type="button" aria-label="Търсене" aria-busy="true"><BrandLoading size={20} decorative/></button><button className="home-inline-control home-inline-location" type="button" aria-label="Локация" aria-busy="true"><BrandLoading size={20} decorative/></button></div></section>
    <section className="settings-panel discovery-compact" data-loading-example="compact-submit"><h2>Мобилно търсене</h2><button className="discovery-submit" type="button" aria-label="Търсене" aria-busy="true"><BrandLoading size={20} decorative/><span>Намери</span></button></section>
    <MonthlyBookingCalendarView month="2028-02" timezone="Europe/Sofia" locale="bg" calendar={calendar} status="loading" canPrevious={false} canNext={false}/>
  </main>
}
