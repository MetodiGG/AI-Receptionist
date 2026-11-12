'use client'

import { useState } from 'react'
import { DateTime } from 'luxon'
import { AdminBusinessReport } from '../../../components/admin-business-report'

const statuses = ['booked', 'confirmed', 'done', 'cancelled', 'no_show']
const businesses = [
  { id: '00000000-0000-4000-8000-000000000001', name: 'Измислено QA студио · дълго тестово име на бизнеса', timezone: 'Europe/Sofia', booking_mode: 'native' },
  { id: '00000000-0000-4000-8000-000000000002', name: 'Измислен QA бизнес с външни резервации', timezone: 'Europe/Sofia', booking_mode: 'external' },
]
const counts = rows => Object.fromEntries(statuses.map(status => [status, rows.filter(row => row.status === status).length]))
function report(query, business) {
  const all = business.booking_mode === 'external' ? [] : Array.from({ length: 60 }, (_, index) => {
    const customer = index % 15
    const starts = DateTime.fromISO(query.from, { zone: business.timezone }).plus({ days: index % 28, hours: 10 + index % 6 })
    return { id: `fictional-booking-${index}`, startsAt: starts.toUTC().toISO(), endsAt: starts.plus({ minutes: 45 }).toUTC().toISO(), createdAt: starts.minus({ days: 2 }).toUTC().toISO(), status: statuses[index % 5], source: ['web', 'manual', 'bot'][index % 3], customer: { id: `fictional-customer-${customer}`, name: customer === 14 ? 'Изтрит клиент' : `QA клиент ${customer + 1} · измислен пример`, phone: customer === 14 ? null : '+359000000000', email: customer === 14 ? null : `fictional-long-test-contact-${customer + 1}@example.invalid` }, service: { id: 'fictional-service', name: 'Измислена услуга с дълго име за проверка на пренасянето на текста' }, staff: { id: 'fictional-staff', name: 'QA служител · измислен пример' } }
  })
  const filtered = query.status === 'all' ? all : all.filter(row => row.status === query.status)
  const customerIds = [...new Set(filtered.map(row => row.customer.id))]
  const customers = customerIds.map(id => {
    const rows = filtered.filter(row => row.customer.id === id).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    return { ...rows[0].customer, bookings: rows.length, statuses: counts(rows), firstVisitAt: rows[0].startsAt, lastVisitAt: rows.at(-1).startsAt }
  })
  const rows = query.view === 'customers' ? customers : filtered
  return { business: { id: business.id, name: business.name, timezone: business.timezone, bookingMode: business.booking_mode }, period: { from: query.from, to: query.to, basis: query.basis, timezone: business.timezone }, summary: { bookings: all.length, customers: new Set(all.map(row => row.customer.id)).size, statuses: counts(all) }, filtered: { bookings: filtered.length, customers: customers.length }, view: query.view, page: query.page, pageSize: query.limit, totalRows: rows.length, totalPages: Math.ceil(rows.length / query.limit), rows: rows.slice((query.page - 1) * query.limit, query.page * query.limit) }
}
export function AdminReportPreview() {
  const [locale, setLocale] = useState('bg'), [businessId, setBusinessId] = useState(businesses[0].id)
  const business = businesses.find(row => row.id === businessId)
  return <main className="admin-report-preview"><header><h1>{business.name}</h1><button type="button" className="secondary-button" onClick={() => setLocale(value => value === 'bg' ? 'en' : 'bg')}>BG / EN</button><button type="button" className="secondary-button" onClick={() => setBusinessId(value => value === businesses[0].id ? businesses[1].id : businesses[0].id)}>{locale === 'en' ? 'Switch fictional business' : 'Смени измисления бизнес'}</button></header><AdminBusinessReport business={business} locale={locale} preview={report}/></main>
}
