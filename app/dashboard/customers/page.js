'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { OwnerPage } from '../../../components/owner-page'
import { supabase } from '../../../lib/supabase'

function CustomersContent({ business }) {
  const [customers, setCustomers] = useState([])
  const [appointments, setAppointments] = useState([])
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [customersResult, appointmentsResult] = await Promise.all([
      supabase.from('customers').select('*').eq('business_id', business.id).order('created_at', { ascending: false }),
      supabase.from('appointments').select('customer_id,status,starts_at').eq('business_id', business.id),
    ])
    const requestError = customersResult.error || appointmentsResult.error
    if (requestError) { setError(requestError.message); setStatus('error'); return }
    setCustomers(customersResult.data || [])
    setAppointments(appointmentsResult.data || [])
    setStatus('ready')
  }, [business.id])

  useEffect(() => { load() }, [load])

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return customers.filter((customer) => !normalized || [customer.name, customer.phone, customer.email].some((value) => value?.toLowerCase().includes(normalized)))
  }, [customers, query])

  function stats(customerId) {
    const rows = appointments.filter((item) => item.customer_id === customerId)
    return { total: rows.length, completed: rows.filter((item) => item.status === 'done').length }
  }

  async function saveNotes() {
    const { error: updateError } = await supabase.from('customers').update({ notes }).eq('id', editing.id).eq('business_id', business.id)
    if (updateError) { setError(updateError.message); return }
    setCustomers((current) => current.map((item) => item.id === editing.id ? { ...item, notes } : item))
    setEditing(null)
  }

  return (
    <main className="dashboard-content admin-page">
      <div className="admin-page-head"><div><p className="auth-kicker">CRM</p><h2>Клиенти</h2><p>Контакти и история на посещенията на едно място.</p></div><div className="admin-count"><strong>{customers.length}</strong><span>клиенти</span></div></div>
      <label className="admin-search"><span className="sr-only">Търси клиенти</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Търси по име, телефон или имейл..." /></label>
      {error && <p className="form-message" role="alert">{error}</p>}
      {status === 'loading' && <div className="admin-loading"><span className="button-spinner" /> Зареждаме клиентите...</div>}
      {status === 'ready' && visible.length === 0 && <div className="empty-state"><h3>Няма намерени клиенти</h3><p>Новите клиенти ще се появят тук след първата им резервация.</p></div>}
      <div className="customer-grid">{visible.map((customer) => {
        const customerStats = stats(customer.id)
        return <article className="customer-card" key={customer.id}>
          <div className="customer-avatar">{(customer.name || '?').slice(0, 1).toUpperCase()}</div>
          <div className="customer-info"><h3>{customer.name || 'Посетител от чата'}</h3><a href={customer.phone ? `tel:${customer.phone}` : undefined}>{customer.phone || 'Без телефон'}</a><small>{customer.email || customer.channel}</small></div>
          <div className="customer-stats"><span><strong>{customerStats.total}</strong> резервации</span><span><strong>{customerStats.completed}</strong> посещения</span></div>
          {customer.notes && <p className="customer-notes">{customer.notes}</p>}
          <button className="ghost-button" type="button" onClick={() => { setEditing(customer); setNotes(customer.notes || '') }}>Бележки</button>
        </article>
      })}</div>
      {editing && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null) }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="notes-title"><h3 id="notes-title">Бележки за {editing.name || 'клиента'}</h3><textarea className="text-area" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Предпочитания, важна информация..." /><div><button className="secondary-button" type="button" onClick={() => setEditing(null)}>Отказ</button><button className="primary-button" type="button" onClick={saveNotes}>Запази</button></div></section></div>}
    </main>
  )
}

export default function CustomersPage() {
  return <OwnerPage title="Клиенти">{(props) => <CustomersContent {...props} />}</OwnerPage>
}
