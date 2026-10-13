'use client'

import { DateTime } from 'luxon'
import { useCallback, useEffect, useState } from 'react'
import { OwnerPage } from '../../../components/owner-page'
import { supabase } from '../../../lib/supabase'

function AssistantContent({ business }) {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadConversations = useCallback(async () => {
    const { data, error: requestError } = await supabase.from('conversations').select('id,status,channel,created_at,updated_at,customer:customers(name,phone,email)').eq('business_id', business.id).order('updated_at', { ascending: false })
    if (requestError) { setError(requestError.message); setLoading(false); return }
    setConversations(data || [])
    setSelected((current) => current || data?.[0] || null)
    setLoading(false)
  }, [business.id])

  useEffect(() => { loadConversations() }, [loadConversations])
  useEffect(() => {
    if (!selected) { setMessages([]); return }
    supabase.from('messages').select('id,role,content,created_at').eq('conversation_id', selected.id).order('created_at').then(({ data, error: requestError }) => {
      if (requestError) setError(requestError.message)
      else setMessages(data || [])
    })
  }, [selected])

  async function toggleResolved() {
    if (!selected) return
    const nextStatus = selected.status === 'resolved' ? 'open' : 'resolved'
    const { error: updateError } = await supabase.from('conversations').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', selected.id)
    if (updateError) { setError(updateError.message); return }
    setSelected({ ...selected, status: nextStatus })
    setConversations((current) => current.map((item) => item.id === selected.id ? { ...item, status: nextStatus } : item))
  }

  return (
    <main className="dashboard-content admin-page assistant-admin-page">
      <div className="admin-page-head"><div><p className="auth-kicker">Разговори</p><h2>AI асистент</h2><p>Виж как асистентът помага на клиентите ти.</p></div><span className="status-chip"><span className="online-dot" /> Активен</span></div>
      {error && <p className="form-message" role="alert">{error}</p>}
      {loading && <div className="admin-loading"><span className="button-spinner" /> Зареждаме разговорите...</div>}
      {!loading && conversations.length === 0 && <div className="empty-state"><h3>Все още няма разговори</h3><p>Разговорите от публичната страница ще се появят тук.</p></div>}
      {!loading && conversations.length > 0 && <div className="inbox-layout">
        <aside className="conversation-list">{conversations.map((item) => <button type="button" className={selected?.id === item.id ? 'active' : ''} onClick={() => setSelected(item)} key={item.id}><span className="customer-avatar small">{(item.customer?.name || '?').slice(0, 1).toUpperCase()}</span><span><strong>{item.customer?.name || 'Посетител'}</strong><small>{item.customer?.phone || 'Чат от сайта'}</small></span><time>{DateTime.fromISO(item.updated_at).setLocale('bg').toRelative()}</time>{item.status === 'open' && <i />}</button>)}</aside>
        <section className="conversation-view">
          <header><div><h3>{selected?.customer?.name || 'Посетител'}</h3><p>{selected?.customer?.phone || selected?.customer?.email || 'Чат от публичната страница'}</p></div><button className="ghost-button" type="button" onClick={toggleResolved}>{selected?.status === 'resolved' ? 'Отвори отново' : 'Маркирай като приключен'}</button></header>
          <div className="conversation-messages">{messages.map((message) => <div className={`admin-chat-message ${message.role}`} key={message.id}><span>{message.content}</span><time>{DateTime.fromISO(message.created_at).setZone(business.timezone).toFormat('HH:mm')}</time></div>)}</div>
        </section>
      </div>}
    </main>
  )
}

export default function AssistantPage() {
  return <OwnerPage title="AI асистент">{(props) => <AssistantContent {...props} />}</OwnerPage>
}
