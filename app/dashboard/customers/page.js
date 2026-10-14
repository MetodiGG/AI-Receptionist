'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../../../components/icon'
import { OwnerPage } from '../../../components/owner-page'
import { supabase } from '../../../lib/supabase'

function CustomersContent({ business }) {
  const [customers, setCustomers] = useState([])
  const [appointments, setAppointments] = useState([])
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [customerToDelete, setCustomerToDelete] = useState(null)
  const [notes, setNotes] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [customersResult, appointmentsResult] = await Promise.all([
      supabase.from('customers').select('*').eq('business_id', business.id).order('created_at', { ascending: false }),
      supabase.from('appointments').select('customer_id,status,starts_at').eq('business_id', business.id),
    ])
    const requestError = customersResult.error || appointmentsResult.error
    if (requestError) { setError(requestError.message); setStatus('error'); return }
    setCustomers((customersResult.data || []).filter((customer) => customer.name !== 'Изтрит клиент'))
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

  async function deleteCustomer() {
    if (!customerToDelete || deleting) return
    setDeleting(true)
    setError('')
    setDeleteError('')
    const { error: requestError } = await supabase.rpc('anonymize_customer', { input_business_id: business.id, input_customer_id: customerToDelete.id })
    setDeleting(false)
    if (requestError) { setDeleteError(`Не успяхме да изтрием клиента: ${requestError.message}`); return }
    setCustomers((current) => current.filter((item) => item.id !== customerToDelete.id))
    setCustomerToDelete(null)
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
          <div className="customer-actions"><button className="ghost-button" type="button" onClick={() => { setEditing(customer); setNotes(customer.notes || '') }}>Бележки</button><button className="danger-link" type="button" onClick={() => { setCustomerToDelete(customer); setDeleteError('') }}><Icon name="trash" /> Изтрий</button></div>
        </article>
      })}</div>
      {editing && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null) }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="notes-title"><h3 id="notes-title">Бележки за {editing.name || 'клиента'}</h3><textarea className="text-area" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Предпочитания, важна информация..." /><div><button className="secondary-button" type="button" onClick={() => setEditing(null)}>Отказ</button><button className="primary-button" type="button" onClick={saveNotes}>Запази</button></div></section></div>}
      {customerToDelete && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deleting) setCustomerToDelete(null) }}><section className="admin-modal delete-customer-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-customer-title" aria-describedby="delete-customer-description"><span className="delete-customer-icon"><Icon name="trash" /></span><h3 id="delete-customer-title">Изтриване на клиент</h3><p id="delete-customer-description">Сигурен ли си, че искаш да изтриеш <strong>{customerToDelete.name || 'този клиент'}</strong>? Личните данни, бележките и разговорите ще бъдат премахнати окончателно. Историята на резервациите ще остане само като анонимна статистика.</p>{deleteError && <p className="delete-error" role="alert">{deleteError}</p>}<div><button className="secondary-button" type="button" onClick={() => setCustomerToDelete(null)} disabled={deleting}>Отказ</button><button className="danger-button" type="button" onClick={deleteCustomer} disabled={deleting}>{deleting ? 'Изтриване…' : 'Изтрий клиента'}</button></div></section></div>}
    </main>
  )
}

export default function CustomersPage() {
  return <OwnerPage title="Клиенти">{(props) => <CustomersContent {...props} />}</OwnerPage>
}
